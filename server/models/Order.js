import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      trim: true,
      default: ""
    },
    productName: {
      type: String,
      required: [true, "Le nom de l'article est requis"],
      maxlength: [200, "Le nom de l'article ne doit pas dépasser 200 caractères"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Le prix de l'article est requis"],
      min: [0, "Le prix de l'article ne peut pas être négatif"]
    },
    quantity: {
      type: Number,
      required: [true, "La quantité de l'article est requise"],
      min: [1, "La quantité minimale est de 1"],
      max: [100, "La quantité maximale par article est de 100"],
      default: 1
    },
    image: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    customerName: {
      type: String,
      required: [true, "Le nom du client est requis"],
      maxlength: [100, "Le nom du client ne doit pas dépasser 100 caractères"],
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Le numéro de téléphone est requis"],
      maxlength: [30, "Le numéro de téléphone ne doit pas dépasser 30 caractères"],
      trim: true
    },
    wilaya: {
      type: String,
      required: [true, "La wilaya est requise"],
      maxlength: [100, "La wilaya ne doit pas dépasser 100 caractères"],
      trim: true
    },
    commune: {
      type: String,
      maxlength: [100, "La commune ne doit pas dépasser 100 caractères"],
      trim: true,
      default: ""
    },
    deliveryType: {
      type: String,
      enum: {
        values: ["home", "desk"],
        message: "Le type de livraison doit être 'home' (domicile) ou 'desk' (bureau)"
      },
      default: "home"
    },
    deliveryFee: {
      type: Number,
      min: [0, "Les frais de livraison ne peuvent pas être négatifs"],
      default: 0
    },
    items: {
      type: [OrderItemSchema],
      default: []
    },
    // Backwards compatibility fields for single product orders
    productId: {
      type: String,
      trim: true,
      default: ""
    },
    productName: {
      type: String,
      maxlength: [200, "Le nom du produit ne doit pas dépasser 200 caractères"],
      trim: true,
      default: ""
    },
    productPrice: {
      type: Number,
      min: [0, "Le prix ne peut pas être négatif"],
      default: 0
    },
    quantity: {
      type: Number,
      min: [1, "La quantité minimale est de 1"],
      max: [100, "La quantité maximale est de 100"],
      default: 1
    },
    vehicleNote: {
      type: String,
      maxlength: [500, "La note sur le véhicule ne doit pas dépasser 500 caractères"],
      trim: true,
      default: ""
    },
    total: {
      type: Number,
      required: [true, "Le total de la commande est requis"],
      min: [0, "Le montant total ne peut pas être négatif"]
    },
    status: {
      type: String,
      enum: {
        values: ["nouveau", "confirme", "en_route", "livre", "annule"],
        message: "Statut de commande invalide"
      },
      default: "nouveau"
    }
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;

