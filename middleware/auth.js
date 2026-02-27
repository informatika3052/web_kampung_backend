const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Anda belum login" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!req.user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses khusus admin" });
  }
  next();
};
