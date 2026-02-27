const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAvailableYears, // <-- Import fungsi baru
} = require("../controllers/transactionController");
const router = express.Router();

// Route untuk mendapatkan tahun-tahun yang tersedia
router.get("/years", getAvailableYears);

router
  .route("/")
  .get(protect, getTransactions)
  .post(protect, adminOnly, createTransaction);

router
  .route("/:id")
  .put(protect, adminOnly, updateTransaction)
  .delete(protect, adminOnly, deleteTransaction);

module.exports = router;
