import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
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
      required: [true, "Le nom français de la catégorie est requis"],
      maxlength: [100, "Le nom français ne doit pas dépasser 100 caractères"],
      trim: true
    },
    nameAr: {
      type: String,
      maxlength: [100, "Le nom arabe ne doit pas dépasser 100 caractères"],
      trim: true,
      default: ""
    },
    count: {
      type: Number,
      default: 0,
      min: [0, "Le nombre de produits ne peut pas être négatif"]
    }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export default Category;

