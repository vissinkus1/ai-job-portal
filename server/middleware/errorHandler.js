const { validationResult } = require("express-validator");

/**
 * Middleware to check express-validator results and return standardized errors.
 * Place after validator arrays in route chains:
 *   router.post("/", validators.createJob, validate, controller.create)
 */
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
                value: e.value,
            })),
        });
    }
    next();
}

/**
 * Global error handler — catches unhandled errors from all routes.
 * Must be registered AFTER all routes: app.use(globalErrorHandler)
 */
function globalErrorHandler(err, req, res, _next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            message: messages[0],
            errors: messages,
            code: "VALIDATION_ERROR",
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            message: `Duplicate value for ${field}`,
            code: "DUPLICATE_KEY",
        });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            message: "Invalid ID format",
            code: "INVALID_ID",
        });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            message: "Invalid token",
            code: "INVALID_TOKEN",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Token expired",
            code: "TOKEN_EXPIRED",
        });
    }

    // Multer file upload errors
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            message: "File too large. Maximum size is 5MB.",
            code: "FILE_TOO_LARGE",
        });
    }

    // Default — internal server error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: statusCode === 500 ? "Internal server error" : err.message,
        code: "INTERNAL_ERROR",
    });
}

module.exports = { validate, globalErrorHandler };
