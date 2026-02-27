const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/database");

// Import models - pastikan pathnya benar
const db = require("./models"); // Ini akan membaca models/index.js

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

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/import", importRoutes);

app.get("/api/test-pdf", (req, res) => {
  console.log("Test PDF endpoint dipanggil");
  try {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=test.pdf");
    doc.pipe(res);
    doc.fontSize(25).text("Hello World! Ini test PDF", 100, 100);
    doc.end();
    console.log("Test PDF sukses");
  } catch (err) {
    console.error("Test PDF error:", err);
    res.status(500).json({ error: err.message });
  }
});
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "API Kas Kampung berjalan",
    time: new Date().toISOString(),
  });
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

// Test koneksi database
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected...");

    // Sync database
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("✅ Database synced");
    console.log("📊 Models tersedia:", Object.keys(db));
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
