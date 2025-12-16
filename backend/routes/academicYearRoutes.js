const express = require("express");
const router = express.Router();
const academicYearController = require("../controllers/academicYearController");

// Base path: /api/academic-years

/**
 * @route   GET /api/academic-years
 * @desc    Get all academic years
 * @access  Private (protected by middleware in server.js)
 */
router.get("/", academicYearController.getAllAcademicYears);

/**
 * @route   GET /api/academic-years/current
 * @desc    Get current active academic year
 * @access  Private
 */
router.get("/current", academicYearController.getCurrentAcademicYear);

/**
 * @route   GET /api/academic-years/:id
 * @desc    Get single academic year by ID
 * @access  Private
 */
router.get("/:id", academicYearController.getAcademicYearById);

/**
 * @route   GET /api/academic-years/:id/stats
 * @desc    Get statistics for a specific academic year
 * @access  Private
 */
router.get("/:id/stats", academicYearController.getAcademicYearStats);

/**
 * @route   POST /api/academic-years
 * @desc    Create new academic year
 * @access  Private
 * @body    { year_name, start_date_bs, end_date_bs, is_current, status }
 */
router.post("/", academicYearController.createAcademicYear);

/**
 * @route   PUT /api/academic-years/:id
 * @desc    Update academic year
 * @access  Private
 * @body    { year_name, start_date_bs, end_date_bs, is_current, status }
 */
router.put("/:id", academicYearController.updateAcademicYear);

/**
 * @route   PUT /api/academic-years/:id/set-current
 * @desc    Set specific academic year as current (and unset others)
 * @access  Private
 */
router.put("/:id/set-current", academicYearController.setCurrentAcademicYear);

/**
 * @route   DELETE /api/academic-years/:id
 * @desc    Delete academic year (only if no students/exams linked)
 * @access  Private
 */
router.delete("/:id", academicYearController.deleteAcademicYear);

module.exports = router;