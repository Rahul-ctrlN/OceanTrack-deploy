const express = require("express");
const Vessel = require("../models/Vessel");
const Voyage = require("../models/Voyage");
const Cargo = require("../models/Cargo");
const Fuel = require("../models/Fuel");
const Maintenance = require("../models/Maintenance");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// @route   GET /api/reports
// @desc    Fleet-wide summary statistics
router.get("/", async (req, res) => {
  try {
    // Vessel statistics
    const vessels = await Vessel.find();
    const vesselStatusCounts = {};
    vessels.forEach((v) => {
      const status = v.status || "Unknown";
      vesselStatusCounts[status] = (vesselStatusCounts[status] || 0) + 1;
    });
    const vesselStats = Object.keys(vesselStatusCounts).map((status) => ({
      name: status,
      value: vesselStatusCounts[status],
    }));

    // Voyage statistics
    const voyages = await Voyage.find();
    const voyageStatusCounts = {};
    voyages.forEach((v) => {
      const status = v.status || "Unknown";
      voyageStatusCounts[status] = (voyageStatusCounts[status] || 0) + 1;
    });
    const voyageStats = Object.keys(voyageStatusCounts).map((status) => ({
      name: status,
      value: voyageStatusCounts[status],
    }));

    // Cargo statistics
    const cargoRecords = await Cargo.find();
    const totalCargoWeight = cargoRecords.reduce((sum, c) => sum + (c.weight || 0), 0);
    const cargoTypeCounts = {};
    cargoRecords.forEach((c) => {
      const type = c.cargoType || "Unknown";
      cargoTypeCounts[type] = (cargoTypeCounts[type] || 0) + 1;
    });
    const cargoStats = Object.keys(cargoTypeCounts).map((type) => ({
      name: type,
      value: cargoTypeCounts[type],
    }));

    // Fuel statistics
    const fuelRecords = await Fuel.find();
    const totalFuelQuantity = fuelRecords.reduce((sum, f) => sum + (f.quantity || 0), 0);
    const totalFuelCost = fuelRecords.reduce((sum, f) => sum + (f.cost || 0), 0);

    // Maintenance statistics
    const maintenanceRecords = await Maintenance.find();
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);
    const maintenanceStatusCounts = {};
    maintenanceRecords.forEach((m) => {
      const status = m.status || "Unknown";
      maintenanceStatusCounts[status] = (maintenanceStatusCounts[status] || 0) + 1;
    });
    const maintenanceStats = Object.keys(maintenanceStatusCounts).map((status) => ({
      name: status,
      value: maintenanceStatusCounts[status],
    }));

    return res.status(200).json({
      vessels: {
        total: vessels.length || 0,
        byStatus: vesselStats || [],
      },
      voyages: {
        total: voyages.length || 0,
        byStatus: voyageStats || [],
      },
      cargo: {
        total: cargoRecords.length || 0,
        totalWeight: totalCargoWeight || 0,
        byType: cargoStats || [],
      },
      fuel: {
        totalQuantity: totalFuelQuantity || 0,
        totalCost: totalFuelCost || 0,
      },
      maintenance: {
        total: maintenanceRecords.length || 0,
        totalCost: totalMaintenanceCost || 0,
        byStatus: maintenanceStats || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

const reportRoutes = router;

module.exports = reportRoutes;