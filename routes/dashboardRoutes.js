const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getSummary,
  getGrafik6Bulan,
  getRecentTransactions, // Tambahkan ini
} = require("../controllers/dashboardController");
const router = express.Router();

router.use(protect);

router.get("/summary", getSummary);
router.get("/grafik-6-bulan", getGrafik6Bulan);
router.get("/recent-transactions", getRecentTransactions); // Route ini

module.exports = router;
