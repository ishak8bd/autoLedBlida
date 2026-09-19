import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Appointment } from "../models/Appointment.js";
import { Settings } from "../models/Settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    console.error("❌ ERREUR: MONGODB_URI n'est pas défini dans le fichier .env.");
    console.error("Veuillez renseigner votre chaîne de connexion MongoDB Atlas avant d'exécuter la migration.");
    process.exit(1);
  }

  // Determine source file
  const storePath = path.join(__dirname, "..", "data", "store.json");
  const examplePath = path.join(__dirname, "..", "data", "store.example.json");

  let sourcePath = storePath;
  if (!fs.existsSync(sourcePath)) {
    sourcePath = examplePath;
  }

  if (!fs.existsSync(sourcePath)) {
    console.error("❌ ERREUR: Aucun fichier source (store.json ou store.example.json) trouvé.");
    process.exit(1);
  }

  console.log(`[SEED] Lecture des données depuis: ${sourcePath}`);
  const raw = fs.readFileSync(sourcePath, "utf8");
  const data = JSON.parse(raw);

  console.log(`[SEED] Connexion à MongoDB Atlas...`);
  await mongoose.connect(uri.trim());
  console.log(`[SEED] ✅ Connecté avec succès.`);

  // 1. Categories
  let catCount = 0;
  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      if (!cat.id) continue;
      await Category.findOneAndUpdate(
        { id: cat.id },
        {
          id: cat.id,
          nameFr: cat.nameFr || cat.name || "Catégorie",
          nameAr: cat.nameAr || "",
          count: Number(cat.count) || 0
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      catCount++;
    }
  }
  console.log(`[SEED] ✅ Catégories synchronisées: ${catCount}`);

  // 2. Products
  let prodCount = 0;
  if (Array.isArray(data.products)) {
    for (const prod of data.products) {
      if (!prod.id) continue;
      await Product.findOneAndUpdate(
        { id: prod.id },
        {
          id: prod.id,
          nameFr: prod.nameFr || prod.title || prod.name || "Produit",
          nameAr: prod.nameAr || "",
          price: Number(prod.price) || 0,
          oldPrice: prod.oldPrice ? Number(prod.oldPrice) : null,
          isPromo: Boolean(prod.isPromo),
          isNew: Boolean(prod.isNew),
          category: prod.category || "accessories",
          inStock: prod.inStock !== false,
          badgeFr: prod.badgeFr || prod.badge || "",
          badgeAr: prod.badgeAr || "",
          image: prod.image || "",
          images: Array.isArray(prod.images) ? prod.images : (prod.image ? [prod.image] : []),
          descriptionFr: prod.descriptionFr || prod.description || "",
          descriptionAr: prod.descriptionAr || ""
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      prodCount++;
    }
  }
  console.log(`[SEED] ✅ Produits synchronisés: ${prodCount}`);

  // 3. Orders
  let orderCount = 0;
  if (Array.isArray(data.orders)) {
    for (const ord of data.orders) {
      if (!ord.id) continue;
      await Order.findOneAndUpdate(
        { id: ord.id },
        {
          id: ord.id,
          customerName: ord.customerName || "Client",
          phone: ord.phone || "",
          wilaya: ord.wilaya || "",
          commune: ord.commune || "",
          deliveryType: ord.deliveryType || "home",
          deliveryFee: Number(ord.deliveryFee) || 0,
          items: Array.isArray(ord.items) ? ord.items : [],
          productId: ord.productId || "",
          productName: ord.productName || "",
          productPrice: Number(ord.productPrice) || 0,
          quantity: Number(ord.quantity) || 1,
          vehicleNote: ord.vehicleNote || "",
          total: Number(ord.total) || 0,
          status: ord.status || "nouveau"
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      orderCount++;
    }
  }
  console.log(`[SEED] ✅ Commandes synchronisées: ${orderCount}`);

  // 4. Appointments
  let aptCount = 0;
  if (Array.isArray(data.appointments)) {
    for (const apt of data.appointments) {
      if (!apt.id) continue;
      await Appointment.findOneAndUpdate(
        { id: apt.id },
        {
          id: apt.id,
          name: apt.name || "Client",
          phone: apt.phone || "",
          vehicle: apt.vehicle || "",
          service: apt.service || "Prestation",
          serviceId: apt.serviceId || "",
          preferredDate: apt.preferredDate || new Date().toISOString().split("T")[0],
          preferredTime: apt.preferredTime || "",
          message: apt.message || "",
          status: apt.status || "nouveau"
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      aptCount++;
    }
  }
  console.log(`[SEED] ✅ Rendez-vous synchronisés: ${aptCount}`);

  // 5. Settings & Delivery Fees
  const settingsData = {
    ...(data.settings || {}),
    deliveryFees: data.deliveryFees || {}
  };
  // Strip recoverySecret and recoveryEmailPassword from being stored in Mongo
  if (settingsData.adminAuth) {
    delete settingsData.adminAuth.recoveryEmailPassword;
    delete settingsData.adminAuth.recoverySecret;
  }

  await Settings.findOneAndUpdate(
    { _id: "site_settings" },
    { $set: settingsData },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
  console.log(`[SEED] ✅ Paramètres et frais de livraison synchronisés.`);

  console.log("\n========================================================");
  console.log("🎉 MIGRATION VERS MONGODB ATLAS EFFECTUÉE AVEC SUCCÈS !");
  console.log("========================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error("❌ Erreur critique lors de la migration:", err);
  process.exit(1);
});

