const db = require("../config/db");

// @desc    Get all exams with Academic Year filtering
// @route   GET /api/exams?academic_year_id=1&class_level=11&faculty=Science
const getAllExams = async (req, res) => {
  try {
    let { academic_year_id, class_level, faculty } = req.query;
    
    // 🆕 If no year specified, default to current year
    if (!academic_year_id) {
      const [currentYear] = await db.query(
        "SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1"
      );
      if (currentYear.length > 0) {
        academic_year_id = currentYear[0].id;
      }
    }

    let query = `
      SELECT 
        e.*,
        ay.year_name,
        ay.is_current as is_current_year,
        COUNT(DISTINCT m.student_id) as students_appeared
      FROM exams e
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN marks m ON e.id = m.exam_id
      WHERE 1=1
    `;
    const params = [];

    // 🆕 Filter by Academic Year ID
    if (academic_year_id) {
      query += ` AND e.academic_year_id = ?`;
      params.push(academic_year_id);
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
        ay.year_name,
        ay.start_date_bs,
        ay.end_date_bs,
        ay.is_current as is_current_year,
        COUNT(DISTINCT m.student_id) as students_appeared,
        COUNT(DISTINCT m.subject_id) as subjects_count
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
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
      academic_year_id, // 🆕 Use academic_year_id instead of academic_year
      class_level,
      faculty,
      is_final,
      remarks,
    } = req.body;

    // Validation
    if (!exam_name || !exam_date || !class_level) {
      return res.status(400).json({
        message: "Exam name, date, and class level are required",
      });
    }

    // 🆕 Auto-assign current academic year if not provided
    let yearId = academic_year_id;
    
    if (!yearId) {
      const [currentYear] = await db.query(
        "SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1"
      );
      
      if (currentYear.length === 0) {
        return res.status(400).json({ 
          message: "No current academic year found. Please create one first." 
        });
      }
      
      yearId = currentYear[0].id;
      console.log(`✅ Auto-assigned exam to current academic year: ${yearId}`);
    }

    // Validate class level
    if (!['11', '12'].includes(class_level.toString())) {
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
       (exam_name, exam_date, academic_year_id, class_level, faculty, is_final, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exam_name,
        exam_date,
        yearId, // 🆕 Use academic_year_id
        class_level,
        faculty || null,
        is_final ? 1 : 0,
        remarks || null,
      ]
    );

    console.log(`✅ Exam created: ${exam_name} (ID: ${result.insertId}, Year: ${yearId})`);

    res.status(201).json({
      message: "Exam created successfully",
      examId: result.insertId,
      academic_year_id: yearId,
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
      academic_year_id, // 🆕 Use academic_year_id
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
    if (!exam_name || !exam_date || !class_level) {
      return res.status(400).json({
        message: "Exam name, date, and class level are required",
      });
    }

    await db.query(
      `UPDATE exams 
       SET exam_name = ?, 
           exam_date = ?, 
           academic_year_id = ?, 
           class_level = ?, 
           faculty = ?, 
           is_final = ?, 
           remarks = ?
       WHERE id = ?`,
      [
        exam_name,
        exam_date,
        academic_year_id || existing[0].academic_year_id, // Keep existing if not provided
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

// 🆕 @desc    Get exams by academic year with statistics
// @route   GET /api/exams/year/:year_id/stats
const getExamsByYearWithStats = async (req, res) => {
  try {
    const { year_id } = req.params;

    // Get academic year info
    const [year] = await db.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [year_id]
    );

    if (year.length === 0) {
      return res.status(404).json({ message: "Academic year not found" });
    }

    // Get all exams for this year with statistics
    const [exams] = await db.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT m.student_id) as students_with_marks,
        COUNT(DISTINCT m.subject_id) as subjects_with_marks,
        AVG(m.grade_point) as average_gpa
      FROM exams e
      LEFT JOIN marks m ON e.id = m.exam_id
      WHERE e.academic_year_id = ?
      GROUP BY e.id
      ORDER BY e.exam_date DESC`,
      [year_id]
    );

    // Calculate summary statistics
    const summary = {
      total_exams: exams.length,
      final_exams: exams.filter((e) => e.is_final).length,
      terminal_exams: exams.filter((e) => !e.is_final).length,
      total_students_participated: exams.reduce((sum, e) => sum + (e.students_with_marks || 0), 0),
    };

    res.json({
      academic_year: year[0],
      exams,
      summary,
    });
  } catch (error) {
    console.error("Get Exams By Year Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🆕 @desc    Get exam statistics for dashboard
// @route   GET /api/exams/stats/summary?academic_year_id=1
const getExamStatsSummary = async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    let query = "SELECT COUNT(*) as total FROM exams WHERE 1=1";
    const params = [];

    if (academic_year_id) {
      query += " AND academic_year_id = ?";
      params.push(academic_year_id);
    }

    const [total] = await db.query(query, params);

    // Exams by class
    let classQuery = `
      SELECT class_level, COUNT(*) as count 
      FROM exams 
      WHERE 1=1
    `;
    
    if (academic_year_id) {
      classQuery += " AND academic_year_id = ?";
    }
    
    classQuery += " GROUP BY class_level";
    
    const [byClass] = await db.query(
      classQuery, 
      academic_year_id ? [academic_year_id] : []
    );

    // Final vs Regular
    let typeQuery = `
      SELECT 
        SUM(CASE WHEN is_final = 1 THEN 1 ELSE 0 END) as final_exams,
        SUM(CASE WHEN is_final = 0 THEN 1 ELSE 0 END) as terminal_exams
      FROM exams 
      WHERE 1=1
    `;
    
    if (academic_year_id) {
      typeQuery += " AND academic_year_id = ?";
    }
    
    const [byType] = await db.query(
      typeQuery,
      academic_year_id ? [academic_year_id] : []
    );

    res.json({
      total_exams: total[0].total,
      by_class: byClass,
      final_exams: byType[0].final_exams || 0,
      terminal_exams: byType[0].terminal_exams || 0,
    });
  } catch (error) {
    console.error("Get Exam Stats Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamsByYearWithStats, // 🆕 NOW EXPORTED
  getExamStatsSummary,     // 🆕 NEW ENDPOINT
};