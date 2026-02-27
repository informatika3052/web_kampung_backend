// const PDFDocument = require("pdfkit");
// const { Transaction } = require("../models/Transaction");
// const { Op } = require("sequelize");

// exports.generateMonthlyReport = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ message: "Bulan dan tahun diperlukan" });
//     }

//     const startDate = `${year}-${month.padStart(2, "0")}-01`;
//     const endDate = `${year}-${month.padStart(2, "0")}-31`;

//     const transactions = await Transaction.findAll({
//       where: {
//         date: {
//           [Op.between]: [startDate, endDate],
//         },
//       },
//       order: [["date", "ASC"]],
//     });

//     // Hitung total
//     const totalIncome = transactions
//       .filter((t) => t.type === "income")
//       .reduce((sum, t) => sum + t.amount, 0);
//     const totalExpense = transactions
//       .filter((t) => t.type === "expense")
//       .reduce((sum, t) => sum + t.amount, 0);
//     const balance = totalIncome - totalExpense;

//     // Buat PDF
//     const doc = new PDFDocument({ margin: 50 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=laporan-kas-${month}-${year}.pdf`,
//     );

//     doc.pipe(res);

//     // Header
//     doc.fontSize(20).text("Laporan Kas Kampung", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(16).text(`Bulan: ${month} - ${year}`, { align: "center" });
//     doc.moveDown(2);

//     // Ringkasan
//     doc.fontSize(14).text("Ringkasan Keuangan:", { underline: true });
//     doc
//       .fontSize(12)
//       .text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`)
//       .text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`)
//       .text(`Saldo Akhir: Rp ${balance.toLocaleString("id-ID")}`, {
//         bold: true,
//       });
//     doc.moveDown(2);

//     // Detail Transaksi
//     doc.fontSize(14).text("Detail Transaksi:", { underline: true });
//     doc.moveDown();

//     // Tabel sederhana
//     transactions.forEach((t) => {
//       const type = t.type === "income" ? "Pemasukan" : "Pengeluaran";
//       doc
//         .fontSize(10)
//         .text(
//           `${t.date} | ${t.description} | ${type} | Rp ${t.amount.toLocaleString("id-ID")}`,
//         );
//     });

//     doc.end();
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const PDFDocument = require("pdfkit");
const { Transaction } = require("../models");
const { Op } = require("sequelize");

exports.generateMonthlyReport = async (req, res) => {
  try {
    console.log("🚀 Report endpoint dipanggil");
    const { month, year } = req.query;
    console.log("📅 Parameter:", { month, year });

    // Validasi input
    if (!month || !year) {
      console.log("❌ Bulan/tahun tidak lengkap");
      return res.status(400).json({ message: "Bulan dan tahun diperlukan" });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: "Bulan tidak valid" });
    }
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ message: "Tahun tidak valid" });
    }

    // Hitung tanggal
    const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const endDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${lastDay}`;
    console.log("📆 Rentang tanggal:", { startDate, endDate });

    // Ambil data transaksi
    console.log("🔍 Mencari transaksi...");
    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });
    console.log(`✅ Ditemukan ${transactions.length} transaksi`);

    // Hitung total
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    console.log(
      "💰 Total pemasukan:",
      totalIncome,
      "pengeluaran:",
      totalExpense,
      "saldo:",
      balance,
    );

    // Buat PDF
    console.log("📄 Membuat dokumen PDF...");
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    console.log("✅ PDFDocument dibuat");

    // Set header response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan-kas-${month}-${year}.pdf`,
    );
    console.log("📤 Header response diset");

    // Pipe PDF ke response
    doc.pipe(res);
    console.log("🔌 PDF dipipe ke response");

    // Konten PDF
    doc.fontSize(20).text("Laporan Kas Kampung", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Bulan: ${month} - ${year}`, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).text("Ringkasan Keuangan:", { underline: true });
    doc
      .fontSize(12)
      .text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`)
      .text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`)
      .text(`Saldo Akhir: Rp ${balance.toLocaleString("id-ID")}`);
    doc.moveDown(2);
    doc.fontSize(14).text("Detail Transaksi:", { underline: true });
    doc.moveDown();

    if (transactions.length === 0) {
      doc.fontSize(12).text("Tidak ada transaksi pada periode ini.");
    } else {
      transactions.forEach((t) => {
        const type = t.type === "income" ? "Pemasukan" : "Pengeluaran";
        doc
          .fontSize(10)
          .text(
            `${t.date} | ${t.description.substring(0, 30)} | ${type} | Rp ${t.amount.toLocaleString("id-ID")}`,
          );
      });
    }

    console.log("✍️ Konten PDF selesai ditulis");
    doc.end();
    console.log("✅ PDF selesai");

    doc.on("error", (err) => {
      console.error("❌ Error pada stream PDF:", err);
    });
  } catch (error) {
    console.error("❌ Error di reportController:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal generate laporan", error: error.message });
    }
  }
};
