const db = require("../config/db");
const { calculateFinalSubjectGrade } = require("../utils/gpaCalculator");

// @desc    Enter Marks (Bulk)
// @route   POST /api/marks/bulk
const enterBulkMarks = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { exam_id, subject_id, marks_data } = req.body;
    // marks_data expects: [ { student_id: 1, theory: 50, practical: 20 }, ... ]

    // 1. Get Subject Max Marks for Validation
    const [subjects] = await connection.query(
      "SELECT * FROM subjects WHERE id = ?",
      [subject_id]
    );
    if (subjects.length === 0) throw new Error("Subject not found");

    const subject = subjects[0];

    // 2. Loop through and process marks
    for (const entry of marks_data) {
      const { student_id, theory, practical } = entry;

      // Basic Validation
      if (theory > subject.theory_full_marks) {
        throw new Error(
          `Theory marks for student ${student_id} exceed limit (${subject.theory_full_marks})`
        );
      }
      if (practical > subject.practical_full_marks) {
        throw new Error(
          `Practical marks for student ${student_id} exceed limit (${subject.practical_full_marks})`
        );
      }

      // Calculate Grade & Point immediately
      const { grade, point } = calculateFinalSubjectGrade(
        theory,
        subject.theory_full_marks,
        practical,
        subject.practical_full_marks
      );

      // Upsert (Insert or Update if exists)
      const query = `
                INSERT INTO marks 
                (exam_id, student_id, subject_id, theory_obtained, practical_obtained, grade_point, final_grade)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                theory_obtained = VALUES(theory_obtained),
                practical_obtained = VALUES(practical_obtained),
                grade_point = VALUES(grade_point),
                final_grade = VALUES(final_grade)
            `;

      await connection.query(query, [
        exam_id,
        student_id,
        subject_id,
        theory,
        practical,
        point,
        grade,
      ]);
    }

    await connection.commit();
    res.status(200).json({ message: "Marks saved successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Marks Entry Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get Marks for a specific Exam & Subject (for editing)
// @route   GET /api/marks/:examId/:subjectId
const getMarksByExamAndSubject = async (req, res) => {
  try {
    const { examId, subjectId } = req.params;
    const [marks] = await db.query(
      `SELECT student_id, theory_obtained, practical_obtained 
             FROM marks 
             WHERE exam_id = ? AND subject_id = ?`,
      [examId, subjectId]
    );
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { enterBulkMarks, getMarksByExamAndSubject };
