const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// @route   GET /api/attendance
// @desc    Get attendance sheet (requires query params: date, class_level, faculty)
router.get("/", attendanceController.getAttendance);

// @route   POST /api/attendance
// @desc    Save bulk attendance
router.post("/", attendanceController.saveAttendance);

module.exports = router;
