const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    jenis_iuran: {
      type: DataTypes.ENUM(
        "kas_bulanan",
        "kas_kematian",
        "kas_sosial",
        "dana_bangunan",
        "lainnya",
      ),
      allowNull: false,
      defaultValue: "kas_bulanan",
    },
    nama_warga: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "transactions",
    timestamps: true,
  },
);

// Relasi dengan User
Transaction.associate = (models) => {
  Transaction.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });
};

module.exports = Transaction;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notNull: { msg: "Tanggal harus diisi" },
      },
    },
    jenis_iuran: {
      type: DataTypes.ENUM(
        "kas_bulanan",
        "kas_kematian",
        "kas_sosial",
        "dana_bangunan",
        "lainnya",
      ),
      allowNull: false,
      defaultValue: "kas_bulanan",
    },
    nama_warga: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nama warga tidak boleh kosong" },
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: "Jumlah harus angka" },
        min: {
          args: [0],
          msg: "Jumlah tidak boleh negatif",
        },
      },
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "transactions",
    timestamps: true,
    underscored: false,
  },
);

module.exports = Transaction;
