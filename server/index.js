require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
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

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN, methods: ["GET", "POST"] },
});

// Make io accessible in controllers
app.set("io", io);

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(sanitize);

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

app.get("/", (req, res) => {
  res.send("Backend is running");
});

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
  console.log(`Server running on port ${PORT}`);
});

// ─── Process-level error handlers ──────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]", err);
  // Give time for logs to flush, then exit
  setTimeout(() => process.exit(1), 1000);
});
