const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadAnnouncementImage } = require("../middleware/upload"); // Import spesifik
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

router.use(protect);

// Route untuk membuat pengumuman dengan upload gambar
router
  .route("/")
  .get(getAnnouncements)
  .post(adminOnly, uploadAnnouncementImage, createAnnouncement); // Gunakan uploadAnnouncementImage

router.get("/years", getAnnouncementYears);
router.get("/recent", getRecentAnnouncements);
router.get("/upcoming", getUpcomingEvents);

router
  .route("/:id")
  .get(getAnnouncementById)
  .put(adminOnly, updateAnnouncement)
  .delete(adminOnly, deleteAnnouncement);

module.exports = router;
