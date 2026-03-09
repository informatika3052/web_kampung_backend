const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/database");

dotenv.config();

const app = express();

/**
 * ✅ CORS harus didefinisikan dengan origin tanpa trailing slash.
 *    Jangan gabung 2 URL jadi 1 string.
 */
const allowedOrigins = [
  "https://web-kampung.vercel.app",
  "https://web-kampung-c1ii02x8i-informatika3052s-projects.vercel.app",
  "http://localhost:3000",
];

const corsOptions = {
  origin(origin, callback) {
    // allow requests with no origin (curl, server-to-server, dll)
    if (!origin) return callback(null, true);

    // allow exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // (Opsional tapi berguna) izinkan preview vercel untuk project "web-kampung"
    // contoh: https://web-kampung-xxxxx.vercel.app
    if (/^https:\/\/web-kampung(-.+)?\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // credentials: true, // aktifkan kalau kamu pakai cookie/session lintas domain
};

// ✅ pasang CORS sebelum routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

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

// ✅ kompatibilitas kalau frontend kamu masih manggil tanpa /api
app.use("/announcements", announcementRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "API Kas Kampung berjalan",
    time: new Date().toISOString(),
  });
});

// Error handler (opsional: bedakan error CORS)
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  const isCors = String(err.message || "")
    .toLowerCase()
    .includes("cors");
  res.status(isCors ? 403 : 500).json({
    message: isCors ? "CORS blocked" : "Terjadi kesalahan internal server",
    error: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

startServer();
