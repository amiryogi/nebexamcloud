const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/db");

// Import Middleware
const { protect } = require("./middleware/authMiddleware");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const subjectRoutes = require("./routes/subjectRoutes");
const examRoutes = require("./routes/examRoutes");
const marksRoutes = require("./routes/marksRoutes");
const reportRoutes = require("./routes/reportRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const schoolSettingsRoutes = require("./routes/schoolSettingsRoutes");
const academicYearRoutes = require("./routes/academicYearRoutes"); // NEW - Phase 2
const promotionRoutes = require("./routes/studentPromotionRoutes");
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folders for Uploads
app.use("/uploads", express.static("uploads"));

// --- API Routes ---

// 1. Public Routes (No Token Required)
app.use("/api/auth", authRoutes);

// 2. Protected Routes (Token Required)
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/students", protect, studentRoutes);
app.use("/api/students/promote", protect, promotionRoutes); // 🆕 NEW - Must come BEFORE /api/students
app.use("/api/subjects", protect, subjectRoutes);
app.use("/api/exams", protect, examRoutes);
app.use("/api/marks", protect, marksRoutes);
app.use("/api/reports", protect, reportRoutes);
app.use("/api/attendance", protect, attendanceRoutes);
app.use("/api/school-settings", protect, schoolSettingsRoutes);
app.use("/api/academic-years", protect, academicYearRoutes); // NEW - Phase 2

// Basic Route to Test Server
app.get("/", (req, res) => {
  res.send("NEB Student Management API is running...");
});

// Test Database Connection
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS solution");
    res.json({
      message: "Database connected successfully",
      result: rows[0].solution,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res
      .status(500)
      .json({ message: "Database connection failed", error: error.message });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (err instanceof require("multer").MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      message: err.message,
    });
  }

  // Handle custom errors
  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(
    `🏫 School Settings API: http://localhost:${PORT}/api/school-settings`
  );
  console.log(
    `📅 Academic Years API: http://localhost:${PORT}/api/academic-years`
  );
});
