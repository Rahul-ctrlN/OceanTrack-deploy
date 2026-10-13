const mongoose = require("mongoose");

const VesselSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  imoNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vesselType: {
    type: String,
    required: true,
    trim: true
  },
  flag: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Active", "At Port", "Maintenance", "In Transit", "Idle"],
    default: "Idle"
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  speed: {
    type: Number,
    default: 0
  },
  destination: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Vessel = mongoose.model("Vessel", VesselSchema);

module.exports = Vessel;