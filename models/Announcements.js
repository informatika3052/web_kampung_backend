const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Announcements = sequelize.define(
  "Announcements",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Judul
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Deskripsi tambahan (untuk kegiatan dll)
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Tanggal
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // Lokasi (optional kalau bukan kegiatan)
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Lampiran file
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Kategori
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
    tableName: "Announcements",
    timestamps: true,
  },
);

Announcements.associate = (models) => {
  Announcements.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });
};

module.exports = Announcements;
