const sequelize = require("../config/database");
const User = require("./User");
const Transaction = require("./Transaction");
const Announcement = require("./Announcement");
const Activity = require("./Activity");

// Definisikan relasi
User.hasMany(Transaction, { foreignKey: "created_by" });
Transaction.belongsTo(User, { foreignKey: "created_by", as: "creator" });

User.hasMany(Announcement, { foreignKey: "created_by" });
Announcement.belongsTo(User, { foreignKey: "created_by", as: "creator" });

User.hasMany(Activity, { foreignKey: "created_by" });
Activity.belongsTo(User, { foreignKey: "created_by", as: "creator" });

const db = {
  sequelize,
  User,
  Transaction,
  Announcement,
  Activity,
};

// console.log("✅ Models loaded:", Object.keys(db));

module.exports = db;
