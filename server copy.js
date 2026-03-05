// config/database.js
const { Sequelize } = require("sequelize");

// Cek apakah environment variable tersedia
console.log("DB Config:", {
  host: process.env.MYSQLHOST || "localhost",
  database: process.env.MYSQLDATABASE || "railway",
  user: process.env.MYSQLUSER || "root",
  port: process.env.MYSQLPORT || 3306,
  password: process.env.MYSQLPASSWORD ? "******" : "not set",
});

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || "railway",
  process.env.MYSQLUSER || "root",
  process.env.MYSQLPASSWORD || "",
  {
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    dialect: "mysql",
    logging: console.log, // Aktifkan logging untuk debugging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  },
);

// Test koneksi
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected to Railway!");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    console.error("Full error:", err);
  });

module.exports = sequelize;
