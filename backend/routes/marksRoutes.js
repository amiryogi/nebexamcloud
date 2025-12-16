const express = require("express");
const router = express.Router();
const marksController = require("../controllers/marksController");

router.post("/bulk", marksController.enterBulkMarks);
router.get("/:examId/:subjectId", marksController.getMarksByExamAndSubject);

module.exports = router;
