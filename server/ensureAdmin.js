
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

async function ensureAdmin() {
  try {
    await connectDB();

    const email = "admin@oceantrack.com";
    const password = "Admin@123";
    const passwordHash = await bcrypt.hash(password, 10);

    await User.updateOne(
      { email },
      {
        $set: {
          name: "System Administrator",
          email,
          password: passwordHash,
          role: "admin",
        },
      },
      { upsert: true, runValidators: true }
    );

    const admin = await User.findOne({ email })
      .select("+password");

    const valid = admin &&
      await bcrypt.compare(password, admin.password);

    if (!valid) {
      throw new Error("Admin password verification failed");
    }

    console.log("LOCAL ADMIN ACCOUNT READY");
    console.log("Email: admin@oceantrack.com");
    console.log("Password: Admin@123");
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

ensureAdmin();
