const db = require("../config/db");

// @desc    Get Attendance Sheet for a specific Class & Date
// @route   GET /api/attendance?date=YYYY-MM-DD&class_level=12&faculty=Science
const getAttendance = async (req, res) => {
  try {
    const { date, class_level, faculty } = req.query;

    if (!date || !class_level || !faculty) {
      return res
        .status(400)
        .json({ message: "Date, Class, and Faculty are required" });
    }

    // 1. Get all active students for this class
    // 2. LEFT JOIN with attendance table to see if data exists for this date
    const query = `
            SELECT 
                s.id as student_id, 
                s.first_name, 
                s.last_name, 
                s.registration_no,
                a.status
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
            WHERE s.class_level = ? AND s.faculty = ?
            ORDER BY s.first_name ASC
        `;

    const [rows] = await db.query(query, [date, class_level, faculty]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save Attendance (Bulk)
// @route   POST /api/attendance
const saveAttendance = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { date, attendance_data } = req.body;
    // attendance_data = [{ student_id: 1, status: 'Present' }, ...]

    if (!date || !attendance_data || attendance_data.length === 0) {
      throw new Error("Invalid data provided");
    }

    // Loop and Upsert (Insert or Update)
    for (const entry of attendance_data) {
      const query = `
                INSERT INTO attendance (student_id, date, status)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            `;
      await connection.query(query, [entry.student_id, date, entry.status]);
    }

    await connection.commit();
    res.json({ message: "Attendance saved successfully" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = { getAttendance, saveAttendance };
