const express = require("express");
const Vessel = require("../models/Vessel");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// GET /api/vessels
router.get("/", async (req, res) => {
  try {
    const vessels = await Vessel.find().sort({ createdAt: -1 });
    return res.status(200).json(vessels);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/vessels/:id
router.get("/:id", async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);

    if (!vessel) {
      return res.status(404).json({
        message: "Vessel not found",
      });
    }

    return res.status(200).json(vessel);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// POST /api/vessels
router.post("/", adminOnly, async (req, res) => {
  try {
    const vessel = await Vessel.create(req.body);

    return res.status(201).json(vessel);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to create vessel",
      error: error.message,
    });
  }
});

// PUT /api/vessels/:id
router.put("/:id", adminOnly, async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!vessel) {
      return res.status(404).json({
        message: "Vessel not found",
      });
    }

    return res.status(200).json(vessel);
  } catch (error) {
    return res.status(400).json({
      message: "Failed to update vessel",
      error: error.message,
    });
  }
});

// DELETE /api/vessels/:id
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);

    if (!vessel) {
      return res.status(404).json({
        message: "Vessel not found",
      });
    }

    await vessel.deleteOne();

    return res.status(200).json({
      message: "Vessel deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

const vesselRoutes = router;

module.exports = vesselRoutes;