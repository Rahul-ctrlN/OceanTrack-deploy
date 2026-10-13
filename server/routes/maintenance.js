const express = require("express");
const Maintenance = require("../models/Maintenance");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Convert database record to the format used by frontend
const formatMaintenance = (record) => {
  const obj = record.toObject ? record.toObject() : record;

  return {
    ...obj,

    type: obj.type || obj.maintenanceType || "",

    completionDate:
      obj.completionDate ||
      obj.completedDate ||
      null,

    maintenanceId: obj.maintenanceId || "",
  };
};

// @route GET /api/maintenance
router.get("/", async (req, res) => {
  try {
    const maintenance = await Maintenance.find()
      .populate("vessel", "name imoNumber")
      .sort({ scheduledDate: 1 });

    return res.status(200).json(
      maintenance.map(formatMaintenance)
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route GET /api/maintenance/:id
router.get("/:id", async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate("vessel", "name imoNumber");

    if (!record) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    return res.status(200).json(formatMaintenance(record));
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route POST /api/maintenance
router.post("/", async (req, res) => {
  try {
    const {
      maintenanceId,
      vessel,
      type,
      maintenanceType,
      description,
      scheduledDate,
      completionDate,
      completedDate,
      status,
      cost,
      assignedPerson,
      notes,
    } = req.body;

    const record = await Maintenance.create({
      maintenanceId,
      vessel,

      // Accept current frontend name OR old name
      maintenanceType: type || maintenanceType,

      description,
      scheduledDate,

      // Accept current frontend name OR old name
      completedDate: completionDate || completedDate,

      status: status || "Scheduled",
      cost: Number(cost || 0),
      assignedPerson,
      notes,
    });

    const populatedRecord = await Maintenance.findById(record._id)
      .populate("vessel", "name imoNumber");

    return res.status(201).json(
      formatMaintenance(populatedRecord)
    );
  } catch (error) {
    console.error("Create maintenance error:", error);

    return res.status(400).json({
      message: "Failed to create maintenance record",
      error: error.message,
    });
  }
});

// @route PUT /api/maintenance/:id
router.put("/:id", async (req, res) => {
  try {
    const {
      maintenanceId,
      vessel,
      type,
      maintenanceType,
      description,
      scheduledDate,
      completionDate,
      completedDate,
      status,
      cost,
      assignedPerson,
      notes,
    } = req.body;

    const updateData = {
      maintenanceId,
      vessel,
      maintenanceType: type || maintenanceType,
      description,
      scheduledDate,
      completedDate: completionDate || completedDate,
      status,
      cost: Number(cost || 0),
      assignedPerson,
      notes,
    };

    const record = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("vessel", "name imoNumber");

    if (!record) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    return res.status(200).json(
      formatMaintenance(record)
    );
  } catch (error) {
    console.error("Update maintenance error:", error);

    return res.status(400).json({
      message: "Failed to update maintenance record",
      error: error.message,
    });
  }
});

// @route DELETE /api/maintenance/:id
router.delete("/:id", async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    await record.deleteOne();

    return res.status(200).json({
      message: "Maintenance record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;