// config/sequelize.js
const { Sequelize } = require("sequelize");

// Ambil environment variable (pastikan sudah di-set di Railway)
const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || "railway",
  process.env.MYSQLUSER || "root",
  process.env.MYSQLPASSWORD || "",
  {
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    dialect: "mysql",
    logging: false, // matikan log query, atau ganti dengan console.log untuk debug
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

// Uji koneksi
sequelize
  .authenticate()
  .then(() => console.log("✅ Sequelize connected to MySQL"))
  .catch((err) => console.error("❌ Sequelize connection error:", err));

module.exports = sequelize;
