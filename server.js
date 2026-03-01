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
app.use("/uploads", express.static("uploads"));

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
const announcementRoutes = require("./routes/announcementRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/import", importRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/announcements", announcementRoutes);

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

    await sequelize.sync({ alter: true }); // ✅ Aman, hanya mengubah struktur tanpa hapus data
    console.log("✅ Database synced");

    // Buat data dummy - TAPI beri pengecekan agar tidak duplicate
    const User = db.User;
    const Transaction = db.Transaction;
    const Announcements = db.Announcements;

    // Cek apakah admin sudah ada
    let admin = await User.findOne({ where: { email: "admin@kampung.com" } });

    if (!admin) {
      // Buat user admin hanya jika belum ada
      admin = await User.create({
        name: "Admin",
        email: "admin@kampung.com",
        password: "admin123",
        role: "admin",
      });
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Cek apakah sudah ada data transaksi
    const transactionCount = await Transaction.count();
    if (transactionCount === 0) {
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
      console.log("✅ Data dummy transaksi dibuat");
    } else {
      console.log("✅ Data transaksi sudah ada");
    }

    // Cek apakah sudah ada data announcement
    const announcementCount = await Announcements.count();
    if (announcementCount === 0 && Announcements) {
      const now = new Date();
      const nextWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
      );
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

      // Pengumuman umum
      await Announcements.create({
        title: "Pengumuman Penting",
        description: "Informasi mengenai jadwal pembayaran iuran bulanan",
        date: now.toISOString().split("T")[0],
        location: "Sekretariat RT",
        category: "umum",
        created_by: admin.id,
      });

      // Kegiatan
      await Announcements.create({
        title: "Kerja Bakti",
        description: "Kerja bakti membersihkan selokan dan lingkungan RT",
        date: nextWeek.toISOString().split("T")[0],
        location: "Lingkungan RT 01",
        category: "kegiatan",
        created_by: admin.id,
      });

      // Keamanan
      await Announcements.create({
        title: "Rapat Keamanan Lingkungan",
        description: "Membahas sistem keamanan lingkungan dan jadwal ronda",
        date: nextMonth.toISOString().split("T")[0],
        location: "Balai Warga",
        category: "keamanan",
        created_by: admin.id,
      });

      // Iuran
      await Announcements.create({
        title: "Penyesuaian Iuran Bulanan",
        description: "Informasi mengenai perubahan besaran iuran bulanan",
        date: now.toISOString().split("T")[0],
        category: "iuran",
        created_by: admin.id,
      });

      // console.log("✅ Data dummy announcements dibuat");
    }

    console.log("📊 Models tersedia:", Object.keys(db));

    // Jalankan server
    app.listen(PORT, () => {
      // console.log(`🚀 Server running on port ${PORT}`);
      // console.log(`📝 Test di browser: http://localhost:${PORT}`);
      // console.log(`📋 API Endpoints:`);
      // console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
      // console.log(
      //   `   - Transactions: http://localhost:${PORT}/api/transactions`,
      // );
      // console.log(
      //   `   - Announcements: http://localhost:${PORT}/api/announcements`,
      // );
      // console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
      // console.log(`   - Dashboard: http://localhost:${PORT}/api/dashboard`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }

  // Setelah import routes
  console.log("✅ Auth routes loaded");
  console.log("✅ Transaction routes loaded");
  console.log("✅ Announcement routes loaded:", !!announcementRoutes);

  // Sebelum use routes
  console.log("📋 Registering routes...");
  app.use("/api/auth", authRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/announcements", announcementRoutes);
  console.log("✅ Routes registered");
}

// Panggil fungsi untuk menjalankan server
startServer();
