const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/profileController");
const { uploadAvatar, deleteAvatar } = require("../controllers/avatarController");

// Image upload config for profile pictures
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, GIF, WebP) are allowed"), false);
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// All profile routes are protected
router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);

// Avatar routes
router.post("/avatar", auth, avatarUpload.single("avatar"), uploadAvatar);
router.delete("/avatar", auth, deleteAvatar);

module.exports = router;
