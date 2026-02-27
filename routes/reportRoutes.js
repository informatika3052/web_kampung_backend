const express = require("express");
const { protect } = require("../middleware/auth");
const { generateMonthlyReport } = require("../controllers/reportController");
const router = express.Router();

router.get("/monthly", protect, generateMonthlyReport);

module.exports = router;
