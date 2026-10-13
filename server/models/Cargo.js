const mongoose = require("mongoose");

const CargoSchema = new mongoose.Schema({
  cargoNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  voyage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voyage",
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  cargoType: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Pending", "Loaded", "In Transit", "Delivered"],
    default: "Pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Cargo = mongoose.model("Cargo", CargoSchema);

module.exports = Cargo;