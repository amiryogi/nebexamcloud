const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");

// Base path: /api/exams

// @route   GET /api/exams
// @desc    Get all exams (with optional academic_year_id filter)
router.get("/", examController.getAllExams);

// @route   GET /api/exams/:id
// @desc    Get single exam by ID with statistics
router.get("/:id", examController.getExamById);

// @route   GET /api/exams/year/:year_id/stats
// @desc    Get all exams for a specific year with statistics
router.get("/year/:year_id/stats", examController.getExamsByYearWithStats);

// @route   POST /api/exams
// @desc    Create a new exam
router.post("/", examController.createExam);

// @route   PUT /api/exams/:id
// @desc    Update an exam
router.put("/:id", examController.updateExam);

// @route   DELETE /api/exams/:id
// @desc    Delete an exam
router.delete("/:id", examController.deleteExam);

module.exports = router;
