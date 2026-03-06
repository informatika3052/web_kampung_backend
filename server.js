const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/database");
const db = require("./models");

dotenv.config();

const app = express();
// ✅ KONFIGURASI CORS YANG LEBIH LENGKAP
const corsOptions = {
  origin: ["https://web-kampung.vercel.app", "http://localhost:3000"], // domain frontend
  credentials: true, // izinkan cookie/auth headers
  optionsSuccessStatus: 200, // untuk browser legacy
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

app.use(cors(corsOptions));

// ✅ TANGANI OPTIONS REQUEST SECARA EKSPLISIT
app.options("*", cors(corsOptions)); // preflight untuk semua route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

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

const net = require("net");
const testConnection = (host, port) => {
  const socket = net.createConnection(port, host, () => {
    console.log(`✅ TCP connection to ${host}:${port} successful`);
    socket.end();
  });
  socket.on("error", (err) => {
    console.error(`❌ TCP connection to ${host}:${port} failed:`, err.message);
  });
};
// Panggil setelah mendapatkan host dan port
if (process.env.MYSQLHOST && process.env.MYSQLPORT) {
  testConnection(process.env.MYSQLHOST, parseInt(process.env.MYSQLPORT));
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    const [tables] = await sequelize.query("SHOW TABLES");
    console.log("📂 Tables:", tables);

    // jalankan server
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);

      console.log("DB:", process.env.MYSQLDATABASE);
      console.log("HOST:", process.env.MYSQLHOST);
      console.log("USER:", process.env.MYSQLUSER);
      console.log("PORT:", process.env.MYSQLPORT);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

startServer();
