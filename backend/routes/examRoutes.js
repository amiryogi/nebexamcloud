const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");

// Base path: /api/exams

// IMPORTANT: Specific routes must come BEFORE parameterized routes

/**
 * @route   GET /api/exams/year/:year_id/stats
 * @desc    Get all exams for a specific year with statistics
 * @access  Private
 */
router.get("/year/:year_id/stats", examController.getExamsByYearWithStats);

/**
 * @route   GET /api/exams/stats/summary
 * @desc    Get exam statistics summary (for dashboard)
 * @query   academic_year_id (optional)
 * @access  Private
 */
router.get("/stats/summary", examController.getExamStatsSummary);

/**
 * @route   GET /api/exams
 * @desc    Get all exams (with optional filters)
 * @query   academic_year_id, class_level, faculty
 * @access  Private
 */
router.get("/", examController.getAllExams);

/**
 * @route   GET /api/exams/:id
 * @desc    Get single exam by ID with statistics
 * @access  Private
 */
router.get("/:id", examController.getExamById);

/**
 * @route   POST /api/exams
 * @desc    Create a new exam
 * @body    { exam_name, exam_date, academic_year_id?, class_level, faculty?, is_final, remarks? }
 * @access  Private
 */
router.post("/", examController.createExam);

/**
 * @route   PUT /api/exams/:id
 * @desc    Update an exam
 * @body    { exam_name, exam_date, academic_year_id?, class_level, faculty?, is_final, remarks? }
 * @access  Private
 */
router.put("/:id", examController.updateExam);

/**
 * @route   DELETE /api/exams/:id
 * @desc    Delete an exam
 * @access  Private
 */
router.delete("/:id", examController.deleteExam);

module.exports = router;