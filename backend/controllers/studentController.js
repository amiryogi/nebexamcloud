const db = require("../config/db");
const NepaliDate = require("nepali-date-converter");
const { validateStudent } = require("../utils/validators");

// Configuration
const UPLOAD_PATH = process.env.UPLOAD_PATH || "/uploads/students";

// Helper: Convert BS to AD
const convertBStoAD = (bsDate) => {
  try {
    if (!bsDate) return null;
    const formattedDate = bsDate.replace(/\//g, "-");
    const DateConverter = NepaliDate.default || NepaliDate;
    const nepaliDateObj = new DateConverter(formattedDate);
    const adDate = nepaliDateObj.toJsDate();
    if (isNaN(adDate.getTime())) return null;
    return adDate;
  } catch (error) {
    console.error(`BS to AD Conversion Error:`, error.message);
    return null;
  }
};

const createStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const {
      first_name,
      middle_name,
      last_name,
      registration_no,
      symbol_no,
      gender,
      dob_bs,
      father_name,
      mother_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      subject_ids,
    } = req.body;

    // Input validation
    const validation = validateStudent(req.body, false);
    if (!validation.isValid) {
      connection.release();
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.errors 
      });
    }

    const dob_ad = convertBStoAD(dob_bs);
    if (!dob_ad) throw new Error("Invalid BS Date");
    const image_url = req.file
      ? `${UPLOAD_PATH}/${req.file.filename}`
      : null;

    const [result] = await connection.execute(
      `INSERT INTO students (first_name, middle_name, last_name, registration_no, symbol_no, gender, dob_bs, dob_ad, father_name, mother_name, enrollment_year, class_level, faculty, section, address, contact_no, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        middle_name,
        last_name,
        registration_no,
        symbol_no,
        gender,
        dob_bs,
        dob_ad,
        father_name,
        mother_name,
        enrollment_year,
        class_level,
        faculty,
        section,
        address,
        contact_no,
        image_url,
      ]
    );

    const newStudentId = result.insertId;

    // Subjects
    if (subject_ids) {
      let subjects = [];
      try {
        subjects =
          typeof subject_ids === "string"
            ? JSON.parse(subject_ids)
            : subject_ids;
      } catch (e) {
        console.warn("Failed to parse subject_ids in createStudent:", e.message);
      }
      if (subjects.length > 0) {
        const values = subjects.map((sid) => [
          newStudentId,
          sid,
          enrollment_year,
        ]);
        await connection.query(
          `INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?`,
          [values]
        );
      }
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Student created", studentId: newStudentId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const updateStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const studentId = req.params.id;

    const {
      first_name,
      middle_name,
      last_name,
      registration_no,
      symbol_no,
      gender,
      dob_bs,
      father_name,
      mother_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      subject_ids,
    } = req.body;

    // Input validation (isUpdate = true, so only validate provided fields)
    const validation = validateStudent(req.body, true);
    if (!validation.isValid) {
      connection.release();
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.errors 
      });
    }

    // 1. Calculate AD Date if BS date is provided
    let dob_ad = null;
    if (dob_bs) {
      dob_ad = convertBStoAD(dob_bs);
      if (!dob_ad) throw new Error("Invalid BS Date format");
    }

    // 2. Prepare Update Query
    let updateQuery = `UPDATE students SET 
            first_name=?, middle_name=?, last_name=?, 
            registration_no=?, symbol_no=?, 
            gender=?, dob_bs=?, dob_ad=?, 
            father_name=?, mother_name=?, 
            enrollment_year=?, class_level=?, faculty=?, section=?, 
            address=?, contact_no=?`;

    const params = [
      first_name,
      middle_name,
      last_name,
      registration_no,
      symbol_no,
      gender,
      dob_bs,
      dob_ad,
      father_name,
      mother_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
    ];

    // Handle Image Update (only if new file uploaded)
    if (req.file) {
      updateQuery += `, image_url=?`;
      params.push(`${UPLOAD_PATH}/${req.file.filename}`);
    }

    updateQuery += ` WHERE id=?`;
    params.push(studentId);

    await connection.execute(updateQuery, params);

    // 3. Update Subjects (Delete old, Insert new)
    if (subject_ids) {
      let subjectsToEnroll = [];
      if (typeof subject_ids === "string") {
        try {
          subjectsToEnroll = JSON.parse(subject_ids);
        } catch (e) {
          console.warn("Failed to parse subject_ids in updateStudent:", e.message);
        }
      } else if (Array.isArray(subject_ids)) {
        subjectsToEnroll = subject_ids;
      }

      // Remove existing subjects
      await connection.execute(
        `DELETE FROM student_subjects WHERE student_id = ?`,
        [studentId]
      );

      // Add new subjects
      if (subjectsToEnroll.length > 0) {
        const enrollmentValues = subjectsToEnroll.map((subId) => [
          studentId,
          subId,
          enrollment_year,
        ]);
        await connection.query(
          `INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?`,
          [enrollmentValues]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Student updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update Student Error:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const getAllStudents = async (req, res) => {
  try {
    const { class_level, faculty, search } = req.query;
    let sql = `SELECT * FROM students WHERE 1=1`;
    const params = [];
    if (class_level) {
      sql += ` AND class_level = ?`;
      params.push(class_level);
    }
    if (faculty) {
      sql += ` AND faculty = ?`;
      params.push(faculty);
    }
    if (search) {
      sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR registration_no LIKE ? OR symbol_no LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY created_at DESC`;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    // 1. Get Student Basic Info
    const [rows] = await db.query(`SELECT * FROM students WHERE id = ?`, [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = rows[0];

    // 2. Get Enrolled Subjects with Details
    const [subjects] = await db.query(
      `SELECT s.id, s.subject_name, s.theory_code, s.theory_full_marks, 
              s.practical_full_marks, s.total_credit_hour
       FROM student_subjects ss
       JOIN subjects s ON ss.subject_id = s.id
       WHERE ss.student_id = ?
       ORDER BY s.subject_name`,
      [req.params.id]
    );

    // 3. Return Student with Subjects
    res.json({
      ...student,
      subjects: subjects,
    });
  } catch (error) {
    console.error("Get Student Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  const connection = await db.getConnection();
  const studentId = req.params.id;

  console.log(`[BACKEND] Attempting to delete Student ID: ${studentId}`);

  if (!studentId || studentId === "undefined") {
    connection.release();
    return res.status(400).json({ message: "Invalid Student ID provided" });
  }

  try {
    await connection.beginTransaction();

    // 1. Manually clean up dependencies
    await connection.execute(
      `DELETE FROM student_subjects WHERE student_id = ?`,
      [studentId]
    );

    try {
      await connection.execute(`DELETE FROM attendance WHERE student_id = ?`, [
        studentId,
      ]);
    } catch (err) {
      /* Ignore table not found */
    }

    try {
      await connection.execute(`DELETE FROM marks WHERE student_id = ?`, [
        studentId,
      ]);
    } catch (err) {
      /* Ignore table not found */
    }

    // 2. Delete the Student
    const [result] = await connection.execute(
      `DELETE FROM students WHERE id = ?`,
      [studentId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      console.log(`[BACKEND] Student ID ${studentId} not found in DB.`);
      return res.status(404).json({ message: "Student not found" });
    }

    await connection.commit();
    console.log(`[BACKEND] Successfully deleted Student ID: ${studentId}`);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error(`[BACKEND] Delete Transaction Failed:`, error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Cannot delete: Student has related records that must be deleted first.",
      });
    }

    res.status(500).json({ message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  createStudent,
  updateStudent,
  getAllStudents,
  getStudentById,
  deleteStudent,
};
