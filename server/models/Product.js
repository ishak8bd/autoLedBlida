import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    nameFr: {
      type: String,
      required: [true, "Le nom français du produit est requis"],
      maxlength: [200, "Le nom français ne doit pas dépasser 200 caractères"],
      trim: true
    },
    nameAr: {
      type: String,
      maxlength: [200, "Le nom arabe ne doit pas dépasser 200 caractères"],
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: [true, "Le prix est requis"],
      min: [0, "Le prix ne peut pas être négatif"]
    },
    oldPrice: {
      type: Number,
      min: [0, "L'ancien prix ne peut pas être négatif"],
      default: null
    },
    isPromo: {
      type: Boolean,
      default: false
    },
    isNew: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      required: [true, "La catégorie est requise"],
      trim: true
    },
    inStock: {
      type: Boolean,
      default: true
    },
    badgeFr: {
      type: String,
      maxlength: [100, "Le badge français ne doit pas dépasser 100 caractères"],
      trim: true,
      default: ""
    },
    badgeAr: {
      type: String,
      maxlength: [100, "Le badge arabe ne doit pas dépasser 100 caractères"],
      trim: true,
      default: ""
    },
    image: {
      type: String,
      trim: true,
      default: ""
    },
    images: {
      type: [String],
      default: []
    },
    descriptionFr: {
      type: String,
      maxlength: [3000, "La description ne doit pas dépasser 3000 caractères"],
      trim: true,
      default: ""
    },
    descriptionAr: {
      type: String,
      maxlength: [3000, "La description arabe ne doit pas dépasser 3000 caractères"],
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

// Prevent re-compilation in development
export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;

