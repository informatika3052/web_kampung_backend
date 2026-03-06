const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Announcements = sequelize.define(
  "Announcements", // ini nama model (bisa kapital)
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM("umum", "keamanan", "kegiatan", "iuran"),
      defaultValue: "umum",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    // ⚠️ YANG DIPERBAIKI: tableName harus huruf kecil semua
    tableName: "announcements", // <- ubah jadi huruf kecil

    timestamps: true,

    // ⚠️ TAMBAHKAN INI untuk mapping kolom yang benar:
    underscored: true, // karena di database pakai created_at, updated_at

    // Kalau perlu, bisa mapping eksplisit:
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

Announcements.associate = (models) => {
  Announcements.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });
};

module.exports = Announcements;
