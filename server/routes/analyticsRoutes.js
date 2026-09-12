const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getSkillTrends,
    getSalaryBySkill,
    getDemandOverTime,
    getTopCompaniesHiring,
    getMySkillMarketValue,
} = require("../controllers/analyticsController");

// Public endpoints — available to all users
router.get("/skill-trends", getSkillTrends);
router.get("/salary-by-skill", getSalaryBySkill);
router.get("/demand-over-time", getDemandOverTime);
router.get("/top-companies-hiring", getTopCompaniesHiring);

// Protected — requires login
router.get("/my-skill-market-value", auth, getMySkillMarketValue);

module.exports = router;
