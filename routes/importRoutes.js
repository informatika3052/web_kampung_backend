const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const uploadExcelFile = require("../middleware/upload");
const { importExcel } = require("../controllers/importController");
const router = express.Router();

router.post(
  "/excel",
  protect,
  adminOnly,
  uploadExcelFile.uploadExcelFile,
  importExcel,
);

module.exports = router;
