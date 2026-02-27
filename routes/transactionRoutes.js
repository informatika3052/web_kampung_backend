const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAvailableYears,
  getTransactionsByType,
  getTransactionById,
  getWargaList,
  getRecentTransactions,
  getPemasukan,
  getTotalPemasukan,
  getPengeluaran,
  getTotalPengeluaran,
} = require("../controllers/transactionController");
const router = express.Router();

// Protect semua routes
router.use(protect);

// Route untuk mendapatkan tahun-tahun yang tersedia
router.get("/years", getAvailableYears);

// Route untuk mendapatkan daftar warga
router.get("/warga-list", getWargaList);

// Route untuk transaksi terbaru
router.get("/recent", getRecentTransactions);

// Route untuk transaksi by type
router.get("/by-type", getTransactionsByType);

// Route khusus untuk pemasukan
router.get("/pemasukan", getPemasukan);

router.get("/pemasukan/total", getTotalPemasukan);

// Route khusus untuk pengeluaran
router.get("/pengeluaran", getPengeluaran);

router.get("/pengeluaran/total", getTotalPengeluaran);

router.route("/").get(getTransactions).post(adminOnly, createTransaction);

router
  .route("/:id")
  .get(getTransactionById)
  .put(adminOnly, updateTransaction)
  .delete(adminOnly, deleteTransaction);

module.exports = router;
