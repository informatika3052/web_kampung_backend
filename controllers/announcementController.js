const { Announcements, User } = require("../models");
const { Op } = require("sequelize");

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

    // Ganti Announcement -> Announcements
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
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, attachment, category } =
      req.body;

    // Ganti Announcement -> Announcements
    const announcement = await Announcements.findByPk(id);

    if (!announcement) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }

    await announcement.update({
      title: title || announcement.title,
      description:
        description !== undefined ? description : announcement.description,
      date: date || announcement.date,
      location: location !== undefined ? location : announcement.location,
      attachment:
        attachment !== undefined ? attachment : announcement.attachment,
      category: category || announcement.category,
    });

    const updatedAnnouncement = await Announcements.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error("❌ Error in updateAnnouncement:", error);
    res.status(500).json({ message: error.message });
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

// Get available years
exports.getAnnouncementYears = async (req, res) => {
  try {
    const sequelize = require("sequelize");

    // Ganti Announcement -> Announcements
    const years = await Announcements.findAll({
      attributes: [[sequelize.fn("YEAR", sequelize.col("date")), "year"]],
      group: ["year"],
      order: [[sequelize.fn("YEAR", sequelize.col("date")), "DESC"]],
      raw: true,
    });

    const yearList = years.map((y) => y.year).filter((y) => y);
    res.json(yearList);
  } catch (error) {
    console.error("Error fetching available years:", error);
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
