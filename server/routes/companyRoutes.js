const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { roleGuard } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
    createOrUpdateCompany,
    getMyCompany,
    getCompanyById,
    getCompanyByOwner,
    uploadLogo,
    deleteCompany,
} = require("../controllers/companyController");

// Employer-only routes
router.post("/", auth, roleGuard(["employer"]), createOrUpdateCompany);
router.get("/me", auth, roleGuard(["employer"]), getMyCompany);
router.post("/logo", auth, roleGuard(["employer"]), upload.single("logo"), uploadLogo);
router.delete("/", auth, roleGuard(["employer"]), deleteCompany);

// Public routes
router.get("/by-owner/:userId", getCompanyByOwner);
router.get("/:id", getCompanyById);

module.exports = router;
