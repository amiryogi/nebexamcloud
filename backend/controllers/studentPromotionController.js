const db = require("../config/db");

/**
 * Student Promotion System
 * Handles Class 11 → 12 promotion and Class 12 → Graduated
 */

// @desc    Promote students from Class 11 to Class 12
// @route   POST /api/students/promote/to-class-12
// @body    { student_ids: [1,2,3], new_academic_year_id: 2 }
const promoteToClass12 = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { student_ids, new_academic_year_id } = req.body;

    // Validation
    if (!student_ids || student_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No students selected for promotion",
      });
    }

    if (!new_academic_year_id) {
      await connection.rollback();
      return res.status(400).json({
        message: "New academic year is required",
      });
    }

    // Verify target academic year exists
    const [targetYear] = await connection.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [new_academic_year_id]
    );

    if (targetYear.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Target academic year not found",
      });
    }

    // Get students to be promoted
    const [studentsToPromote] = await connection.query(
      `SELECT id, first_name, last_name, class_level, status 
       FROM students 
       WHERE id IN (?) 
       AND class_level = '11' 
       AND status = 'active'`,
      [student_ids]
    );

    if (studentsToPromote.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No eligible Class 11 students found for promotion",
      });
    }

    // Promote students
    await connection.query(
      `UPDATE students 
       SET class_level = '12',
           academic_year_id = ?,
           updated_at = NOW()
       WHERE id IN (?)`,
      [new_academic_year_id, student_ids]
    );

    await connection.commit();

    console.log(`✅ Promoted ${studentsToPromote.length} students to Class 12`);

    res.json({
      success: true,
      message: `Successfully promoted ${studentsToPromote.length} students to Class 12`,
      promoted_students: studentsToPromote,
      new_academic_year: targetYear[0].year_name,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Promotion Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to promote students",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// @desc    Graduate Class 12 students (mark as graduated)
// @route   POST /api/students/promote/graduate
// @body    { student_ids: [1,2,3], graduation_date: '2024-04-15' }
const graduateStudents = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { student_ids, graduation_date } = req.body;

    // Validation
    if (!student_ids || student_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No students selected for graduation",
      });
    }

    // Get students to be graduated
    const [studentsToGraduate] = await connection.query(
      `SELECT 
        s.id, 
        s.first_name, 
        s.last_name, 
        s.class_level, 
        s.status,
        ay.year_name
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id IN (?) 
       AND s.class_level = '12' 
       AND s.status = 'active'`,
      [student_ids]
    );

    if (studentsToGraduate.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No eligible Class 12 students found for graduation",
      });
    }

    // Update status to graduated
    await connection.query(
      `UPDATE students 
       SET status = 'graduated',
           updated_at = NOW()
       WHERE id IN (?)`,
      [student_ids]
    );

    await connection.commit();

    console.log(`🎓 Graduated ${studentsToGraduate.length} students`);

    res.json({
      success: true,
      message: `Successfully graduated ${studentsToGraduate.length} students`,
      graduated_students: studentsToGraduate,
      graduation_date:
        graduation_date || new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Graduation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to graduate students",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// @desc    Rollback promotion (demote Class 12 back to Class 11)
// @route   POST /api/students/promote/rollback
// @body    { student_ids: [1,2,3], previous_academic_year_id: 1 }
const rollbackPromotion = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { student_ids, previous_academic_year_id } = req.body;

    if (!student_ids || student_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No students selected for rollback",
      });
    }

    // Demote students back to Class 11
    await connection.query(
      `UPDATE students 
       SET class_level = '11',
           academic_year_id = ?,
           updated_at = NOW()
       WHERE id IN (?) 
       AND class_level = '12'`,
      [previous_academic_year_id, student_ids]
    );

    await connection.commit();

    console.log(`↩️ Rolled back ${student_ids.length} students to Class 11`);

    res.json({
      success: true,
      message: `Successfully rolled back ${student_ids.length} students to Class 11`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Rollback Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rollback promotion",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// @desc    Get promotion summary/preview
// @route   GET /api/students/promote/summary?current_year_id=1&next_year_id=2
const getPromotionSummary = async (req, res) => {
  try {
    const { current_year_id, next_year_id } = req.query;

    if (!current_year_id || !next_year_id) {
      return res.status(400).json({
        message: "Both current_year_id and next_year_id are required",
      });
    }

    // Get current year info
    const [currentYear] = await db.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [current_year_id]
    );

    const [nextYear] = await db.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [next_year_id]
    );

    if (currentYear.length === 0 || nextYear.length === 0) {
      return res.status(404).json({
        message: "Academic year not found",
      });
    }

    // Count Class 11 students eligible for promotion
    const [class11Count] = await db.query(
      `SELECT COUNT(*) as total
       FROM students
       WHERE class_level = '11'
       AND academic_year_id = ?
       AND status = 'active'`,
      [current_year_id]
    );

    // Count Class 12 students eligible for graduation
    const [class12Count] = await db.query(
      `SELECT COUNT(*) as total
       FROM students
       WHERE class_level = '12'
       AND academic_year_id = ?
       AND status = 'active'`,
      [current_year_id]
    );

    // Get faculty breakdown
    const [facultyBreakdown] = await db.query(
      `SELECT 
        class_level,
        faculty,
        COUNT(*) as count
       FROM students
       WHERE academic_year_id = ?
       AND status = 'active'
       GROUP BY class_level, faculty`,
      [current_year_id]
    );

    res.json({
      current_year: currentYear[0],
      next_year: nextYear[0],
      summary: {
        class_11_eligible: class11Count[0].total,
        class_12_eligible: class12Count[0].total,
        total_students: class11Count[0].total + class12Count[0].total,
      },
      faculty_breakdown: facultyBreakdown,
    });
  } catch (error) {
    console.error("Get Promotion Summary Error:", error);
    res.status(500).json({
      message: "Failed to get promotion summary",
      error: error.message,
    });
  }
};

module.exports = {
  promoteToClass12,
  graduateStudents,
  rollbackPromotion,
  getPromotionSummary,
};
