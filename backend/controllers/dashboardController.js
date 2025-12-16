const db = require("../config/db");

// Utility: get today's date (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split("T")[0];

// Utility: Get current academic year (default logic: if month >= 4, current year, else previous year)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  // If it's April or later, use current year; otherwise use previous year
  // Adjust this logic based on your school's academic year start
  return currentMonth >= 4
    ? currentYear.toString()
    : (currentYear - 1).toString();
};

// @desc    Get Dashboard Statistics with Academic Year Support
// @route   GET /api/dashboard/stats?academic_year=2080
const getDashboardStats = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const activeYear = academic_year || getCurrentAcademicYear();

    // 1. Total Active Students (overall)
    const [studentCount] = await db.query(
      `SELECT COUNT(*) as total FROM students WHERE status = 'active'`
    );

    // 2. Students by Academic Year
    const [studentsByYear] = await db.query(`
      SELECT enrollment_year, COUNT(*) as count
      FROM students
      WHERE status = 'active'
      GROUP BY enrollment_year
      ORDER BY enrollment_year DESC
    `);

    // 3. Class Distribution (for selected year)
    const [classCounts] = await db.query(
      `
      SELECT class_level, COUNT(*) as count
      FROM students
      WHERE status = 'active' 
      ${academic_year ? "AND enrollment_year = ?" : ""}
      GROUP BY class_level
    `,
      academic_year ? [academic_year] : []
    );

    // 4. Faculty Distribution (for selected year)
    const [facultyCounts] = await db.query(
      `
      SELECT faculty, COUNT(*) as count
      FROM students
      WHERE status = 'active'
      ${academic_year ? "AND enrollment_year = ?" : ""}
      GROUP BY faculty
    `,
      academic_year ? [academic_year] : []
    );

    // 5. Total Subjects
    const [subjectCount] = await db.query(
      `SELECT COUNT(*) as total FROM subjects`
    );

    // 6. Subjects by Class & Faculty
    const [subjectsByClass] = await db.query(`
      SELECT class_level, faculty, COUNT(*) as count
      FROM subjects
      GROUP BY class_level, faculty
      ORDER BY class_level, faculty
    `);

    // 7. Upcoming Exams (for selected academic year)
    const [upcomingExams] = await db.query(
      `
      SELECT id, exam_name, exam_date, class_level, faculty, is_final
      FROM exams
      WHERE exam_date >= CURDATE()
      ${academic_year ? "AND academic_year = ?" : ""}
      ORDER BY exam_date ASC
      LIMIT 5
    `,
      academic_year ? [academic_year] : []
    );

    // 8. Recent Exams (for selected academic year)
    const [recentExams] = await db.query(
      `
      SELECT id, exam_name, exam_date, class_level, faculty, is_final
      FROM exams
      WHERE exam_date < CURDATE()
      ${academic_year ? "AND academic_year = ?" : ""}
      ORDER BY exam_date DESC
      LIMIT 5
    `,
      academic_year ? [academic_year] : []
    );

    // 9. Total Exams for selected year
    const [examCountForYear] = await db.query(
      `
      SELECT COUNT(*) as total 
      FROM exams 
      ${academic_year ? "WHERE academic_year = ?" : ""}
    `,
      academic_year ? [academic_year] : []
    );

    // 10. Exam Statistics by Type
    const [examTypeStats] = await db.query(
      `
      SELECT 
        SUM(CASE WHEN is_final = 1 THEN 1 ELSE 0 END) as final_exams,
        SUM(CASE WHEN is_final = 0 THEN 1 ELSE 0 END) as regular_exams
      FROM exams
      ${academic_year ? "WHERE academic_year = ?" : ""}
    `,
      academic_year ? [academic_year] : []
    );

    // 11. Available Academic Years
    const [academicYears] = await db.query(`
      SELECT DISTINCT enrollment_year as year
      FROM students
      WHERE enrollment_year IS NOT NULL
      UNION
      SELECT DISTINCT academic_year as year
      FROM exams
      WHERE academic_year IS NOT NULL
      ORDER BY year DESC
    `);

    // Build class distribution object
    const byClass = {};
    classCounts.forEach((row) => {
      byClass[`class_${row.class_level}`] = row.count;
    });

    // Build faculty distribution object
    const byFaculty = {};
    facultyCounts.forEach((row) => {
      byFaculty[row.faculty || "undefined"] = row.count;
    });

    // Build subject distribution
    const subjectDistribution = {};
    subjectsByClass.forEach((row) => {
      const key = `${row.class_level}_${row.faculty || "common"}`;
      subjectDistribution[key] = row.count;
    });

    // Format response
    const stats = {
      academic_year: activeYear,
      available_years: academicYears.map((y) => y.year),

      students: {
        total: studentCount[0]?.total || 0,
        byClass: byClass,
        byFaculty: byFaculty,
        byYear: studentsByYear.map((y) => ({
          year: y.enrollment_year,
          count: y.count,
        })),
      },

      subjects: {
        total: subjectCount[0]?.total || 0,
        distribution: subjectDistribution,
      },

      exams: {
        total: examCountForYear[0]?.total || 0,
        final_exams: examTypeStats[0]?.final_exams || 0,
        regular_exams: examTypeStats[0]?.regular_exams || 0,
        upcoming: upcomingExams,
        recent: recentExams,
        upcomingCount: upcomingExams.length,
      },
    };

    console.log(
      `✅ Dashboard stats generated for academic year: ${activeYear}`
    );
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
// @route   GET /api/dashboard/activity?academic_year=2080
const getRecentActivity = async (req, res) => {
  try {
    const { academic_year } = req.query;

    // Get recently added students
    const [recentStudents] = await db.query(
      `
      SELECT 
        id,
        CONCAT(first_name, ' ', last_name) as name,
        class_level,
        faculty,
        enrollment_year,
        created_at
      FROM students
      ${academic_year ? "WHERE enrollment_year = ?" : ""}
      ORDER BY created_at DESC
      LIMIT 10
    `,
      academic_year ? [academic_year] : []
    );

    // Get recently created exams
    const [recentExamsCreated] = await db.query(
      `
      SELECT 
        id, 
        exam_name, 
        exam_date, 
        academic_year,
        class_level,
        faculty,
        is_final,
        created_at
      FROM exams
      ${academic_year ? "WHERE academic_year = ?" : ""}
      ORDER BY created_at DESC
      LIMIT 10
    `,
      academic_year ? [academic_year] : []
    );

    // Get recent marks entries (for activity feed)
    const [recentMarks] = await db.query(
      `
      SELECT 
        m.created_at,
        e.exam_name,
        e.academic_year,
        s.subject_name,
        COUNT(DISTINCT m.student_id) as students_count
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN subjects s ON m.subject_id = s.id
      ${academic_year ? "WHERE e.academic_year = ?" : ""}
      GROUP BY m.exam_id, m.subject_id, m.created_at, e.exam_name, e.academic_year, s.subject_name
      ORDER BY m.created_at DESC
      LIMIT 10
    `,
      academic_year ? [academic_year] : []
    );

    // Combine and sort all activities
    const activities = [
      ...recentStudents.map((s) => ({
        id: s.id,
        type: "student_added",
        title: `New Student: ${s.name}`,
        description: `Class ${s.class_level} - ${s.faculty}`,
        academic_year: s.enrollment_year,
        timestamp: s.created_at,
        data: s,
      })),
      ...recentExamsCreated.map((e) => ({
        id: e.id,
        type: "exam_created",
        title: `New Exam: ${e.exam_name}`,
        description: `Class ${e.class_level} - ${e.faculty || "All"} ${
          e.is_final ? "(Final)" : ""
        }`,
        academic_year: e.academic_year,
        timestamp: e.created_at,
        data: e,
      })),
      ...recentMarks.map((m) => ({
        type: "marks_entered",
        title: `Marks Entered: ${m.exam_name}`,
        description: `${m.subject_name} - ${m.students_count} students`,
        academic_year: m.academic_year,
        timestamp: m.created_at,
        data: m,
      })),
    ];

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: activities.slice(0, 15), // Return top 15 most recent
      summary: {
        recent_students: recentStudents.length,
        recent_exams: recentExamsCreated.length,
        recent_marks: recentMarks.length,
      },
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
// @route   GET /api/dashboard/search?q=john&academic_year=2080
const quickSearch = async (req, res) => {
  try {
    const { q, academic_year } = req.query;

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
        enrollment_year,
        image_url
      FROM students
      WHERE status = 'active'
        AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          registration_no LIKE ?
        )
        ${academic_year ? "AND enrollment_year = ?" : ""}
      ORDER BY first_name ASC
      LIMIT 15`,
      academic_year
        ? [`%${q}%`, `%${q}%`, `%${q}%`, academic_year]
        : [`%${q}%`, `%${q}%`, `%${q}%`]
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

// @desc    Get Academic Year Summary
// @route   GET /api/dashboard/year-summary/:academic_year
const getYearSummary = async (req, res) => {
  try {
    const { academic_year } = req.params;

    // Total students enrolled this year
    const [studentStats] = await db.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN class_level = 11 THEN 1 END) as class_11,
        COUNT(CASE WHEN class_level = 12 THEN 1 END) as class_12,
        COUNT(CASE WHEN faculty = 'Science' THEN 1 END) as science,
        COUNT(CASE WHEN faculty = 'Management' THEN 1 END) as management,
        COUNT(CASE WHEN faculty = 'Humanities' THEN 1 END) as humanities
      FROM students
      WHERE enrollment_year = ? AND status = 'active'
    `,
      [academic_year]
    );

    // Exam statistics
    const [examStats] = await db.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_final = 1 THEN 1 END) as final_exams,
        COUNT(CASE WHEN is_final = 0 THEN 1 END) as regular_exams,
        COUNT(CASE WHEN exam_date >= CURDATE() THEN 1 END) as upcoming,
        COUNT(CASE WHEN exam_date < CURDATE() THEN 1 END) as completed
      FROM exams
      WHERE academic_year = ?
    `,
      [academic_year]
    );

    // Marks completion rate
    const [marksStats] = await db.query(
      `
      SELECT 
        COUNT(DISTINCT m.student_id) as students_with_marks,
        COUNT(*) as total_marks_entries
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      WHERE e.academic_year = ?
    `,
      [academic_year]
    );

    res.json({
      academic_year,
      students: studentStats[0],
      exams: examStats[0],
      marks: marksStats[0],
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Year Summary Error:", error);
    res.status(500).json({
      message: "Failed to load year summary",
      error: error.message,
    });
  }
};

// @desc    Get Performance Analytics
// @route   GET /api/dashboard/analytics?academic_year=2080&class_level=11&faculty=Science
const getPerformanceAnalytics = async (req, res) => {
  try {
    const { academic_year, class_level, faculty } = req.query;

    let whereClause = "1=1";
    const params = [];

    if (academic_year) {
      whereClause += " AND e.academic_year = ?";
      params.push(academic_year);
    }

    if (class_level) {
      whereClause += " AND s.class_level = ?";
      params.push(class_level);
    }

    if (faculty && faculty !== "All") {
      whereClause += " AND s.faculty = ?";
      params.push(faculty);
    }

    // Average GPA by exam
    const [gpaByExam] = await db.query(
      `
      SELECT 
        e.exam_name,
        e.exam_date,
        AVG(m.grade_point) as avg_gpa,
        COUNT(DISTINCT m.student_id) as student_count
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN students s ON m.student_id = s.id
      WHERE ${whereClause}
      GROUP BY e.id, e.exam_name, e.exam_date
      ORDER BY e.exam_date DESC
      LIMIT 10
    `,
      params
    );

    // Grade distribution
    const [gradeDistribution] = await db.query(
      `
      SELECT 
        m.final_grade,
        COUNT(*) as count
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN students s ON m.student_id = s.id
      WHERE ${whereClause}
      GROUP BY m.final_grade
      ORDER BY m.final_grade
    `,
      params
    );

    // Subject-wise performance
    const [subjectPerformance] = await db.query(
      `
      SELECT 
        sub.subject_name,
        AVG(m.grade_point) as avg_gpa,
        COUNT(DISTINCT m.student_id) as student_count
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e ON m.exam_id = e.id
      JOIN students s ON m.student_id = s.id
      WHERE ${whereClause}
      GROUP BY sub.id, sub.subject_name
      ORDER BY avg_gpa DESC
    `,
      params
    );

    res.json({
      gpa_by_exam: gpaByExam,
      grade_distribution: gradeDistribution,
      subject_performance: subjectPerformance,
      filters: {
        academic_year,
        class_level,
        faculty,
      },
    });
  } catch (error) {
    console.error("❌ Performance Analytics Error:", error);
    res.status(500).json({
      message: "Failed to load performance analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  quickSearch,
  getYearSummary,
  getPerformanceAnalytics,
};
