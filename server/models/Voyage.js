const mongoose = require("mongoose");

const voyageSchema = new mongoose.Schema(
  {
    voyageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
    },

    origin: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    // Destination coordinates for the tracking map
    destinationLatitude: {
      type: Number,
      required: false,
      min: -90,
      max: 90,
      default: null,
    },

    destinationLongitude: {
      type: Number,
      required: false,
      min: -180,
      max: 180,
      default: null,
    },

    departureDate: {
      type: Date,
      required: true,
    },

    expectedArrival: {
      type: Date,
      required: true,
    },

    actualArrival: {
      type: Date,
      default: null,
    },

    currentLocation: {
      type: String,
      default: "",
      trim: true,
    },

    distance: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Planned",
        "In Progress",
        "Completed",
        "Delayed",
        "Cancelled",
      ],
      default: "Planned",
    },

    delay: {
      type: Number,
      default: 0,
      min: 0,
    },

    plannedFuel: {
      type: Number,
      default: 0,
      min: 0,
    },

    actualFuel: {
      type: Number,
      default: 0,
      min: 0,
    },

    cargo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cargo",
      },
    ],

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Voyage", voyageSchema);