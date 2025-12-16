const db = require("../config/db");

// @desc    Get all exams with Academic Year filtering
// @route   GET /api/exams?academic_year=2080&class_level=11&faculty=Science
const getAllExams = async (req, res) => {
  try {
    const { academic_year, class_level, faculty } = req.query;

    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT m.student_id) as students_appeared
      FROM exams e
      LEFT JOIN marks m ON e.id = m.exam_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by Academic Year
    if (academic_year) {
      query += ` AND e.academic_year = ?`;
      params.push(academic_year);
    }

    // Filter by Class Level
    if (class_level) {
      query += ` AND e.class_level = ?`;
      params.push(class_level);
    }

    // Filter by Faculty
    if (faculty && faculty !== "All") {
      query += ` AND e.faculty = ?`;
      params.push(faculty);
    }

    query += ` GROUP BY e.id ORDER BY e.exam_date DESC, e.created_at DESC`;

    const [exams] = await db.query(query, params);

    res.json(exams);
  } catch (error) {
    console.error("Get Exams Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single exam details
// @route   GET /api/exams/:id
const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;

    const [exams] = await db.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT m.student_id) as students_appeared,
        COUNT(DISTINCT m.subject_id) as subjects_count
       FROM exams e
       LEFT JOIN marks m ON e.id = m.exam_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [examId]
    );

    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json(exams[0]);
  } catch (error) {
    console.error("Get Exam Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
const createExam = async (req, res) => {
  try {
    const {
      exam_name,
      exam_date,
      academic_year,
      class_level,
      faculty,
      is_final,
      remarks,
    } = req.body;

    // Validation
    if (!exam_name || !exam_date || !academic_year || !class_level) {
      return res.status(400).json({
        message: "Exam name, date, academic year, and class level are required",
      });
    }

    // Validate class level
    if (![11, 12].includes(parseInt(class_level))) {
      return res.status(400).json({
        message: "Class level must be 11 or 12",
      });
    }

    // Validate faculty if provided
    if (faculty && !["Science", "Management", "Humanities"].includes(faculty)) {
      return res.status(400).json({
        message: "Invalid faculty. Must be Science, Management, or Humanities",
      });
    }

    const [result] = await db.query(
      `INSERT INTO exams 
       (exam_name, exam_date, academic_year, class_level, faculty, is_final, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exam_name,
        exam_date,
        academic_year,
        class_level,
        faculty || null,
        is_final ? 1 : 0,
        remarks || null,
      ]
    );

    console.log(`✅ Exam created: ${exam_name} (ID: ${result.insertId})`);

    res.status(201).json({
      message: "Exam created successfully",
      examId: result.insertId,
    });
  } catch (error) {
    console.error("Create Exam Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const {
      exam_name,
      exam_date,
      academic_year,
      class_level,
      faculty,
      is_final,
      remarks,
    } = req.body;

    // Check if exam exists
    const [existing] = await db.query(`SELECT * FROM exams WHERE id = ?`, [
      examId,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Validation
    if (!exam_name || !exam_date || !academic_year || !class_level) {
      return res.status(400).json({
        message: "Exam name, date, academic year, and class level are required",
      });
    }

    await db.query(
      `UPDATE exams 
       SET exam_name = ?, 
           exam_date = ?, 
           academic_year = ?, 
           class_level = ?, 
           faculty = ?, 
           is_final = ?, 
           remarks = ?
       WHERE id = ?`,
      [
        exam_name,
        exam_date,
        academic_year,
        class_level,
        faculty || null,
        is_final ? 1 : 0,
        remarks || null,
        examId,
      ]
    );

    console.log(`✅ Exam updated: ${exam_name} (ID: ${examId})`);

    res.json({ message: "Exam updated successfully" });
  } catch (error) {
    console.error("Update Exam Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
const deleteExam = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const examId = req.params.id;

    // Check if exam has marks
    const [marks] = await connection.query(
      `SELECT COUNT(*) as count FROM marks WHERE exam_id = ?`,
      [examId]
    );

    if (marks[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        message:
          "Cannot delete exam with existing marks. Please delete marks first.",
      });
    }

    // Delete the exam
    const [result] = await connection.query(`DELETE FROM exams WHERE id = ?`, [
      examId,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Exam not found" });
    }

    await connection.commit();
    console.log(`✅ Exam deleted: ID ${examId}`);

    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Exam Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get available academic years (from exams)
// @route   GET /api/exams/years/list
const getAcademicYears = async (req, res) => {
  try {
    const [years] = await db.query(`
      SELECT DISTINCT academic_year 
      FROM exams 
      WHERE academic_year IS NOT NULL
      ORDER BY academic_year DESC
    `);

    res.json(years.map((y) => y.academic_year));
  } catch (error) {
    console.error("Get Academic Years Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exam statistics for a specific academic year
// @route   GET /api/exams/stats/:academic_year
const getExamStats = async (req, res) => {
  try {
    const { academic_year } = req.params;

    // Total exams
    const [totalExams] = await db.query(
      `SELECT COUNT(*) as total FROM exams WHERE academic_year = ?`,
      [academic_year]
    );

    // Exams by class
    const [byClass] = await db.query(
      `SELECT class_level, COUNT(*) as count 
       FROM exams 
       WHERE academic_year = ? 
       GROUP BY class_level`,
      [academic_year]
    );

    // Exams by faculty
    const [byFaculty] = await db.query(
      `SELECT faculty, COUNT(*) as count 
       FROM exams 
       WHERE academic_year = ? 
       GROUP BY faculty`,
      [academic_year]
    );

    // Final vs Regular exams
    const [byType] = await db.query(
      `SELECT 
        SUM(CASE WHEN is_final = 1 THEN 1 ELSE 0 END) as final_exams,
        SUM(CASE WHEN is_final = 0 THEN 1 ELSE 0 END) as regular_exams
       FROM exams 
       WHERE academic_year = ?`,
      [academic_year]
    );

    res.json({
      academic_year,
      total_exams: totalExams[0].total,
      by_class: byClass,
      by_faculty: byFaculty,
      final_exams: byType[0].final_exams || 0,
      regular_exams: byType[0].regular_exams || 0,
    });
  } catch (error) {
    console.error("Get Exam Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getAcademicYears,
  getExamStats,
};
