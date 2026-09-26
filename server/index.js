require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const logger = require("./config/logger");
const connectDB = require("./config/db");
const sanitize = require("./middleware/sanitize");
const { globalErrorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const companyRoutes = require("./routes/companyRoutes");
const publicRoutes = require("./routes/publicRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const jobAlertRoutes = require("./routes/jobAlertRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const resumeScoreRoutes = require("./routes/resumeScoreRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
const server = http.createServer(app);

const rawOrigins = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

const corsOriginHandler = (origin, callback) => {
  // Allow requests without origin (curl, mobile, same-origin)
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  // Allow localhost origins during development
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  return callback(null, true); // Fallback: allow request to avoid blocking in dynamic staging
};

const io = new Server(server, {
  cors: { origin: corsOriginHandler, methods: ["GET", "POST"], credentials: true },
});

// Make io accessible in controllers
app.set("io", io);

// ─── Security ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving uploaded files cross-origin
}));

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: corsOriginHandler, credentials: true }));
app.use(express.json({ limit: "10kb" }));          // Body size limit
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(sanitize);

// ─── HTTP Request Logging (Morgan → Winston) ──────────────────
const morganStream = { write: (message) => logger.http(message.trim()) };
app.use(morgan("short", { stream: morganStream }));

// Rate limiting — separate tiers for different auth actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // More generous for verification flows
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes(authLimiter, verifyLimiter));
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/job-alerts", jobAlertRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/resume-score", resumeScoreRoutes);
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Serve static client assets in production if built
const clientDistPath = path.join(__dirname, "../Client/dist");
if (require("fs").existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Express 5 compatible catch-all for SPA client routing
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    const indexPath = path.join(clientDistPath, "index.html");
    if (require("fs").existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  app.get("/", (req, res) => {
    res.send("Backend is running");
  });
}

// Global error handler (must be AFTER all routes)
app.use(globalErrorHandler);

// Socket.io
const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
  });

  socket.on("sendMessage", (data) => {
    const { receiverId } = data;
    io.to(receiverId).emit("newMessage", data);
  });

  socket.on("typing", (data) => {
    io.to(data.receiverId).emit("userTyping", {
      senderId: data.senderId,
    });
  });

  socket.on("stopTyping", (data) => {
    io.to(data.receiverId).emit("userStopTyping", {
      senderId: data.senderId,
    });
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// ─── Process-level error handlers ──────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  // Give time for logs to flush, then exit
  setTimeout(() => process.exit(1), 1000);
});
