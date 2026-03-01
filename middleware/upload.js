const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pastikan folder uploads ada
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Buat subfolder untuk announcements
const announcementsDir = path.join(uploadDir, "announcements");
if (!fs.existsSync(announcementsDir)) {
  fs.mkdirSync(announcementsDir);
}

// Konfigurasi storage untuk berbagai jenis upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan folder berdasarkan jenis file atau tujuan
    if (file.fieldname === "attachment") {
      // Untuk upload gambar pengumuman
      cb(null, announcementsDir);
    } else if (file.fieldname === "file" || file.fieldname === "importFile") {
      // Untuk upload file Excel (import)
      cb(null, uploadDir);
    } else {
      // Default
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Simpan dengan nama field + timestamp agar lebih terorganisir
    const prefix = file.fieldname === "attachment" ? "announcement" : "file";
    cb(null, prefix + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter file berdasarkan fieldname
const fileFilter = (req, file, cb) => {
  // Untuk field "attachment" (gambar pengumuman)
  if (file.fieldname === "attachment") {
    const allowedImages = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedImages.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format gambar tidak didukung. Gunakan .jpg, .jpeg, .png, .gif, atau .webp",
        ),
        false,
      );
    }
  }
  // Untuk field "file" atau "importFile" (Excel import)
  else if (file.fieldname === "file" || file.fieldname === "importFile") {
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
  } else {
    // Jika fieldname tidak dikenal, reject
    cb(new Error("Field file tidak dikenal"), false);
  }
};

// Buat dua instance upload untuk kebutuhan berbeda
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maks 5MB
});

// Export dengan fungsi khusus untuk setiap kebutuhan
module.exports = {
  // Untuk upload gambar pengumuman (attachment)
  uploadAnnouncementImage: upload.single("attachment"),

  // Untuk upload file Excel (import)
  uploadExcelFile: upload.single("file"),

  // Untuk multiple file upload jika diperlukan
  uploadMultiple: upload.array("files", 5),

  // Middleware umum (bisa digunakan dengan fieldname dinamis)
  uploadSingle: (fieldName) => upload.single(fieldName),
};
