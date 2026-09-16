import mongoose from "mongoose";

const PhoneNumberSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => "p-" + Date.now() },
    number: { type: String, required: true, trim: true },
    labelFr: { type: String, default: "" },
    labelAr: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: true }
  },
  { _id: false }
);

const HolidayBannerSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    titleFr: { type: String, default: "" },
    titleAr: { type: String, default: "" },
    messageFr: { type: String, default: "" },
    messageAr: { type: String, default: "" },
    badgeFr: { type: String, default: "" },
    badgeAr: { type: String, default: "" }
  },
  { _id: false }
);

const AdminAuthSchema = new mongoose.Schema(
  {
    password: { type: String, default: "" },
    recoveryEmail: { type: String, trim: true, lowercase: true, default: "" },
    recoveryPhone: { type: String, trim: true, default: "" },
    recoveryEmailPassword: { type: String, default: "" }
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "site_settings"
    },
    storeName: { type: String, default: "AutoLedBlida" },
    city: { type: String, default: "Ouled Yaïch, Blida" },
    cityAr: { type: String, default: "أولاد يعيش، البليدة" },
    address: { type: String, default: "Route Principale, Ouled Yaïch, Blida, Algérie" },
    addressAr: { type: String, default: "الطريق الرئيسي، أولاد يعيش، ولاية البليدة، الجزائر" },
    taglineFr: { type: String, default: "Expert en éclairage & équipement automobile" },
    taglineAr: { type: String, default: "خبراء في إنارة وتجهيز السيارات" },
    subtaglineFr: { type: String, default: "" },
    subtaglineAr: { type: String, default: "" },
    deliveryWilayas: { type: Number, default: 58 },
    whatsappMain: { type: String, default: "0561147039" },
    phoneNumbers: { type: [PhoneNumberSchema], default: [] },
    googleMapsUrl: { type: String, default: "" },
    socials: {
      tiktok: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" }
    },
    openingHoursFr: { type: String, default: "Samedi - Jeudi : 09h00 - 19h00 | Vendredi : Fermé" },
    openingHoursAr: { type: String, default: "السبت - الخميس : 09:00 - 19:00 | الجمعة : عطلة" },
    holidayBanner: { type: HolidayBannerSchema, default: () => ({}) },
    deliveryFees: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    adminAuth: { type: AdminAuthSchema, default: () => ({}) },
    adminPin: { type: String, default: "1234" }
  },
  {
    timestamps: true
  }
);

// Helper to get or initialize singleton settings document
SettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findById("site_settings");
  if (!doc) {
    doc = await this.create({ _id: "site_settings" });
  }
  return doc;
};

export const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
export default Settings;

