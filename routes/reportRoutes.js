const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateMonthlyReport,
  generateYearlyReport,
  exportToExcel,
} = require("../controllers/reportController");
const router = express.Router();

router.use(protect);

router.get("/monthly", generateMonthlyReport);
router.get("/yearly", generateYearlyReport);
router.get("/excel", exportToExcel);

module.exports = router;
