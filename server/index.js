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

// Helpers for phone validation
function cleanAlgerianPhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[\s\-\.]/g, "");
}

function isValidAlgerianPhone(phone) {
  const clean = cleanAlgerianPhone(phone);
  return /^0[567][0-9]{8}$/.test(clean);
}

// 2. Public endpoint: Submit appointment
app.post("/api/appointments", (req, res) => {
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

// 2b. Public endpoint: Submit product order
app.post("/api/orders", (req, res) => {
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

app.delete("/api/admin/phones/:id", (req, res) => {
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

// 6b. Admin: Delivery Fees Management (Get & Update per Wilaya or Bulk)
app.get("/api/admin/delivery-fees", (req, res) => {
  const data = readData();
  if (!data) return res.status(500).json({ error: "Database error" });
  res.json({ success: true, deliveryFees: data.deliveryFees || {} });
});

app.put("/api/admin/delivery-fees", (req, res) => {
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

// 7. Admin: Product CRUD
app.post("/api/admin/products", (req, res) => {
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

app.put("/api/admin/products/:id", (req, res) => {
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

// 9. Admin: Appointment CRUD (Create, Edit, Status & Deletion)
app.post("/api/admin/appointments", (req, res) => {
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

app.put("/api/admin/appointments/:id", (req, res) => {
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

// 9b. Admin: Order CRUD (Create, Edit, Status & Deletion)
app.post("/api/admin/orders", (req, res) => {
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

app.put("/api/admin/orders/:id", (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AutoLedBlida Server running on port ${PORT}`);
});