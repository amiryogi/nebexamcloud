const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const upload = require("../middleware/uploadMiddleware");

// Base path: /api/students

// Create Student
router.post("/", upload.single("image"), studentController.createStudent);

// Get All Students
router.get("/", studentController.getAllStudents);

// Get Single Student
router.get("/:id", studentController.getStudentById);

// Update Student
router.put("/:id", upload.single("image"), studentController.updateStudent);

// Delete Student
// Added logging middleware to debug if request reaches here
router.delete(
  "/:id",
  (req, res, next) => {
    console.log(
      `🗑️ Route Hit: Attempting to delete student ID: ${req.params.id}`
    );
    next();
  },
  studentController.deleteStudent
);

module.exports = router;
