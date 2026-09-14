import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, "Le nom est requis pour le rendez-vous"],
      maxlength: [100, "Le nom ne doit pas dépasser 100 caractères"],
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Le numéro de téléphone est requis"],
      maxlength: [30, "Le numéro de téléphone ne doit pas dépasser 30 caractères"],
      trim: true
    },
    vehicle: {
      type: String,
      maxlength: [150, "Le modèle de véhicule ne doit pas dépasser 150 caractères"],
      trim: true,
      default: ""
    },
    service: {
      type: String,
      required: [true, "Le type de prestation est requis"],
      maxlength: [150, "Le nom de la prestation ne doit pas dépasser 150 caractères"],
      trim: true
    },
    serviceId: {
      type: String,
      trim: true,
      default: ""
    },
    preferredDate: {
      type: String,
      required: [true, "La date souhaitée est requise"],
      maxlength: [30, "La date ne doit pas dépasser 30 caractères"],
      trim: true
    },
    preferredTime: {
      type: String,
      maxlength: [30, "L'heure ne doit pas dépasser 30 caractères"],
      trim: true,
      default: ""
    },
    message: {
      type: String,
      maxlength: [500, "Le message ne doit pas dépasser 500 caractères"],
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: ["nouveau", "confirme", "termine", "annule"],
        message: "Statut de rendez-vous invalide"
      },
      default: "nouveau"
    }
  },
  {
    timestamps: true
  }
);

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
export default Appointment;

