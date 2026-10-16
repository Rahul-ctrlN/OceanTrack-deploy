
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Port = require("./models/Port");

async function checkWpi() {
  try {
    await connectDB();

    const collection = mongoose.connection.db.collection(
      Port.collection.collectionName
    );

    console.log("\n--- DATABASE CHECK ---");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", Port.collection.collectionName);

    const count = await collection.countDocuments();
    console.log("Total port records:", count);

    const sample = await collection.findOne({});

    if (!sample) {
      console.log("RESULT: Port collection is empty.");
      return;
    }

    console.log("\n--- ACTUAL CSV FIELD NAMES ---");
    console.log(Object.keys(sample));

    console.log("\n--- SAMPLE RECORD ---");
    console.log(JSON.stringify(sample, null, 2));

    const possibleNameFields = [
      "mainPortName",
      "Main Port Name",
      "Main Port",
      "main_port_",
      "alternatePortName",
      "Alternate Port Name",
      "Alternate Port",
      "alternate_",
      "unlocode",
      "UN/LOCODE",
    ];

    const searchConditions = possibleNameFields.map((field) => ({
      [field]: { $regex: "chennai", $options: "i" },
    }));

    const matches = await collection
      .find({ $or: searchConditions })
      .limit(10)
      .toArray();

    console.log("\n--- CHENNAI SEARCH ---");
    console.log("Matching records:", matches.length);
    console.log(JSON.stringify(matches, null, 2));
  } catch (error) {
    console.error("DIAGNOSTIC ERROR:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkWpi();
