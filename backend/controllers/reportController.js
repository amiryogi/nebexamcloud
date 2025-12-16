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

    // 1. Fetch Student Details with Academic Year
    const [students] = await db.query(
      `SELECT 
        s.*,
        ay.year_name,
        ay.start_date_bs,
        ay.end_date_bs
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (students.length === 0)
      return res.status(404).json({ message: "Student not found" });

    const student = students[0];

    // 2. Fetch Exam Details with Academic Year
    const [exams] = await db.query(
      `SELECT 
        e.*,
        ay.year_name as exam_year
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE e.id = ?`,
      [examId]
    );

    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const exam = exams[0];

    // 3. Verify student and exam are in same academic year (optional validation)
    if (student.academic_year_id !== exam.academic_year_id) {
      console.warn(
        `⚠️ Warning: Student (year ${student.academic_year_id}) and Exam (year ${exam.academic_year_id}) are in different academic years`
      );
    }

    // 4. Fetch Marks for SPECIFIC EXAM with Subject Details
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

    // 5. Process Each Subject with Detailed Grades
    const formattedSubjects = results.map((row) => {
      // Convert strings to numbers before calculation
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
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        theory_code: row.theory_code,
        practical_code: row.practical_code,

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

    // 6. Calculate Overall GPA
    const gpa = calculateOverallGPA(
      formattedSubjects.map((s) => ({
        total_credit_hour: s.total_credit_hour,
        grade_point: s.final_grade_point,
      }))
    );

    res.json({
      student,
      exam,
      academic_year: {
        id: student.academic_year_id,
        name: student.year_name,
        start_date_bs: student.start_date_bs,
        end_date_bs: student.end_date_bs,
      },
      subjects: formattedSubjects,
      gpa,
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Batch Gradesheets with Filters
// @route   GET /api/reports/class/:class_level?exam_id=1&faculty=Science&academic_year_id=1
const getClassGradesheets = async (req, res) => {
  try {
    const { class_level } = req.params;
    const { faculty, academic_year_id, exam_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ message: "exam_id is required" });
    }

    // Get exam details with academic year
    const [exams] = await db.query(
      `SELECT 
        e.*,
        ay.year_name as exam_year
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE e.id = ?`,
      [exam_id]
    );

    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const exam = exams[0];

    // 1. Build Query for Students
    let sql = `
      SELECT 
        s.id,
        ay.year_name,
        ay.id as year_id
      FROM students s
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE s.class_level = ?
    `;
    const params = [class_level];

    if (faculty && faculty !== "All") {
      sql += ` AND s.faculty = ?`;
      params.push(faculty);
    }

    // Filter by academic year if provided, otherwise use exam's year
    if (academic_year_id) {
      sql += ` AND s.academic_year_id = ?`;
      params.push(academic_year_id);
    } else if (exam.academic_year_id) {
      sql += ` AND s.academic_year_id = ?`;
      params.push(exam.academic_year_id);
    }

    sql += ` ORDER BY s.registration_no ASC`;

    const [students] = await db.query(sql, params);

    if (students.length === 0) {
      return res.json({
        exam,
        academic_year: academic_year_id || exam.academic_year_id,
        reports: [],
      });
    }

    const reports = [];

    // 2. Generate Report for Each Student
    for (const st of students) {
      const [studentRows] = await db.query(
        `SELECT 
          s.*,
          ay.year_name
         FROM students s
         LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
         WHERE s.id = ?`,
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
        // Convert strings to numbers
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
          subject_name: row.subject_name,
          theory_code: row.theory_code,
          practical_code: row.practical_code,
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

    res.json({
      exam,
      academic_year: {
        id: academic_year_id || exam.academic_year_id,
        name: students[0]?.year_name || exam.exam_year,
      },
      reports,
      total_students: reports.length,
    });
  } catch (error) {
    console.error("Bulk Report Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Student Performance Across Years
// @route   GET /api/reports/student/:id/performance
const getStudentPerformanceAcrossYears = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Get student details
    const [students] = await db.query(
      `SELECT s.*, ay.year_name
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = students[0];

    // Get all exams the student has appeared in
    const [exams] = await db.query(
      `SELECT DISTINCT 
        e.id,
        e.exam_name,
        e.exam_date,
        e.is_final,
        ay.year_name
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE m.student_id = ?
       ORDER BY e.exam_date ASC`,
      [studentId]
    );

    // Calculate GPA for each exam
    const performance = [];

    for (const exam of exams) {
      const [results] = await db.query(
        `SELECT 
          s.theory_credit_hour,
          s.practical_credit_hour,
          m.theory_obtained,
          m.practical_obtained,
          s.theory_full_marks,
          s.practical_full_marks
         FROM marks m
         JOIN subjects s ON m.subject_id = s.id
         WHERE m.student_id = ? AND m.exam_id = ?`,
        [studentId, exam.id]
      );

      const subjects = results.map((row) => {
        const gradeDetails = calculateSubjectGrades(
          parseFloat(row.theory_obtained) || 0,
          parseFloat(row.theory_full_marks) || 0,
          parseFloat(row.practical_obtained) || 0,
          parseFloat(row.practical_full_marks) || 0,
          parseFloat(row.theory_credit_hour) || 0,
          parseFloat(row.practical_credit_hour) || 0
        );

        return {
          total_credit_hour: gradeDetails.final.totalCreditHour,
          grade_point: gradeDetails.final.gradePoint,
        };
      });

      const gpa = calculateOverallGPA(subjects);

      performance.push({
        exam_id: exam.id,
        exam_name: exam.exam_name,
        exam_date: exam.exam_date,
        is_final: exam.is_final,
        year_name: exam.year_name,
        gpa: gpa,
        subjects_count: results.length,
      });
    }

    res.json({
      student,
      performance,
      total_exams: exams.length,
    });
  } catch (error) {
    console.error("Student Performance Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentGradesheet,
  getClassGradesheets,
  getStudentPerformanceAcrossYears,
};
