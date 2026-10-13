require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const vesselRoutes = require("./routes/vessels");
const voyageRoutes = require("./routes/voyages");
const portRoutes = require("./routes/ports");
const cargoRoutes = require("./routes/cargo");
const fuelRoutes = require("./routes/fuel");
const maintenanceRoutes = require("./routes/maintenance");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "OceanTrack API is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vessels", vesselRoutes);
app.use("/api/ports", portRoutes);
app.use("/api/voyages", voyageRoutes);
app.use("/api/cargo", cargoRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (safety net)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`OceanTrack server running on port ${PORT}`);
});