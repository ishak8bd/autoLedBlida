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

import { connectDB, getDbStatus } from "./db.js";
import { uploadImage, deleteImage, isCloudinaryConfigured } from "./cloudinary.js";
import { Product } from "./models/Product.js";
import { Category } from "./models/Category.js";
import { Order } from "./models/Order.js";
import { Appointment } from "./models/Appointment.js";
import { Settings } from "./models/Settings.js";
import { createAdminAuthMiddleware, validateRecoverySecret } from "./middleware/auth.js";
import { resolveOrderPricing, calculateOrderTotal } from "../src/utils/orderCalculations.js";

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

// Initialize Database connection (fails loudly in production if MONGODB_URI is unset)
await connectDB();
const isMongo = () => getDbStatus().isConnected;

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

// Body parser: default 1mb for standard requests; /api/admin/upload uses dedicated 20mb parser
app.use((req, res, next) => {
  if (req.path === "/api/admin/upload") {
    return next();
  }
  express.json({ limit: "1mb" })(req, res, next);
});

// Rate Limiters
// 1. Auth limiter (admin login & recovery) - 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives. Veuillez réessayer dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Customer orders & appointments limiter - 40 per 15 minutes (CGNAT-friendly for Algerian 4G)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: "Trop de requêtes envoyées. Veuillez patienter quelques minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin JWT Authentication Middleware
const requireAdminAuth = createAdminAuthMiddleware(JWT_SECRET);

// Check if string is a bcrypt hash ($2a$, $2b$, $2y$)
function isBcryptHash(str) {
  return typeof str === "string" && str.startsWith("$2");
}

// In-memory OTP storage for password reset: email -> { code, expiresAt, attempts }
const resetOtpStore = new Map();

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

// Master email for critical security alerts (defaults to isaak.bd96@gmail.com)
const MASTER_ALERT_EMAIL = process.env.MASTER_ALERT_EMAIL || "isaak.bd96@gmail.com";

// Unified email sender (supports Resend HTTPS API, Brevo HTTPS API, and Nodemailer Gmail fallback)
async function sendEmailAlert({ to, subject, htmlContent, textContent }) {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || "onboarding@resend.dev").trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
  const gmailUser = (process.env.GMAIL_USER || "").trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || "").trim();

  // 1. Prioritize Resend HTTPS API (Port 443, immune to Render SMTP port blocks)
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `AutoLedBlida <${emailFrom}>`,
          to: [to],
          subject,
          html: htmlContent,
          text: textContent
        })
      });
      if (res.ok) {
        return { success: true, provider: "resend" };
      }
      const err = await res.json().catch(() => ({}));
      console.error("[Email Alert] Resend error:", err);
    } catch (e) {
      console.error("[Email Alert] Resend failed:", e.message);
    }
  }

  // 2. Brevo HTTPS API
  if (brevoApiKey) {
    try {
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || gmailUser || "no-reply@autoledblida.com").trim();
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          sender: { name: "AutoLedBlida Admin", email: senderEmail },
          to: [{ email: to, name: "Admin" }],
          subject,
          htmlContent,
          textContent
        })
      });
      if (res.ok) {
        return { success: true, provider: "brevo" };
      }
      const err = await res.json().catch(() => ({}));
      console.error("[Email Alert] Brevo error:", err);
    } catch (e) {
      console.error("[Email Alert] Brevo failed:", e.message);
    }
  }

  // 3. Fallback: Nodemailer Gmail SMTP
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass.replace(/\s+/g, "") }
      });
      await transporter.sendMail({
        from: `"AutoLedBlida Admin" <${gmailUser}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent
      });
      return { success: true, provider: "nodemailer" };
    } catch (e) {
      console.error("[Email Alert] Nodemailer failed:", e.message);
    }
  }

  return { success: false, error: "No working email provider configured" };
}

// 1. Get entire public/admin store (with credentials sanitized for privacy)
app.get("/api/data", async (req, res) => {
  try {
    if (isMongo()) {
      const [products, categories, orders, appointments, settingsDoc] = await Promise.all([
        Product.find().lean(),
        Category.find().lean(),
        Order.find().sort({ createdAt: -1 }).lean(),
        Appointment.find().sort({ createdAt: -1 }).lean(),
        Settings.getSingleton()
      ]);

      const s = settingsDoc ? (settingsDoc.toObject ? settingsDoc.toObject() : settingsDoc) : {};
      const safeData = {
        products: products || [],
        categories: categories || [],
        orders: orders || [],
        appointments: appointments || [],
        deliveryFees: s.deliveryFees || {},
        settings: {
          ...s,
          adminPin: undefined,
          adminAuth: {
            isConfigured: Boolean(s.adminAuth?.password),
            recoveryEmail: s.adminAuth?.recoveryEmail || "",
            hasRecoveryPhone: Boolean(s.adminAuth?.recoveryPhone),
            hasRecoverySecret: Boolean(s.adminAuth?.recoverySecret || s.adminAuth?.recoveryEmailPassword),
            hasRecoveryEmailPassword: Boolean(s.adminAuth?.recoverySecret || s.adminAuth?.recoveryEmailPassword)
          }
        }
      };
      return res.json(safeData);
    }

    // Local fallback when USE_LOCAL_STORAGE=true
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
          hasRecoveryPhone: Boolean(data.settings?.adminAuth?.recoveryPhone),
          hasRecoverySecret: Boolean(data.settings?.adminAuth?.recoverySecret || data.settings?.adminAuth?.recoveryEmailPassword),
          hasRecoveryEmailPassword: Boolean(data.settings?.adminAuth?.recoverySecret || data.settings?.adminAuth?.recoveryEmailPassword)
        }
      }
    };
    return res.json(safeData);
  } catch (err) {
    console.error("Error loading /api/data:", err);
    return res.status(500).json({ error: "Failed to load database" });
  }
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
app.post("/api/appointments", orderLimiter, async (req, res) => {
  const { name, phone, vehicle, service, preferredDate, message } = req.body;
  const cleanedPhone = cleanAlgerianPhone(phone);

  if (!name || !cleanedPhone || !vehicle) {
    return res.status(400).json({ error: "Nom, téléphone et véhicule requis" });
  }

  // Field length validation (fail fast with HTTP 400)
  if (String(name).length > 100) {
    return res.status(400).json({ error: "Le nom ne doit pas dépasser 100 caractères" });
  }
  if (String(cleanedPhone).length > 30) {
    return res.status(400).json({ error: "Le numéro de téléphone ne doit pas dépasser 30 caractères" });
  }
  if (vehicle && String(vehicle).length > 150) {
    return res.status(400).json({ error: "Le modèle de véhicule ne doit pas dépasser 150 caractères" });
  }
  if (service && String(service).length > 150) {
    return res.status(400).json({ error: "Le nom du service ne doit pas dépasser 150 caractères" });
  }
  if (message && String(message).length > 500) {
    return res.status(400).json({ error: "Le message ne doit pas dépasser 500 caractères" });
  }

  if (!isValidAlgerianPhone(cleanedPhone)) {
    return res.status(400).json({
      error: "Numéro de téléphone incorrect (doit comporter 10 chiffres et commencer par 05, 06 ou 07)"
    });
  }

  const newAppointment = {
    id: "apt-" + Date.now(),
    name: name.trim(),
    phone: cleanedPhone,
    vehicle: vehicle.trim(),
    service: service ? String(service).trim() : "Installation LED / Phares",
    preferredDate: preferredDate || new Date().toISOString().split("T")[0],
    message: (message || "").trim(),
    status: "nouveau",
    createdAt: new Date().toISOString()
  };

  try {
    if (isMongo()) {
      const created = await Appointment.create(newAppointment);
      return res.status(201).json({ success: true, appointment: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database unavailable" });
    data.appointments = [newAppointment, ...(data.appointments || [])];
    writeData(data);
    return res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err) {
    console.error("Error creating appointment:", err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du rendez-vous" });
  }
});

// 2b. Public endpoint: Submit product order (rate-limited, no auth required)
app.post("/api/orders", orderLimiter, async (req, res) => {
  const { customerName, phone, wilaya, commune, quantity, vehicleNote, productId, productName, productPrice, productImage, deliveryType, deliveryFee } = req.body;
  const cleanedPhone = cleanAlgerianPhone(phone);

  if (!customerName || !cleanedPhone || !wilaya || !commune) {
    return res.status(400).json({ error: "Nom, téléphone, wilaya et commune requis" });
  }

  // Field length validation (fail fast with HTTP 400)
  if (String(customerName).length > 100) {
    return res.status(400).json({ error: "Le nom du client ne doit pas dépasser 100 caractères" });
  }
  if (String(cleanedPhone).length > 30) {
    return res.status(400).json({ error: "Le numéro de téléphone ne doit pas dépasser 30 caractères" });
  }
  if (String(wilaya).length > 100) {
    return res.status(400).json({ error: "La wilaya ne doit pas dépasser 100 caractères" });
  }
  if (commune && String(commune).length > 100) {
    return res.status(400).json({ error: "La commune ne doit pas dépasser 100 caractères" });
  }
  if (vehicleNote && String(vehicleNote).length > 500) {
    return res.status(400).json({ error: "La note sur le véhicule ne doit pas dépasser 500 caractères" });
  }

  if (!isValidAlgerianPhone(cleanedPhone)) {
    return res.status(400).json({
      error: "Numéro de téléphone incorrect (doit comporter 10 chiffres et commencer par 05, 06 ou 07)"
    });
  }

  const rawItems = Array.isArray(req.body.items) && req.body.items.length > 0 ? req.body.items : null;
  const items = rawItems
    ? rawItems.map((item) => ({
        productId: item.productId || item.id || "",
        productName: String(item.productName || item.nameFr || "Produit AutoLedBlida").slice(0, 200),
        price: Number(item.productPrice || item.price) || 0,
        image: item.productImage || item.image || "",
        quantity: Math.max(1, Math.min(100, Number(item.quantity) || 1))
      }))
    : [
        {
          productId: productId || "",
          productName: String(productName || "Produit AutoLedBlida").slice(0, 200),
          price: Number(productPrice) || 0,
          image: productImage || "",
          quantity: Math.max(1, Math.min(100, Number(quantity) || 1))
        }
      ];

  const totalQty = items.reduce((s, it) => s + it.quantity, 0);
  const pricing = resolveOrderPricing({
    items,
    quantity: totalQty,
    productPrice,
    deliveryFee,
    subtotal: req.body.subtotal,
    total: req.body.total
  });
  const subtotal = pricing.subtotal;
  const dFee = pricing.deliveryFee;
  const total = pricing.total;

  const displayProductName = items.length === 1 && items[0].quantity === 1
    ? items[0].productName
    : `${totalQty} articles\n${items.map((i) => `•${i.productName} (x${i.quantity})`).join("\n")}`;

  const newOrder = {
    id: "cmd-" + Date.now(),
    customerName: customerName.trim(),
    phone: cleanedPhone,
    wilaya: wilaya.trim(),
    commune: (commune || "").trim(),
    deliveryType: deliveryType === "desk" ? "desk" : "home",
    deliveryFee: dFee,
    quantity: totalQty,
    vehicleNote: (vehicleNote || "").trim(),
    items,
    productId: items[0]?.productId || productId || "",
    productName: displayProductName,
    productImage: items[0]?.image || productImage || "",
    productPrice: items[0]?.price || Number(productPrice) || 0,
    total,
    status: "nouveau",
    createdAt: new Date().toISOString()
  };

  try {
    if (isMongo()) {
      const created = await Order.create(newOrder);
      return res.status(201).json({ success: true, order: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database unavailable" });
    data.orders = [newOrder, ...(data.orders || [])];
    writeData(data);
    return res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement de la commande" });
  }
});

// 3. Admin: Check Auth Status
app.get("/api/admin/auth-status", async (req, res) => {
  try {
    let adminAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      adminAuth = s?.adminAuth;
    } else {
      const data = readData();
      adminAuth = data?.settings?.adminAuth;
    }

    const isConfigured = Boolean(adminAuth?.password);
    res.json({
      isConfigured,
      hasRecoveryPhone: Boolean(adminAuth?.recoveryPhone),
      hasRecoverySecret: Boolean(adminAuth?.recoverySecret || adminAuth?.recoveryEmailPassword),
      hasRecoveryEmailPassword: Boolean(adminAuth?.recoverySecret || adminAuth?.recoveryEmailPassword)
    });
  } catch (err) {
    console.error("Auth status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 3b. Admin: Verify existing JWT Session Token
app.get("/api/admin/verify-token", requireAdminAuth, (req, res) => {
  res.json({ success: true, valid: true });
});

// 4. Admin: Setup Initial Credentials (rate-limited, hashed with bcrypt)
app.post("/api/admin/setup-credentials", authLimiter, async (req, res) => {
  const { email, phone, password, recoverySecret, emailPassword, recoveryEmailPassword } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Email de récupération valide requis" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "Le mot de passe admin doit comporter au moins 6 caractères ou chiffres" });
  }

  const rawRecoverySecret = recoverySecret || emailPassword || recoveryEmailPassword;
  const secretValidation = validateRecoverySecret(rawRecoverySecret);
  if (!secretValidation.valid) {
    return res.status(400).json({ error: secretValidation.error });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const hashedRecoverySecret = await bcrypt.hash(secretValidation.secret, 10);

  try {
    if (isMongo()) {
      await Settings.findOneAndUpdate(
        { _id: "site_settings" },
        {
          $set: {
            "adminAuth.recoveryEmail": email.trim().toLowerCase(),
            "adminAuth.recoveryPhone": (phone || "").trim(),
            "adminAuth.password": hashedPassword,
            "adminAuth.recoverySecret": hashedRecoverySecret,
            "adminAuth.recoveryEmailPassword": hashedRecoverySecret,
            adminPin: hashedPassword
          }
        },
        { upsert: true, new: true }
      );
    } else {
      const data = readData() || {};
      data.settings = data.settings || {};
      data.settings.adminAuth = {
        recoveryEmail: email.trim().toLowerCase(),
        recoveryPhone: (phone || "").trim(),
        password: hashedPassword,
        recoverySecret: hashedRecoverySecret,
        recoveryEmailPassword: hashedRecoverySecret
      };
      data.settings.adminPin = hashedPassword;
      writeData(data);
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, message: "Accès administrateur configuré avec succès" });
  } catch (err) {
    console.error("Setup credentials error:", err);
    res.status(500).json({ error: "Erreur lors de la configuration des accès" });
  }
});

// 5. Admin: Verify Password & Issue 7-Day JWT Token
app.post("/api/admin/verify-password", authLimiter, async (req, res) => {
  const { password } = req.body;
  try {
    let storedAuth = null;
    let fallbackPin = "1234";

    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
      fallbackPin = s?.adminPin || "1234";
    } else {
      const data = readData();
      if (!data) return res.status(500).json({ error: "Database error" });
      storedAuth = data.settings?.adminAuth;
      fallbackPin = data.settings?.adminPin || "1234";
    }

    if (!storedAuth || !storedAuth.password) {
      if (password && (password === fallbackPin || password === "1234")) {
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
      if (String(password) === storedPassword) {
        isMatch = true;
        const hashedPassword = await bcrypt.hash(String(password), 10);
        if (isMongo()) {
          await Settings.findOneAndUpdate(
            { _id: "site_settings" },
            { $set: { "adminAuth.password": hashedPassword, adminPin: hashedPassword } }
          );
        } else {
          const data = readData();
          if (data?.settings?.adminAuth) {
            data.settings.adminAuth.password = hashedPassword;
            data.settings.adminPin = hashedPassword;
            writeData(data);
          }
        }
        console.log(`[SECURITY MIGRATION] Mot de passe admin migré avec succès vers bcrypt hash.`);
      }
    }

    if (isMatch) {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ success: true, token });
    }

    console.warn(`[SECURITY ALERT] Échec de connexion admin depuis IP: ${req.ip} à ${new Date().toISOString()}`);
    return res.status(401).json({ success: false, error: "Mot de passe incorrect" });
  } catch (err) {
    console.error("Verify password error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 6. Admin Option A: Send 6-Digit Verification OTP via Nodemailer
app.post("/api/admin/send-reset-otp", async (req, res) => {
  const { email } = req.body;
  try {
    let storedAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
    } else {
      const data = readData();
      storedAuth = data?.settings?.adminAuth;
    }

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
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0
    });

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

    const emailResult = await sendEmailAlert({
      to: storedAuth.recoveryEmail,
      subject: `Code de vérification AutoLedBlida : ${otp}`,
      htmlContent,
      textContent: `Votre code de réinitialisation AutoLedBlida est : ${otp} (valable 15 minutes).`
    });

    if (emailResult.success) {
      return res.json({
        success: true,
        message: "Code envoyé avec succès par email ! Vérifiez votre boîte de réception."
      });
    } else {
      return res.status(500).json({
        success: false,
        canUseFallback: true,
        error: "Impossible d'envoyer l'email de réinitialisation. Vous pouvez utiliser l'Option B (clé de secours)."
      });
    }
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 7a. Admin Option A: Check OTP Code (Step 1 - verify code only)
app.post("/api/admin/check-reset-otp", authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  try {
    let storedAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
    } else {
      const data = readData();
      storedAuth = data?.settings?.adminAuth;
    }

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
      return res.status(400).json({ error: "Code incorrect. Veuillez vérifier vos emails." });
    }

    record.verified = true;
    const resetToken = jwt.sign(
      { role: "admin_password_reset", email: normalizedEmail },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      success: true,
      message: "Code correct !",
      resetToken
    });
  } catch (err) {
    console.error("Check reset OTP error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 7b. Admin Option A: Set New Password (Step 2 - with verified OTP or resetToken)
app.post("/api/admin/verify-reset-otp", authLimiter, async (req, res) => {
  const { email, otp, resetToken, newPassword } = req.body;
  try {
    let storedAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
    } else {
      const data = readData();
      storedAuth = data?.settings?.adminAuth;
    }

    if (!storedAuth || !storedAuth.recoveryEmail) {
      return res.status(400).json({ error: "Aucun accès configuré." });
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedStored = String(storedAuth.recoveryEmail).trim().toLowerCase();

    if (normalizedEmail !== normalizedStored) {
      return res.status(400).json({ error: "Adresse email non reconnue." });
    }

    let isAuthorized = false;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        if (decoded.role === "admin_password_reset" && decoded.email === normalizedEmail) {
          isAuthorized = true;
        }
      } catch (e) {
        // Fall back to memory record
      }
    }

    if (!isAuthorized) {
      const record = resetOtpStore.get(normalizedEmail);
      if (!record) {
        return res.status(400).json({ error: "Session de réinitialisation expirée. Veuillez demander un nouveau code." });
      }

      if (Date.now() > record.expiresAt) {
        resetOtpStore.delete(normalizedEmail);
        return res.status(400).json({ error: "Ce code a expiré. Veuillez en demander un nouveau." });
      }

      if (record.verified || String(record.code).trim() === String(otp || "").trim()) {
        isAuthorized = true;
      } else {
        record.attempts = (record.attempts || 0) + 1;
        if (record.attempts >= 5) {
          resetOtpStore.delete(normalizedEmail);
          return res.status(400).json({ error: "Trop de tentatives incorrectes. Veuillez demander un nouveau code." });
        }
        return res.status(400).json({ error: "Code incorrect. Veuillez vérifier vos emails." });
      }
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au moins 6 caractères." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    resetOtpStore.delete(normalizedEmail);

    if (isMongo()) {
      await Settings.findOneAndUpdate(
        { _id: "site_settings" },
        { $set: { "adminAuth.password": hashedPassword, adminPin: hashedPassword } }
      );
    } else {
      const data = readData();
      if (data?.settings?.adminAuth) {
        data.settings.adminAuth.password = hashedPassword;
        data.settings.adminPin = hashedPassword;
        writeData(data);
      }
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      success: true,
      token,
      message: "Mot de passe réinitialisé avec succès !"
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 8a. Admin Option B: Verify Direct Rescue Credentials (Step 1)
app.post("/api/admin/check-fallback-credentials", authLimiter, async (req, res) => {
  const { recoveryEmail, recoverySecret, recoveryEmailPassword } = req.body;
  try {
    let storedAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
    } else {
      const data = readData();
      storedAuth = data?.settings?.adminAuth;
    }

    if (!storedAuth || !storedAuth.password) {
      return res.status(400).json({ error: "Aucun accès configuré. Veuillez d'abord créer vos identifiants." });
    }

    const normalizedEmail = String(recoveryEmail || "").trim().toLowerCase();
    const normalizedStored = String(storedAuth.recoveryEmail || "").trim().toLowerCase();

    // 1. Email check: distinguish if Gmail address is wrong
    if (!normalizedEmail || normalizedEmail !== normalizedStored) {
      return res.status(400).json({
        error: "Adresse Gmail incorrecte ou non reconnue."
      });
    }

    // 2. Secret check: generic secret (PIN, word, sentence) with minimum length 4
    const cleanInputSecret = String(recoverySecret || recoveryEmailPassword || "").trim();
    if (!cleanInputSecret || cleanInputSecret.length < 4) {
      return res.status(400).json({
        error: "Code de récupération incorrect (au moins 4 caractères)."
      });
    }

    const storedRecoverySecret = storedAuth.recoverySecret || storedAuth.recoveryEmailPassword;

    let secretMatch = false;
    if (storedRecoverySecret) {
      if (isBcryptHash(storedRecoverySecret)) {
        secretMatch = await bcrypt.compare(cleanInputSecret, storedRecoverySecret);
        if (!secretMatch && cleanInputSecret.includes(" ")) {
          secretMatch = await bcrypt.compare(cleanInputSecret.replace(/\s+/g, ""), storedRecoverySecret);
        }
      } else {
        secretMatch =
          cleanInputSecret === storedRecoverySecret ||
          cleanInputSecret.replace(/\s+/g, "") === String(storedRecoverySecret).replace(/\s+/g, "");
      }
    }

    if (!secretMatch) {
      console.warn(`[SECURITY ALERT] Échec code de récupération de secours depuis IP: ${req.ip}`);
      return res.status(400).json({
        error: "Code de récupération incorrect."
      });
    }

    const fallbackToken = jwt.sign(
      { role: "admin_fallback_reset", email: normalizedEmail },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      success: true,
      message: "Code de récupération validé !",
      fallbackToken
    });
  } catch (err) {
    console.error("Check fallback credentials error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 8b. Admin Option B: Reset Password with Verified Fallback Token or Credentials (Step 2)
app.post("/api/admin/recover-password", authLimiter, async (req, res) => {
  const { fallbackToken, recoveryEmail, recoverySecret, recoveryEmailPassword, newPassword } = req.body;
  try {
    let storedAuth = null;
    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth;
    } else {
      const data = readData();
      storedAuth = data?.settings?.adminAuth;
    }

    if (!storedAuth || !storedAuth.password) {
      return res.status(400).json({ error: "Aucun accès configuré. Veuillez d'abord créer vos identifiants." });
    }

    let isAuthorized = false;

    if (fallbackToken) {
      try {
        const decoded = jwt.verify(fallbackToken, JWT_SECRET);
        if (decoded.role === "admin_fallback_reset") {
          isAuthorized = true;
        }
      } catch (e) {
        // Fall back to direct credentials verification
      }
    }

    if (!isAuthorized) {
      const normalizedEmail = String(recoveryEmail || "").trim().toLowerCase();
      const normalizedStored = String(storedAuth.recoveryEmail || "").trim().toLowerCase();

      if (!normalizedEmail || normalizedEmail !== normalizedStored) {
        return res.status(400).json({
          error: "Adresse Gmail incorrecte ou non reconnue."
        });
      }

      const cleanInputSecret = String(recoverySecret || recoveryEmailPassword || "").trim();
      if (!cleanInputSecret || cleanInputSecret.length < 4) {
        return res.status(400).json({
          error: "Code de récupération incorrect (au moins 4 caractères)."
        });
      }

      const storedRecoverySecret = storedAuth.recoverySecret || storedAuth.recoveryEmailPassword;

      let secretMatch = false;
      if (storedRecoverySecret) {
        if (isBcryptHash(storedRecoverySecret)) {
          secretMatch = await bcrypt.compare(cleanInputSecret, storedRecoverySecret);
          if (!secretMatch && cleanInputSecret.includes(" ")) {
            secretMatch = await bcrypt.compare(cleanInputSecret.replace(/\s+/g, ""), storedRecoverySecret);
          }
        } else {
          secretMatch =
            cleanInputSecret === storedRecoverySecret ||
            cleanInputSecret.replace(/\s+/g, "") === String(storedRecoverySecret).replace(/\s+/g, "");
        }
      }

      if (!secretMatch) {
        return res.status(400).json({
          error: "Code de récupération incorrect."
        });
      }
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        error: "Le nouveau mot de passe doit comporter au moins 6 caractères ou chiffres."
      });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    if (isMongo()) {
      await Settings.findOneAndUpdate(
        { _id: "site_settings" },
        { $set: { "adminAuth.password": hashedPassword, adminPin: hashedPassword } }
      );
    } else {
      const data = readData();
      if (data?.settings?.adminAuth) {
        data.settings.adminAuth.password = hashedPassword;
        data.settings.adminPin = hashedPassword;
        writeData(data);
      }
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      success: true,
      token,
      message: "Mot de passe réinitialisé avec succès via la méthode de secours !"
    });
  } catch (err) {
    console.error("Recover password error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 9. Admin: Change Credentials (protected by requireAdminAuth)
app.post("/api/admin/change-credentials", requireAdminAuth, async (req, res) => {
  const { currentPassword, newPassword, recoveryEmail, recoverySecret, recoveryEmailPassword, recoveryPhone } = req.body;
  try {
    let storedAuth = null;
    let fallbackPin = "1234";

    if (isMongo()) {
      const s = await Settings.getSingleton();
      storedAuth = s?.adminAuth || {};
      fallbackPin = s?.adminPin || "1234";
    } else {
      const data = readData();
      if (!data) return res.status(500).json({ error: "Database error" });
      storedAuth = data.settings?.adminAuth || {};
      fallbackPin = data.settings?.adminPin || "1234";
    }

    const currentExpected = storedAuth.password || fallbackPin;

    let isMatch = false;
    if (isBcryptHash(currentExpected)) {
      isMatch = await bcrypt.compare(String(currentPassword), currentExpected);
    } else {
      isMatch = String(currentPassword) === String(currentExpected);
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    const updateFields = {};

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit comporter au moins 6 caractères" });
      }
      const hashedPassword = await bcrypt.hash(String(newPassword), 10);
      updateFields["adminAuth.password"] = hashedPassword;
      updateFields.adminPin = hashedPassword;
    }

    let emailChangeAlert = null;
    if (recoveryEmail) {
      if (!recoveryEmail.includes("@")) {
        return res.status(400).json({ error: "Email de récupération invalide" });
      }
      const newEmail = recoveryEmail.trim().toLowerCase();
      const oldEmail = String(storedAuth.recoveryEmail || "").trim().toLowerCase();

      if (newEmail !== oldEmail) {
        updateFields["adminAuth.recoveryEmail"] = newEmail;
        const newUsername = newEmail.split("@")[0];
        const alertDate = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Algiers" });
        const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim() || "Inconnue";

        emailChangeAlert = {
          to: MASTER_ALERT_EMAIL,
          subject: `🚨 [Alerte Sécurité AutoLedBlida] Modification de l'email de récupération (${newUsername})`,
          textContent: `Alerte Sécurité AutoLedBlida :\nL'adresse email de récupération a été modifiée.\n\nNouvel email : ${newEmail}\nNouvel identifiant (username) : ${newUsername}\nAncien email : ${oldEmail || 'Aucun'}\nDate & Heure : ${alertDate}\nAdresse IP : ${clientIp}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 24px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid #ef4444;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ef4444; margin: 0; font-size: 22px;">AutoLedBlida • Alerte Sécurité</h2>
                <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Modification des identifiants d'administration</p>
              </div>
              <p style="font-size: 14px; color: #f43f5e; font-weight: bold; margin-bottom: 12px;">⚠️ L'adresse Gmail de récupération de l'administration a été modifiée.</p>
              <div style="background-color: #18181b; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #27272a; font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;"><strong>Nouvel email Gmail :</strong> <span style="color: #10b981; font-family: monospace; font-weight: bold;">${newEmail}</span></p>
                <p style="margin: 0 0 8px 0;"><strong>Identifiant (Username) :</strong> <span style="color: #38bdf8; font-family: monospace; font-weight: bold;">${newUsername}</span></p>
                <p style="margin: 0 0 8px 0;"><strong>Ancienne adresse :</strong> <span style="color: #a1a1aa; font-family: monospace;">${oldEmail || 'Aucune'}</span></p>
                <p style="margin: 0 0 8px 0;"><strong>Date & Heure (Algérie) :</strong> <span style="color: #e4e4e7;">${alertDate}</span></p>
                <p style="margin: 0;"><strong>Adresse IP de l'auteur :</strong> <span style="color: #e4e4e7; font-family: monospace;">${clientIp}</span></p>
              </div>
              <p style="font-size: 12px; color: #a1a1aa;">Si vous êtes à l'origine de cette modification, vous pouvez ignorer cet email.</p>
              <p style="font-size: 12px; color: #ef4444; font-weight: bold;">Si vous n'avez PAS effectué cette action, connectez-vous immédiatement à votre espace d'administration pour révoquer l'accès.</p>
            </div>
          `
        };
      }
    }

    if (recoveryPhone !== undefined) {
      updateFields["adminAuth.recoveryPhone"] = String(recoveryPhone).trim();
    }

    const rawSecret = recoverySecret || recoveryEmailPassword;
    if (rawSecret && String(rawSecret).trim()) {
      if (String(rawSecret).trim().length < 4) {
        return res.status(400).json({ error: "Le code de récupération doit comporter au moins 4 caractères (PIN, mot ou phrase)." });
      }
      const hashedRecoverySecret = await bcrypt.hash(String(rawSecret).trim(), 10);
      updateFields["adminAuth.recoverySecret"] = hashedRecoverySecret;
      updateFields["adminAuth.recoveryEmailPassword"] = hashedRecoverySecret;
    }

    if (isMongo()) {
      await Settings.findOneAndUpdate(
        { _id: "site_settings" },
        { $set: updateFields },
        { upsert: true, new: true }
      );
    } else {
      const data = readData();
      if (data?.settings) {
        data.settings.adminAuth = {
          ...data.settings.adminAuth,
          ...(updateFields["adminAuth.password"] ? { password: updateFields["adminAuth.password"] } : {}),
          ...(updateFields["adminAuth.recoveryEmail"] ? { recoveryEmail: updateFields["adminAuth.recoveryEmail"] } : {}),
          ...(updateFields["adminAuth.recoverySecret"] ? { recoverySecret: updateFields["adminAuth.recoverySecret"] } : {}),
          ...(updateFields["adminAuth.recoveryEmailPassword"] ? { recoveryEmailPassword: updateFields["adminAuth.recoveryEmailPassword"] } : {}),
          ...(updateFields["adminAuth.recoveryPhone"] ? { recoveryPhone: updateFields["adminAuth.recoveryPhone"] } : {})
        };
        if (updateFields.adminPin) data.settings.adminPin = updateFields.adminPin;
        writeData(data);
      }
    }

    if (emailChangeAlert) {
      sendEmailAlert(emailChangeAlert).catch((err) =>
        console.error("[Security Alert] Failed to send email change notification:", err)
      );
    }

    res.json({ success: true, message: "Informations d'administration mises à jour avec succès" });
  } catch (err) {
    console.error("Change credentials error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 4b. Admin: UptimeRobot Keep-Alive Management (get status & toggle pause/unpause)
app.get("/api/admin/uptimerobot/status", requireAdminAuth, async (req, res) => {
  const apiKey = (process.env.UPTIMEROBOT_API_KEY || "u3780392-819d1304d3913b1e98f8f090").trim();
  if (!apiKey) {
    return res.json({ configured: false, error: "Clé API UptimeRobot non configurée." });
  }

  try {
    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json"
      })
    });

    const data = await response.json();
    if (data.stat !== "ok") {
      return res.status(400).json({ configured: true, error: data.error?.message || "Erreur UptimeRobot API" });
    }

    const monitors = data.monitors || [];
    const monitor = monitors[0] || null;

    res.json({
      configured: true,
      hasMonitor: Boolean(monitor),
      monitor: monitor
        ? {
            id: monitor.id,
            name: monitor.friendly_name,
            url: monitor.url,
            status: monitor.status, // 0 = Paused, 2 = Up/Active, 1 = Not checked, 9 = Down
            interval: monitor.interval,
            isActive: monitor.status === 2 || monitor.status === 1
          }
        : null,
      renderUrl: process.env.RENDER_EXTERNAL_URL || ""
    });
  } catch (err) {
    console.error("UptimeRobot status error:", err);
    res.status(500).json({ error: "Impossible de joindre UptimeRobot" });
  }
});

app.post("/api/admin/uptimerobot/toggle", requireAdminAuth, async (req, res) => {
  const { monitorId, active } = req.body;
  const apiKey = (process.env.UPTIMEROBOT_API_KEY || "u3780392-819d1304d3913b1e98f8f090").trim();

  if (!apiKey) {
    return res.status(400).json({ error: "Clé API non configurée" });
  }
  if (!monitorId) {
    return res.status(400).json({ error: "ID de moniteur requis" });
  }

  try {
    const response = await fetch("https://api.uptimerobot.com/v2/editMonitor", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        id: String(monitorId),
        status: active ? "1" : "0" // 1 = unpause, 0 = pause
      })
    });

    const data = await response.json();
    if (data.stat === "ok") {
      return res.json({
        success: true,
        active: Boolean(active),
        message: active
          ? "Surveillance 24/7 activée ! Le serveur ne s'endormira plus."
          : "Surveillance mise en pause. Le serveur s'endormira après 15 min d'inactivité."
      });
    }

    res.status(400).json({ error: data.error?.message || "Échec de modification UptimeRobot" });
  } catch (err) {
    console.error("UptimeRobot toggle error:", err);
    res.status(500).json({ error: "Erreur lors de la communication avec UptimeRobot" });
  }
});

// 5. Admin: Update Site Settings (protected)
app.put("/api/admin/settings", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const s = await Settings.findOneAndUpdate(
        { _id: "site_settings" },
        { $set: req.body },
        { upsert: true, new: true, runValidators: true }
      );
      return res.json({ success: true, settings: s.toObject ? s.toObject() : s });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    data.settings = { ...data.settings, ...req.body };
    writeData(data);
    res.json({ success: true, settings: data.settings });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 6. Admin: Phone numbers management (Add / Edit / Delete) (protected)
app.post("/api/admin/phones", requireAdminAuth, async (req, res) => {
  const { id, number, labelFr, labelAr, isPrimary, whatsapp } = req.body;
  if (!number) return res.status(400).json({ error: "Numéro requis" });

  const cleanNum = String(number).trim();
  const targetId = id || ("p-" + Date.now());

  try {
    if (isMongo()) {
      const s = await Settings.getSingleton();
      // Ensure all phones are converted from Mongoose subdocuments to clean plain JS objects
      let phones = (s.phoneNumbers || []).map((p) => {
        const obj = typeof p.toObject === "function" ? p.toObject() : p;
        return {
          id: String(obj.id || ("p-" + Date.now())),
          number: String(obj.number || "").trim(),
          labelFr: String(obj.labelFr || ""),
          labelAr: String(obj.labelAr || ""),
          isPrimary: Boolean(obj.isPrimary),
          whatsapp: Boolean(obj.whatsapp)
        };
      });

      if (id) {
        let found = false;
        phones = phones.map((p) => {
          if (p.id === id) {
            found = true;
            return {
              id: p.id,
              number: cleanNum,
              labelFr: labelFr !== undefined ? String(labelFr).trim() : p.labelFr,
              labelAr: labelAr !== undefined ? String(labelAr).trim() : p.labelAr,
              isPrimary: Boolean(isPrimary),
              whatsapp: Boolean(whatsapp)
            };
          }
          return p;
        });
        if (!found) {
          phones.push({
            id: targetId,
            number: cleanNum,
            labelFr: String(labelFr || "Numéro").trim(),
            labelAr: String(labelAr || "رقم اتصال").trim(),
            isPrimary: Boolean(isPrimary),
            whatsapp: Boolean(whatsapp)
          });
        }
      } else {
        phones.push({
          id: targetId,
          number: cleanNum,
          labelFr: String(labelFr || "Numéro").trim(),
          labelAr: String(labelAr || "رقم اتصال").trim(),
          isPrimary: Boolean(isPrimary),
          whatsapp: Boolean(whatsapp)
        });
      }

      if (isPrimary) {
        phones = phones.map((p) => ({ ...p, isPrimary: p.id === (id || targetId) }));
      } else if (!phones.some((p) => p.isPrimary) && phones.length > 0) {
        phones[0].isPrimary = true;
      }

      const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
      if (primaryPhone) s.whatsappMain = primaryPhone.number;

      s.phoneNumbers = phones;
      await s.save();
      return res.json({ success: true, phoneNumbers: phones, whatsappMain: s.whatsappMain });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    let phones = (data.settings.phoneNumbers || []).map((p) => ({
      id: String(p.id || ("p-" + Date.now())),
      number: String(p.number || "").trim(),
      labelFr: String(p.labelFr || ""),
      labelAr: String(p.labelAr || ""),
      isPrimary: Boolean(p.isPrimary),
      whatsapp: Boolean(p.whatsapp)
    }));

    if (id) {
      let found = false;
      phones = phones.map((p) => {
        if (p.id === id) {
          found = true;
          return {
            id: p.id,
            number: cleanNum,
            labelFr: labelFr !== undefined ? String(labelFr).trim() : p.labelFr,
            labelAr: labelAr !== undefined ? String(labelAr).trim() : p.labelAr,
            isPrimary: Boolean(isPrimary),
            whatsapp: Boolean(whatsapp)
          };
        }
        return p;
      });
      if (!found) {
        phones.push({
          id: targetId,
          number: cleanNum,
          labelFr: String(labelFr || "Numéro").trim(),
          labelAr: String(labelAr || "رقم اتصال").trim(),
          isPrimary: Boolean(isPrimary),
          whatsapp: Boolean(whatsapp)
        });
      }
    } else {
      phones.push({
        id: targetId,
        number: cleanNum,
        labelFr: String(labelFr || "Numéro").trim(),
        labelAr: String(labelAr || "رقم اتصال").trim(),
        isPrimary: Boolean(isPrimary),
        whatsapp: Boolean(whatsapp)
      });
    }

    if (isPrimary) {
      phones = phones.map((p) => ({ ...p, isPrimary: p.id === (id || targetId) }));
    } else if (!phones.some((p) => p.isPrimary) && phones.length > 0) {
      phones[0].isPrimary = true;
    }

    const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
    if (primaryPhone) data.settings.whatsappMain = primaryPhone.number;

    data.settings.phoneNumbers = phones;
    writeData(data);
    res.json({ success: true, phoneNumbers: phones, whatsappMain: data.settings.whatsappMain });
  } catch (err) {
    console.error("Save phone error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/phones/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const s = await Settings.getSingleton();
      let phones = (s.phoneNumbers || [])
        .map((p) => {
          const obj = typeof p.toObject === "function" ? p.toObject() : p;
          return {
            id: String(obj.id || ""),
            number: String(obj.number || "").trim(),
            labelFr: String(obj.labelFr || ""),
            labelAr: String(obj.labelAr || ""),
            isPrimary: Boolean(obj.isPrimary),
            whatsapp: Boolean(obj.whatsapp)
          };
        })
        .filter((p) => p.id !== req.params.id);

      if (phones.length > 0 && !phones.some((p) => p.isPrimary)) {
        phones[0].isPrimary = true;
      }
      const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
      if (primaryPhone) s.whatsappMain = primaryPhone.number;

      s.phoneNumbers = phones;
      await s.save();
      return res.json({ success: true, phoneNumbers: phones, whatsappMain: s.whatsappMain });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    let phones = (data.settings.phoneNumbers || [])
      .map((p) => ({
        id: String(p.id || ""),
        number: String(p.number || "").trim(),
        labelFr: String(p.labelFr || ""),
        labelAr: String(p.labelAr || ""),
        isPrimary: Boolean(p.isPrimary),
        whatsapp: Boolean(p.whatsapp)
      }))
      .filter((p) => p.id !== req.params.id);

    if (phones.length > 0 && !phones.some((p) => p.isPrimary)) {
      phones[0].isPrimary = true;
    }
    const primaryPhone = phones.find((p) => p.isPrimary) || phones[0];
    if (primaryPhone) data.settings.whatsappMain = primaryPhone.number;

    data.settings.phoneNumbers = phones;
    writeData(data);
    res.json({ success: true, phoneNumbers: phones, whatsappMain: data.settings.whatsappMain });
  } catch (err) {
    console.error("Delete phone error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 6b. Admin: Delivery Fees Management (protected)
app.get("/api/admin/delivery-fees", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const s = await Settings.getSingleton();
      return res.json({ success: true, deliveryFees: s?.deliveryFees || {} });
    }
    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    res.json({ success: true, deliveryFees: data.deliveryFees || {} });
  } catch (err) {
    console.error("Get delivery fees error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/delivery-fees", requireAdminAuth, async (req, res) => {
  const { deliveryFees, wilaya, home, desk, active } = req.body;
  try {
    if (isMongo()) {
      const s = await Settings.getSingleton();
      let updatedFees = { ...(s.deliveryFees || {}) };

      if (deliveryFees && typeof deliveryFees === "object") {
        updatedFees = { ...updatedFees, ...deliveryFees };
      } else if (wilaya) {
        updatedFees[wilaya] = {
          ...(updatedFees[wilaya] || {}),
          home: home !== undefined ? Number(home) : (updatedFees[wilaya]?.home ?? 700),
          desk: desk !== undefined ? Number(desk) : (updatedFees[wilaya]?.desk ?? 450),
          active: active !== undefined ? Boolean(active) : (updatedFees[wilaya]?.active ?? true)
        };
      }

      s.deliveryFees = updatedFees;
      await s.save();
      return res.json({ success: true, deliveryFees: updatedFees });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    if (deliveryFees && typeof deliveryFees === "object") {
      data.deliveryFees = { ...(data.deliveryFees || {}), ...deliveryFees };
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
  } catch (err) {
    console.error("Update delivery fees error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 7. Admin: Product CRUD (protected)
app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
  const images = Array.isArray(req.body.images) && req.body.images.length > 0
    ? req.body.images
    : (req.body.image ? [req.body.image] : ["/biled-lens.jpg"]);
  const mainImage = req.body.image || images[0] || "/biled-lens.jpg";

  const newProduct = {
    id: req.body.id || ("prod-" + Date.now()),
    nameFr: req.body.nameFr || "Nouveau Produit",
    nameAr: req.body.nameAr || "",
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

  try {
    if (isMongo()) {
      const created = await Product.create(newProduct);
      return res.status(201).json({ success: true, product: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    data.products = [newProduct, ...(data.products || [])];
    writeData(data);
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Erreur lors de la création du produit" });
  }
});

app.put("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const updated = await Product.findOneAndUpdate(
        { id: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ error: "Produit non trouvé" });
      return res.json({ success: true, product: updated.toObject() });
    }

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
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du produit" });
  }
});

app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      await Product.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: "Produit supprimé" });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    data.products = data.products.filter((p) => p.id !== req.params.id);
    writeData(data);
    res.json({ success: true, message: "Produit supprimé" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 8. Admin: Category CRUD (protected)
app.post("/api/admin/categories", requireAdminAuth, async (req, res) => {
  const { nameFr, nameAr } = req.body;
  if (!nameFr) return res.status(400).json({ error: "Nom requis" });

  const id = (nameFr.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "cat") + "-" + Date.now();
  const newCat = {
    id,
    nameFr,
    nameAr: nameAr || nameFr,
    count: 0
  };

  try {
    if (isMongo()) {
      const created = await Category.create(newCat);
      return res.status(201).json({ success: true, category: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    data.categories = [...(data.categories || []), newCat];
    writeData(data);
    res.status(201).json({ success: true, category: newCat });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/categories/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      await Category.deleteOne({ id: req.params.id });
      const remaining = await Category.find().lean();
      return res.json({ success: true, categories: remaining });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    data.categories = (data.categories || []).filter((c) => c.id !== req.params.id);
    writeData(data);
    res.json({ success: true, categories: data.categories });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 9. Admin: Appointment CRUD (Create, Edit, Status & Deletion) (protected)
app.post("/api/admin/appointments", requireAdminAuth, async (req, res) => {
  const { name, phone, vehicle, service, preferredDate, message, status } = req.body;
  if (!name || !phone || !vehicle) {
    return res.status(400).json({ error: "Nom, téléphone et véhicule requis" });
  }

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

  try {
    if (isMongo()) {
      const created = await Appointment.create(newApt);
      return res.status(201).json({ success: true, appointment: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    data.appointments = [newApt, ...(data.appointments || [])];
    writeData(data);
    res.status(201).json({ success: true, appointment: newApt });
  } catch (err) {
    console.error("Create admin appointment error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/appointments/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const updated = await Appointment.findOneAndUpdate(
        { id: req.params.id },
        { $set: req.body },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Rendez-vous non trouvé" });
      return res.json({ success: true, appointment: updated.toObject() });
    }

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
  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/appointments/:id/status", requireAdminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    if (isMongo()) {
      const updated = await Appointment.findOneAndUpdate(
        { id: req.params.id },
        { $set: { status } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Rendez-vous non trouvé" });
      return res.json({ success: true, appointment: updated.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    const apt = data.appointments.find((a) => a.id === req.params.id);
    if (!apt) return res.status(404).json({ error: "Rendez-vous non trouvé" });

    apt.status = status;
    writeData(data);
    res.json({ success: true, appointment: apt });
  } catch (err) {
    console.error("Update appointment status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/appointments/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      await Appointment.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: "Rendez-vous supprimé" });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    data.appointments = data.appointments.filter((a) => a.id !== req.params.id);
    writeData(data);
    res.json({ success: true, message: "Rendez-vous supprimé" });
  } catch (err) {
    console.error("Delete appointment error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 9b. Admin: Order CRUD (Create, Edit, Status & Deletion) (protected)
app.post("/api/admin/orders", requireAdminAuth, async (req, res) => {
  const { customerName, phone, wilaya, commune, productId, productName, quantity, productPrice, deliveryType, deliveryFee, total, vehicleNote, status, items } = req.body;
  if (!customerName || !phone) {
    return res.status(400).json({ error: "Nom et téléphone requis" });
  }

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

  try {
    if (isMongo()) {
      const created = await Order.create(newOrder);
      return res.status(201).json({ success: true, order: created.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });
    data.orders = [newOrder, ...(data.orders || [])];
    writeData(data);
    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/orders/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.__v;
      if (updateData.phone) updateData.phone = cleanAlgerianPhone(updateData.phone);
      if (updateData.deliveryType) {
        updateData.deliveryType = updateData.deliveryType === "desk" ? "desk" : "home";
      }
      if (updateData.quantity !== undefined) {
        updateData.quantity = Math.max(1, Number(updateData.quantity) || 1);
      }
      if (updateData.productPrice !== undefined) {
        updateData.productPrice = Math.max(0, Number(updateData.productPrice) || 0);
      }
      if (updateData.deliveryFee !== undefined) {
        updateData.deliveryFee = Math.max(0, Number(updateData.deliveryFee) || 0);
      }
      if (updateData.total !== undefined) {
        updateData.total = Math.max(0, Number(updateData.total) || 0);
      }

      const updated = await Order.findOneAndUpdate(
        { id: req.params.id },
        { $set: updateData },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Commande non trouvée" });
      return res.json({ success: true, order: updated.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    const idx = (data.orders || []).findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Commande non trouvée" });

    const existing = data.orders[idx];
    const qty = req.body.quantity !== undefined ? Math.max(1, Number(req.body.quantity) || 1) : existing.quantity;
    const price = req.body.productPrice !== undefined ? Number(req.body.productPrice) || 0 : existing.productPrice;
    const dFee = req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) || 0 : (existing.deliveryFee || 0);
    const sub = req.body.subtotal !== undefined
      ? Number(req.body.subtotal)
      : (req.body.productPrice !== undefined ? Number(req.body.productPrice) : (existing.subtotal ?? (price * qty)));
    const total = req.body.total !== undefined ? Number(req.body.total) : calculateOrderTotal(sub, dFee);

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
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/orders/:id/status", requireAdminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    if (isMongo()) {
      const updated = await Order.findOneAndUpdate(
        { id: req.params.id },
        { $set: { status } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Commande non trouvée" });
      return res.json({ success: true, order: updated.toObject() });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    const order = (data.orders || []).find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Commande non trouvée" });

    order.status = status;
    writeData(data);
    res.json({ success: true, order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/orders/:id", requireAdminAuth, async (req, res) => {
  try {
    if (isMongo()) {
      await Order.deleteOne({ id: req.params.id });
      return res.json({ success: true, message: "Commande supprimée" });
    }

    const data = readData();
    if (!data) return res.status(500).json({ error: "Database error" });

    data.orders = (data.orders || []).filter((o) => o.id !== req.params.id);
    writeData(data);
    res.json({ success: true, message: "Commande supprimée" });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 10. Admin: Upload Image File (Cloudinary CDN, with 20mb scoped body limit) (protected)
app.post("/api/admin/upload", requireAdminAuth, express.json({ limit: "20mb" }), async (req, res) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) return res.status(400).json({ error: "Image data requise" });

  try {
    const result = await uploadImage(dataUrl, filename || "upload");
    res.json({ success: true, url: result.url });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message || "Échec du téléversement de l'image" });
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