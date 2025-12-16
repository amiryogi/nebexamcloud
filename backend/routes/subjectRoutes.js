const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");

// @route   GET /api/subjects
// @desc    Get all subjects (supports filters)
router.get("/", subjectController.getAllSubjects);

// @route   POST /api/subjects
// @desc    Create a new subject
router.post("/", subjectController.createSubject);

// @route   PUT /api/subjects/:id
// @desc    Update a subject
router.put("/:id", subjectController.updateSubject);

// @route   DELETE /api/subjects/:id
// @desc    Delete a subject
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
