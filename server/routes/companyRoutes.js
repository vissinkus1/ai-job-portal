const express = require("express");
const router = express.Router();
const { getCompanyProfile } = require("../controllers/companyController");

router.get("/:userId", getCompanyProfile);

module.exports = router;
