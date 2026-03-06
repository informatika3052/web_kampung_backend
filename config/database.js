const { Sequelize } = require("sequelize");
require("dotenv").config();

// Gunakan MYSQL_URL jika ada (cara termudah)
const sequelize = process.env.MYSQL_URL
  ? new Sequelize(process.env.MYSQL_URL, {
      dialect: "mysql",
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.MYSQLDATABASE || "railway",
      process.env.MYSQLUSER || "root",
      process.env.MYSQLPASSWORD || "",
      {
        host: process.env.MYSQLHOST || "mysql.railway.internal",
        port: process.env.MYSQLPORT || 3306,
        dialect: "mysql",
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      },
    );

// Test koneksi dengan retry
const connectWithRetry = async (retries = 5) => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    if (retries > 0) {
      console.log(`🔄 Retrying... (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    }
  }
};

connectWithRetry();
module.exports = sequelize;
