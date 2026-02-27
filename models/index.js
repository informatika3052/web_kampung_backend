const sequelize = require("../config/database");
const User = require("./User");
const Transaction = require("./Transaction");

// Definisikan relasi antar model (jika ada)
// Contoh: User.hasMany(Transaction) dll

const db = {
  sequelize,
  User,
  Transaction,
};

console.log("✅ Models loaded:", Object.keys(db));

module.exports = db;
