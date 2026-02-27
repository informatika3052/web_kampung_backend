const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/database");

// Import models
const db = require("./models");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging semua request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const importRoutes = require("./routes/importRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/import", importRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "API Kas Kampung berjalan",
    time: new Date().toISOString(),
  });
});

app.get("/api/test-pdf", (req, res) => {
  try {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=test.pdf");
    doc.pipe(res);
    doc.fontSize(25).text("Hello World! Ini test PDF", 100, 100);
    doc.end();
  } catch (err) {
    console.error("Test PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    message: "Terjadi kesalahan internal server",
    error: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

// ========== INI BAGIAN PENTING YANG HARUS ADA ==========
const PORT = process.env.PORT || 5000;

// Jalankan server dan koneksi database
async function startServer() {
  try {
    // Test koneksi database
    await sequelize.authenticate();
    console.log("✅ Database connected...");

    // Sync database dengan force (untuk development)
    await sequelize.sync({ force: true });
    console.log("✅ Database synced");

    // Buat data dummy
    const User = require("./models/User");
    const Transaction = require("./models/Transaction");

    // Buat user admin
    const admin = await User.create({
      name: "Admin",
      email: "admin@kampung.com",
      password: "admin123",
      role: "admin",
    });

    // Buat data transaksi dummy untuk 6 bulan terakhir
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const tanggal = date.toISOString().split("T")[0];

      // Pemasukan
      await Transaction.create({
        date: tanggal,
        jenis_iuran: "kas_bulanan",
        nama_warga: "Budi Santoso",
        amount: 50000,
        type: "income",
        keterangan: "Iuran bulanan",
        created_by: admin.id,
      });

      // Pengeluaran
      await Transaction.create({
        date: tanggal,
        jenis_iuran: "kas_sosial",
        nama_warga: "RT 01",
        amount: 25000,
        type: "expense",
        keterangan: "Beli snack",
        created_by: admin.id,
      });
    }

    console.log("✅ Data dummy dibuat");
    console.log("📊 Models tersedia:", Object.keys(db));

    // Jalankan server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Test di browser: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
}

// Panggil fungsi untuk menjalankan server
startServer();
