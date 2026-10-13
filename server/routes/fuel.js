const express = require("express");
const Fuel = require("../models/Fuel");
const Vessel = require("../models/Vessel");
const Voyage = require("../models/Voyage");
const { protect } = require("../middleware/auth");

const router = express.Router();

/*
  GET ALL FUEL RECORDS
*/
router.get("/", protect, async (req, res) => {
  try {
    const records = await Fuel.find()
      .populate(
        "vessel",
        "vesselId name imoNumber type status location"
      )
      .populate(
        "voyage",
        "voyageId voyageNumber origin destination status"
      )
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error("Get fuel records error:", error);
    res.status(500).json({
      message: "Failed to fetch fuel records",
    });
  }
});

/*
  GET SINGLE FUEL RECORD
*/
router.get("/:id", protect, async (req, res) => {
  try {
    const record = await Fuel.findById(req.params.id)
      .populate(
        "vessel",
        "vesselId name imoNumber type status location"
      )
      .populate(
        "voyage",
        "voyageId voyageNumber origin destination status"
      );

    if (!record) {
      return res.status(404).json({
        message: "Fuel record not found",
      });
    }

    res.json(record);
  } catch (error) {
    console.error("Get fuel record error:", error);
    res.status(500).json({
      message: "Failed to fetch fuel record",
    });
  }
});

/*
  CREATE FUEL RECORD
*/
router.post("/", protect, async (req, res) => {
  try {
    const {
      recordId,
      vessel,
      voyage,
      date,
      fuelType,
      fuelUsed,
      costPerLiter,
      totalCost,
      cost,
      remainingFuel,
      distance,
      consumptionRate,
      location,
      notes,
    } = req.body;

    if (!vessel || !date || fuelUsed === undefined) {
      return res.status(400).json({
        message: "Vessel, date and fuel used are required",
      });
    }

    // Check vessel
    const vesselExists = await Vessel.findById(vessel);

    if (!vesselExists) {
      return res.status(404).json({
        message: "Vessel not found",
      });
    }

    // Check voyage if provided
    if (voyage) {
      const voyageExists = await Voyage.findById(voyage);

      if (!voyageExists) {
        return res.status(404).json({
          message: "Voyage not found",
        });
      }
    }

    const fuel = Number(fuelUsed || 0);
    const rate = Number(costPerLiter || 0);

    // Automatically calculate total cost
    const calculatedCost =
      fuel > 0 && rate > 0
        ? fuel * rate
        : Number(totalCost || cost || 0);

    const calculatedConsumption =
      Number(distance || 0) > 0
        ? fuel / Number(distance)
        : Number(consumptionRate || 0);

    const newRecord = await Fuel.create({
      recordId,
      vessel,
      voyage: voyage || null,
      date,
      fuelType: fuelType || "Marine Diesel",
      fuelUsed: fuel,
      costPerLiter: rate,
      totalCost: calculatedCost,
      cost: calculatedCost,
      remainingFuel: Number(remainingFuel || 0),
      distance: Number(distance || 0),
      consumptionRate: calculatedConsumption,
      location: location || "",
      notes: notes || "",
    });

    const populatedRecord = await Fuel.findById(newRecord._id)
      .populate(
        "vessel",
        "vesselId name imoNumber type status location"
      )
      .populate(
        "voyage",
        "voyageId voyageNumber origin destination status"
      );

    res.status(201).json(populatedRecord);
  } catch (error) {
    console.error("Create fuel record error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Record ID already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create fuel record",
      error: error.message,
    });
  }
});

/*
  UPDATE FUEL RECORD
*/
router.put("/:id", protect, async (req, res) => {
  try {
    const {
      recordId,
      vessel,
      voyage,
      date,
      fuelType,
      fuelUsed,
      costPerLiter,
      totalCost,
      cost,
      remainingFuel,
      distance,
      consumptionRate,
      location,
      notes,
    } = req.body;

    const existingRecord = await Fuel.findById(req.params.id);

    if (!existingRecord) {
      return res.status(404).json({
        message: "Fuel record not found",
      });
    }

    // Check vessel
    if (vessel) {
      const vesselExists = await Vessel.findById(vessel);

      if (!vesselExists) {
        return res.status(404).json({
          message: "Vessel not found",
        });
      }
    }

    // Check voyage
    if (voyage) {
      const voyageExists = await Voyage.findById(voyage);

      if (!voyageExists) {
        return res.status(404).json({
          message: "Voyage not found",
        });
      }
    }

    const fuel = Number(
      fuelUsed !== undefined
        ? fuelUsed
        : existingRecord.fuelUsed || 0
    );

    const rate = Number(
      costPerLiter !== undefined
        ? costPerLiter
        : existingRecord.costPerLiter || 0
    );

    const calculatedCost =
      fuel > 0 && rate > 0
        ? fuel * rate
        : Number(
            totalCost ??
              cost ??
              existingRecord.totalCost ??
              existingRecord.cost ??
              0
          );

    const dist = Number(
      distance !== undefined
        ? distance
        : existingRecord.distance || 0
    );

    const calculatedConsumption =
      dist > 0
        ? fuel / dist
        : Number(
            consumptionRate ??
              existingRecord.consumptionRate ??
              0
          );

    existingRecord.recordId =
      recordId ?? existingRecord.recordId;

    existingRecord.vessel =
      vessel ?? existingRecord.vessel;

    existingRecord.voyage =
      voyage !== undefined
        ? voyage || null
        : existingRecord.voyage;

    existingRecord.date =
      date ?? existingRecord.date;

    existingRecord.fuelType =
      fuelType ?? existingRecord.fuelType;

    existingRecord.fuelUsed = fuel;

    existingRecord.costPerLiter = rate;

    existingRecord.totalCost = calculatedCost;

    // Keep old "cost" field compatible
    existingRecord.cost = calculatedCost;

    existingRecord.remainingFuel =
      Number(
        remainingFuel !== undefined
          ? remainingFuel
          : existingRecord.remainingFuel || 0
      );

    existingRecord.distance = dist;

    existingRecord.consumptionRate =
      calculatedConsumption;

    existingRecord.location =
      location ?? existingRecord.location;

    existingRecord.notes =
      notes ?? existingRecord.notes;

    await existingRecord.save();

    const populatedRecord = await Fuel.findById(
      existingRecord._id
    )
      .populate(
        "vessel",
        "vesselId name imoNumber type status location"
      )
      .populate(
        "voyage",
        "voyageId voyageNumber origin destination status"
      );

    res.json(populatedRecord);
  } catch (error) {
    console.error("Update fuel record error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Record ID already exists",
      });
    }

    res.status(500).json({
      message: "Failed to update fuel record",
      error: error.message,
    });
  }
});

/*
  DELETE FUEL RECORD
*/
router.delete("/:id", protect, async (req, res) => {
  try {
    const record = await Fuel.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        message: "Fuel record not found",
      });
    }

    await Fuel.findByIdAndDelete(req.params.id);

    res.json({
      message: "Fuel record deleted successfully",
    });
  } catch (error) {
    console.error("Delete fuel record error:", error);

    res.status(500).json({
      message: "Failed to delete fuel record",
    });
  }
});

module.exports = router;