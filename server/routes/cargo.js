const express = require("express");
const mongoose = require("mongoose");

const Cargo = require("../models/Cargo");
const Voyage = require("../models/Voyage");

const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

/* GET ALL CARGO */
router.get("/", async (req, res) => {
  try {
    const cargo = await Cargo.find()
      .populate(
        "voyage",
        "voyageId voyageNumber origin destination status"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(cargo);
  } catch (error) {
    console.error("Get cargo error:", error);

    res.status(500).json({
      message: "Failed to load cargo records.",
    });
  }
});

/* GET ONE CARGO */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid cargo ID.",
      });
    }

    const cargo = await Cargo.findById(req.params.id).populate(
      "voyage",
      "voyageId voyageNumber origin destination status"
    );

    if (!cargo) {
      return res.status(404).json({
        message: "Cargo record not found.",
      });
    }

    res.status(200).json(cargo);
  } catch (error) {
    console.error("Get cargo error:", error);

    res.status(500).json({
      message: "Failed to load cargo record.",
    });
  }
});

/* CREATE CARGO */
router.post("/", async (req, res) => {
  try {
    const {
      cargoNumber,
      voyage,
      description,
      cargoType,
      quantity,
      weight,
      status,
    } = req.body;

    if (!cargoNumber || !voyage || !cargoType) {
      return res.status(400).json({
        message: "Cargo ID, voyage and cargo type are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(voyage)) {
      return res.status(400).json({
        message: "Invalid voyage selected.",
      });
    }

    const voyageExists = await Voyage.findById(voyage);

    if (!voyageExists) {
      return res.status(400).json({
        message: "Selected voyage does not exist.",
      });
    }

    const existingCargo = await Cargo.findOne({
      cargoNumber: cargoNumber.trim(),
    });

    if (existingCargo) {
      return res.status(409).json({
        message: `Cargo ID "${cargoNumber.trim()}" already exists.`,
      });
    }

    const cargo = await Cargo.create({
      cargoNumber: cargoNumber.trim(),
      voyage,
      description: description?.trim() || "",
      cargoType: cargoType.trim(),
      quantity: Math.max(0, Number(quantity) || 0),
      weight: Math.max(0, Number(weight) || 0),
      status: status || "Pending",
    });

    const result = await cargo.populate(
      "voyage",
      "voyageId voyageNumber origin destination status"
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Create cargo error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This Cargo ID already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      message: "Failed to create cargo record.",
    });
  }
});

/* UPDATE CARGO */
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid cargo ID.",
      });
    }

    const {
      cargoNumber,
      voyage,
      description,
      cargoType,
      quantity,
      weight,
      status,
    } = req.body;

    if (!cargoNumber || !voyage || !cargoType) {
      return res.status(400).json({
        message: "Cargo ID, voyage and cargo type are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(voyage)) {
      return res.status(400).json({
        message: "Invalid voyage selected.",
      });
    }

    const voyageExists = await Voyage.findById(voyage);

    if (!voyageExists) {
      return res.status(400).json({
        message: "Selected voyage does not exist.",
      });
    }

    const duplicate = await Cargo.findOne({
      cargoNumber: cargoNumber.trim(),
      _id: { $ne: req.params.id },
    });

    if (duplicate) {
      return res.status(409).json({
        message: `Cargo ID "${cargoNumber.trim()}" already exists.`,
      });
    }

    const cargo = await Cargo.findByIdAndUpdate(
      req.params.id,
      {
        cargoNumber: cargoNumber.trim(),
        voyage,
        description: description?.trim() || "",
        cargoType: cargoType.trim(),
        quantity: Math.max(0, Number(quantity) || 0),
        weight: Math.max(0, Number(weight) || 0),
        status: status || "Pending",
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      "voyage",
      "voyageId voyageNumber origin destination status"
    );

    if (!cargo) {
      return res.status(404).json({
        message: "Cargo record not found.",
      });
    }

    res.status(200).json(cargo);
  } catch (error) {
    console.error("Update cargo error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This Cargo ID already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      message: "Failed to update cargo record.",
    });
  }
});

/* DELETE CARGO */
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid cargo ID.",
      });
    }

    const cargo = await Cargo.findByIdAndDelete(req.params.id);

    if (!cargo) {
      return res.status(404).json({
        message: "Cargo record not found.",
      });
    }

    res.status(200).json({
      message: "Cargo deleted successfully.",
    });
  } catch (error) {
    console.error("Delete cargo error:", error);

    res.status(500).json({
      message: "Failed to delete cargo record.",
    });
  }
});

module.exports = router;