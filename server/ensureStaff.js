
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function ensureStaff() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to database:", mongoose.connection.name);

    const email = "staff@oceantrack.com";
    const password = "Staff@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne(
      { email },
      {
        $set: {
          name: "OceanTrack Staff",
          email,
          password: hashedPassword,
          role: "staff"
        }
      },
      { upsert: true, runValidators: true }
    );

    console.log("Staff account created/updated successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Staff setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

ensureStaff();
