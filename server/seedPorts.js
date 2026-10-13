require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Port = require("./models/Port");

const ports = [
  ["Chennai Port", "India", 13.0827, 80.2925],
  ["Mumbai Port", "India", 18.9496, 72.8447],
  ["Jawaharlal Nehru Port", "India", 18.9496, 72.9495],
  ["Kandla Port", "India", 23.0333, 70.2167],
  ["Mundra Port", "India", 22.7333, 69.7000],
  ["Kolkata Port", "India", 22.5726, 88.3639],
  ["Visakhapatnam Port", "India", 17.6868, 83.2185],
  ["Cochin Port", "India", 9.9667, 76.2667],
  ["Tuticorin Port", "India", 8.7642, 78.1348],
  ["Paradip Port", "India", 20.3167, 86.6167],

  ["Singapore Port", "Singapore", 1.2644, 103.8200],
  ["Port Klang", "Malaysia", 3.0000, 101.4000],
  ["Tanjung Pelepas", "Malaysia", 1.3667, 103.5500],
  ["Penang Port", "Malaysia", 5.4167, 100.3500],
  ["Laem Chabang", "Thailand", 13.0833, 100.8833],
  ["Bangkok Port", "Thailand", 13.7333, 100.5167],
  ["Colombo Port", "Sri Lanka", 6.9500, 79.8500],
  ["Chittagong Port", "Bangladesh", 22.3333, 91.8167],
  ["Yangon Port", "Myanmar", 16.7667, 96.1667],
  ["Karachi Port", "Pakistan", 24.8500, 66.9833],
  ["Port Qasim", "Pakistan", 24.7667, 67.3333],
  ["Dubai Port", "UAE", 25.2697, 55.2925],
  ["Jebel Ali Port", "UAE", 24.9857, 55.0273],
  ["Abu Dhabi Port", "UAE", 24.5333, 54.3667],
  ["Salalah Port", "Oman", 16.9500, 53.9833],
  ["Muscat Port", "Oman", 23.6167, 58.5667],
  ["Jeddah Islamic Port", "Saudi Arabia", 21.4833, 39.1667],
  ["Dammam Port", "Saudi Arabia", 26.4500, 50.1167],
  ["Aqaba Port", "Jordan", 29.5167, 35.0000],
  ["Port Said", "Egypt", 31.2565, 32.2841],

  ["Shanghai Port", "China", 31.2304, 121.4737],
  ["Ningbo-Zhoushan Port", "China", 29.8683, 121.5440],
  ["Shenzhen Port", "China", 22.5431, 114.0579],
  ["Guangzhou Port", "China", 23.1291, 113.2644],
  ["Qingdao Port", "China", 36.0671, 120.3826],
  ["Tianjin Port", "China", 38.9897, 117.3500],
  ["Xiamen Port", "China", 24.4798, 118.0894],
  ["Hong Kong Port", "Hong Kong", 22.3193, 114.1694],
  ["Busan Port", "South Korea", 35.1028, 129.0403],
  ["Incheon Port", "South Korea", 37.4563, 126.7052],
  ["Tokyo Port", "Japan", 35.6170, 139.7671],
  ["Yokohama Port", "Japan", 35.4437, 139.6380],
  ["Nagoya Port", "Japan", 35.0833, 136.8833],
  ["Kobe Port", "Japan", 34.6833, 135.1833],
  ["Osaka Port", "Japan", 34.6500, 135.4333],
  ["Kaohsiung Port", "Taiwan", 22.6163, 120.3133],
  ["Keelung Port", "Taiwan", 25.1333, 121.7333],
  ["Manila Port", "Philippines", 14.5833, 120.9667],
  ["Jakarta Port", "Indonesia", -6.1000, 106.8833],
  ["Surabaya Port", "Indonesia", -7.2000, 112.7333],

  ["Rotterdam Port", "Netherlands", 51.9496, 4.1453],
  ["Antwerp Port", "Belgium", 51.2667, 4.4000],
  ["Hamburg Port", "Germany", 53.5461, 9.9661],
  ["Bremerhaven Port", "Germany", 53.5500, 8.5833],
  ["Le Havre Port", "France", 49.4900, 0.1000],
  ["Marseille Port", "France", 43.2965, 5.3698],
  ["Barcelona Port", "Spain", 41.3500, 2.1667],
  ["Valencia Port", "Spain", 39.4500, -0.3167],
  ["Algeciras Port", "Spain", 36.1333, -5.4500],
  ["Genoa Port", "Italy", 44.4000, 8.9333],
  ["Naples Port", "Italy", 40.8333, 14.2667],
  ["Piraeus Port", "Greece", 37.9500, 23.6333],
  ["Felixstowe Port", "United Kingdom", 51.9636, 1.3511],
  ["London Gateway", "United Kingdom", 51.5074, 0.7000],
  ["Dover Port", "United Kingdom", 51.1279, 1.3134],
  ["Lisbon Port", "Portugal", 38.7071, -9.1366],
  ["Gdansk Port", "Poland", 54.3520, 18.6466],
  ["Constanta Port", "Romania", 44.1598, 28.6348],

  ["Los Angeles Port", "USA", 33.7405, -118.2728],
  ["Long Beach Port", "USA", 33.7701, -118.1937],
  ["New York Port", "USA", 40.6840, -74.0000],
  ["Savannah Port", "USA", 32.0809, -81.0912],
  ["Houston Port", "USA", 29.7604, -95.3698],
  ["Miami Port", "USA", 25.7617, -80.1918],
  ["New Orleans Port", "USA", 29.9511, -90.0715],
  ["Seattle Port", "USA", 47.6062, -122.3321],
  ["Vancouver Port", "Canada", 49.2827, -123.1207],
  ["Montreal Port", "Canada", 45.5017, -73.5673],
  ["Halifax Port", "Canada", 44.6488, -63.5752],
  ["Manzanillo Port", "Mexico", 19.0500, -104.3167],
  ["Veracruz Port", "Mexico", 19.1738, -96.1342],
  ["Cartagena Port", "Colombia", 10.3910, -75.4794],
  ["Panama City Port", "Panama", 8.9833, -79.5167],

  ["Santos Port", "Brazil", -23.9608, -46.3336],
  ["Rio de Janeiro Port", "Brazil", -22.9035, -43.1729],
  ["Buenos Aires Port", "Argentina", -34.6037, -58.3816],
  ["Montevideo Port", "Uruguay", -34.9011, -56.1645],
  ["Valparaiso Port", "Chile", -33.0472, -71.6127],
  ["Callao Port", "Peru", -12.0464, -77.1428],

  ["Durban Port", "South Africa", -29.8587, 31.0218],
  ["Cape Town Port", "South Africa", -33.9180, 18.4233],
  ["Port Elizabeth", "South Africa", -33.9608, 25.6022],
  ["Lagos Port", "Nigeria", 6.4541, 3.3947],
  ["Tema Port", "Ghana", 5.6698, 0.0166],
  ["Mombasa Port", "Kenya", -4.0435, 39.6682],
  ["Dar es Salaam Port", "Tanzania", -6.7924, 39.2083],
  ["Port Said", "Egypt", 31.2565, 32.2841],

  ["Sydney Port", "Australia", -33.8688, 151.2093],
  ["Melbourne Port", "Australia", -37.8136, 144.9631],
  ["Brisbane Port", "Australia", -27.4705, 153.0260],
  ["Fremantle Port", "Australia", -32.0569, 115.7439],
  ["Auckland Port", "New Zealand", -36.8445, 174.7680],
  ["Wellington Port", "New Zealand", -41.2866, 174.7756]
];

const seedPorts = async () => {
  try {
    await connectDB();

    await Port.deleteMany({});

    const data = ports.map((p) => ({
      name: p[0],
      country: p[1],
      latitude: p[2],
      longitude: p[3],
    }));

    await Port.insertMany(data);

    console.log(`Ports seeded successfully: ${data.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Port seed error:", error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedPorts();