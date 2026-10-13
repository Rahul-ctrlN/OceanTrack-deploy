const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    maintenanceId: {
      type: String,
      default: "",
    },

    vessel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
    },

    maintenanceType: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    completedDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Overdue"],
      default: "Scheduled",
    },

    cost: {
      type: Number,
      default: 0,
    },

    assignedPerson: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Maintenance ||
  mongoose.model("Maintenance", MaintenanceSchema);