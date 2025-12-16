const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/studentPromotionController");

// All routes are protected by middleware in server.js

/**
 * @route   GET /api/students/promote/summary
 * @desc    Get promotion summary (counts and preview)
 * @query   current_year_id, next_year_id
 */
router.get("/summary", promotionController.getPromotionSummary);

/**
 * @route   POST /api/students/promote/to-class-12
 * @desc    Promote Class 11 students to Class 12
 * @body    { student_ids: [1,2,3], new_academic_year_id: 2 }
 */
router.post("/to-class-12", promotionController.promoteToClass12);

/**
 * @route   POST /api/students/promote/graduate
 * @desc    Graduate Class 12 students
 * @body    { student_ids: [1,2,3], graduation_date: '2024-04-15' }
 */
router.post("/graduate", promotionController.graduateStudents);

/**
 * @route   POST /api/students/promote/rollback
 * @desc    Rollback promotion (Class 12 → Class 11)
 * @body    { student_ids: [1,2,3], previous_academic_year_id: 1 }
 */
router.post("/rollback", promotionController.rollbackPromotion);

module.exports = router;
