require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");

const User = require("./models/User");
const Vessel = require("./models/Vessel");
const Voyage = require("./models/Voyage");
const Cargo = require("./models/Cargo");
const Fuel = require("./models/Fuel");
const Maintenance = require("./models/Maintenance");

const seedData = async () => {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await User.deleteMany();
    await Vessel.deleteMany();
    await Voyage.deleteMany();
    await Cargo.deleteMany();
    await Fuel.deleteMany();
    await Maintenance.deleteMany();

    console.log("Creating users...");
    const salt = await bcrypt.genSalt(10);

    const adminPassword = await bcrypt.hash("Admin@123", salt);
    const admin = await User.create({
      name: "System Administrator",
      email: "admin@oceantrack.com",
      password: adminPassword,
      role: "admin",
    });

    const staffPassword = await bcrypt.hash("Staff@123", salt);
    const staffUsers = await User.create([
      { name: "Rahul Menon", email: "rahul.menon@oceantrack.com", password: staffPassword, role: "staff" },
      { name: "Priya Nair", email: "priya.nair@oceantrack.com", password: staffPassword, role: "staff" },
      { name: "Arjun Kumar", email: "arjun.kumar@oceantrack.com", password: staffPassword, role: "staff" },
    ]);

    console.log("Creating vessels...");
    const vessels = await Vessel.create([
      { name: "MV Ocean Voyager", imoNumber: "IMO9012345", vesselType: "Container Ship", flag: "Panama", capacity: 12000, status: "Active", latitude: 13.0827, longitude: 80.2707, speed: 18, destination: "Chennai Port" },
      { name: "MV Pacific Trader", imoNumber: "IMO9012346", vesselType: "Bulk Carrier", flag: "Liberia", capacity: 8000, status: "In Transit", latitude: 1.2903, longitude: 103.8519, speed: 14, destination: "Singapore Port" },
      { name: "MV Coral Express", imoNumber: "IMO9012347", vesselType: "Tanker", flag: "Marshall Islands", capacity: 15000, status: "At Port", latitude: 25.276987, longitude: 55.296249, speed: 0, destination: "Dubai Port" },
      { name: "MV Northern Star", imoNumber: "IMO9012348", vesselType: "Container Ship", flag: "Panama", capacity: 11000, status: "Active", latitude: 22.3193, longitude: 114.1694, speed: 20, destination: "Hong Kong Port" },
      { name: "MV Atlantic Pearl", imoNumber: "IMO9012349", vesselType: "Bulk Carrier", flag: "Malta", capacity: 9500, status: "Maintenance", latitude: 51.9244, longitude: 4.4777, speed: 0, destination: "Rotterdam Port" },
      { name: "MV Indian Horizon", imoNumber: "IMO9012350", vesselType: "Tanker", flag: "India", capacity: 13500, status: "In Transit", latitude: 18.9647, longitude: 72.8258, speed: 16, destination: "Mumbai Port" },
      { name: "MV Silver Wave", imoNumber: "IMO9012351", vesselType: "Container Ship", flag: "Singapore", capacity: 10500, status: "Idle", latitude: 3.139, longitude: 101.6869, speed: 0, destination: "Port Klang" },
      { name: "MV Golden Harbor", imoNumber: "IMO9012352", vesselType: "Bulk Carrier", flag: "Panama", capacity: 8700, status: "Active", latitude: 31.2304, longitude: 121.4737, speed: 17, destination: "Shanghai Port" },
    ]);

    console.log("Creating voyages...");
    const voyages = await Voyage.create([
      { voyageNumber: "VOY-1001", vessel: vessels[0]._id, origin: "Chennai Port", destination: "Singapore Port", departureDate: new Date("2026-08-01"), estimatedArrival: new Date("2026-08-10"), status: "Active", distance: 2900, progress: 55 },
      { voyageNumber: "VOY-1002", vessel: vessels[1]._id, origin: "Singapore Port", destination: "Dubai Port", departureDate: new Date("2026-08-05"), estimatedArrival: new Date("2026-08-18"), status: "Active", distance: 5800, progress: 30 },
      { voyageNumber: "VOY-1003", vessel: vessels[2]._id, origin: "Dubai Port", destination: "Mumbai Port", departureDate: new Date("2026-07-20"), estimatedArrival: new Date("2026-07-28"), status: "Completed", distance: 1900, progress: 100 },
      { voyageNumber: "VOY-1004", vessel: vessels[3]._id, origin: "Hong Kong Port", destination: "Shanghai Port", departureDate: new Date("2026-09-01"), estimatedArrival: new Date("2026-09-05"), status: "Active", distance: 1250, progress: 70 },
      { voyageNumber: "VOY-1005", vessel: vessels[4]._id, origin: "Rotterdam Port", destination: "Mumbai Port", departureDate: new Date("2026-08-15"), estimatedArrival: new Date("2026-09-10"), status: "Delayed", distance: 11000, progress: 40 },
      { voyageNumber: "VOY-1006", vessel: vessels[5]._id, origin: "Mumbai Port", destination: "Chennai Port", departureDate: new Date("2026-09-05"), estimatedArrival: new Date("2026-09-09"), status: "Active", distance: 1450, progress: 60 },
      { voyageNumber: "VOY-1007", vessel: vessels[6]._id, origin: "Port Klang", destination: "Singapore Port", departureDate: new Date("2026-09-15"), estimatedArrival: new Date("2026-09-17"), status: "Planned", distance: 350, progress: 0 },
      { voyageNumber: "VOY-1008", vessel: vessels[7]._id, origin: "Shanghai Port", destination: "Hong Kong Port", departureDate: new Date("2026-08-25"), estimatedArrival: new Date("2026-08-29"), status: "Completed", distance: 1250, progress: 100 },
    ]);

    console.log("Creating cargo records...");
    await Cargo.create([
      { cargoNumber: "CRG-2001", voyage: voyages[0]._id, description: "Electronics and machinery parts", cargoType: "General Cargo", quantity: 500, weight: 12000, status: "In Transit" },
      { cargoNumber: "CRG-2002", voyage: voyages[1]._id, description: "Crude oil shipment", cargoType: "Liquid Bulk", quantity: 1, weight: 45000, status: "In Transit" },
      { cargoNumber: "CRG-2003", voyage: voyages[2]._id, description: "Textiles and garments", cargoType: "General Cargo", quantity: 800, weight: 9500, status: "Delivered" },
      { cargoNumber: "CRG-2004", voyage: voyages[3]._id, description: "Consumer electronics", cargoType: "Container", quantity: 300, weight: 7000, status: "In Transit" },
      { cargoNumber: "CRG-2005", voyage: voyages[4]._id, description: "Iron ore", cargoType: "Dry Bulk", quantity: 1, weight: 38000, status: "Loaded" },
      { cargoNumber: "CRG-2006", voyage: voyages[5]._id, description: "Pharmaceutical supplies", cargoType: "General Cargo", quantity: 200, weight: 3000, status: "In Transit" },
      { cargoNumber: "CRG-2007", voyage: voyages[7]._id, description: "Automobile parts", cargoType: "Container", quantity: 450, weight: 8600, status: "Delivered" },
    ]);

    console.log("Creating fuel records...");
    await Fuel.create([
      { vessel: vessels[0]._id, voyage: voyages[0]._id, fuelType: "Diesel", quantity: 12000, cost: 8400, date: new Date("2026-08-01"), notes: "Departure refuel" },
      { vessel: vessels[1]._id, voyage: voyages[1]._id, fuelType: "Heavy Fuel Oil", quantity: 25000, cost: 16250, date: new Date("2026-08-05"), notes: "Full tank before departure" },
      { vessel: vessels[2]._id, voyage: voyages[2]._id, fuelType: "Marine Gas Oil", quantity: 9000, cost: 7200, date: new Date("2026-07-20"), notes: "Standard refuel" },
      { vessel: vessels[3]._id, voyage: voyages[3]._id, fuelType: "Diesel", quantity: 6000, cost: 4200, date: new Date("2026-09-01"), notes: "Short route refuel" },
      { vessel: vessels[4]._id, fuelType: "LNG", quantity: 15000, cost: 9800, date: new Date("2026-08-14"), notes: "Pre-maintenance refuel" },
      { vessel: vessels[5]._id, voyage: voyages[5]._id, fuelType: "Diesel", quantity: 7000, cost: 4900, date: new Date("2026-09-05"), notes: "Coastal voyage refuel" },
      { vessel: vessels[6]._id, fuelType: "Marine Gas Oil", quantity: 5000, cost: 4000, date: new Date("2026-09-10"), notes: "Idle vessel top-up" },
      { vessel: vessels[7]._id, voyage: voyages[7]._id, fuelType: "Heavy Fuel Oil", quantity: 11000, cost: 7150, date: new Date("2026-08-25"), notes: "Return trip refuel" },
    ]);

    console.log("Creating maintenance records...");
    await Maintenance.create([
      { vessel: vessels[4]._id, maintenanceType: "Engine Overhaul", description: "Scheduled engine overhaul and inspection", scheduledDate: new Date("2026-09-01"), status: "In Progress", cost: 45000, notes: "Estimated 2 weeks" },
      { vessel: vessels[2]._id, maintenanceType: "Hull Cleaning", description: "Routine hull cleaning and anti-fouling", scheduledDate: new Date("2026-09-20"), status: "Scheduled", cost: 8000, notes: "" },
      { vessel: vessels[0]._id, maintenanceType: "Safety Equipment Check", description: "Annual lifeboat and safety gear inspection", scheduledDate: new Date("2026-08-10"), completedDate: new Date("2026-08-11"), status: "Completed", cost: 3000, notes: "Passed inspection" },
      { vessel: vessels[6]._id, maintenanceType: "Navigation System Update", description: "GPS and radar system software update", scheduledDate: new Date("2026-08-20"), status: "Overdue", cost: 5000, notes: "Delayed due to parts availability" },
      { vessel: vessels[1]._id, maintenanceType: "Ballast Tank Inspection", description: "Routine ballast tank inspection", scheduledDate: new Date("2026-09-25"), status: "Scheduled", cost: 6000, notes: "" },
      { vessel: vessels[7]._id, maintenanceType: "Propeller Inspection", description: "Underwater propeller inspection", scheduledDate: new Date("2026-07-15"), completedDate: new Date("2026-07-16"), status: "Completed", cost: 4500, notes: "No damage found" },
    ]);

    console.log("Seed complete.");
    console.log("");
    console.log("Initial Admin:");
    console.log("admin@oceantrack.com / Admin@123");
    console.log("");
    console.log("Sample Staff Accounts (password: Staff@123):");
    staffUsers.forEach((u) => console.log(`${u.email}`));

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error.message);
    process.exit(1);
  }
};

seedData();