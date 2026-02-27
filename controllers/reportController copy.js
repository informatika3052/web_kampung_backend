const ExcelJS = require("exceljs");

// Export ke Excel
exports.exportToExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Ambil data transaksi
    const { Transaction } = require("../models");
    const { Op } = require("sequelize");

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    // Buat workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Kas");

    // Header
    worksheet.columns = [
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Jenis Iuran", key: "jenis_iuran", width: 20 },
      { header: "Nama Warga", key: "nama_warga", width: 25 },
      { header: "Tipe", key: "type", width: 15 },
      { header: "Nominal", key: "amount", width: 15 },
      { header: "Keterangan", key: "keterangan", width: 30 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E7D32" },
    };
    worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Tambah data
    transactions.forEach((t) => {
      worksheet.addRow({
        date: new Date(t.date).toLocaleDateString("id-ID"),
        jenis_iuran: t.jenis_iuran.replace(/_/g, " "),
        nama_warga: t.nama_warga,
        type: t.type === "income" ? "Pemasukan" : "Pengeluaran",
        amount: t.amount,
        keterangan: t.keterangan || "-",
      });
    });

    // Set response header
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan-kas-${month}-${year}.xlsx`,
    );

    // Kirim file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ message: error.message });
  }
};
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

    console.log(`📊 Found ${transactions.length} transactions`);

    // Hitung total
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Buat PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      info: {
        Title: `Laporan Kas Kampung ${month}-${year}`,
        Author: "Sistem Kas Kampung",
        Subject: "Laporan Keuangan Bulanan",
      },
    });

    // Set header response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan-kas-${month}-${year}.pdf`,
    );

    // Pipe PDF ke response
    doc.pipe(res);

    // ========== KONTEN PDF ==========

    // Header dengan gaya
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
      .text(`Bulan: ${month} - ${year}`, { align: "center" });

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
        .text("Nama Warga", 230, tableTop)
        .text("Tipe", 340, tableTop)
        .text("Nominal", 400, tableTop);

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
            width: 100,
          })
          .text(t.nama_warga || "-", 230, rowY, { width: 100 })
          .text(t.type === "income" ? "Pemasukan" : "Pengeluaran", 340, rowY)
          .text(`Rp ${(t.amount || 0).toLocaleString("id-ID")}`, 400, rowY);

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
          `TOTAL Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")} | Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")} | Saldo: Rp ${balance.toLocaleString("id-ID")}`,
          55,
          doc.y,
          { width: 490, align: "center" },
        );
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

    doc.on("error", (err) => {
      console.error("❌ Error pada stream PDF:", err);
    });

    console.log("✅ PDF report generated successfully");
  } catch (error) {
    console.error("❌ Error di reportController:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal generate laporan", error: error.message });
    }
  }
};

// Export ke Excel (jika diperlukan)
exports.exportToExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Validasi input
    if (!month || !year) {
      return res.status(400).json({ message: "Bulan dan tahun diperlukan" });
    }

    // Ambil data transaksi
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDay}`;

    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    // Format data untuk CSV
    const csvData = transactions.map((t) => ({
      Tanggal: new Date(t.date).toLocaleDateString("id-ID"),
      "Jenis Iuran": (t.jenis_iuran || "-").replace(/_/g, " "),
      "Nama Warga": t.nama_warga || "-",
      Tipe: t.type === "income" ? "Pemasukan" : "Pengeluaran",
      Nominal: t.amount || 0,
      Keterangan: t.keterangan || "-",
    }));

    // Buat CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((h) => `"${row[h]}"`).join(",")),
    ].join("\n");

    // Set response headers
    res.setHeader("Content-Type", "text/csv;charset=utf-8;");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan-kas-${month}-${year}.csv`,
    );

    // Kirim data
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ message: error.message });
  }
};
