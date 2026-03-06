// config/sequelize.js
const { Sequelize } = require("sequelize");

// Ambil environment variable (pastikan sudah di-set di Railway)
const sequelize = new Sequelize(
  process.env.MYSQLDATABASE,
  process.env.MYSQLUSER,
  process.env.MYSQLPASSWORD,
  {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    dialect: "mysql",
    logging: true, // Aktifkan logging untuk debug, ganti dengan false untuk produksi
    // logging: false, // matikan log query, atau ganti dengan console.log untuk debug
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
  .then(() => {
    console.log("✅ Sequelize connected to MySQL");
    console.log("DB:", process.env.MYSQLDATABASE);
    console.log("HOST:", process.env.MYSQLHOST);
    console.log("USER:", process.env.MYSQLUSER);
    console.log("PORT:", process.env.MYSQLPORT);
  })
  .catch((err) => console.error("❌ Sequelize connection error:", err));

module.exports = sequelize;
