
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const Port = require("./models/Port");

const CSV_FILE = path.join(__dirname, "data", "WPI.csv");

function getValue(row, names) {
  // Match CSV column names without depending on exact casing.
  const normalizedRow = new Map(
    Object.entries(row).map(([key, value]) => [
      key.replace(/^\uFEFF/, "").trim().toLowerCase(),
      value,
    ])
  );

  for (const name of names) {
    const value = normalizedRow.get(name.toLowerCase());

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function parseCoordinate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value).trim();

  // Decimal: 13.08, -80.27
  if (/^-?\d+(?:\.\d+)?$/.test(text)) {
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  // Direction format: 13.08 N, 80.27 W
  const match = text.match(
    /^(\d+(?:\.\d+)?)\s*([NSEW])$/i
  );

  if (!match) return null;

  const number = Number(match[1]);
  const direction = match[2].toUpperCase();

  return direction === "S" || direction === "W"
    ? -number
    : number;
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function readCSV() {
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
}

async function importWPI() {
  let connected = false;

  try {
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`WPI.csv not found at: ${CSV_FILE}`);
    }

    const stats = fs.statSync(CSV_FILE);

    if (stats.size === 0) {
      throw new Error("WPI.csv is empty.");
    }

    console.log("Reading:", CSV_FILE);

    const rows = await readCSV();

    console.log("CSV records found:", rows.length);

    if (rows.length === 0) {
      throw new Error("CSV contains no data rows.");
    }

    const documents = rows
      .map((row) => {
        const mainPortName = getValue(row, [
          "Main Port Name",
          "main_port_",
          "Main Port",
          "Main Port Name (English)",
        ]);

        const alternatePortName = getValue(row, [
          "Alternate Port Name",
          "alternate_",
          "Alternate Port",
        ]);

        const wpinumber = getValue(row, [
          "World Port Index Number",
          "WPI Number",
          "wpinumber",
        ]);

        const unlocode = getValue(row, [
          "UN/LOCODE",
          "UNLOCODE",
          "UNLOCODE Code",
          "unlocode",
        ]);

        const countryCode = getValue(row, [
          "Country Code",
          "Country",
          "countryCode",
        ]);

        const latitudeValue = getValue(row, [
          "Latitude",
          "LATITUDE",
          "Lat",
          "latitude",
        ]);

        const longitudeValue = getValue(row, [
          "Longitude",
          "LONGITUDE",
          "Long",
          "longitude",
        ]);

        const latitude = parseCoordinate(latitudeValue);
        const longitude = parseCoordinate(longitudeValue);

        const searchNames = [
          normalize(mainPortName),
          normalize(alternatePortName),
          normalize(unlocode),
        ].filter(Boolean);

        // Skip rows with no searchable port name.
        if (!mainPortName && !alternatePortName && !unlocode) {
          return null;
        }

        return {
          wpinumber,
          mainPortName,
          alternatePortName,
          unlocode,
          countryCode,
          latitude,
          longitude,
          searchNames,
          data: row,
        };
      })
      .filter(Boolean);

    if (documents.length === 0) {
      throw new Error(
        "No usable port records found. Check the CSV column names."
      );
    }

    const withCoordinates = documents.filter(
      (port) =>
        Number.isFinite(port.latitude) &&
        Number.isFinite(port.longitude)
    ).length;

    console.log("Usable port records:", documents.length);
    console.log("Records with coordinates:", withCoordinates);

    // Confirm Chennai is present before modifying the collection.
    const chennaiRecords = documents.filter((port) =>
      [
        port.mainPortName,
        port.alternatePortName,
        port.unlocode,
      ].some((name) => normalize(name).includes("chennai"))
    );

    console.log("Chennai matches in CSV:", chennaiRecords.length);

    if (chennaiRecords.length > 0) {
      console.log(
        chennaiRecords.slice(0, 3).map((port) => ({
          name: port.mainPortName,
          alternate: port.alternatePortName,
          latitude: port.latitude,
          longitude: port.longitude,
        }))
      );
    }

    // Do not connect or modify MongoDB until the CSV is validated.
    await connectDB();
    connected = true;

    const batchSize = 500;

    // Use only after confirming this is the intended ports collection.
    // This removes port records only, not vessels, voyages, or users.
    console.log("Replacing records in the ports collection...");
    await Port.deleteMany({});

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Port.insertMany(batch, { ordered: false });

      console.log(
        `Imported ${Math.min(i + batch.length, documents.length)} / ${documents.length}`
      );
    }

    const finalCount = await Port.countDocuments();

    console.log("\nWPI IMPORT COMPLETED");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", Port.collection.collectionName);
    console.log("Records in database:", finalCount);
  } catch (error) {
    console.error("\nWPI IMPORT ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.disconnect().catch(() => {});
    }
  }
}

importWPI();
