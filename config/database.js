// config/sequelize.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || "railway",
  process.env.MYSQLUSER || "root",
  process.env.MYSQLPASSWORD || "password",
  {
    host: process.env.MYSQLHOST || "mysql.railway.internal",
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

// cek koneksi database
const connectWithRetry = () => {
  sequelize
    .authenticate()
    .then(() => console.log("Database connected"))
    .catch((err) => {
      console.error("Database connection failed, retrying in 5s...", err);

      console.log("DB:", process.env.MYSQLDATABASE);
      console.log("HOST:", process.env.MYSQLHOST);
      console.log("USER:", process.env.MYSQLUSER);
      console.log("PORT:", process.env.MYSQLPORT);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

module.exports = sequelize;
