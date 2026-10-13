require("dotenv").config();

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const Port = require("./models/Port");

const CSV_FILE = path.join(__dirname, "data", "WPI.csv");

function getValue(row, names) {
  for (const name of names) {
    if (
      row[name] !== undefined &&
      row[name] !== null &&
      String(row[name]).trim() !== ""
    ) {
      return String(row[name]).trim();
    }
  }

  return "";
}

function parseCoordinate(value) {
  if (!value) return null;

  const text = String(value).trim();

  const decimal = Number(text);

  if (!Number.isNaN(decimal)) {
    return decimal;
  }

  const match = text.match(
    /^(\d+(?:\.\d+)?)\s*([NSEW])$/i
  );

  if (!match) return null;

  const number = parseFloat(match[1]);
  const direction = match[2].toUpperCase();

  if (direction === "S" || direction === "W") {
    return -number;
  }

  return number;
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function importWPI() {
  try {
    if (!fs.existsSync(CSV_FILE)) {
      console.error("WPI.csv was not found.");
      console.error(`Expected file: ${CSV_FILE}`);
      process.exit(1);
    }

    await connectDB();

    console.log("Reading WPI.csv...");

    const rows = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on("data", (row) => {
          rows.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log(`CSV records found: ${rows.length}`);

    if (rows.length === 0) {
      console.error("WPI.csv is empty.");
      process.exit(1);
    }

    console.log("Clearing existing Port collection...");

    await Port.deleteMany({});

    const documents = rows.map((row) => {
      const mainPortName = getValue(row, [
        "Main Port Name",
        "main_port_",
        "Main Port",
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

      return {
        wpinumber,
        mainPortName,
        alternatePortName,
        unlocode,
        countryCode,
        latitude,
        longitude,
        searchNames,

        // Keep the complete original WPI record.
        data: row,
      };
    });

    console.log("Importing records into MongoDB...");

    const batchSize = 500;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Port.insertMany(batch, {
        ordered: false,
      });

      console.log(
        `Imported ${Math.min(
          i + batch.length,
          documents.length
        )} / ${documents.length}`
      );
    }

    console.log("");
    console.log("====================================");
    console.log("WPI IMPORT COMPLETED SUCCESSFULLY");
    console.log("====================================");
    console.log(`Total records imported: ${documents.length}`);

    const withCoordinates = documents.filter(
      (p) =>
        p.latitude !== null &&
        p.longitude !== null
    ).length;

    console.log(`Records with coordinates: ${withCoordinates}`);
    console.log(
      `Records without coordinates: ${
        documents.length - withCoordinates
      }`
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("WPI IMPORT ERROR:");
    console.error(error.message);

    await mongoose.connection.close();

    process.exit(1);
  }
}

importWPI();