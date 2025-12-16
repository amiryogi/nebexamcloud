const db = require("../config/db");

/**
 * @desc    Get all exams with academic year filter
 * @route   GET /api/exams?academic_year_id=1
 * @access  Private
 */
const getAllExams = async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    let query = `
      SELECT 
        e.*,
        ay.year_name,
        ay.is_current as is_current_year
      FROM exams e
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by academic year if provided
    if (academic_year_id) {
      query += " AND e.academic_year_id = ?";
      params.push(academic_year_id);
    }

    query += " ORDER BY e.exam_date DESC";

    const [exams] = await db.query(query, params);

    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Get Exams Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single exam by ID
 * @route   GET /api/exams/:id
 * @access  Private
 */
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const [exams] = await db.query(
      `SELECT 
        e.*,
        ay.year_name,
        ay.start_date_bs,
        ay.end_date_bs,
        ay.is_current as is_current_year
       FROM exams e
       LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
       WHERE e.id = ?`,
      [id]
    );

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get statistics
    const [marksCount] = await db.query(
      "SELECT COUNT(DISTINCT student_id) as students_appeared FROM marks WHERE exam_id = ?",
      [id]
    );

    res.json({
      success: true,
      data: {
        ...exams[0],
        statistics: {
          students_appeared: marksCount[0].students_appeared,
        },
      },
    });
  } catch (error) {
    console.error("Get Exam Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new exam
 * @route   POST /api/exams
 * @access  Private
 */
const createExam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { exam_name, exam_date, is_final, academic_year_id } = req.body;

    // Validation
    if (!exam_name || !exam_date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Exam name and date are required",
      });
    }

    // Auto-assign current academic year if not provided
    let yearId = academic_year_id;

    if (!yearId) {
      const [currentYear] = await connection.query(
        "SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1"
      );

      if (currentYear.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "No current academic year found. Please create one first.",
        });
      }

      yearId = currentYear[0].id;
      console.log(`✅ Auto-assigned exam to current academic year: ${yearId}`);
    }

    // Insert exam
    const [result] = await connection.query(
      "INSERT INTO exams (exam_name, exam_date, is_final, academic_year_id) VALUES (?, ?, ?, ?)",
      [exam_name, exam_date, is_final || false, yearId]
    );

    await connection.commit();

    console.log(`✅ Exam created: ${exam_name} (Year: ${yearId})`);

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: {
        examId: result.insertId,
        exam_name,
        academic_year_id: yearId,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Exam Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Update exam
 * @route   PUT /api/exams/:id
 * @access  Private
 */
const updateExam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { exam_name, exam_date, is_final, academic_year_id } = req.body;

    // Check if exam exists
    const [existing] = await connection.query(
      "SELECT * FROM exams WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Build update query
    let updateQuery = "UPDATE exams SET ";
    const updateParams = [];
    const updates = [];

    if (exam_name !== undefined) {
      updates.push("exam_name = ?");
      updateParams.push(exam_name);
    }

    if (exam_date !== undefined) {
      updates.push("exam_date = ?");
      updateParams.push(exam_date);
    }

    if (is_final !== undefined) {
      updates.push("is_final = ?");
      updateParams.push(is_final);
    }

    if (academic_year_id !== undefined) {
      updates.push("academic_year_id = ?");
      updateParams.push(academic_year_id);
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateQuery += updates.join(", ") + " WHERE id = ?";
    updateParams.push(id);

    await connection.query(updateQuery, updateParams);

    await connection.commit();

    console.log(`✅ Exam updated: ID ${id}`);

    res.json({
      success: true,
      message: "Exam updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Exam Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Delete exam
 * @route   DELETE /api/exams/:id
 * @access  Private
 */
const deleteExam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if exam exists
    const [existing] = await connection.query(
      "SELECT * FROM exams WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if there are marks entered
    const [marksCount] = await connection.query(
      "SELECT COUNT(*) as total FROM marks WHERE exam_id = ?",
      [id]
    );

    if (marksCount[0].total > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${marksCount[0].total} marks entries exist for this exam`,
      });
    }

    // Delete exam
    await connection.query("DELETE FROM exams WHERE id = ?", [id]);

    await connection.commit();

    console.log(`✅ Exam deleted: ${existing[0].exam_name}`);

    res.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Exam Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete exam",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
};
