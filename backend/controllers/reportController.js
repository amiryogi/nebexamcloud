const db = require("../config/db");
const {
  calculateSubjectGrades,
  calculateOverallGPA,
} = require("../utils/gpaCalculator");

// @desc    Get Single Student Gradesheet with Exam Filter
// @route   GET /api/reports/student/:id?exam_id=1
const getStudentGradesheet = async (req, res) => {
  try {
    const studentId = req.params.id;
    const examId = req.query.exam_id;

    if (!examId) {
      return res.status(400).json({ message: "exam_id is required" });
    }

    // 1. Fetch Student Details
    const [students] = await db.query(`SELECT * FROM students WHERE id = ?`, [
      studentId,
    ]);
    if (students.length === 0)
      return res.status(404).json({ message: "Student not found" });
    const student = students[0];

    // 2. Fetch Marks for SPECIFIC EXAM with Subject Details
    const [results] = await db.query(
      `SELECT 
          s.id as subject_id, 
          s.subject_name, 
          s.theory_code,
          s.practical_code,
          s.theory_full_marks, 
          s.practical_full_marks,
          s.theory_credit_hour, 
          s.practical_credit_hour,
          m.theory_obtained, 
          m.practical_obtained
       FROM student_subjects ss
       JOIN subjects s ON ss.subject_id = s.id
       LEFT JOIN marks m ON s.id = m.subject_id 
           AND m.student_id = ? 
           AND m.exam_id = ?
       WHERE ss.student_id = ?
       ORDER BY s.subject_name`,
      [studentId, examId, studentId]
    );

    // 3. Process Each Subject with Detailed Grades
    const formattedSubjects = results.map((row) => {
      // 🔧 FIX: Convert strings to numbers before calculation
      const theoryObtained = parseFloat(row.theory_obtained) || 0;
      const theoryFullMarks = parseFloat(row.theory_full_marks) || 0;
      const practicalObtained = parseFloat(row.practical_obtained) || 0;
      const practicalFullMarks = parseFloat(row.practical_full_marks) || 0;
      const theoryCreditHour = parseFloat(row.theory_credit_hour) || 0;
      const practicalCreditHour = parseFloat(row.practical_credit_hour) || 0;

      const gradeDetails = calculateSubjectGrades(
        theoryObtained,
        theoryFullMarks,
        practicalObtained,
        practicalFullMarks,
        theoryCreditHour,
        practicalCreditHour
      );

      return {
        subject_code: row.theory_code,
        subject_name: row.subject_name,
        subject_code: row.practical_code,
        subject_name: row.subject_name,

        // Theory Details
        theory_full_marks: theoryFullMarks,
        theory_obtained: theoryObtained,
        theory_grade_point: gradeDetails.theory.gradePoint,
        theory_grade: gradeDetails.theory.grade,
        theory_credit_hour: theoryCreditHour,

        // Practical Details
        practical_full_marks: practicalFullMarks,
        practical_obtained: practicalObtained,
        practical_grade_point: gradeDetails.practical.gradePoint,
        practical_grade: gradeDetails.practical.grade,
        practical_credit_hour: practicalCreditHour,

        // Final Combined
        total_credit_hour: gradeDetails.final.totalCreditHour,
        final_grade_point: gradeDetails.final.gradePoint,
        final_grade: gradeDetails.final.grade,
      };
    });

    // 4. Calculate Overall GPA
    const gpa = calculateOverallGPA(
      formattedSubjects.map((s) => ({
        total_credit_hour: s.total_credit_hour,
        grade_point: s.final_grade_point,
      }))
    );

    res.json({
      student,
      subjects: formattedSubjects,
      gpa,
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Batch Gradesheets with Filters
// @route   GET /api/reports/class/:class_level?exam_id=1&faculty=Science&year=2080
const getClassGradesheets = async (req, res) => {
  try {
    const { class_level } = req.params;
    const { faculty, year, exam_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ message: "exam_id is required" });
    }

    // 1. Build Query for Students
    let sql = `SELECT id FROM students WHERE class_level = ?`;
    const params = [class_level];

    if (faculty && faculty !== "All") {
      sql += ` AND faculty = ?`;
      params.push(faculty);
    }

    if (year) {
      sql += ` AND enrollment_year = ?`;
      params.push(year);
    }

    sql += ` ORDER BY registration_no ASC`;

    const [students] = await db.query(sql, params);

    if (students.length === 0) {
      return res.json([]);
    }

    const reports = [];

    // 2. Generate Report for Each Student
    for (const st of students) {
      const [studentRows] = await db.query(
        `SELECT * FROM students WHERE id = ?`,
        [st.id]
      );
      const student = studentRows[0];

      const [results] = await db.query(
        `SELECT 
            s.subject_name, 
            s.theory_code,
            s.practical_code,
            s.theory_full_marks,
            s.practical_full_marks,
            s.theory_credit_hour, 
            s.practical_credit_hour,
            m.theory_obtained, 
            m.practical_obtained
         FROM student_subjects ss
         JOIN subjects s ON ss.subject_id = s.id
         LEFT JOIN marks m ON s.id = m.subject_id 
             AND m.student_id = ? 
             AND m.exam_id = ?
         WHERE ss.student_id = ?
         ORDER BY s.subject_name`,
        [st.id, exam_id, st.id]
      );

      const subjects = results.map((row) => {
        // 🔧 FIX: Convert strings to numbers
        const theoryObtained = parseFloat(row.theory_obtained) || 0;
        const theoryFullMarks = parseFloat(row.theory_full_marks) || 0;
        const practicalObtained = parseFloat(row.practical_obtained) || 0;
        const practicalFullMarks = parseFloat(row.practical_full_marks) || 0;
        const theoryCreditHour = parseFloat(row.theory_credit_hour) || 0;
        const practicalCreditHour = parseFloat(row.practical_credit_hour) || 0;

        const gradeDetails = calculateSubjectGrades(
          theoryObtained,
          theoryFullMarks,
          practicalObtained,
          practicalFullMarks,
          theoryCreditHour,
          practicalCreditHour
        );

        return {
          subject_code: row.theory_code,
          practical_code: row.practical_code,
          subject_name: row.subject_name,
          theory_full_marks: theoryFullMarks,
          theory_obtained: theoryObtained,
          theory_grade_point: gradeDetails.theory.gradePoint,
          theory_grade: gradeDetails.theory.grade,
          theory_credit_hour: theoryCreditHour,
          practical_full_marks: practicalFullMarks,
          practical_obtained: practicalObtained,
          practical_grade_point: gradeDetails.practical.gradePoint,
          practical_grade: gradeDetails.practical.grade,
          practical_credit_hour: practicalCreditHour,
          total_credit_hour: gradeDetails.final.totalCreditHour,
          final_grade_point: gradeDetails.final.gradePoint,
          final_grade: gradeDetails.final.grade,
        };
      });

      const gpa = calculateOverallGPA(
        subjects.map((s) => ({
          total_credit_hour: s.total_credit_hour,
          grade_point: s.final_grade_point,
        }))
      );

      reports.push({ student, subjects, gpa });
    }

    res.json(reports);
  } catch (error) {
    console.error("Bulk Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudentGradesheet, getClassGradesheets };
