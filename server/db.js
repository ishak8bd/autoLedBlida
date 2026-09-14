import mongoose from "mongoose";

let isDbConnected = false;
let dbMode = "none";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const useLocal = String(process.env.USE_LOCAL_STORAGE).trim().toLowerCase() === "true";

  if (uri && uri.trim() !== "") {
    try {
      console.log("[DB] Connecting to MongoDB Atlas...");
      await mongoose.connect(uri.trim());
      isDbConnected = true;
      dbMode = "mongodb";
      console.log("[DB] ✅ Connected to MongoDB Atlas successfully.");
      return { isConnected: true, mode: "mongodb" };
    } catch (err) {
      console.error("[DB] ❌ MongoDB Atlas connection error:", err.message);
      if (useLocal) {
        console.warn("[DB] ⚠️ Falling back to local storage because USE_LOCAL_STORAGE=true is explicitly set.");
        isDbConnected = false;
        dbMode = "local";
        return { isConnected: false, mode: "local" };
      }
      console.error("FATAL: Failed to connect to MongoDB Atlas and USE_LOCAL_STORAGE is not enabled. Refusing to start.");
      process.exit(1);
    }
  }

  // If MONGODB_URI is not set:
  if (useLocal) {
    console.log("[DB] ℹ️ USE_LOCAL_STORAGE=true is active. Running in local JSON storage mode (Offline Dev Mode).");
    isDbConnected = false;
    dbMode = "local";
    return { isConnected: false, mode: "local" };
  }

  console.error("FATAL: MONGODB_URI environment variable is not set.");
  console.error("Persistent database storage is required to prevent data loss on Render.");
  console.error("If you are developing locally offline, set USE_LOCAL_STORAGE=true in your .env file.");
  process.exit(1);
}

export function getDbStatus() {
  return {
    isConnected: isDbConnected,
    mode: dbMode
  };
}

export default mongoose;

