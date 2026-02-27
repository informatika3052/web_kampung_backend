const { Transaction } = require("../models");
const { Op } = require("sequelize");

// Ambil semua transaksi dengan filter bulan/tahun
exports.getTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = {};

    console.log("Request query:", { month, year }); // Debugging

    if (month && year) {
      // Validasi month dan year
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Bulan tidak valid" });
      }

      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ message: "Tahun tidak valid" });
      }

      // Hitung tanggal awal bulan
      const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;

      // Hitung tanggal akhir bulan
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${lastDay}`;

      console.log("Date range:", { startDate, endDate });

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    console.log("Where clause:", where);

    const transactions = await Transaction.findAll({
      where,
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    console.log(`Found ${transactions.length} transactions`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getTransactions:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Kirim error detail ke client (hanya untuk development)
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
      name: error.name,
    });
  }
};

// Buat transaksi baru (admin only)
exports.createTransaction = async (req, res) => {
  try {
    const { date, description, amount, type } = req.body;

    console.log("Creating transaction with data:", {
      date,
      description,
      amount,
      type,
    });

    // Validasi input
    if (!date || !description || !amount || !type) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    // Validasi amount harus number
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "Jumlah harus angka positif" });
    }

    // Validasi type
    if (!["income", "expense"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Tipe harus income atau expense" });
    }

    const transaction = await Transaction.create({
      date,
      description,
      amount: amountNum,
      type,
    });

    console.log("Transaction created:", transaction.toJSON());
    res.status(201).json(transaction);
  } catch (error) {
    console.error("❌ Error in createTransaction:", error);
    res.status(500).json({
      message: "Gagal membuat transaksi",
      error: error.message,
    });
  }
};

// Update transaksi (admin only)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Updating transaction:", id);

    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    await transaction.update(req.body);
    console.log("Transaction updated");
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error in updateTransaction:", error);
    res.status(500).json({ message: error.message });
  }
};

// Hapus transaksi (admin only)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting transaction:", id);

    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    await transaction.destroy();
    console.log("Transaction deleted");
    res.json({ message: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error in deleteTransaction:", error);
    res.status(500).json({ message: error.message });
  }
};
// Di bagian bawah file, tambahkan fungsi ini
exports.getAvailableYears = async (req, res) => {
  try {
    const sequelize = require("sequelize"); // Import di dalam fungsi atau di atas file
    const { Transaction } = require("../models");

    console.log("Fetching available years...");

    const years = await Transaction.findAll({
      attributes: [[sequelize.fn("YEAR", sequelize.col("date")), "year"]],
      group: ["year"],
      order: [[sequelize.fn("YEAR", sequelize.col("date")), "DESC"]],
      raw: true,
    });

    console.log("Available years:", years);

    // Extract year values dan kirim sebagai array
    const yearList = years.map((y) => y.year);
    res.json(yearList);
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({ message: error.message });
  }
};
