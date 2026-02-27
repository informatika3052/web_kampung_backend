const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pastikan folder uploads ada
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = [".xlsx", ".xls", ".csv"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv"),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maks 5MB
});

module.exports = upload;
