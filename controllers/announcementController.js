const { Announcements, User } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Get all announcements dengan filter
exports.getAnnouncements = async (req, res) => {
  try {
    const { month, year, category, search } = req.query;
    let where = {};

    // Filter by month/year
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${lastDay}`;

      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by search
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    // Ganti Announcement -> Announcements
    const announcements = await Announcements.findAll({
      where,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(announcements);
  } catch (error) {
    console.error("❌ Error in getAnnouncements:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcements.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!announcement) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }

    res.json(announcement);
  } catch (error) {
    console.error("❌ Error in getAnnouncementById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;

    let attachment = null;
    if (req.file) {
      attachment = `/uploads/announcements/${req.file.filename}`;
    }
    // Validasi
    if (!title || !date) {
      return res.status(400).json({
        message: "Title dan date wajib diisi",
        received: req.body,
      });
    }

    // Ganti Announcement -> Announcements
    const announcement = await Announcements.create({
      title,
      description: description || null,
      date,
      location: location || null,
      attachment: attachment || null,
      category: category || "umum",
      created_by: req.user.id,
    });

    // Ambil data lengkap dengan relasi
    const newAnnouncement = await Announcements.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    console.log("✅ Announcement created:", announcement.id);
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error("❌ Error in createAnnouncement:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update announcement
// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, category, existingAttachment } =
      req.body;

    console.log("📥 Update data received:", {
      title,
      description,
      date,
      location,
      category,
    });
    console.log("📥 Existing attachment:", existingAttachment);
    console.log("📥 New file:", req.file);

    // Cari announcement berdasarkan ID
    const announcement = await Announcements.findByPk(id);

    if (!announcement) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }

    // Variabel untuk menyimpan path attachment baru
    let newAttachment = announcement.attachment;

    // ===== HANDLE UPLOAD FILE =====
    if (req.file) {
      // SKENARIO 1: Ada file baru diupload
      console.log("📸 File baru diupload:", req.file.filename);

      // Hapus file lama jika ada (dari folder uploads)
      if (announcement.attachment) {
        const oldFilePath = path.join(
          __dirname,
          "../",
          announcement.attachment,
        );
        console.log("🗑️ Menghapus file lama:", oldFilePath);

        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error("❌ Gagal menghapus file lama:", err);
          } else {
            console.log("✅ File lama berhasil dihapus");
          }
        });
      }

      // Set attachment baru
      newAttachment = `/uploads/announcements/${req.file.filename}`;
    } else if (existingAttachment === "") {
      // SKENARIO 2: existingAttachment dikirim kosong (user menghapus gambar)
      console.log("🗑️ User menghapus gambar");

      // Hapus file lama jika ada
      if (announcement.attachment) {
        const oldFilePath = path.join(
          __dirname,
          "../",
          announcement.attachment,
        );
        console.log("🗑️ Menghapus file lama:", oldFilePath);

        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error("❌ Gagal menghapus file lama:", err);
          } else {
            console.log("✅ File lama berhasil dihapus");
          }
        });
      }

      // Set attachment menjadi null (tidak ada gambar)
      newAttachment = null;
    } else if (existingAttachment) {
      // SKENARIO 3: existingAttachment ada (gambar tetap sama)
      console.log("🖼️ Menggunakan gambar yang sudah ada");
      newAttachment = existingAttachment;
    }

    // Update data announcement
    await announcement.update({
      title: title || announcement.title,
      description:
        description !== undefined ? description : announcement.description,
      date: date || announcement.date,
      location: location !== undefined ? location : announcement.location,
      category: category || announcement.category,
      attachment: newAttachment, // Gunakan attachment yang sudah diproses
    });

    console.log("✅ Announcement updated:", announcement.id);

    // Ambil data updated dengan relasi
    const updatedAnnouncement = await Announcements.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({
      message: "Pengumuman berhasil diupdate",
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error("❌ Error in updateAnnouncement:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    res.status(500).json({
      message: "Gagal mengupdate pengumuman",
      error: error.message,
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Ganti Announcement -> Announcements
    const announcement = await Announcements.findByPk(id);

    if (!announcement) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }

    await announcement.destroy();
    res.json({ message: "Pengumuman berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error in deleteAnnouncement:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent announcements
exports.getRecentAnnouncements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Ganti Announcement -> Announcements
    const announcements = await Announcements.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: limit,
    });

    res.json(announcements);
  } catch (error) {
    console.error("❌ Error in getRecentAnnouncements:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const limit = parseInt(req.query.limit) || 10;

    // Ganti Announcement -> Announcements
    const announcements = await Announcements.findAll({
      where: {
        date: {
          [Op.gte]: today,
        },
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "ASC"]],
      limit: limit,
    });

    res.json(announcements);
  } catch (error) {
    console.error("❌ Error in getUpcomingEvents:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get available years untuk filter announcements
exports.getAnnouncementYears = async (req, res) => {
  try {
    const sequelize = require("sequelize");
    const { Announcements } = require("../models"); // PASTIKAN NAMA MODELNYA BENAR

    console.log("🔍 Model Announcements:", Announcements ? "ADA" : "TIDAK ADA");

    const years = await Announcements.findAll({
      attributes: [[sequelize.fn("YEAR", sequelize.col("date")), "year"]],
      group: ["year"],
      order: [[sequelize.fn("YEAR", sequelize.col("date")), "DESC"]],
      raw: true,
    });

    console.log("📊 Years from database:", years);

    // Extract year values dan kirim sebagai array
    const yearList = years.map((y) => y.year).filter((y) => y != null);

    // Jika tidak ada data, kirim tahun sekarang
    if (yearList.length === 0) {
      const currentYear = new Date().getFullYear();
      console.log("⚠️ No years found, sending current year:", currentYear);
      return res.json([currentYear]);
    }

    console.log("✅ Year list sent:", yearList);
    res.json(yearList);
  } catch (error) {
    console.error("❌ Error fetching available years:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get announcements by category
exports.getAnnouncementsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Ganti Announcement -> Announcements
    const announcements = await Announcements.findAll({
      where: { category },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });

    res.json(announcements);
  } catch (error) {
    console.error("❌ Error in getAnnouncementsByCategory:", error);
    res.status(500).json({ message: error.message });
  }
};
