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
    const monthlyData = {};

    transactions.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;

      if (jenis === "tahunan") {
        const bulan = new Date(t.date).getMonth() + 1;
        if (!monthlyData[bulan]) {
          monthlyData[bulan] = {
            pemasukan: 0,
            pengeluaran: 0,
            transactions: [],
          };
        }
        if (t.type === "income") monthlyData[bulan].pemasukan += t.amount;
        else monthlyData[bulan].pengeluaran += t.amount;
        monthlyData[bulan].transactions.push(t);
      }
    });

    const balance = totalIncome - totalExpense;

    // Buat dokumen PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      info: {
        Title: `Laporan Kas Kampung ${jenis === "tahunan" ? "Tahun " + year : "Bulan " + month + "-" + year}`,
        Author: "Sistem Kas Kampung",
        Subject: "Laporan Keuangan",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    const filename =
      jenis === "tahunan"
        ? `laporan-tahunan-${year}.pdf`
        : `laporan-bulanan-${month}-${year}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);

    // ==================== FUNGSI BANTU ====================
    // Menggambar header tabel dengan latar hijau
    function drawTableHeader(headers, startX, startY, colWidths) {
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      doc.rect(startX, startY - 5, totalWidth, 20).fill("#2e7d32");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
      let x = startX;
      headers.forEach((header, i) => {
        doc.text(header, x, startY, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });
      doc.fillColor("#000000").font("Helvetica").fontSize(9);
      return startY + 15;
    }

    // Menggambar satu baris tabel dengan latar abu-abu bergantian
    function drawTableRow(columns, startX, startY, colWidths, isEven) {
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      if (isEven) {
        doc.rect(startX, startY - 5, totalWidth, 20).fill("#f5f5f5");
      }
      let x = startX;
      columns.forEach((text, i) => {
        doc.fillColor("#000000").text(text, x, startY, {
          width: colWidths[i],
          align: "left",
          ellipsis: true, // memotong teks jika terlalu panjang
        });
        x += colWidths[i];
      });
      return startY + 20;
    }

    // Mengecek apakah ruang tersisa cukup; jika tidak, buat halaman baru
    function checkPageBreak(requiredSpace) {
      if (doc.y + requiredSpace > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        return doc.page.margins.top;
      }
      return doc.y;
    }

    // ==================== KONTEN AWAL ====================
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
        `Dibuat pada: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
        { align: "center" },
      );
    doc.moveDown(2);
    doc
      .strokeColor("#2e7d32")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // ==================== RINGKASAN (KOTAK) ====================
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#2e7d32")
      .text("RINGKASAN KEUANGAN", { underline: false });
    doc.moveDown(0.5);

    const summaryY = doc.y;
    // Pemasukan
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

    // Pengeluaran
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

    // Saldo
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

    // ==================== DETAIL TRANSAKSI ====================
    if (jenis === "tahunan") {
      // ---------- REKAP PER BULAN ----------
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
      const colWidths = [100, 100, 100, 100, 100]; // Bulan, Pemasukan, Pengeluaran, Saldo, Jumlah
      const headers = ["Bulan", "Pemasukan", "Pengeluaran", "Saldo", "Trans."];
      let currentY = drawTableHeader(headers, 50, doc.y, colWidths);
      doc.y = currentY;

      let totalPemasukanTahunan = 0,
        totalPengeluaranTahunan = 0;

      for (let i = 1; i <= 12; i++) {
        const data = monthlyData[i] || {
          pemasukan: 0,
          pengeluaran: 0,
          transactions: [],
        };
        const saldoBulan = data.pemasukan - data.pengeluaran;
        totalPemasukanTahunan += data.pemasukan;
        totalPengeluaranTahunan += data.pengeluaran;

        currentY = checkPageBreak(20);
        doc.y = currentY;
        const columns = [
          namaBulan[i - 1],
          `Rp ${data.pemasukan.toLocaleString("id-ID")}`,
          `Rp ${data.pengeluaran.toLocaleString("id-ID")}`,
          `Rp ${saldoBulan.toLocaleString("id-ID")}`,
          data.transactions.length.toString(),
        ];
        currentY = drawTableRow(columns, 50, currentY, colWidths, i % 2 === 0);
        doc.y = currentY;
      }

      // Total tahunan
      currentY = checkPageBreak(25);
      doc.y = currentY;
      doc.rect(50, doc.y - 5, 500, 25).fill("#e8f5e9");
      doc
        .fillColor("#1b5e20")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          `TOTAL TAHUN ${year}: Pemasukan Rp ${totalPemasukanTahunan.toLocaleString("id-ID")} | ` +
            `Pengeluaran Rp ${totalPengeluaranTahunan.toLocaleString("id-ID")} | ` +
            `Saldo Rp ${(totalPemasukanTahunan - totalPengeluaranTahunan).toLocaleString("id-ID")}`,
          55,
          doc.y,
          { width: 490, align: "center" },
        );
      doc.moveDown(2);

      // ---------- DETAIL PER BULAN ----------
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#2e7d32")
        .text("DETAIL TRANSAKSI PER BULAN", { underline: false });
      doc.moveDown(1);

      const detailColWidths = [80, 120, 120, 60, 100]; // Tanggal, Jenis Iuran, Nama Warga, Tipe, Nominal
      const detailHeaders = [
        "Tanggal",
        "Jenis Iuran",
        "Nama Warga",
        "Tipe",
        "Nominal",
      ];

      for (let i = 1; i <= 12; i++) {
        const data = monthlyData[i];
        if (data && data.transactions.length > 0) {
          doc.y = checkPageBreak(30);
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#1b5e20")
            .text(namaBulan[i - 1]);
          doc.moveDown(0.5);

          let detailY = drawTableHeader(
            detailHeaders,
            50,
            doc.y,
            detailColWidths,
          );
          doc.y = detailY;

          data.transactions.forEach((t, idx) => {
            detailY = checkPageBreak(20);
            doc.y = detailY;
            const columns = [
              new Date(t.date).toLocaleDateString("id-ID"),
              (t.jenis_iuran || "-").replace(/_/g, " "),
              t.nama_warga || "-",
              t.type === "income" ? "Pemasukan" : "Pengeluaran",
              `Rp ${(t.amount || 0).toLocaleString("id-ID")}`,
            ];
            detailY = drawTableRow(
              columns,
              50,
              detailY,
              detailColWidths,
              idx % 2 === 0,
            );
            doc.y = detailY;
          });
          doc.moveDown(1);
        }
      }
    } else {
      // ---------- LAPORAN BULANAN ----------
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
        const colWidths = [80, 120, 120, 60, 100];
        const headers = [
          "Tanggal",
          "Jenis Iuran",
          "Nama Warga",
          "Tipe",
          "Nominal",
        ];
        let currentY = drawTableHeader(headers, 50, doc.y, colWidths);
        doc.y = currentY;

        transactions.forEach((t, idx) => {
          currentY = checkPageBreak(20);
          doc.y = currentY;
          const columns = [
            new Date(t.date).toLocaleDateString("id-ID"),
            (t.jenis_iuran || "-").replace(/_/g, " "),
            t.nama_warga || "-",
            t.type === "income" ? "Pemasukan" : "Pengeluaran",
            `Rp ${(t.amount || 0).toLocaleString("id-ID")}`,
          ];
          currentY = drawTableRow(
            columns,
            50,
            currentY,
            colWidths,
            idx % 2 === 0,
          );
          doc.y = currentY;
        });

        currentY = checkPageBreak(25);
        doc.y = currentY;
        doc.rect(50, doc.y - 5, 500, 25).fill("#e8f5e9");
        doc
          .fillColor("#1b5e20")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            `TOTAL: Pemasukan Rp ${totalIncome.toLocaleString("id-ID")} | ` +
              `Pengeluaran Rp ${totalExpense.toLocaleString("id-ID")} | ` +
              `Saldo Rp ${balance.toLocaleString("id-ID")}`,
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

    // Footer dengan total (sesuaikan jumlah kolom)
    csvContent += "\n";
    csvContent += `"TOTAL PEMASUKAN",,,,${totalIncome}\n`;
    csvContent += `"TOTAL PENGELUARAN",,,,${totalExpense}\n`;
    csvContent += `"SALDO AKHIR",,,,${balance}\n`;

    // Set response headers dengan format yang benar
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    // Kirim data
    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    // Pastikan response belum terkirim sebelum mengirim error
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message });
    }
  }
};
