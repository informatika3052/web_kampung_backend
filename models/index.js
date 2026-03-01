const sequelize = require("../config/database");
const User = require("./User");
const Transaction = require("./Transaction");
const Announcements = require("./Announcements");

// Definisikan relasi
User.hasMany(Transaction, { foreignKey: "created_by" });
Transaction.belongsTo(User, { foreignKey: "created_by", as: "creator" });

User.hasMany(Announcements, { foreignKey: "created_by" });
Announcements.belongsTo(User, { foreignKey: "created_by", as: "creator" });

const db = {
  sequelize,
  User,
  Transaction,
  Announcements,
};

// console.log("✅ Models loaded:", Object.keys(db));

module.exports = db;
