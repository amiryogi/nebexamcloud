const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Base path: /api/dashboard
// All routes are protected by middleware in server.js

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @query   academic_year_id (optional - defaults to current year)
 * @access  Private
 */
router.get("/stats", dashboardController.getDashboardStats);

/**
 * @route   GET /api/dashboard/year-comparison
 * @desc    Get comparison statistics across all academic years
 * @access  Private
 */
router.get("/year-comparison", dashboardController.getYearComparison);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get performance analytics
 * @query   academic_year_id, class_level, faculty (optional)
 * @access  Private
 */
router.get("/analytics", dashboardController.getPerformanceAnalytics);

/**
 * @route   GET /api/dashboard/search
 * @desc    Quick search for students
 * @query   q (required), academic_year_id (optional)
 * @access  Private
 */
router.get("/search", dashboardController.quickSearch);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity log
 * @query   academic_year_id (optional)
 * @access  Private
 */
router.get("/activity", dashboardController.getRecentActivity);

module.exports = router;