const { Transaction } = require("../models");
const { Op } = require("sequelize");

// Get summary untuk card statistics
exports.getSummary = async (req, res) => {
  try {
    console.log("📊 Fetching summary...");

    // Hitung saldo total (semua pemasukan - semua pengeluaran)
    const allIncome =
      (await Transaction.sum("amount", { where: { type: "income" } })) || 0;
    const allExpense =
      (await Transaction.sum("amount", { where: { type: "expense" } })) || 0;
    const saldoSaatIni = allIncome - allExpense;

    // Hitung pemasukan bulan ini
    const now = new Date();
    const tahunIni = now.getFullYear();
    const bulanIni = now.getMonth() + 1;

    // Format tanggal dengan benar
    const startDate = `${tahunIni}-${bulanIni.toString().padStart(2, "0")}-01`;

    // Hitung hari terakhir bulan ini
    const lastDay = new Date(tahunIni, bulanIni, 0).getDate();
    const endDate = `${tahunIni}-${bulanIni.toString().padStart(2, "0")}-${lastDay}`;

    console.log(`📅 Rentang: ${startDate} sampai ${endDate}`);

    const pemasukanBulanIni =
      (await Transaction.sum("amount", {
        where: {
          type: "income",
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      })) || 0;

    // Hitung pengeluaran bulan ini
    const pengeluaranBulanIni =
      (await Transaction.sum("amount", {
        where: {
          type: "expense",
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      })) || 0;

    const result = {
      saldoSaatIni,
      pemasukanBulanIni,
      pengeluaranBulanIni,
    };

    console.log("✅ Summary:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in getSummary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get data grafik 6 bulan - VERSI PALING AMAN
exports.getGrafik6Bulan = async (req, res) => {
  try {
    console.log("📈 Fetching grafik data...");

    const now = new Date();
    const result = [];

    // Nama bulan dalam Bahasa Indonesia
    const namaBulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    // Loop 6 bulan terakhir
    for (let i = 5; i >= 0; i--) {
      // Hitung bulan dan tahun dengan benar
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const tahun = targetDate.getFullYear();
      const bulan = targetDate.getMonth() + 1;

      // Format bulan dengan leading zero
      const bulanStr = bulan.toString().padStart(2, "0");

      // Buat tanggal awal dan akhir bulan dengan BENAR
      const startDate = `${tahun}-${bulanStr}-01`;

      // Hitung jumlah hari dalam bulan tersebut
      const daysInMonth = new Date(tahun, bulan, 0).getDate();
      const endDate = `${tahun}-${bulanStr}-${daysInMonth}`;

      console.log(`📅 Bulan ${i}: ${startDate} - ${endDate}`);

      // Ambil semua transaksi di bulan tersebut
      const bulanTransactions = await Transaction.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Hitung total pemasukan bulan ini
      let pemasukan = 0;
      let pengeluaran = 0;

      bulanTransactions.forEach((t) => {
        if (t.type === "income") {
          pemasukan += t.amount;
        } else {
          pengeluaran += t.amount;
        }
      });

      // Hitung saldo (akumulasi sampai akhir bulan ini)
      const allTransactionsUntil = await Transaction.findAll({
        where: {
          date: {
            [Op.lte]: endDate,
          },
        },
      });

      let saldo = 0;
      allTransactionsUntil.forEach((t) => {
        if (t.type === "income") {
          saldo += t.amount;
        } else {
          saldo -= t.amount;
        }
      });

      result.push({
        bulan: namaBulan[bulan - 1] + " " + tahun,
        pemasukan,
        pengeluaran,
        saldo,
      });

      console.log(
        `✅ ${namaBulan[bulan - 1]}: Pem=${pemasukan}, Peng=${pengeluaran}, Saldo=${saldo}`,
      );
    }

    console.log("✅ Grafik data siap:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in getGrafik6Bulan:", error);
    res.status(500).json({
      message: "Gagal mengambil data grafik",
      error: error.message,
    });
  }
};

// Get recent transactions
exports.getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const transactions = await Transaction.findAll({
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: limit,
    });

    res.json(transactions);
  } catch (error) {
    console.error("❌ Error in getRecentTransactions:", error);
    res.status(500).json({ message: error.message });
  }
};
