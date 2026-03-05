const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadAnnouncementImage } = require("../middleware/upload");
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getRecentAnnouncements,
  getUpcomingEvents,
  getAnnouncementYears,
} = require("../controllers/announcementController");
const router = express.Router();

// ========== ROUTES PUBLIK (TIDAK PERLU LOGIN) ==========
// Route untuk halaman depan - tidak perlu proteksi
router.get("/recent", getRecentAnnouncements);
router.get("/years", getAnnouncementYears);
router.get("/:id", getAnnouncementById); // GET publik

// ========== ROUTES DENGAN PROTECT (HARUS LOGIN) ==========
// Semua route di bawah ini butuh login
router.use(protect);

// Route untuk mendapatkan tahun yang tersedia
router.get("/upcoming", getUpcomingEvents);

// CRUD announcements (butuh login)
router
  .route("/")
  .get(getAnnouncements)
  .post(adminOnly, uploadAnnouncementImage, createAnnouncement);

router
  .route("/:id")
  .put(adminOnly, uploadAnnouncementImage, updateAnnouncement) // TAMBAHKAN UPLOAD MIDDLEWARE
  .delete(adminOnly, deleteAnnouncement);
module.exports = router;
