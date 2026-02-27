const { Transaction } = require("../models");
const { Op } = require("sequelize");

// Ambil semua transaksi dengan filter bulan/tahun
exports.getTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = {};

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

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const transactions = await Transaction.findAll({
      where,
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

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
// Buat transaksi baru
exports.createTransaction = async (req, res) => {
  try {
    const { date, jenis_iuran, nama_warga, amount, type, keterangan } =
      req.body;

    // Log untuk debugging
    console.log("📝 Data received:", req.body);

    // Validasi input - pastikan nama field SAMA dengan yang dikirim frontend
    if (!date || !jenis_iuran || !nama_warga || !amount || !type) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
        received: req.body, // Kirim balik data yang diterima untuk debugging
      });
    }

    // Validasi amount harus number
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "Jumlah harus angka positif" });
    }

    const transaction = await Transaction.create({
      date,
      jenis_iuran,
      nama_warga,
      amount: amountNum,
      type,
      keterangan: keterangan || "",
      created_by: req.user.id,
    });

    console.log("✅ Transaction created:", transaction.id);
    res.status(201).json(transaction);
  } catch (error) {
    console.error("❌ Error in createTransaction:", error);
    res.status(500).json({ message: error.message });
  }
};

// Ambil transaksi by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching transaction with ID: ${id}`);

    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    console.log(`✅ Transaction found:`, transaction.id);
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error in getTransactionById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update transaksi (admin only)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    await transaction.update(req.body);
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
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    await transaction.destroy();
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
    const years = await Transaction.findAll({
      attributes: [[sequelize.fn("YEAR", sequelize.col("date")), "year"]],
      group: ["year"],
      order: [[sequelize.fn("YEAR", sequelize.col("date")), "DESC"]],
      raw: true,
    });

    // Extract year values dan kirim sebagai array
    const yearList = years.map((y) => y.year);
    res.json(yearList);
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent transactions
exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    console.log(`📋 Mengambil ${limit} transaksi terbaru...`);

    const transactions = await Transaction.findAll({
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: limit,
    });

    console.log(`✅ Ditemukan ${transactions.length} transaksi terbaru`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getRecentTransactions:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get warga list (untuk filter dropdown)
exports.getWargaList = async (req, res) => {
  try {
    console.log("📋 Mengambil daftar warga...");

    const warga = await Transaction.findAll({
      attributes: [
        [
          require("sequelize").fn(
            "DISTINCT",
            require("sequelize").col("nama_warga"),
          ),
          "nama_warga",
        ],
      ],
      where: {
        nama_warga: {
          [Op.ne]: null, // Abaikan yang null
        },
      },
      raw: true,
    });

    const wargaList = warga.map((w) => w.nama_warga).filter((w) => w); // Filter falsy values
    console.log(`✅ Ditemukan ${wargaList.length} warga`);
    res.json(wargaList);
  } catch (error) {
    console.error("❌ Error in getWargaList:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get transactions by type dengan filter
exports.getTransactionsByType = async (req, res) => {
  try {
    const { type, bulan, tahun, warga, jenis } = req.query;
    let where = {};

    // Filter by type jika ada
    if (type) {
      where.type = type;
    }

    // Filter by bulan dan tahun
    if (bulan && tahun) {
      const bulanStr = bulan.toString().padStart(2, "0");
      const startDate = `${tahun}-${bulanStr}-01`;
      const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Filter by nama warga
    if (warga) {
      where.nama_warga = warga;
    }

    // Filter by jenis iuran
    if (jenis) {
      where.jenis_iuran = jenis;
    }

    console.log("📋 Filter transactions:", {
      type,
      bulan,
      tahun,
      warga,
      jenis,
    });
    console.log("📋 Where clause:", where);

    const transactions = await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });

    console.log(`✅ Ditemukan ${transactions.length} transaksi`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getTransactionsByType:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get pemasukan dengan filter (khusus type='income')
exports.getPemasukan = async (req, res) => {
  try {
    const { bulan, tahun, warga, jenis } = req.query;
    let where = { type: "income" };

    // Filter by bulan dan tahun
    if (bulan && tahun) {
      const bulanStr = bulan.toString().padStart(2, "0");
      const startDate = `${tahun}-${bulanStr}-01`;
      const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Filter by nama warga
    if (warga) {
      where.nama_warga = warga;
    }

    // Filter by jenis iuran
    if (jenis) {
      where.jenis_iuran = jenis;
    }

    const transactions = await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getPemasukan:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get total pemasukan (untuk ringkasan)
exports.getTotalPemasukan = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    let where = { type: "income" };

    if (bulan && tahun) {
      const bulanStr = bulan.toString().padStart(2, "0");
      const startDate = `${tahun}-${bulanStr}-01`;
      const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const total = (await Transaction.sum("amount", { where })) || 0;
    res.json({ total });
  } catch (error) {
    console.error("❌ Error in getTotalPemasukan:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get pemasukan dengan filter (khusus type='income')
exports.getPengeluaran = async (req, res) => {
  try {
    const { bulan, tahun, warga, jenis } = req.query;
    let where = { type: "expense" };

    // Filter by bulan dan tahun
    if (bulan && tahun) {
      const bulanStr = bulan.toString().padStart(2, "0");
      const startDate = `${tahun}-${bulanStr}-01`;
      const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Filter by nama warga
    if (warga) {
      where.nama_warga = warga;
    }

    // Filter by jenis iuran
    if (jenis) {
      where.jenis_iuran = jenis;
    }

    const transactions = await Transaction.findAll({
      where,
      order: [["date", "DESC"]],
    });

    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getPemasukan:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get total pengeluaran (untuk ringkasan)
exports.getTotalPengeluaran = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    let where = { type: "expense" };

    if (bulan && tahun) {
      const bulanStr = bulan.toString().padStart(2, "0");
      const startDate = `${tahun}-${bulanStr}-01`;
      const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const total = (await Transaction.sum("amount", { where })) || 0;
    res.json({ total });
  } catch (error) {
    console.error("❌ Error in getTotalPengeluaran:", error);
    res.status(500).json({ message: error.message });
  }
};
