import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "store.json");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}

// Security headers with helmet (configured to permit cross-origin image loading)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  })
);

// Restricted CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:5000,http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Accès refusé par la politique CORS"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "25mb" }));

// Rate Limiters
// 1. Auth limiter (admin login & recovery) - 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives. Veuillez réessayer dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. OTP limiter (protect Gmail quota) - 3 requests per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Trop de demandes de code. Veuillez patienter 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Customer orders & appointments limiter - 40 per 15 minutes (CGNAT-friendly for Algerian 4G)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: "Trop de requêtes envoyées. Veuillez patienter quelques minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin JWT Authentication Middleware
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise. Jeton manquant." });
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Session expirée, veuillez vous reconnecter",
        expired: true
      });
    }
    return res.status(401).json({ error: "Jeton d'authentification invalide" });
  }
}

// Check if string is a bcrypt hash ($2a$, $2b$, $2y$)
function isBcryptHash(str) {
  return typeof str === "string" && str.startsWith("$2");
}

// In-memory OTP storage for password reset: email -> { code, expiresAt, attempts }
const resetOtpStore = new Map();

// Helper to create Nodemailer Gmail transporter (prefers .env secrets if set)
function createMailTransporter(email, password) {
  const user = process.env.GMAIL_USER || email;
  const pass = process.env.GMAIL_APP_PASSWORD || password;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: String(user).trim(),
      pass: String(pass).replace(/\s+/g, "")
    }
  });
}

// Helper to read data safely (stripping BOM if written by Windows PowerShell)
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const exampleFile = path.join(__dirname, "data", "store.example.json");
      if (fs.existsSync(exampleFile)) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.copyFileSync(exampleFile, DATA_FILE);
      }
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const clean = raw.replace(/^\uFEFF/, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Error reading data file:", err);
    return null;
  }
}

// Helper to save data atomically
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing data file:", err);
    return false;
  }
}

// 1. Get entire public/admin store (with credentials sanitized for privacy)
app.get("/api/data", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Failed to load database" });

  const safeData = {
    ...data,
    settings: {
      ...data.settings,
      adminPin: undefined,
      adminAuth: {
        isConfigured: Boolean(data.settings?.adminAuth?.password),
        recoveryEmail: data.settings?.adminAuth?.recoveryEmail || "",
        hasRecoveryPhone: Boolean(data.settings?.adminAuth?.recoveryPhone)
      }
    }
  };
  res.json(safeData);
});

// Helpers for phone validation
function cleanAlgerianPhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[\s\-\.]/g, "");
}

function isValidAlgerianPhone(phone) {
  const clean = cleanAlgerianPhone(phone);
  return /^0[567][0-9]{8}$/.test(clean);
}

// 2. Public endpoint: Submit appointment (rate-limited, no auth required)
app.post("/api/appointments", orderLimiter, (req, res) => {
  const { name, phone, vehicle, service, preferredDate, message } = req.body;
  const cleanedPhone = cleanAlgerianPhone(phone);

  if (!name || !cleanedPhone || !vehicle) {
    return res.status(400).json({ error: "Nom, téléphone et véhicule requis" });
  }

  if (!isValidAlgerianPhone(cleanedPhone)) {
    return res.status(400).json({
      error: "Numéro de téléphone incorrect (doit comporter 10 chiffres et commencer par 05, 06 ou 07)"
    });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database unavailable" });

  const newAppointment = {
    id: "apt-" + Date.now(),
    name: name.trim(),
    phone: cleanedPhone,
    vehicle: vehicle.trim(),
    service: service || "Installation LED / Phares",
    preferredDate: preferredDate || new Date().toISOString().split("T")[0],
    message: (message || "").trim(),
    status: "nouveau",
    createdAt: new Date().toISOString()
  };

  data.appointments = [newAppointment, ...(data.appointments || [])];
  writeData(data);

  res.status(201).json({ success: true, appointment: newAppointment });
});

// 2b. Public endpoint: Submit product order (rate-limited, no auth required)
app.post("/api/orders", orderLimiter, (req, res) => {
  const { customerName, phone, wilaya, commune, quantity, vehicleNote, productId, productName, productPrice, productImage, deliveryType, deliveryFee } = req.body;
  const cleanedPhone = cleanAlgerianPhone(phone);

  if (!customerName || !cleanedPhone || !wilaya || !commune) {
    return res.status(400).json({ error: "Nom, téléphone, wilaya et commune requis" });
  }

  if (!isValidAlgerianPhone(cleanedPhone)) {
    return res.status(400).json({
      error: "Numéro de téléphone incorrect (doit comporter 10 chiffres et commencer par 05, 06 ou 07)"
    });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database unavailable" });

  const rawItems = Array.isArray(req.body.items) && req.body.items.length > 0 ? req.body.items : null;
  const items = rawItems
    ? rawItems.map((item) => ({
        productId: item.productId || item.id || "",
        productName: item.productName || item.nameFr || "Produit AutoLedBlida",
        productPrice: Number(item.productPrice || item.price) || 0,
        productImage: item.productImage || item.image || "",
        quantity: Math.max(1, Number(item.quantity) || 1)
      }))
    : [
        {
          productId: productId || "",
          productName: productName || "Produit AutoLedBlida",
          productPrice: Number(productPrice) || 0,
          productImage: productImage || "",
          quantity: Math.max(1, Number(quantity) || 1)
        }
      ];

  const totalQty = items.reduce((s, it) => s + it.quantity, 0);
  const calculatedSubtotal = items.reduce((s, it) => s + it.productPrice * it.quantity, 0);
  const subtotal = req.body.subtotal !== undefined ? Number(req.body.subtotal) : calculatedSubtotal;
  const dFee = Number(deliveryFee) || 0;
  const total = req.body.total !== undefined ? Number(req.body.total) : (subtotal + dFee);

  const displayProductName = items.length === 1 && items[0].quantity === 1
    ? items[0].productName
    : `${totalQty} articles\n${items.map((i) => `•${i.productName} (x${i.quantity})`).join("\n")}`;

  const newOrder = {
    id: "cmd-" + Date.now(),
    customerName: customerName.trim(),
    phone: cleanedPhone,
    wilaya: wilaya.trim(),
    commune: (commune || "").trim(),
    deliveryType: deliveryType || "home",
    deliveryFee: dFee,
    quantity: totalQty,
    vehicleNote: (vehicleNote || "").trim(),
    items,
    productId: items[0]?.productId || productId || "",
    productName: displayProductName,
    productImage: items[0]?.productImage || productImage || "",
    productPrice: items[0]?.productPrice || Number(productPrice) || 0,
    subtotal,
    total,
    status: "nouveau",
    createdAt: new Date().toISOString()
  };

  data.orders = [newOrder, ...(data.orders || [])];
  writeData(data);

  res.status(201).json({ success: true, order: newOrder });
});

// 3. Admin: Check Auth Status
app.get("/api/admin/auth-status", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const isConfigured = Boolean(data.settings?.adminAuth?.password);
  res.json({
    isConfigured,
    hasRecoveryPhone: Boolean(data.settings?.adminAuth?.recoveryPhone)
  });
});

// 3b. Admin: Verify existing JWT Session Token
app.get("/api/admin/verify-token", requireAdminAuth, (req, res) => {
  res.json({ success: true, valid: true });
});

// 4. Admin: Setup Initial Credentials (rate-limited, hashed with bcrypt)
app.post("/api/admin/setup-credentials", authLimiter, async (req, res) => {
  const { email, emailPassword, phone, password } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Email de récupération valide requis" });
  }
  if (!emailPassword || String(emailPassword).trim().length === 0) {
    return res.status(400).json({ error: "Mot de passe de l'email requis" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "Le mot de passe admin doit comporter au moins 6 caractères ou chiffres" });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);

  data.settings = data.settings || {};
  data.settings.adminAuth = {
    recoveryEmail: email.trim().toLowerCase(),
    recoveryEmailPassword: String(emailPassword),
    recoveryPhone: (phone || "").trim(),
    password: hashedPassword
  };
  data.settings.adminPin = hashedPassword;
  writeData(data);

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, token, message: "Accès administrateur configuré avec succès" });
});

// 5. Admin: Verify Password & Issue 7-Day JWT Token
app.post("/api/admin/verify-password", authLimiter, async (req, res) => {
  const { password } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const storedAuth = data.settings?.adminAuth;
  if (!storedAuth || !storedAuth.password) {
    const defaultPin = data.settings?.adminPin || "1234";
    if (password && (password === defaultPin || password === "1234")) {
      const token = jwt.sign({ role: "admin", requiresSetup: true }, JWT_SECRET, { expiresIn: "1h" });
      return res.json({ success: true, requiresSetup: true, token });
    }
    console.warn(`[SECURITY ALERT] Tentative de connexion admin non configurée échouée depuis IP: ${req.ip}`);
    return res.status(200).json({ success: false, requiresSetup: true });
  }

  let isMatch = false;
  const storedPassword = String(storedAuth.password);

  if (isBcryptHash(storedPassword)) {
    isMatch = await bcrypt.compare(String(password), storedPassword);
  } else {
    // Legacy plaintext password migration boundary
    if (String(password) === storedPassword) {
      isMatch = true;
      // Auto-upgrade to bcrypt hash immediately and permanently
      const hashedPassword = await bcrypt.hash(String(password), 10);
      storedAuth.password = hashedPassword;
      data.settings.adminPin = hashedPassword;
      writeData(data);
      console.log(`[SECURITY MIGRATION] Mot de passe admin migré avec succès vers bcrypt hash.`);
    }
  }

  if (isMatch) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  }

  console.warn(`[SECURITY ALERT] Échec de connexion admin depuis IP: ${req.ip} à ${new Date().toISOString()}`);
  return res.status(401).json({ success: false, error: "Mot de passe incorrect" });
});

// 6. Admin Option A: Send 6-Digit Verification OTP via Nodemailer (Rate limited)
app.post("/api/admin/send-reset-otp", otpLimiter, async (req, res) => {
  const { email } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Erreur base de données" });

  const storedAuth = data.settings?.adminAuth;
  if (!storedAuth || !storedAuth.recoveryEmail) {
    return res.status(400).json({ error: "Aucun email administrateur configuré." });
  }

  const normalizedInput = String(email || "").trim().toLowerCase();
  const normalizedStored = String(storedAuth.recoveryEmail).trim().toLowerCase();

  if (normalizedInput !== normalizedStored) {
    return res.status(400).json({
      error: "Cette adresse Gmail ne correspond pas au compte administrateur enregistré."
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  resetOtpStore.set(normalizedStored, {
    code: otp,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    attempts: 0
  });

  // Attempt sending via Nodemailer
  const hasAppPassword = Boolean(process.env.GMAIL_APP_PASSWORD || storedAuth.recoveryEmailPassword);
  if (hasAppPassword) {
    try {
      const transporter = createMailTransporter(
        storedAuth.recoveryEmail,
        storedAuth.recoveryEmailPassword
      );

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 24px; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid #27272a;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 22px;">AutoLedBlida</h2>
            <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Récupération de mot de passe administrateur</p>
          </div>
          <p style="font-size: 14px; color: #e4e4e7;">Bonjour,</p>
          <p style="font-size: 14px; color: #d4d4d8;">Vous avez demandé la réinitialisation de votre mot de passe pour l'espace d'administration. Voici votre code de confirmation :</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ef4444; background: #18181b; padding: 12px 24px; border-radius: 12px; border: 1px solid #ef4444;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #a1a1aa; text-align: center;">Ce code est valable pendant <strong>15 minutes</strong>. Ne le partagez avec personne.</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
          <p style="font-size: 11px; color: #71717a; text-align: center;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"AutoLedBlida Admin" <${process.env.GMAIL_USER || storedAuth.recoveryEmail}>`,
        to: storedAuth.recoveryEmail,
        subject: `Code de vérification AutoLedBlida : ${otp}`,
        text: `Votre code de réinitialisation AutoLedBlida est : ${otp} (valable 15 minutes).`,
        html: htmlContent
      });

      return res.json({
        success: true,
        message: "Code envoyé avec succès par email ! Vérifiez votre boîte de réception."
      });
    } catch (mailErr) {
      console.error("Nodemailer send error:", mailErr.message);
      return res.status(500).json({
        success: false,
        canUseFallback: true,
        error: "Impossible d'envoyer l'email (vérifiez le mot de passe d'application ou la connexion). Vous pouvez utiliser l'Option B (clé de secours)."
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      canUseFallback: true,
      error: "Mot de passe de l'email non configuré pour l'envoi automatique. Utilisez l'Option B."
    });
  }
});

// 7. Admin Option A: Verify OTP & Set New Password (hashed with bcrypt, returns JWT)
app.post("/api/admin/verify-reset-otp", authLimiter, async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Erreur base de données" });

  const storedAuth = data.settings?.adminAuth;
  if (!storedAuth || !storedAuth.recoveryEmail) {
    return res.status(400).json({ error: "Aucun accès configuré." });
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedStored = String(storedAuth.recoveryEmail).trim().toLowerCase();

  if (normalizedEmail !== normalizedStored) {
    return res.status(400).json({ error: "Adresse email non reconnue." });
  }

  const record = resetOtpStore.get(normalizedEmail);
  if (!record) {
    return res.status(400).json({ error: "Aucun code demandé ou code expiré. Veuillez demander un nouveau code." });
  }

  if (Date.now() > record.expiresAt) {
    resetOtpStore.delete(normalizedEmail);
    return res.status(400).json({ error: "Ce code a expiré. Veuillez en demander un nouveau." });
  }

  if (String(record.code).trim() !== String(otp || "").trim()) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= 5) {
      resetOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: "Trop de tentatives incorrectes. Veuillez demander un nouveau code." });
    }
    return res.status(400).json({ error: "Code de vérification incorrect. Veuillez vérifier vos emails." });
  }

  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au moins 6 caractères." });
  }

  // Success: hash new password with bcrypt
  const hashedPassword = await bcrypt.hash(String(newPassword), 10);
  resetOtpStore.delete(normalizedEmail);
  data.settings.adminAuth.password = hashedPassword;
  data.settings.adminPin = hashedPassword;
  writeData(data);

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({
    success: true,
    token,
    message: "Mot de passe réinitialisé avec succès !"
  });
});

// 8. Admin Option B: Direct Rescue with Gmail + Email Password (returns JWT)
app.post("/api/admin/recover-password", authLimiter, async (req, res) => {
  const { recoveryEmail, recoveryEmailPassword, newPassword } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const storedAuth = data.settings?.adminAuth;
  if (!storedAuth || !storedAuth.password) {
    return res.status(400).json({ error: "Aucun accès configuré. Veuillez d'abord créer vos identifiants." });
  }

  const emailMatch =
    recoveryEmail &&
    recoveryEmail.trim().toLowerCase() === String(storedAuth.recoveryEmail).trim().toLowerCase();

  const cleanInputPass = String(recoveryEmailPassword || "").replace(/\s+/g, "");
  const cleanStoredPass = String(storedAuth.recoveryEmailPassword || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  const emailPasswordMatch = cleanInputPass === cleanStoredPass;

  if (!emailMatch || !emailPasswordMatch) {
    console.warn(`[SECURITY ALERT] Échec tentative de récupération de secours depuis IP: ${req.ip}`);
    return res.status(401).json({
      error: "Adresse Gmail ou mot de passe de l'email / clé de secours incorrect."
    });
  }

  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({
      error: "Le nouveau mot de passe doit comporter au moins 6 caractères ou chiffres."
    });
  }

  const hashedPassword = await bcrypt.hash(String(newPassword), 10);
  data.settings.adminAuth.password = hashedPassword;
  data.settings.adminPin = hashedPassword;
  writeData(data);

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({
    success: true,
    token,
    message: "Mot de passe réinitialisé avec succès via la méthode de secours !"
  });
});

// 9. Admin: Change Credentials (protected by requireAdminAuth)
app.post("/api/admin/change-credentials", requireAdminAuth, async (req, res) => {
  const { currentPassword, newPassword, recoveryEmail, recoveryEmailPassword, recoveryPhone } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const storedAuth = data.settings?.adminAuth || {};
  const currentExpected = storedAuth.password || data.settings?.adminPin || "1234";

  let isMatch = false;
  if (isBcryptHash(currentExpected)) {
    isMatch = await bcrypt.compare(String(currentPassword), currentExpected);
  } else {
    isMatch = String(currentPassword) === String(currentExpected);
  }

  if (!isMatch) {
    return res.status(401).json({ error: "Mot de passe actuel incorrect" });
  }

  if (newPassword) {
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au moins 6 caractères" });
    }
    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    storedAuth.password = hashedPassword;
    data.settings.adminPin = hashedPassword;
  }

  if (recoveryEmail) {
    if (!recoveryEmail.includes("@")) {
      return res.status(400).json({ error: "Email de récupération invalide" });
    }
    storedAuth.recoveryEmail = recoveryEmail.trim().toLowerCase();
  }

  if (recoveryEmailPassword) {
    storedAuth.recoveryEmailPassword = String(recoveryEmailPassword);
  }

  if (recoveryPhone !== undefined) {
    storedAuth.recoveryPhone = String(recoveryPhone).trim();
  }

  data.settings.adminAuth = storedAuth;
  writeData(data);

  res.json({ success: true, message: "Informations d'administration mises à jour avec succès" });
});

// 5. Admin: Update Site Settings (protected)
app.put("/api/admin/settings", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.settings = {
    ...data.settings,
    ...req.body
  };
  writeData(data);
  res.json({ success: true, settings: data.settings });
});

// 6. Admin: Phone numbers management (Add / Edit / Delete) (protected)
app.post("/api/admin/phones", requireAdminAuth, (req, res) => {
  const { id, number, labelFr, labelAr, isPrimary, whatsapp } = req.body;
  if (!number) return res.status(400).json({ error: "Numéro requis" });

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  let phones = data.settings.phoneNumbers || [];
  const cleanNum = String(number).trim();
  const targetId = id || ("p-" + Date.now());

  if (id) {
    // Edit
    phones = phones.map((p) =>
      p.id === id ? { ...p, number: cleanNum, labelFr, labelAr, isPrimary: Boolean(isPrimary), whatsapp: Boolean(whatsapp) } : p
    );
  } else {
    // Add
    const newPhone = {
      id: targetId,
      number: cleanNum,
      labelFr: labelFr || "Numéro",
      labelAr: labelAr || "رقم اتصال",
      isPrimary: Boolean(isPrimary),
      whatsapp: Boolean(whatsapp)
    };
    phones.push(newPhone);
  }

  // If this phone is set as primary, ensure it is the ONLY primary and update whatsappMain
  if (isPrimary) {
    phones = phones.map((p) => ({
      ...p,
      isPrimary: p.id === targetId
    }));
    data.settings.whatsappMain = cleanNum;
  } else if (!phones.some((p) => p.isPrimary) && phones.length > 0) {
    // Ensure at least one phone is always marked as primary
    phones[0].isPrimary = true;
    data.settings.whatsappMain = phones[0].number;
  }

  const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
  if (primaryPhone) {
    data.settings.whatsappMain = primaryPhone.number;
  }

  data.settings.phoneNumbers = phones;
  writeData(data);
  res.json({ success: true, phoneNumbers: phones, whatsappMain: data.settings.whatsappMain });
});

app.delete("/api/admin/phones/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  let phones = (data.settings.phoneNumbers || []).filter(
    (p) => p.id !== req.params.id
  );
  if (phones.length > 0 && !phones.some((p) => p.isPrimary)) {
    phones[0].isPrimary = true;
  }
  const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
  if (primaryPhone) {
    data.settings.whatsappMain = primaryPhone.number;
  }
  data.settings.phoneNumbers = phones;
  writeData(data);
  res.json({ success: true, phoneNumbers: data.settings.phoneNumbers, whatsappMain: data.settings.whatsappMain });
});

// 6b. Admin: Delivery Fees Management (Get & Update per Wilaya or Bulk) (protected)
app.get("/api/admin/delivery-fees", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });
  res.json({ success: true, deliveryFees: data.deliveryFees || {} });
});

app.put("/api/admin/delivery-fees", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const { deliveryFees, wilaya, home, desk, active } = req.body;

  if (deliveryFees && typeof deliveryFees === "object") {
    data.deliveryFees = {
      ...(data.deliveryFees || {}),
      ...deliveryFees
    };
  } else if (wilaya) {
    if (!data.deliveryFees) data.deliveryFees = {};
    data.deliveryFees[wilaya] = {
      ...(data.deliveryFees[wilaya] || {}),
      home: home !== undefined ? Number(home) : (data.deliveryFees[wilaya]?.home ?? 700),
      desk: desk !== undefined ? Number(desk) : (data.deliveryFees[wilaya]?.desk ?? 450),
      active: active !== undefined ? Boolean(active) : (data.deliveryFees[wilaya]?.active ?? true)
    };
  }

  writeData(data);
  res.json({ success: true, deliveryFees: data.deliveryFees });
});

// 7. Admin: Product CRUD (protected)
app.post("/api/admin/products", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const images = Array.isArray(req.body.images) && req.body.images.length > 0
    ? req.body.images
    : (req.body.image ? [req.body.image] : ["/biled-lens.jpg"]);
  const mainImage = req.body.image || images[0] || "/biled-lens.jpg";

  const newProduct = {
    id: "prod-" + Date.now(),
    nameFr: req.body.nameFr || "Nouveau Produit",
    nameAr: req.body.nameAr || "منتج جديد",
    price: Number(req.body.price) || 0,
    oldPrice: req.body.oldPrice ? Number(req.body.oldPrice) : null,
    isPromo: Boolean(req.body.isPromo),
    isNew: req.body.isNew !== undefined ? Boolean(req.body.isNew) : true,
    category: req.body.category || "led-bulbs",
    inStock: req.body.inStock !== false,
    badgeFr: req.body.badgeFr || "",
    badgeAr: req.body.badgeAr || "",
    image: mainImage,
    images: images,
    descriptionFr: req.body.descriptionFr || "",
    descriptionAr: req.body.descriptionAr || ""
  };

  data.products = [newProduct, ...(data.products || [])];
  writeData(data);
  res.status(201).json({ success: true, product: newProduct });
});

app.put("/api/admin/products/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const idx = data.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Produit non trouvé" });

  const existing = data.products[idx];
  const images = Array.isArray(req.body.images) && req.body.images.length > 0
    ? req.body.images
    : (req.body.image ? [req.body.image] : (existing.images || [existing.image]));
  const mainImage = req.body.image || images[0] || existing.image;

  data.products[idx] = {
    ...existing,
    ...req.body,
    id: req.params.id,
    image: mainImage,
    images: images,
    price: Number(req.body.price) || existing.price
  };

  writeData(data);
  res.json({ success: true, product: data.products[idx] });
});

app.delete("/api/admin/products/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.products = data.products.filter((p) => p.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Produit supprimé" });
});

// 8. Admin: Category CRUD (protected)
app.post("/api/admin/categories", requireAdminAuth, (req, res) => {
  const { nameFr, nameAr } = req.body;
  if (!nameFr) return res.status(400).json({ error: "Nom requis" });

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const id = (nameFr.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "cat") + "-" + Date.now();
  const newCat = {
    id,
    nameFr,
    nameAr: nameAr || nameFr,
    count: 0
  };

  data.categories = [...(data.categories || []), newCat];
  writeData(data);
  res.status(201).json({ success: true, category: newCat });
});

app.delete("/api/admin/categories/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.categories = (data.categories || []).filter((c) => c.id !== req.params.id);
  writeData(data);
  res.json({ success: true, categories: data.categories });
});

// 9. Admin: Appointment CRUD (Create, Edit, Status & Deletion) (protected)
app.post("/api/admin/appointments", requireAdminAuth, (req, res) => {
  const { name, phone, vehicle, service, preferredDate, message, status } = req.body;
  if (!name || !phone || !vehicle) {
    return res.status(400).json({ error: "Nom, téléphone et véhicule requis" });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const newApt = {
    id: "apt-" + Date.now(),
    name: name.trim(),
    phone: cleanAlgerianPhone(phone),
    vehicle: vehicle.trim(),
    service: service || "Installation LED / Phares",
    preferredDate: preferredDate || new Date().toISOString().split("T")[0],
    message: message || "",
    status: status || "nouveau",
    createdAt: new Date().toISOString()
  };

  data.appointments = [newApt, ...(data.appointments || [])];
  writeData(data);
  res.status(201).json({ success: true, appointment: newApt });
});

app.put("/api/admin/appointments/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const idx = (data.appointments || []).findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Rendez-vous non trouvé" });

  const existing = data.appointments[idx];
  data.appointments[idx] = {
    ...existing,
    ...req.body,
    id: req.params.id,
    name: req.body.name ? req.body.name.trim() : existing.name,
    phone: req.body.phone ? cleanAlgerianPhone(req.body.phone) : existing.phone,
    vehicle: req.body.vehicle ? req.body.vehicle.trim() : existing.vehicle,
    service: req.body.service ? req.body.service.trim() : existing.service,
    preferredDate: req.body.preferredDate || existing.preferredDate,
    message: req.body.message !== undefined ? req.body.message.trim() : existing.message,
    status: req.body.status || existing.status
  };

  writeData(data);
  res.json({ success: true, appointment: data.appointments[idx] });
});

app.put("/api/admin/appointments/:id/status", requireAdminAuth, (req, res) => {
  const { status } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const apt = data.appointments.find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: "Rendez-vous non trouvé" });

  apt.status = status;
  writeData(data);
  res.json({ success: true, appointment: apt });
});

app.delete("/api/admin/appointments/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.appointments = data.appointments.filter((a) => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Rendez-vous supprimé" });
});

// 9b. Admin: Order CRUD (Create, Edit, Status & Deletion) (protected)
app.post("/api/admin/orders", requireAdminAuth, (req, res) => {
  const { customerName, phone, wilaya, commune, productId, productName, quantity, productPrice, deliveryType, deliveryFee, total, vehicleNote, status, items } = req.body;
  if (!customerName || !phone) {
    return res.status(400).json({ error: "Nom et téléphone requis" });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(productPrice) || 0;
  const dFee = Number(deliveryFee) || 0;
  const finalTotal = total !== undefined ? Number(total) : (price * qty + dFee);

  const newOrder = {
    id: "cmd-" + Date.now(),
    customerName: customerName.trim(),
    phone: cleanAlgerianPhone(phone),
    wilaya: (wilaya || "").trim(),
    commune: (commune || "").trim(),
    deliveryType: deliveryType || "home",
    deliveryFee: dFee,
    items: Array.isArray(items) ? items : undefined,
    productId: productId || "",
    productName: productName || "Produit",
    productPrice: price,
    quantity: qty,
    total: finalTotal,
    vehicleNote: (vehicleNote || "").trim(),
    status: status || "nouveau",
    createdAt: new Date().toISOString()
  };

  data.orders = [newOrder, ...(data.orders || [])];
  writeData(data);
  res.status(201).json({ success: true, order: newOrder });
});

app.put("/api/admin/orders/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const idx = (data.orders || []).findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Commande non trouvée" });

  const existing = data.orders[idx];
  const qty = req.body.quantity !== undefined ? Math.max(1, Number(req.body.quantity) || 1) : existing.quantity;
  const price = req.body.productPrice !== undefined ? Number(req.body.productPrice) || 0 : existing.productPrice;
  const dFee = req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) || 0 : (existing.deliveryFee || 0);
  const total = req.body.total !== undefined ? Number(req.body.total) : (price * qty + dFee);

  data.orders[idx] = {
    ...existing,
    ...req.body,
    id: req.params.id,
    customerName: req.body.customerName ? req.body.customerName.trim() : existing.customerName,
    phone: req.body.phone ? cleanAlgerianPhone(req.body.phone) : existing.phone,
    wilaya: req.body.wilaya !== undefined ? req.body.wilaya.trim() : existing.wilaya,
    commune: req.body.commune !== undefined ? req.body.commune.trim() : existing.commune,
    deliveryType: req.body.deliveryType || existing.deliveryType,
    deliveryFee: dFee,
    productName: req.body.productName ? req.body.productName.trim() : existing.productName,
    quantity: qty,
    productPrice: price,
    vehicleNote: req.body.vehicleNote !== undefined ? req.body.vehicleNote.trim() : existing.vehicleNote,
    status: req.body.status || existing.status,
    total
  };

  writeData(data);
  res.json({ success: true, order: data.orders[idx] });
});

app.put("/api/admin/orders/:id/status", requireAdminAuth, (req, res) => {
  const { status } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const order = (data.orders || []).find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Commande non trouvée" });

  order.status = status;
  writeData(data);
  res.json({ success: true, order });
});

app.delete("/api/admin/orders/:id", requireAdminAuth, (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.orders = (data.orders || []).filter((o) => o.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Commande supprimée" });
});

// 10. Admin: Upload Image File (Base64 -> /uploads/filename) (protected)
app.post("/api/admin/upload", requireAdminAuth, (req, res) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) return res.status(400).json({ error: "Image data requise" });

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) {
      return res.json({ success: true, url: dataUrl });
    }

    const mime = matches[1];
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";

    const base64Data = matches[2];
    const safeName = (filename ? filename.split(".")[0] : "upload")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");
    const finalFilename = `${safeName}_${Date.now()}.${ext}`;

    const uploadsDir = path.join(__dirname, "..", "public", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const targetPath = path.join(uploadsDir, finalFilename);
    fs.writeFileSync(targetPath, Buffer.from(base64Data, "base64"));

    // Sync to dist/uploads if dist exists
    const distUploads = path.join(__dirname, "..", "dist", "uploads");
    if (fs.existsSync(path.join(__dirname, "..", "dist"))) {
      if (!fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });
      fs.copyFileSync(targetPath, path.join(distUploads, finalFilename));
    }

    res.json({ success: true, url: `/uploads/${finalFilename}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Échec du téléversement de l'image" });
  }
});

// Serve frontend production build & public assets
const PUBLIC_PATH = path.join(__dirname, "..", "public");
if (fs.existsSync(PUBLIC_PATH)) {
  app.use(express.static(PUBLIC_PATH));
}

const DIST_PATH = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.join(DIST_PATH, "index.html"));
    }
  });
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`AutoLedBlida Server running on port ${PORT}`);
});

export default app;