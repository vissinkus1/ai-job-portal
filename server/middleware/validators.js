const { body, param, query } = require("express-validator");

/**
 * Centralized validation schemas for all API endpoints.
 * Usage: router.post("/route", validators.createJob, handler)
 */

// ─── Job Validation ──────────────────────────────────────────────

exports.createJob = [
    body("title")
        .trim()
        .notEmpty().withMessage("Job title is required")
        .isLength({ min: 3, max: 150 }).withMessage("Title must be 3-150 characters"),
    body("company")
        .trim()
        .notEmpty().withMessage("Company name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Company name must be 2-100 characters"),
    body("location")
        .trim()
        .notEmpty().withMessage("Location is required"),
    body("type")
        .optional()
        .isIn(["Full-time", "Part-time", "Remote", "Contract", "Internship"])
        .withMessage("Invalid job type"),
    body("experienceLevel")
        .optional()
        .isIn(["Entry", "Mid", "Senior", "Lead"])
        .withMessage("Invalid experience level"),
    body("description")
        .trim()
        .notEmpty().withMessage("Job description is required")
        .isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    body("skills")
        .optional()
        .isArray().withMessage("Skills must be an array"),
    body("skills.*")
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage("Each skill must be 1-50 characters"),
    body("salary")
        .optional()
        .trim(),
    body("deadline")
        .optional()
        .isISO8601().withMessage("Deadline must be a valid date"),
];

exports.updateJob = [
    param("id")
        .isMongoId().withMessage("Invalid job ID"),
    body("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 150 }).withMessage("Title must be 3-150 characters"),
    body("company")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Company name must be 2-100 characters"),
    body("type")
        .optional()
        .isIn(["Full-time", "Part-time", "Remote", "Contract", "Internship"])
        .withMessage("Invalid job type"),
    body("experienceLevel")
        .optional()
        .isIn(["Entry", "Mid", "Senior", "Lead"])
        .withMessage("Invalid experience level"),
    body("description")
        .optional()
        .trim()
        .isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
];

// ─── Application Validation ─────────────────────────────────────

exports.applyToJob = [
    param("jobId")
        .isMongoId().withMessage("Invalid job ID"),
    body("coverLetter")
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage("Cover letter must be under 5000 characters"),
];

exports.updateApplicationStatus = [
    param("id")
        .isMongoId().withMessage("Invalid application ID"),
    body("status")
        .notEmpty().withMessage("Status is required")
        .isIn(["pending", "reviewed", "accepted", "rejected"])
        .withMessage("Status must be one of: pending, reviewed, accepted, rejected"),
];

exports.updateApplicationNotes = [
    param("id")
        .isMongoId().withMessage("Invalid application ID"),
    body("notes")
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage("Notes must be under 2000 characters"),
];

// ─── Chat Validation ────────────────────────────────────────────

exports.sendMessage = [
    param("userId")
        .isMongoId().withMessage("Invalid user ID"),
    body("content")
        .trim()
        .notEmpty().withMessage("Message cannot be empty")
        .isLength({ max: 5000 }).withMessage("Message must be under 5000 characters"),
    body("jobId")
        .optional()
        .isMongoId().withMessage("Invalid job ID"),
];

// ─── Interview Validation ───────────────────────────────────────

exports.scheduleInterview = [
    body("applicationId")
        .isMongoId().withMessage("Invalid application ID"),
    body("dateTime")
        .notEmpty().withMessage("Date and time are required")
        .isISO8601().withMessage("Invalid date format"),
    body("meetingLink")
        .optional()
        .trim()
        .isURL({ require_protocol: true }).withMessage("Meeting link must be a valid URL"),
    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters"),
];

exports.updateInterview = [
    param("id")
        .isMongoId().withMessage("Invalid interview ID"),
    body("status")
        .optional()
        .isIn(["scheduled", "completed", "cancelled"])
        .withMessage("Status must be one of: scheduled, completed, cancelled"),
    body("dateTime")
        .optional()
        .isISO8601().withMessage("Invalid date format"),
    body("meetingLink")
        .optional()
        .trim(),
    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters"),
];

// ─── Job Alert Validation ───────────────────────────────────────

exports.createAlert = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage("Alert name must be 1-100 characters"),
    body("keywords")
        .optional()
        .isArray({ max: 10 }).withMessage("Keywords must be an array (max 10)"),
    body("keywords.*")
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }),
    body("skills")
        .optional()
        .isArray({ max: 20 }).withMessage("Skills must be an array (max 20)"),
    body("locations")
        .optional()
        .isArray({ max: 10 }).withMessage("Locations must be an array (max 10)"),
    body("jobTypes")
        .optional()
        .isArray().withMessage("Job types must be an array"),
    body("jobTypes.*")
        .optional()
        .isIn(["Full-time", "Part-time", "Remote", "Contract", "Internship"]),
    body("experienceLevels")
        .optional()
        .isArray(),
    body("experienceLevels.*")
        .optional()
        .isIn(["Entry", "Mid", "Senior", "Lead"]),
    body("emailNotify")
        .optional()
        .isBoolean().withMessage("emailNotify must be a boolean"),
];

exports.updateAlert = [
    param("id")
        .isMongoId().withMessage("Invalid alert ID"),
    ...exports.createAlert,
    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean"),
];

// ─── Report Validation ──────────────────────────────────────────

exports.createReport = [
    body("jobId")
        .isMongoId().withMessage("Invalid job ID"),
    body("reason")
        .notEmpty().withMessage("Reason is required")
        .isIn(["spam", "misleading", "inappropriate", "other"])
        .withMessage("Reason must be one of: spam, misleading, inappropriate, other"),
    body("details")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Details must be under 1000 characters"),
];

// ─── Profile Validation ─────────────────────────────────────────

exports.updateProfile = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
    body("bio")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Bio must be under 1000 characters"),
    body("phone")
        .optional()
        .trim(),
    body("skills")
        .optional()
        .isArray({ max: 50 }).withMessage("Skills must be an array (max 50)"),
    body("skills.*")
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }),
];

// ─── Search Validation ──────────────────────────────────────────

exports.searchJobs = [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be 1-50"),
    query("search")
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage("Search term too long"),
];

// ─── Mongo ID param validator ───────────────────────────────────

exports.mongoId = (paramName = "id") => [
    param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName}`),
];
