const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Base path: /api/reports

// 1. Single Student Gradesheet
// Endpoint: /api/reports/student/1
router.get("/student/:id", reportController.getStudentGradesheet);

// 2. Batch Class Gradesheets
// Endpoint: /api/reports/class/11
router.get("/class/:class_level", reportController.getClassGradesheets);

// 3. Backward Compatibility (For older frontend links if any)
// Endpoint: /api/reports/gradesheet/1
router.get("/gradesheet/:id", reportController.getStudentGradesheet);

module.exports = router;
