const db = require("../config/db");
const { calculateSubjectGrades } = require("../utils/gpaCalculator");

// @desc    Enter Marks (Bulk)
// @route   POST /api/marks/bulk
const enterBulkMarks = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { exam_id, subject_id, marks_data } = req.body;
    // marks_data expects: [ { student_id: 1, theory: 50, practical: 20 }, ... ]

    // 1. Get Subject Details for Validation and Credit Hours
    const [subjects] = await connection.query(
      `SELECT * FROM subjects WHERE id = ?`,
      [subject_id]
    );

    if (subjects.length === 0) {
      throw new Error("Subject not found");
    }

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

      // Calculate Grade Details using NEB formula
      const gradeDetails = calculateSubjectGrades(
        theory || 0,
        subject.theory_full_marks,
        practical || 0,
        subject.practical_full_marks,
        subject.theory_credit_hour,
        subject.practical_credit_hour
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
        theory || 0,
        practical || 0,
        gradeDetails.final.gradePoint,
        gradeDetails.final.grade,
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
      `SELECT 
        m.student_id, 
        m.theory_obtained, 
        m.practical_obtained,
        m.grade_point,
        m.final_grade,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM marks m
       JOIN students s ON m.student_id = s.id
       WHERE m.exam_id = ? AND m.subject_id = ?
       ORDER BY s.first_name ASC`,
      [examId, subjectId]
    );

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Marks Entry Form Data (Students + Subject Info)
// @route   GET /api/marks/entry-form/:examId/:subjectId?class_level=11&faculty=Science
const getMarksEntryForm = async (req, res) => {
  try {
    const { examId, subjectId } = req.params;
    const { class_level, faculty } = req.query;

    // 1. Get Subject Details
    const [subjects] = await db.query(`SELECT * FROM subjects WHERE id = ?`, [
      subjectId,
    ]);

    if (subjects.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const subject = subjects[0];

    // 2. Get Students enrolled in this subject
    let query = `
      SELECT 
        s.id,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.registration_no,
        s.class_level,
        s.faculty,
        m.theory_obtained,
        m.practical_obtained,
        m.grade_point,
        m.final_grade
      FROM students s
      JOIN student_subjects ss ON s.id = ss.student_id
      LEFT JOIN marks m ON s.id = m.student_id 
        AND m.exam_id = ? 
        AND m.subject_id = ?
      WHERE ss.subject_id = ?
      AND s.status = 'active'
    `;

    const params = [examId, subjectId, subjectId];

    if (class_level) {
      query += ` AND s.class_level = ?`;
      params.push(class_level);
    }

    if (faculty) {
      query += ` AND s.faculty = ?`;
      params.push(faculty);
    }

    query += ` ORDER BY s.first_name ASC`;

    const [students] = await db.query(query, params);

    res.json({
      subject,
      students,
    });
  } catch (error) {
    console.error("Marks Entry Form Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enterBulkMarks,
  getMarksByExamAndSubject,
  getMarksEntryForm,
};
