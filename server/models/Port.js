const mongoose = require("mongoose");

const portSchema = new mongoose.Schema(
  {
    wpinumber: {
      type: String,
      index: true,
    },

    mainPortName: {
      type: String,
      required: true,
      index: true,
    },

    alternatePortName: {
      type: String,
      default: "",
    },

    unlocode: {
      type: String,
      default: "",
      index: true,
    },

    countryCode: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    searchNames: {
      type: [String],
      default: [],
      index: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Port || mongoose.model("Port", portSchema);