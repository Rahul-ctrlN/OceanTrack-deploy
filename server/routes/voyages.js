const express = require("express");
const Voyage = require("../models/Voyage");
const Vessel = require("../models/Vessel");
const Cargo = require("../models/Cargo");
const Port = require("../models/Port");
const { protect } = require("../middleware/auth");

const router = express.Router();

const normalize = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const findPort = async (name) => {
  const value = normalize(name);

  if (!value) return null;

  return await Port.findOne({
    $or: [
      {
        mainPortName: {
          $regex: `^${value}$`,
          $options: "i",
        },
      },
      {
        alternatePortName: {
          $regex: `^${value}$`,
          $options: "i",
        },
      },
      {
        unlocode: {
          $regex: `^${value}$`,
          $options: "i",
        },
      },
    ],
  });
};

/*
  Check whether the selected vessel already has
  another voyage overlapping the requested dates.

  Overlap exists when:

  existing departure < new arrival
  AND
  existing arrival > new departure
*/
const checkVoyageOverlap = async ({
  vesselId,
  departureDate,
  expectedArrival,
  excludeVoyageId = null,
}) => {
  const query = {
    vessel: vesselId,

    departureDate: {
      $lt: new Date(expectedArrival),
    },

    expectedArrival: {
      $gt: new Date(departureDate),
    },

    status: {
      $ne: "Cancelled",
    },
  };

  if (excludeVoyageId) {
    query._id = {
      $ne: excludeVoyageId,
    };
  }

  return await Voyage.findOne(query)
    .select(
      "voyageId origin destination departureDate expectedArrival status"
    )
    .lean();
};

/* =========================================================
   CREATE VOYAGE
========================================================= */

router.post("/", protect, async (req, res) => {
  try {
    const {
      voyageId,
      vessel,
      origin,
      destination,
      departureDate,
      expectedArrival,
      actualArrival,
      currentLocation,
      distance,
      status,
      delay,
      plannedFuel,
      actualFuel,
      cargo,
      notes,
      progress,
    } = req.body;

    if (
      !voyageId ||
      !vessel ||
      !origin ||
      !destination ||
      !departureDate ||
      !expectedArrival
    ) {
      return res.status(400).json({
        message:
          "Please provide voyage ID, vessel, origin, destination, departure date and expected arrival.",
      });
    }

    const departure = new Date(departureDate);
    const arrival = new Date(expectedArrival);

    if (
      Number.isNaN(departure.getTime()) ||
      Number.isNaN(arrival.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid departure or expected arrival date.",
      });
    }

    if (arrival <= departure) {
      return res.status(400).json({
        message:
          "Expected arrival must be after the departure date.",
      });
    }

    const vesselDoc = await Vessel.findById(vessel);

    if (!vesselDoc) {
      return res.status(404).json({
        message: "Vessel not found.",
      });
    }

    const existingVoyage = await Voyage.findOne({
      voyageId,
    });

    if (existingVoyage) {
      return res.status(400).json({
        message: "A voyage with this Voyage ID already exists.",
      });
    }

    /* WPI ORIGIN */

    const originPort = await findPort(origin);

    if (!originPort) {
      return res.status(400).json({
        message:
          "Origin port was not found in the WPI port database.",
      });
    }

    /* WPI DESTINATION */

    const destinationPort = await findPort(destination);

    if (!destinationPort) {
      return res.status(400).json({
        message:
          "Destination port was not found in the WPI port database.",
      });
    }

    /* =====================================================
       VESSEL VOYAGE OVERLAP CHECK
    ===================================================== */

    const overlap = await checkVoyageOverlap({
      vesselId: vessel,
      departureDate: departure,
      expectedArrival: arrival,
    });

    if (overlap) {
      return res.status(409).json({
        message:
          `This vessel already has an overlapping voyage: ` +
          `${overlap.voyageId} (${overlap.origin} → ${overlap.destination}).`,
        conflict: {
          voyageId: overlap.voyageId,
          origin: overlap.origin,
          destination: overlap.destination,
          departureDate: overlap.departureDate,
          expectedArrival: overlap.expectedArrival,
          status: overlap.status,
        },
      });
    }

    /* =====================================================
       CREATE
    ===================================================== */

    const newVoyage = await Voyage.create({
      voyageId,
      vessel: vesselDoc._id,

      // Store official WPI names
      origin: originPort.mainPortName,
      destination: destinationPort.mainPortName,

      departureDate: departure,
      expectedArrival: arrival,

      actualArrival: actualArrival || null,
      currentLocation: currentLocation || "",

      distance: Number(distance) || 0,

      status: status || "Planned",

      delay: Number(delay) || 0,

      plannedFuel: Number(plannedFuel) || 0,
      actualFuel: Number(actualFuel) || 0,

      cargo: Array.isArray(cargo) ? cargo : [],

      notes: notes || "",

      progress:
        progress !== undefined
          ? Math.min(100, Math.max(0, Number(progress)))
          : 0,
    });

    const populatedVoyage = await Voyage.findById(
      newVoyage._id
    )
      .populate(
        "vessel",
        "name imoNumber vesselType status latitude longitude speed destination"
      )
      .populate(
        "cargo",
        "cargoId containerId type description quantity weight status"
      );

    return res.status(201).json({
      message: "Voyage created successfully.",
      voyage: {
        ...populatedVoyage.toObject(),

        originPort: {
          id: originPort._id,
          name: originPort.mainPortName,
          alternateName: originPort.alternatePortName,
          unlocode: originPort.unlocode,
          countryCode: originPort.countryCode,
          latitude: originPort.latitude,
          longitude: originPort.longitude,
        },

        destinationPort: {
          id: destinationPort._id,
          name: destinationPort.mainPortName,
          alternateName: destinationPort.alternatePortName,
          unlocode: destinationPort.unlocode,
          countryCode: destinationPort.countryCode,
          latitude: destinationPort.latitude,
          longitude: destinationPort.longitude,
        },
      },
    });
  } catch (error) {
    console.error("Create voyage error:", error);

    return res.status(500).json({
      message: "Failed to create voyage.",
      error: error.message,
    });
  }
});

/* =========================================================
   GET ALL VOYAGES
========================================================= */

router.get("/", protect, async (req, res) => {
  try {
    const voyages = await Voyage.find()
      .populate(
        "vessel",
        "name imoNumber vesselType status latitude longitude speed destination"
      )
      .populate(
        "cargo",
        "cargoId containerId type description quantity weight status"
      )
      .sort({
        createdAt: -1,
      });

    const enrichedVoyages = await Promise.all(
      voyages.map(async (voyage) => {
        const data = voyage.toObject();

        const originPort = await findPort(voyage.origin);
        const destinationPort = await findPort(
          voyage.destination
        );

        return {
          ...data,

          originPort: originPort
            ? {
                id: originPort._id,
                name: originPort.mainPortName,
                alternateName:
                  originPort.alternatePortName,
                unlocode: originPort.unlocode,
                countryCode: originPort.countryCode,
                latitude: originPort.latitude,
                longitude: originPort.longitude,
              }
            : null,

          destinationPort: destinationPort
            ? {
                id: destinationPort._id,
                name: destinationPort.mainPortName,
                alternateName:
                  destinationPort.alternatePortName,
                unlocode: destinationPort.unlocode,
                countryCode: destinationPort.countryCode,
                latitude: destinationPort.latitude,
                longitude: destinationPort.longitude,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      voyages: enrichedVoyages,
    });
  } catch (error) {
    console.error("Get voyages error:", error);

    return res.status(500).json({
      message: "Failed to fetch voyages.",
      error: error.message,
    });
  }
});

/* =========================================================
   GET SINGLE VOYAGE
========================================================= */

router.get("/:id", protect, async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id)
      .populate(
        "vessel",
        "name imoNumber vesselType status latitude longitude speed destination"
      )
      .populate(
        "cargo",
        "cargoId containerId type description quantity weight status"
      );

    if (!voyage) {
      return res.status(404).json({
        message: "Voyage not found.",
      });
    }

    const data = voyage.toObject();

    const originPort = await findPort(voyage.origin);
    const destinationPort = await findPort(
      voyage.destination
    );

    return res.status(200).json({
      voyage: {
        ...data,

        originPort: originPort
          ? {
              id: originPort._id,
              name: originPort.mainPortName,
              alternateName:
                originPort.alternatePortName,
              unlocode: originPort.unlocode,
              countryCode: originPort.countryCode,
              latitude: originPort.latitude,
              longitude: originPort.longitude,
            }
          : null,

        destinationPort: destinationPort
          ? {
              id: destinationPort._id,
              name: destinationPort.mainPortName,
              alternateName:
                destinationPort.alternatePortName,
              unlocode: destinationPort.unlocode,
              countryCode: destinationPort.countryCode,
              latitude: destinationPort.latitude,
              longitude: destinationPort.longitude,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get voyage error:", error);

    return res.status(500).json({
      message: "Failed to fetch voyage.",
      error: error.message,
    });
  }
});

/* =========================================================
   UPDATE VOYAGE
========================================================= */

router.put("/:id", protect, async (req, res) => {
  try {
    const {
      voyageId,
      vessel,
      origin,
      destination,
      departureDate,
      expectedArrival,
      actualArrival,
      currentLocation,
      distance,
      status,
      delay,
      plannedFuel,
      actualFuel,
      cargo,
      notes,
      progress,
    } = req.body;

    const voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        message: "Voyage not found.",
      });
    }

    const vesselId = vessel || voyage.vessel;

    const vesselDoc = await Vessel.findById(vesselId);

    if (!vesselDoc) {
      return res.status(404).json({
        message: "Vessel not found.",
      });
    }

    const newDeparture = new Date(
      departureDate || voyage.departureDate
    );

    const newArrival = new Date(
      expectedArrival || voyage.expectedArrival
    );

    if (
      Number.isNaN(newDeparture.getTime()) ||
      Number.isNaN(newArrival.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid departure or expected arrival date.",
      });
    }

    if (newArrival <= newDeparture) {
      return res.status(400).json({
        message:
          "Expected arrival must be after the departure date.",
      });
    }

    /* =====================================================
       WPI PORT VALIDATION
    ===================================================== */

    let originPort = await findPort(
      origin || voyage.origin
    );

    if (!originPort) {
      return res.status(400).json({
        message:
          "Origin port was not found in the WPI port database.",
      });
    }

    let destinationPort = await findPort(
      destination || voyage.destination
    );

    if (!destinationPort) {
      return res.status(400).json({
        message:
          "Destination port was not found in the WPI port database.",
      });
    }

    /* =====================================================
       VESSEL VOYAGE OVERLAP CHECK
       Excludes the voyage currently being edited.
    ===================================================== */

    const overlap = await checkVoyageOverlap({
      vesselId: vesselId,
      departureDate: newDeparture,
      expectedArrival: newArrival,
      excludeVoyageId: req.params.id,
    });

    if (overlap) {
      return res.status(409).json({
        message:
          `This vessel already has an overlapping voyage: ` +
          `${overlap.voyageId} (${overlap.origin} → ${overlap.destination}).`,
        conflict: {
          voyageId: overlap.voyageId,
          origin: overlap.origin,
          destination: overlap.destination,
          departureDate: overlap.departureDate,
          expectedArrival: overlap.expectedArrival,
          status: overlap.status,
        },
      });
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    voyage.voyageId = voyageId || voyage.voyageId;

    voyage.vessel = vesselId;

    voyage.origin = originPort.mainPortName;
    voyage.destination = destinationPort.mainPortName;

    voyage.departureDate = newDeparture;
    voyage.expectedArrival = newArrival;

    voyage.actualArrival =
      actualArrival !== undefined
        ? actualArrival || null
        : voyage.actualArrival;

    voyage.currentLocation =
      currentLocation !== undefined
        ? currentLocation
        : voyage.currentLocation;

    voyage.distance =
      distance !== undefined
        ? Number(distance) || 0
        : voyage.distance;

    voyage.status =
      status !== undefined
        ? status
        : voyage.status;

    voyage.delay =
      delay !== undefined
        ? Number(delay) || 0
        : voyage.delay;

    voyage.plannedFuel =
      plannedFuel !== undefined
        ? Number(plannedFuel) || 0
        : voyage.plannedFuel;

    voyage.actualFuel =
      actualFuel !== undefined
        ? Number(actualFuel) || 0
        : voyage.actualFuel;

    voyage.cargo =
      Array.isArray(cargo)
        ? cargo
        : voyage.cargo;

    voyage.notes =
      notes !== undefined
        ? notes
        : voyage.notes;

    if (progress !== undefined) {
      voyage.progress = Math.min(
        100,
        Math.max(0, Number(progress))
      );
    }

    await voyage.save();

    const updatedVoyage = await Voyage.findById(
      voyage._id
    )
      .populate(
        "vessel",
        "name imoNumber vesselType status latitude longitude speed destination"
      )
      .populate(
        "cargo",
        "cargoId containerId type description quantity weight status"
      );

    return res.status(200).json({
      message: "Voyage updated successfully.",
      voyage: {
        ...updatedVoyage.toObject(),

        originPort: {
          id: originPort._id,
          name: originPort.mainPortName,
          alternateName:
            originPort.alternatePortName,
          unlocode: originPort.unlocode,
          countryCode: originPort.countryCode,
          latitude: originPort.latitude,
          longitude: originPort.longitude,
        },

        destinationPort: {
          id: destinationPort._id,
          name: destinationPort.mainPortName,
          alternateName:
            destinationPort.alternatePortName,
          unlocode: destinationPort.unlocode,
          countryCode: destinationPort.countryCode,
          latitude: destinationPort.latitude,
          longitude: destinationPort.longitude,
        },
      },
    });
  } catch (error) {
    console.error("Update voyage error:", error);

    return res.status(500).json({
      message: "Failed to update voyage.",
      error: error.message,
    });
  }
});

/* =========================================================
   DELETE VOYAGE
========================================================= */

router.delete("/:id", protect, async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        message: "Voyage not found.",
      });
    }

    await Voyage.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Voyage deleted successfully.",
    });
  } catch (error) {
    console.error("Delete voyage error:", error);

    return res.status(500).json({
      message: "Failed to delete voyage.",
      error: error.message,
    });
  }
});

module.exports = router;