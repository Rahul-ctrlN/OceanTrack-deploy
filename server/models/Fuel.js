const mongoose = require("mongoose");

const FuelSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      trim: true,
      index: true,
    },
    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
    },
    voyage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voyage",
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fuelType: {
      type: String,
      default: "Marine Diesel",
    },
    fuelUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPerLiter: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Kept for compatibility with older fuel records.
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Kept for compatibility with the older schema.
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingFuel: {
      type: Number,
      default: 0,
      min: 0,
    },
    distance: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumptionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Fuel || mongoose.model("Fuel", FuelSchema);
