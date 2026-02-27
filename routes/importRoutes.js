const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { importExcel } = require("../controllers/importController");
const router = express.Router();

router.post("/excel", protect, adminOnly, upload.single("file"), importExcel);

module.exports = router;
