const db = require("../config/db");

// Utility: get today's date (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split("T")[0];

// @desc    Get Dashboard Statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Students
    const [studentCount] = await db.query(
      `SELECT COUNT(*) as total FROM students WHERE status = 'active'`
    );

    // 2. Class Distribution
    const [classCounts] = await db.query(`
      SELECT class_level, COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY class_level
    `);

    // 3. Faculty Distribution
    const [facultyCounts] = await db.query(`
      SELECT faculty, COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY faculty
    `);

    // 4. Total Subjects
    const [subjectCount] = await db.query(
      `SELECT COUNT(*) as total FROM subjects`
    );

    // 5. Upcoming Exams
    const [upcomingExams] = await db.query(`
      SELECT id, exam_name, exam_date, is_final
      FROM exams
      WHERE exam_date >= CURDATE()
      ORDER BY exam_date ASC
      LIMIT 5
    `);

    // 6. Recent Exams
    const [recentExams] = await db.query(`
      SELECT id, exam_name, exam_date, is_final
      FROM exams
      WHERE exam_date < CURDATE()
      ORDER BY exam_date DESC
      LIMIT 5
    `);

    // Build class distribution object
    const byClass = {};
    classCounts.forEach((row) => {
      byClass[`class_${row.class_level}`] = row.count;
    });

    // Build faculty distribution object
    const byFaculty = {};
    facultyCounts.forEach((row) => {
      byFaculty[row.faculty] = row.count;
    });

    // Format response
    const stats = {
      students: {
        total: studentCount[0]?.total || 0,
        byClass: byClass,
        byFaculty: byFaculty,
      },
      subjects: {
        total: subjectCount[0]?.total || 0,
      },
      exams: {
        upcoming: upcomingExams,
        recent: recentExams,
        upcomingCount: upcomingExams.length,
      },
    };

    console.log("✅ Dashboard stats generated successfully");
    res.json(stats);
  } catch (error) {
    console.error("❌ Dashboard Stats Error:", error);
    res.status(500).json({
      message: "Failed to load dashboard statistics",
      error: error.message,
    });
  }
};

// @desc    Get Recent Activity Log
// @route   GET /api/dashboard/activity
const getRecentActivity = async (req, res) => {
  try {
    // Get recently added students
    const [recentStudents] = await db.query(`
      SELECT 
        id,
        CONCAT(first_name, ' ', last_name) as name,
        class_level,
        faculty,
        created_at
      FROM students
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get recently created exams
    const [recentExamsCreated] = await db.query(`
      SELECT id, exam_name, exam_date, is_final
      FROM exams
      ORDER BY id DESC
      LIMIT 5
    `);

    res.json({
      recentStudents: recentStudents.map((s) => ({
        ...s,
        type: "student_added",
        timestamp: s.created_at,
      })),
      recentExams: recentExamsCreated.map((e) => ({
        ...e,
        type: "exam_created",
      })),
    });
  } catch (error) {
    console.error("❌ Activity Log Error:", error);
    res.status(500).json({
      message: "Failed to load activity log",
      error: error.message,
    });
  }
};

// @desc    Quick Student Search
// @route   GET /api/dashboard/search?q=
const quickSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [results] = await db.query(
      `SELECT 
        id,
        first_name,
        middle_name,
        last_name,
        registration_no,
        class_level,
        faculty,
        image_url
      FROM students
      WHERE status = 'active'
        AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          registration_no LIKE ?
        )
      LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(results);
  } catch (error) {
    console.error("❌ Quick Search Error:", error);
    res.status(500).json({
      message: "Search failed",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  quickSearch,
};
