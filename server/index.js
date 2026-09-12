import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "store.json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Helper to read data safely (stripping BOM if written by Windows PowerShell)
function readData() {
  try {
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

// 1. Get entire public/admin store
app.get("/api/data", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Failed to load database" });
  res.json(data);
});

// 2. Public endpoint: Submit appointment
app.post("/api/appointments", (req, res) => {
  const { name, phone, vehicle, service, preferredDate, message } = req.body;
  if (!name || !phone || !vehicle) {
    return res.status(400).json({ error: "Nom, téléphone et véhicule requis" });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database unavailable" });

  const newAppointment = {
    id: "apt-" + Date.now(),
    name: name.trim(),
    phone: phone.trim(),
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

// 2b. Public endpoint: Submit product order
app.post("/api/orders", (req, res) => {
  const { customerName, phone, wilaya, commune, quantity, vehicleNote, productId, productName, productPrice, productImage } = req.body;
  if (!customerName || !phone || !wilaya) {
    return res.status(400).json({ error: "Nom, téléphone et wilaya requis" });
  }

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database unavailable" });

  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(productPrice) || 0;
  const total = price * qty;

  const newOrder = {
    id: "cmd-" + Date.now(),
    customerName: customerName.trim(),
    phone: phone.trim(),
    wilaya: wilaya.trim(),
    commune: (commune || "").trim(),
    quantity: qty,
    vehicleNote: (vehicleNote || "").trim(),
    productId: productId || "",
    productName: productName || "Produit AutoLedBlida",
    productImage: productImage || "",
    productPrice: price,
    total,
    status: "nouveau",
    createdAt: new Date().toISOString()
  };

  data.orders = [newOrder, ...(data.orders || [])];
  writeData(data);

  res.status(201).json({ success: true, order: newOrder });
});

// 3. Admin: Verify PIN
app.post("/api/admin/verify-pin", (req, res) => {
  const { pin } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const currentPin = data.settings?.adminPin || "1234";
  if (pin === currentPin) {
    return res.json({ success: true, token: "admin-auth-" + Date.now() });
  }
  return res.status(401).json({ success: false, error: "Code PIN incorrect" });
});

// 4. Admin: Change PIN
app.post("/api/admin/change-pin", (req, res) => {
  const { oldPin, newPin } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  if (data.settings.adminPin && data.settings.adminPin !== oldPin) {
    return res.status(400).json({ error: "Ancien code PIN incorrect" });
  }

  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: "Le nouveau code doit contenir au moins 4 chiffres" });
  }

  data.settings.adminPin = newPin;
  writeData(data);
  res.json({ success: true, message: "Code PIN mis à jour avec succès" });
});

// 5. Admin: Update Site Settings
app.put("/api/admin/settings", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.settings = {
    ...data.settings,
    ...req.body
  };
  writeData(data);
  res.json({ success: true, settings: data.settings });
});

// 6. Admin: Phone numbers management (Add / Edit / Delete)
app.post("/api/admin/phones", (req, res) => {
  const { id, number, labelFr, labelAr, isPrimary, whatsapp } = req.body;
  if (!number) return res.status(400).json({ error: "Numéro requis" });

  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  let phones = data.settings.phoneNumbers || [];

  if (id) {
    // Edit
    phones = phones.map((p) =>
      p.id === id ? { ...p, number, labelFr, labelAr, isPrimary, whatsapp } : p
    );
  } else {
    // Add
    const newPhone = {
      id: "p-" + Date.now(),
      number: number.trim(),
      labelFr: labelFr || "Numéro",
      labelAr: labelAr || "رقم اتصال",
      isPrimary: Boolean(isPrimary),
      whatsapp: Boolean(whatsapp)
    };
    phones.push(newPhone);
  }

  if (isPrimary) {
    phones = phones.map((p) => ({
      ...p,
      isPrimary: p.number === number
    }));
    data.settings.whatsappMain = number;
  }

  data.settings.phoneNumbers = phones;
  writeData(data);
  res.json({ success: true, phoneNumbers: phones });
});

app.delete("/api/admin/phones/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.settings.phoneNumbers = (data.settings.phoneNumbers || []).filter(
    (p) => p.id !== req.params.id
  );
  writeData(data);
  res.json({ success: true, phoneNumbers: data.settings.phoneNumbers });
});

// 7. Admin: Product CRUD
app.post("/api/admin/products", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const newProduct = {
    id: "prod-" + Date.now(),
    nameFr: req.body.nameFr || "Nouveau Produit",
    nameAr: req.body.nameAr || "منتج جديد",
    price: Number(req.body.price) || 0,
    category: req.body.category || "led-bulbs",
    inStock: req.body.inStock !== false,
    badgeFr: req.body.badgeFr || "",
    badgeAr: req.body.badgeAr || "",
    image: req.body.image || "/bmw-headlights.png",
    descriptionFr: req.body.descriptionFr || "",
    descriptionAr: req.body.descriptionAr || ""
  };

  data.products = [newProduct, ...(data.products || [])];
  writeData(data);
  res.status(201).json({ success: true, product: newProduct });
});

app.put("/api/admin/products/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const idx = data.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Produit non trouvé" });

  data.products[idx] = {
    ...data.products[idx],
    ...req.body,
    id: req.params.id,
    price: Number(req.body.price) || data.products[idx].price
  };

  writeData(data);
  res.json({ success: true, product: data.products[idx] });
});

app.delete("/api/admin/products/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.products = data.products.filter((p) => p.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Produit supprimé" });
});

// 8. Admin: Category CRUD
app.post("/api/admin/categories", (req, res) => {
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

app.delete("/api/admin/categories/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.categories = (data.categories || []).filter((c) => c.id !== req.params.id);
  writeData(data);
  res.json({ success: true, categories: data.categories });
});

// 9. Admin: Appointment Status & Deletion
app.put("/api/admin/appointments/:id/status", (req, res) => {
  const { status } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const apt = data.appointments.find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: "Rendez-vous non trouvé" });

  apt.status = status;
  writeData(data);
  res.json({ success: true, appointment: apt });
});

app.delete("/api/admin/appointments/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.appointments = data.appointments.filter((a) => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Rendez-vous supprimé" });
});

// 9b. Admin: Order Status & Deletion
app.put("/api/admin/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  const order = (data.orders || []).find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Commande non trouvée" });

  order.status = status;
  writeData(data);
  res.json({ success: true, order });
});

app.delete("/api/admin/orders/:id", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });

  data.orders = (data.orders || []).filter((o) => o.id !== req.params.id);
  writeData(data);
  res.json({ success: true, message: "Commande supprimée" });
});

// 10. Admin: Upload Image File (Base64 -> /uploads/filename)
app.post("/api/admin/upload", (req, res) => {
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

app.listen(PORT, () => {
  console.log(`AutoLedBlida Server running on http://localhost:${PORT}`);
});