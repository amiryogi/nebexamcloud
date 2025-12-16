const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Base path: /api/dashboard

// @route   GET /api/dashboard/stats
// @desc    Get all dashboard statistics
router.get("/stats", dashboardController.getDashboardStats);

// @route   GET /api/dashboard/search?q=query
// @desc    Quick search for students
router.get("/search", dashboardController.quickSearch);

// @route   GET /api/dashboard/activity
// @desc    Get recent activity log
router.get("/activity", dashboardController.getRecentActivity);

module.exports = router;
