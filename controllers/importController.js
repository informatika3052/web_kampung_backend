const XLSX = require("xlsx");
const { Transaction } = require("../models/Transaction");
const fs = require("fs");

exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diupload" });
    }

    const filePath = req.file.path;

    // Baca file Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validasi dan konversi data
    const transactions = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Konversi tanggal Excel ke format YYYY-MM-DD
        let date = row.tanggal || row.date;
        if (typeof date === "number") {
          // Excel date serial number
          const jsDate = XLSX.SSF.parse_date_code(date);
          date = `${jsDate.y}-${String(jsDate.m).padStart(2, "0")}-${String(jsDate.d).padStart(2, "0")}`;
        }

        // Validasi data
        if (!date || !row.deskripsi || !row.jumlah || !row.tipe) {
          errors.push(`Baris ${i + 2}: Data tidak lengkap`);
          continue;
        }

        const type = row.tipe.toLowerCase();
        if (
          type !== "income" &&
          type !== "expense" &&
          type !== "pemasukan" &&
          type !== "pengeluaran"
        ) {
          errors.push(
            `Baris ${i + 2}: Tipe harus income/expense atau pemasukan/pengeluaran`,
          );
          continue;
        }

        transactions.push({
          date: date,
          description: row.deskripsi,
          amount: parseInt(row.jumlah),
          type:
            type === "pemasukan" || type === "income" ? "income" : "expense",
        });
      } catch (err) {
        errors.push(`Baris ${i + 2}: Format data salah`);
      }
    }

    if (errors.length > 0) {
      // Hapus file jika ada error
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "Terdapat kesalahan dalam file",
        errors,
      });
    }

    // Simpan ke database
    await Transaction.bulkCreate(transactions);

    // Hapus file setelah sukses
    fs.unlinkSync(filePath);

    res.json({
      message: "Data berhasil diimport",
      count: transactions.length,
    });
  } catch (error) {
    // Hapus file jika terjadi error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};
