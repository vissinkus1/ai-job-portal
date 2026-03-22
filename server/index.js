require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");
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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Make io accessible in controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/company", companyRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

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
