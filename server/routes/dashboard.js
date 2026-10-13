const express = require("express");
const Vessel = require("../models/Vessel");
const Voyage = require("../models/Voyage");
const Fuel = require("../models/Fuel");
const Maintenance = require("../models/Maintenance");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// @route   GET /api/dashboard
// @desc    Aggregated stats for the dashboard page
router.get("/", async (req, res) => {
  try {
    const totalVessels = await Vessel.countDocuments();
    const activeVoyages = await Voyage.countDocuments({ status: "Active" });

    const fuelRecords = await Fuel.find();
    const totalFuelQuantity = fuelRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
    const totalFuelCost = fuelRecords.reduce((sum, record) => sum + (record.cost || 0), 0);

    const maintenanceDue = await Maintenance.countDocuments({
      status: { $in: ["Scheduled", "Overdue"] },
    });

    // Fuel consumption grouped by fuel type (for chart)
    const fuelByType = {};
    fuelRecords.forEach((record) => {
      const type = record.fuelType || "Unknown";
      fuelByType[type] = (fuelByType[type] || 0) + (record.quantity || 0);
    });
    const fuelChartData = Object.keys(fuelByType).map((type) => ({
      name: type,
      value: fuelByType[type],
    }));

    // Voyage status breakdown (for chart)
    const voyages = await Voyage.find();
    const statusCounts = {};
    voyages.forEach((v) => {
      const status = v.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const voyageChartData = Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
    }));

    // Upcoming maintenance (next 5 scheduled)
    const upcomingMaintenance = await Maintenance.find({ status: { $ne: "Completed" } })
      .populate("vessel", "name")
      .sort({ scheduledDate: 1 })
      .limit(5);

    // Recent activity - latest voyages as a simple proxy
    const recentVoyages = await Voyage.find()
      .populate("vessel", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Simple alerts: overdue maintenance + delayed voyages
    const overdueMaintenance = await Maintenance.find({ status: "Overdue" })
      .populate("vessel", "name")
      .limit(5);
    const delayedVoyages = await Voyage.find({ status: "Delayed" })
      .populate("vessel", "name")
      .limit(5);

    const alerts = [
      ...overdueMaintenance.map((m) => ({
        type: "maintenance",
        message: `Overdue maintenance: ${m.maintenanceType} on ${m.vessel ? m.vessel.name : "Unknown vessel"}`,
      })),
      ...delayedVoyages.map((v) => ({
        type: "voyage",
        message: `Delayed voyage: ${v.voyageNumber} (${v.vessel ? v.vessel.name : "Unknown vessel"})`,
      })),
    ];

    return res.status(200).json({
      stats: {
        totalVessels: totalVessels || 0,
        activeVoyages: activeVoyages || 0,
        totalFuelQuantity: totalFuelQuantity || 0,
        totalFuelCost: totalFuelCost || 0,
        maintenanceDue: maintenanceDue || 0,
      },
      fuelChartData: fuelChartData || [],
      voyageChartData: voyageChartData || [],
      upcomingMaintenance: upcomingMaintenance || [],
      recentActivity: recentVoyages || [],
      alerts: alerts || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

const dashboardRoutes = router;

module.exports = dashboardRoutes;