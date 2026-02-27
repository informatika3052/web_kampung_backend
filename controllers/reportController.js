const PDFDocument = require("pdfkit");
const { Transaction } = require("../models");
const { Op } = require("sequelize");

// Generate laporan bulanan PDF
exports.generateMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    console.log(`📄 Generating PDF report for month: ${month}, year: ${year}`);

    // Validasi input
    if (!month || !year) {
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

    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    // Ambil data transaksi
    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    return generatePDF(res, transactions, month, year, "bulanan");
  } catch (error) {
    console.error("❌ Error di reportController:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal generate laporan", error: error.message });
    }
  }
};

// Generate laporan tahunan PDF
exports.generateYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    console.log(`📄 Generating PDF report for year: ${year}`);

    // Validasi input
    if (!year) {
      return res.status(400).json({ message: "Tahun diperlukan" });
    }

    const yearNum = parseInt(year);

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ message: "Tahun tidak valid" });
    }

    // Hitung tanggal (seluruh tahun)
    const startDate = `${yearNum}-01-01`;
    const endDate = `${yearNum}-12-31`;

    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    // Ambil data transaksi
    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    return generatePDF(res, transactions, null, year, "tahunan");
  } catch (error) {
    console.error("❌ Error di reportController:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal generate laporan", error: error.message });
    }
  }
};

// Fungsi helper untuk generate PDF (digunakan oleh bulanan dan tahunan)
async function generatePDF(res, transactions, month, year, jenis) {
  try {
    // Hitung total
    let totalIncome = 0;
    let totalExpense = 0;

    // Hitung per bulan untuk laporan tahunan
    const monthlyData = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }

      // Untuk laporan tahunan, kategorikan per bulan
      if (jenis === "tahunan") {
        const bulan = new Date(t.date).getMonth() + 1;
        if (!monthlyData[bulan]) {
          monthlyData[bulan] = {
            pemasukan: 0,
            pengeluaran: 0,
            transactions: [],
          };
        }

        if (t.type === "income") {
          monthlyData[bulan].pemasukan += t.amount;
        } else {
          monthlyData[bulan].pengeluaran += t.amount;
        }
        monthlyData[bulan].transactions.push(t);
      }
    });

    const balance = totalIncome - totalExpense;

    // Buat PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      info: {
        Title: `Laporan Kas Kampung ${jenis === "tahunan" ? "Tahun " + year : "Bulan " + month + "-" + year}`,
        Author: "Sistem Kas Kampung",
        Subject: "Laporan Keuangan",
      },
    });

    // Set header response
    res.setHeader("Content-Type", "application/pdf");
    const filename =
      jenis === "tahunan"
        ? `laporan-tahunan-${year}.pdf`
        : `laporan-bulanan-${month}-${year}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Pipe PDF ke response
    doc.pipe(res);

    // ========== KONTEN PDF ==========

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#2e7d32")
      .text("LAPORAN KAS KAMPUNG", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .font("Helvetica")
      .fillColor("#1b5e20")
      .text(
        jenis === "tahunan" ? `Tahun: ${year}` : `Bulan: ${month} - ${year}`,
        { align: "center" },
      );

    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#666666")
      .text(
        `Dibuat pada: ${new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        { align: "center" },
      );

    doc.moveDown(2);

    // Garis pemisah
    doc
      .strokeColor("#2e7d32")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(1.5);

    // ========== RINGKASAN ==========
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#2e7d32")
      .text("RINGKASAN KEUANGAN", { underline: false });

    doc.moveDown(0.5);

    // Buat kotak ringkasan
    const summaryY = doc.y;

    // Kotak Pemasukan
    doc
      .roundedRect(50, summaryY, 150, 80, 5)
      .fillAndStroke("#e8f5e9", "#2e7d32");

    doc
      .fillColor("#1b5e20")
      .fontSize(10)
      .font("Helvetica")
      .text("Total Pemasukan", 60, summaryY + 10, {
        width: 130,
        align: "center",
      });

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Rp ${totalIncome.toLocaleString("id-ID")}`, 60, summaryY + 35, {
        width: 130,
        align: "center",
      });

    // Kotak Pengeluaran
    doc
      .roundedRect(220, summaryY, 150, 80, 5)
      .fillAndStroke("#ffebee", "#d32f2f");

    doc
      .fillColor("#b71c1c")
      .fontSize(10)
      .font("Helvetica")
      .text("Total Pengeluaran", 230, summaryY + 10, {
        width: 130,
        align: "center",
      });

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Rp ${totalExpense.toLocaleString("id-ID")}`, 230, summaryY + 35, {
        width: 130,
        align: "center",
      });

    // Kotak Saldo
    doc
      .roundedRect(390, summaryY, 150, 80, 5)
      .fillAndStroke("#e3f2fd", "#1976d2");

    doc
      .fillColor("#0d47a1")
      .fontSize(10)
      .font("Helvetica")
      .text("Saldo Akhir", 400, summaryY + 10, { width: 130, align: "center" });

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Rp ${balance.toLocaleString("id-ID")}`, 400, summaryY + 35, {
        width: 130,
        align: "center",
      });

    doc.y = summaryY + 100;
    doc.moveDown(2);

    // ========== DETAIL TRANSAKSI ==========

    if (jenis === "tahunan") {
      // Untuk laporan tahunan, tampilkan per bulan
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#2e7d32")
        .text("REKAP PER BULAN", { underline: false });

      doc.moveDown(1);

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

      // Tabel rekap per bulan
      const tableTop = doc.y;

      // Header tabel
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .rect(50, tableTop - 5, 500, 20)
        .fill("#2e7d32");

      doc
        .fillColor("#ffffff")
        .text("Bulan", 55, tableTop)
        .text("Pemasukan", 150, tableTop)
        .text("Pengeluaran", 250, tableTop)
        .text("Saldo", 350, tableTop)
        .text("Jumlah Transaksi", 430, tableTop);

      doc.moveDown(1.5);

      // Isi tabel per bulan
      let rowY = doc.y;
      let totalPemasukanTahunan = 0;
      let totalPengeluaranTahunan = 0;

      for (let i = 1; i <= 12; i++) {
        const data = monthlyData[i] || {
          pemasukan: 0,
          pengeluaran: 0,
          transactions: [],
        };
        const saldoBulan = data.pemasukan - data.pengeluaran;

        totalPemasukanTahunan += data.pemasukan;
        totalPengeluaranTahunan += data.pengeluaran;

        // Background selang-seling
        if (i % 2 === 0) {
          doc.rect(50, rowY - 5, 500, 20).fill("#f5f5f5");
        }

        doc
          .fillColor("#000000")
          .font("Helvetica")
          .fontSize(9)
          .text(namaBulan[i - 1], 55, rowY)
          .text(`Rp ${data.pemasukan.toLocaleString("id-ID")}`, 150, rowY)
          .text(`Rp ${data.pengeluaran.toLocaleString("id-ID")}`, 250, rowY)
          .text(`Rp ${saldoBulan.toLocaleString("id-ID")}`, 350, rowY)
          .text(data.transactions.length.toString(), 430, rowY);

        rowY += 20;
        doc.y = rowY;
      }

      doc.moveDown(1);

      // Total tahunan
      doc.rect(50, doc.y - 5, 500, 25).fill("#e8f5e9");
      doc
        .fillColor("#1b5e20")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          `TOTAL TAHUN ${year}: Pemasukan Rp ${totalPemasukanTahunan.toLocaleString("id-ID")} | Pengeluaran Rp ${totalPengeluaranTahunan.toLocaleString("id-ID")} | Saldo Rp ${(totalPemasukanTahunan - totalPengeluaranTahunan).toLocaleString("id-ID")}`,
          55,
          doc.y,
          { width: 490, align: "center" },
        );

      doc.moveDown(2);

      // Detail transaksi per bulan (opsional, bisa ditambahkan jika ingin detail)
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#2e7d32")
        .text("DETAIL TRANSAKSI PER BULAN", { underline: false });

      doc.moveDown(1);

      for (let i = 1; i <= 12; i++) {
        const data = monthlyData[i];
        if (data && data.transactions.length > 0) {
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#1b5e20")
            .text(namaBulan[i - 1]);

          doc.moveDown(0.5);

          // Header detail transaksi
          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .fillColor("#000000")
            .text("Tanggal", 55, doc.y)
            .text("Jenis Iuran", 120, doc.y)
            .text("Nama Warga", 210, doc.y)
            .text("Tipe", 320, doc.y)
            .text("Nominal", 380, doc.y);

          doc.moveDown(1);

          // Detail transaksi bulan ini
          data.transactions.forEach((t, idx) => {
            if (idx % 2 === 0) {
              doc.rect(50, doc.y - 5, 500, 20).fill("#f9f9f9");
            }

            doc
              .fillColor("#000000")
              .font("Helvetica")
              .fontSize(8)
              .text(new Date(t.date).toLocaleDateString("id-ID"), 55, doc.y)
              .text((t.jenis_iuran || "-").replace(/_/g, " "), 120, doc.y, {
                width: 80,
              })
              .text(t.nama_warga || "-", 210, doc.y, { width: 100 })
              .text(
                t.type === "income" ? "Pemasukan" : "Pengeluaran",
                320,
                doc.y,
              )
              .text(
                `Rp ${(t.amount || 0).toLocaleString("id-ID")}`,
                380,
                doc.y,
              );

            doc.moveDown(1);
          });

          doc.moveDown(1);
        }
      }
    } else {
      // Untuk laporan bulanan, tampilkan detail transaksi seperti biasa
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#2e7d32")
        .text("DETAIL TRANSAKSI", { underline: false });

      doc.moveDown(1);

      if (transactions.length === 0) {
        doc
          .fontSize(12)
          .fillColor("#666666")
          .text("Tidak ada transaksi pada periode ini.", { align: "center" });
      } else {
        // Header tabel
        const tableTop = doc.y;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#ffffff")
          .rect(50, tableTop - 5, 500, 20)
          .fill("#2e7d32");

        doc
          .fillColor("#ffffff")
          .text("Tanggal", 55, tableTop)
          .text("Jenis Iuran", 120, tableTop)
          .text("Nama Warga", 210, tableTop)
          .text("Tipe", 320, tableTop)
          .text("Nominal", 380, tableTop);

        doc.moveDown(1.5);

        // Isi tabel
        let rowY = doc.y;
        transactions.forEach((t, index) => {
          // Background selang-seling
          if (index % 2 === 0) {
            doc.rect(50, rowY - 5, 500, 20).fill("#f5f5f5");
          }

          doc
            .fillColor("#000000")
            .font("Helvetica")
            .fontSize(9)
            .text(new Date(t.date).toLocaleDateString("id-ID"), 55, rowY)
            .text((t.jenis_iuran || "-").replace(/_/g, " "), 120, rowY, {
              width: 80,
            })
            .text(t.nama_warga || "-", 210, rowY, { width: 100 })
            .text(t.type === "income" ? "Pemasukan" : "Pengeluaran", 320, rowY)
            .text(`Rp ${(t.amount || 0).toLocaleString("id-ID")}`, 380, rowY);

          rowY += 20;
          doc.y = rowY;
        });

        // Footer total
        doc.moveDown(1);
        doc.rect(50, doc.y - 5, 500, 25).fill("#e8f5e9");
        doc
          .fillColor("#1b5e20")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            `TOTAL: Pemasukan Rp ${totalIncome.toLocaleString("id-ID")} | Pengeluaran Rp ${totalExpense.toLocaleString("id-ID")} | Saldo Rp ${balance.toLocaleString("id-ID")}`,
            55,
            doc.y,
            { width: 490, align: "center" },
          );
      }
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(
        "Dokumen ini digenerate secara otomatis oleh Sistem Kas Kampung",
        50,
        doc.y + 20,
        { align: "center" },
      );

    // Selesaikan PDF
    doc.end();

    console.log("✅ PDF report generated successfully");
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    throw error;
  }
}

// Export ke Excel (CSV) - Bisa untuk bulanan atau tahunan
exports.exportToExcel = async (req, res) => {
  try {
    const { month, year, periode } = req.query;

    // Validasi input
    if (!year) {
      return res.status(400).json({ message: "Tahun diperlukan" });
    }

    let startDate, endDate, filename;

    if (periode === "tahunan" || !month) {
      // Laporan tahunan
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
      filename = `laporan-tahunan-${year}.csv`;
    } else {
      // Laporan bulanan
      const monthNum = parseInt(month);
      startDate = `${year}-${monthNum.toString().padStart(2, "0")}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      endDate = `${year}-${monthNum.toString().padStart(2, "0")}-${lastDay}`;
      filename = `laporan-bulanan-${month}-${year}.csv`;
    }

    // Ambil data transaksi
    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    // Hitung total
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Format data untuk CSV
    const csvData = transactions.map((t) => ({
      Tanggal: new Date(t.date).toLocaleDateString("id-ID"),
      "Jenis Iuran": (t.jenis_iuran || "-").replace(/_/g, " "),
      "Nama Warga": t.nama_warga || "-",
      Tipe: t.type === "income" ? "Pemasukan" : "Pengeluaran",
      Nominal: t.amount || 0,
      Keterangan: t.keterangan || "-",
    }));

    // Buat CSV dengan header dan footer
    const headers = Object.keys(csvData[0] || {});

    let csvContent = headers.join(",") + "\n";

    // Data
    csvData.forEach((row) => {
      csvContent += headers.map((h) => `"${row[h]}"`).join(",") + "\n";
    });

    // Footer dengan total
    csvContent += "\n";
    csvContent += `"TOTAL PEMASUKAN",,,,"${totalIncome}"\n`;
    csvContent += `"TOTAL PENGELUARAN",,,,"${totalExpense}"\n`;
    csvContent += `"SALDO AKHIR",,,,"${balance}"\n`;

    // Set response headers
    res.setHeader("Content-Type", "text/csv;charset=utf-8;");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Kirim data
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ message: error.message });
  }
};
