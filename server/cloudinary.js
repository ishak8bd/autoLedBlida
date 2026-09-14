import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(
  cloudName && cloudName.trim() &&
  apiKey && apiKey.trim() &&
  apiSecret && apiSecret.trim()
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName.trim(),
    api_key: apiKey.trim(),
    api_secret: apiSecret.trim(),
    secure: true
  });
  console.log("[Cloudinary] ✅ Configured with cloud:", cloudName.trim());
} else {
  console.log("[Cloudinary] ℹ️ Credentials not set.");
}

export async function uploadImage(dataUrl, filename = "product") {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder: "autoledblida/products",
        resource_type: "image",
        format: "webp",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format
      };
    } catch (err) {
      console.error("[Cloudinary] Upload failed:", err.message);
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }

  // Local fallback ONLY if USE_LOCAL_STORAGE is enabled
  const useLocal = String(process.env.USE_LOCAL_STORAGE).trim().toLowerCase() === "true";
  if (useLocal) {
    console.warn("[Cloudinary] ⚠️ Using local filesystem fallback (USE_LOCAL_STORAGE=true).");
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) {
      return { url: dataUrl, local: true };
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

    const distUploads = path.join(__dirname, "..", "dist", "uploads");
    if (fs.existsSync(path.join(__dirname, "..", "dist"))) {
      if (!fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });
      fs.copyFileSync(targetPath, path.join(distUploads, finalFilename));
    }

    return {
      url: `/uploads/${finalFilename}`,
      local: true
    };
  }

  throw new Error("Cloudinary credentials are not configured and USE_LOCAL_STORAGE is disabled. Refusing to write to ephemeral disk.");
}

export async function deleteImage(publicId) {
  if (isCloudinaryConfigured && publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.warn("[Cloudinary] Failed to delete image:", publicId, err.message);
      return false;
    }
  }
  return false;
}

export default cloudinary;

