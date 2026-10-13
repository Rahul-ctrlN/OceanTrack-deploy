const express = require("express");
const Port = require("../models/Port");
const { protect } = require("../middleware/auth");

const router = express.Router();

const normalize = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const escapeRegex = (text) => {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================
   SEARCH WPI PORTS
========================= */

router.get("/search", protect, async (req, res) => {
  try {
    const q = normalize(req.query.q);

    if (!q) {
      return res.json([]);
    }

    const searchRegex = escapeRegex(q);

    const ports = await Port.find({
      $or: [
        {
          mainPortName: {
            $regex: searchRegex,
            $options: "i",
          },
        },
        {
          alternatePortName: {
            $regex: searchRegex,
            $options: "i",
          },
        },
        {
          unlocode: {
            $regex: searchRegex,
            $options: "i",
          },
        },
        {
          searchNames: {
            $regex: searchRegex,
            $options: "i",
          },
        },
      ],
    })
      .select(
        "wpinumber mainPortName alternatePortName unlocode countryCode latitude longitude"
      )
      .limit(15);

    return res.json(ports);
  } catch (error) {
    console.error("Port search error:", error);

    return res.status(500).json({
      message: "Failed to search ports",
    });
  }
});

/* =========================
   FIND NEAREST WPI PORT
========================= */

router.get("/nearest", protect, async (req, res) => {
  try {
    // Accept BOTH formats
    // ?lat=...
    // ?lng=...
    // OR
    // ?latitude=...
    // ?longitude=...

    const latitude = Number(
      req.query.latitude ?? req.query.lat
    );

    const longitude = Number(
      req.query.longitude ?? req.query.lng
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message:
          "Valid latitude and longitude are required",
      });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    // Get all WPI ports having coordinates
    const ports = await Port.find({
      latitude: {
        $ne: null,
        $exists: true,
      },
      longitude: {
        $ne: null,
        $exists: true,
      },
    })
      .select(
        "wpinumber mainPortName alternatePortName unlocode countryCode latitude longitude"
      )
      .lean();

    if (!ports.length) {
      return res.status(404).json({
        message:
          "No WPI ports with coordinates found",
      });
    }

    const toRadians = (value) => {
      return (value * Math.PI) / 180;
    };

    const earthRadius = 6371;

    let nearestPort = null;
    let nearestDistance = Infinity;

    for (const port of ports) {
      const portLat = Number(port.latitude);
      const portLng = Number(port.longitude);

      if (
        !Number.isFinite(portLat) ||
        !Number.isFinite(portLng)
      ) {
        continue;
      }

      // Haversine distance
      const dLat = toRadians(
        portLat - latitude
      );

      const dLng = toRadians(
        portLng - longitude
      );

      const a =
        Math.sin(dLat / 2) *
          Math.sin(dLat / 2) +
        Math.cos(toRadians(latitude)) *
          Math.cos(toRadians(portLat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      const distance = earthRadius * c;

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPort = port;
      }
    }

    if (!nearestPort) {
      return res.status(404).json({
        message:
          "Nearest WPI port could not be found",
      });
    }

    // Return port fields directly
    // so Vessels.jsx can use:
    // result.mainPortName

    return res.json({
      ...nearestPort,
      distanceKm: Number(
        nearestDistance.toFixed(2)
      ),
    });
  } catch (error) {
    console.error(
      "Nearest port error:",
      error
    );

    return res.status(500).json({
      message: "Failed to find nearest port",
    });
  }
});

/* =========================
   GET PORT BY NAME
========================= */

router.get("/:name", protect, async (req, res) => {
  try {
    const name = normalize(req.params.name);

    if (!name) {
      return res.status(400).json({
        message: "Port name is required",
      });
    }

    const escapedName = escapeRegex(name);

    const port = await Port.findOne({
      $or: [
        {
          mainPortName: {
            $regex: `^${escapedName}$`,
            $options: "i",
          },
        },
        {
          alternatePortName: {
            $regex: `^${escapedName}$`,
            $options: "i",
          },
        },
        {
          unlocode: {
            $regex: `^${escapedName}$`,
            $options: "i",
          },
        },
      ],
    });

    if (!port) {
      return res.status(404).json({
        message: "Port not found",
      });
    }

    return res.json(port);
  } catch (error) {
    console.error(
      "Get port error:",
      error
    );

    return res.status(500).json({
      message: "Failed to get port",
    });
  }
});

module.exports = router;