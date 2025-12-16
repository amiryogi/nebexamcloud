const db = require("../config/db");

// @desc    Get all exams
// @route   GET /api/exams
const getAllExams = async (req, res) => {
  try {
    const [exams] = await db.query(
      "SELECT * FROM exams ORDER BY exam_date DESC"
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
const createExam = async (req, res) => {
  try {
    const { exam_name, exam_date, is_final } = req.body;

    if (!exam_name || !exam_date) {
      return res
        .status(400)
        .json({ message: "Exam name and date are required" });
    }

    const [result] = await db.query(
      "INSERT INTO exams (exam_name, exam_date, is_final) VALUES (?, ?, ?)",
      [exam_name, exam_date, is_final || false]
    );

    res.status(201).json({
      message: "Exam created",
      examId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllExams, createExam };
