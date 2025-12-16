const db = require("../config/db");
const { convertBStoAD } = require("../utils/dateConverter");

/**
 * @desc    Get all academic years
 * @route   GET /api/academic-years
 * @access  Private
 */
const getAllAcademicYears = async (req, res) => {
  try {
    const { status } = req.query;

    let query = "SELECT * FROM academic_years WHERE 1=1";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY start_date_ad DESC";

    const [years] = await db.query(query, params);

    res.json({
      success: true,
      data: years,
    });
  } catch (error) {
    console.error("Get Academic Years Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch academic years",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current academic year
 * @route   GET /api/academic-years/current
 * @access  Private
 */
const getCurrentAcademicYear = async (req, res) => {
  try {
    const [years] = await db.query(
      "SELECT * FROM academic_years WHERE is_current = TRUE LIMIT 1"
    );

    if (years.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No current academic year found",
      });
    }

    res.json({
      success: true,
      data: years[0],
    });
  } catch (error) {
    console.error("Get Current Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current academic year",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single academic year by ID
 * @route   GET /api/academic-years/:id
 * @access  Private
 */
const getAcademicYearById = async (req, res) => {
  try {
    const { id } = req.params;

    const [years] = await db.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [id]
    );

    if (years.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    // Get statistics for this year
    const [studentCount] = await db.query(
      "SELECT COUNT(*) as total FROM students WHERE academic_year_id = ?",
      [id]
    );

    const [examCount] = await db.query(
      "SELECT COUNT(*) as total FROM exams WHERE academic_year_id = ?",
      [id]
    );

    res.json({
      success: true,
      data: {
        ...years[0],
        statistics: {
          students: studentCount[0].total,
          exams: examCount[0].total,
        },
      },
    });
  } catch (error) {
    console.error("Get Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch academic year",
      error: error.message,
    });
  }
};

/**
 * @desc    Create new academic year
 * @route   POST /api/academic-years
 * @access  Private
 */
const createAcademicYear = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      year_name,
      start_date_bs,
      end_date_bs,
      is_current,
      status,
    } = req.body;

    // Validation
    if (!year_name || !start_date_bs || !end_date_bs) {
      return res.status(400).json({
        success: false,
        message: "Year name, start date, and end date are required",
      });
    }

    // Check if year_name already exists
    const [existing] = await connection.query(
      "SELECT id FROM academic_years WHERE year_name = ?",
      [year_name]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Academic year with this name already exists",
      });
    }

    // Convert BS dates to AD
    const start_date_ad = convertBStoAD(start_date_bs);
    const end_date_ad = convertBStoAD(end_date_bs);

    if (!start_date_ad || !end_date_ad) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid BS date format",
      });
    }

    // If is_current is true, set all other years to false
    if (is_current) {
      await connection.query(
        "UPDATE academic_years SET is_current = FALSE WHERE is_current = TRUE"
      );
    }

    // Insert new academic year
    const [result] = await connection.query(
      `INSERT INTO academic_years 
       (year_name, start_date_bs, start_date_ad, end_date_bs, end_date_ad, is_current, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        year_name,
        start_date_bs,
        start_date_ad,
        end_date_bs,
        end_date_ad,
        is_current || false,
        status || "upcoming",
      ]
    );

    await connection.commit();

    console.log(`✅ Academic year created: ${year_name}`);

    res.status(201).json({
      success: true,
      message: "Academic year created successfully",
      data: {
        id: result.insertId,
        year_name,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create academic year",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Update academic year
 * @route   PUT /api/academic-years/:id
 * @access  Private
 */
const updateAcademicYear = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      year_name,
      start_date_bs,
      end_date_bs,
      is_current,
      status,
    } = req.body;

    // Check if academic year exists
    const [existing] = await connection.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    // If is_current is being set to true, set all others to false
    if (is_current) {
      await connection.query(
        "UPDATE academic_years SET is_current = FALSE WHERE id != ?",
        [id]
      );
    }

    // Build update query dynamically
    let updateQuery = "UPDATE academic_years SET ";
    const updateParams = [];
    const updates = [];

    if (year_name !== undefined) {
      updates.push("year_name = ?");
      updateParams.push(year_name);
    }

    if (start_date_bs !== undefined) {
      const start_date_ad = convertBStoAD(start_date_bs);
      if (!start_date_ad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid start date BS format",
        });
      }
      updates.push("start_date_bs = ?", "start_date_ad = ?");
      updateParams.push(start_date_bs, start_date_ad);
    }

    if (end_date_bs !== undefined) {
      const end_date_ad = convertBStoAD(end_date_bs);
      if (!end_date_ad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid end date BS format",
        });
      }
      updates.push("end_date_bs = ?", "end_date_ad = ?");
      updateParams.push(end_date_bs, end_date_ad);
    }

    if (is_current !== undefined) {
      updates.push("is_current = ?");
      updateParams.push(is_current);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      updateParams.push(status);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    updateQuery += updates.join(", ") + " WHERE id = ?";
    updateParams.push(id);

    await connection.query(updateQuery, updateParams);

    await connection.commit();

    console.log(`✅ Academic year updated: ID ${id}`);

    res.json({
      success: true,
      message: "Academic year updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update academic year",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Set academic year as current
 * @route   PUT /api/academic-years/:id/set-current
 * @access  Private
 */
const setCurrentAcademicYear = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if academic year exists
    const [existing] = await connection.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    // Set all years to not current
    await connection.query("UPDATE academic_years SET is_current = FALSE");

    // Set this year as current
    await connection.query(
      "UPDATE academic_years SET is_current = TRUE, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    await connection.commit();

    console.log(`✅ Academic year ${existing[0].year_name} set as current`);

    res.json({
      success: true,
      message: "Academic year set as current successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Set Current Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set current academic year",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Delete academic year
 * @route   DELETE /api/academic-years/:id
 * @access  Private
 */
const deleteAcademicYear = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if academic year exists
    const [existing] = await connection.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    // Check if it's the current year
    if (existing[0].is_current) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot delete the current academic year",
      });
    }

    // Check if there are students enrolled in this year
    const [studentCount] = await connection.query(
      "SELECT COUNT(*) as total FROM students WHERE academic_year_id = ?",
      [id]
    );

    if (studentCount[0].total > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${studentCount[0].total} students are enrolled in this academic year`,
      });
    }

    // Check if there are exams in this year
    const [examCount] = await connection.query(
      "SELECT COUNT(*) as total FROM exams WHERE academic_year_id = ?",
      [id]
    );

    if (examCount[0].total > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${examCount[0].total} exams exist in this academic year`,
      });
    }

    // Delete the academic year
    await connection.query("DELETE FROM academic_years WHERE id = ?", [id]);

    await connection.commit();

    console.log(`✅ Academic year deleted: ${existing[0].year_name}`);

    res.json({
      success: true,
      message: "Academic year deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Academic Year Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete academic year",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Get academic year statistics
 * @route   GET /api/academic-years/:id/stats
 * @access  Private
 */
const getAcademicYearStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if academic year exists
    const [years] = await db.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [id]
    );

    if (years.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found",
      });
    }

    // Get student statistics
    const [studentStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN class_level = 11 THEN 1 ELSE 0 END) as grade_11,
        SUM(CASE WHEN class_level = 12 THEN 1 ELSE 0 END) as grade_12
       FROM students 
       WHERE academic_year_id = ?`,
      [id]
    );

    // Get faculty distribution
    const [facultyStats] = await db.query(
      `SELECT faculty, COUNT(*) as count
       FROM students
       WHERE academic_year_id = ?
       GROUP BY faculty`,
      [id]
    );

    // Get exam statistics
    const [examStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_final = 1 THEN 1 ELSE 0 END) as final_exams,
        SUM(CASE WHEN is_final = 0 THEN 1 ELSE 0 END) as other_exams
       FROM exams
       WHERE academic_year_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        year: years[0],
        students: {
          total: studentStats[0].total,
          byGrade: {
            grade_11: studentStats[0].grade_11,
            grade_12: studentStats[0].grade_12,
          },
          byFaculty: facultyStats,
        },
        exams: {
          total: examStats[0].total,
          final: examStats[0].final_exams,
          other: examStats[0].other_exams,
        },
      },
    });
  } catch (error) {
    console.error("Get Academic Year Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch academic year statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getAllAcademicYears,
  getCurrentAcademicYear,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
  getAcademicYearStats,
};