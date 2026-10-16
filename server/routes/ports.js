
const express = require("express");
const Port = require("../models/Port");
const { protect } = require("../middleware/auth");

const router = express.Router();

const normalize = (value) =>
  String(value || "").trim().replace(/\s+/g, " ");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/ports/search?q=chennai
router.get("/search", protect, async (req, res) => {
  try {
    const query = normalize(req.query.q);

    if (query.length < 2) {
      return res.json([]);
    }

    const safeQuery = escapeRegex(query);

    const ports = await Port.find({
      $or: [
        { mainPortName: { $regex: safeQuery, $options: "i" } },
        { alternatePortName: { $regex: safeQuery, $options: "i" } },
        { unlocode: { $regex: safeQuery, $options: "i" } },
        { searchNames: { $regex: safeQuery, $options: "i" } },
      ],
    })
      .select(
        "wpinumber mainPortName alternatePortName unlocode countryCode latitude longitude"
      )
      .limit(15)
      .lean();

    console.log(`WPI search "${query}": ${ports.length} results`);

    return res.json(ports);
  } catch (error) {
    console.error("PORT SEARCH ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to search WPI ports",
    });
  }
});

// GET /api/ports/nearest?lat=13.08&lng=80.27
router.get("/nearest", protect, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (
      req.query.lat === undefined ||
      req.query.lng === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required",
      });
    }

    const ports = await Port.find({
      latitude: { $gte: lat - 2, $lte: lat + 2 },
      longitude: { $gte: lng - 2, $lte: lng + 2 },
    })
      .select(
        "wpinumber mainPortName alternatePortName unlocode countryCode latitude longitude"
      )
      .lean();

    if (!ports.length) {
      return res.status(404).json({
        message: "No nearby WPI port found",
      });
    }

    let nearest = null;
    let nearestDistance = Infinity;

    for (const port of ports) {
      const portLat = Number(port.latitude);
      const portLng = Number(port.longitude);

      if (!Number.isFinite(portLat) || !Number.isFinite(portLng)) {
        continue;
      }

      const distance =
        (portLat - lat) ** 2 + (portLng - lng) ** 2;

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = port;
      }
    }

    if (!nearest) {
      return res.status(404).json({
        message: "No nearby WPI port found",
      });
    }

    return res.json(nearest);
  } catch (error) {
    console.error("NEAREST PORT ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to find nearest WPI port",
    });
  }
});

// GET /api/ports/:name
// Keep this route AFTER /search and /nearest.
router.get("/:name", protect, async (req, res) => {
  try {
    const name = normalize(req.params.name);

    if (!name) {
      return res.status(400).json({
        message: "Port name is required",
      });
    }

    const safeName = escapeRegex(name);

    const port = await Port.findOne({
      $or: [
        { mainPortName: { $regex: `^${safeName}$`, $options: "i" } },
        { alternatePortName: { $regex: `^${safeName}$`, $options: "i" } },
        { unlocode: { $regex: `^${safeName}$`, $options: "i" } },
      ],
    }).lean();

    if (!port) {
      return res.status(404).json({
        message: "Port not found",
      });
    }

    return res.json(port);
  } catch (error) {
    console.error("GET PORT ERROR:", error.message);

    return res.status(500).json({
      message: "Failed to get WPI port",
    });
  }
});

module.exports = router;
