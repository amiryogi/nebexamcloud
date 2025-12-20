const db = require("../config/db");
const NepaliDate = require("nepali-date-converter");

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

    console.log(
      "📥 CREATE STUDENT - Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("📥 CREATE STUDENT - Files:", req.file);

    const {
      first_name,
      middle_name,
      last_name,
      registration_no,
      symbol_no,
      gender,
      dob_bs,
      parent_name,
      enrollment_year,
      academic_year_id,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      subject_ids,
    } = req.body;

    // ✅ Validate required fields
    if (!first_name || !last_name || !enrollment_year) {
      throw new Error(
        "First name, last name, and enrollment year are required"
      );
    }

    // 🔥 NEW: Get academic_year_id if not provided
    let finalAcademicYearId = academic_year_id;

    if (!finalAcademicYearId) {
      console.log("⚠️ No academic year provided, fetching current year...");

      const [currentYear] = await connection.query(
        "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1"
      );

      if (currentYear.length === 0) {
        throw new Error(
          "No current academic year found. Please set one in Academic Years settings."
        );
      }

      finalAcademicYearId = currentYear[0].id;
      console.log("✅ Using current academic year ID:", finalAcademicYearId);
    }

    const dob_ad = convertBStoAD(dob_bs);
    if (!dob_ad) throw new Error("Invalid BS Date");

    const image_url = req.file
      ? `/uploads/students/${req.file.filename}`
      : null;

    // 🔥 UPDATED: Insert student WITH academic_year_id
    const [result] = await connection.execute(
      `INSERT INTO students (
        first_name, middle_name, last_name, 
        registration_no, symbol_no, 
        gender, dob_bs, dob_ad, 
        parent_name, enrollment_year, 
        academic_year_id, 
        class_level, faculty, section, 
        address, contact_no, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        middle_name || null,
        last_name,
        registration_no || null,
        symbol_no || null,
        gender,
        dob_bs,
        dob_ad,
        parent_name || null,
        enrollment_year,
        finalAcademicYearId,
        class_level,
        faculty || null,
        section || null,
        address || null,
        contact_no || null,
        image_url,
      ]
    );

    const newStudentId = result.insertId;
    console.log("✅ Student inserted with ID:", newStudentId);
    console.log("✅ Linked to academic year ID:", finalAcademicYearId);

    // ✅ Handle subject enrollment
    if (subject_ids) {
      let subjects = [];

      if (typeof subject_ids === "string") {
        try {
          subjects = JSON.parse(subject_ids);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError.message);
          subjects = subject_ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);
        }
      } else if (Array.isArray(subject_ids)) {
        subjects = subject_ids;
      }

      if (subjects && subjects.length > 0) {
        console.log(
          `📚 Inserting ${subjects.length} subjects for student ${newStudentId}`
        );

        const validSubjects = subjects.filter((sid) => {
          const id = parseInt(sid);
          return !isNaN(id) && id > 0;
        });

        if (validSubjects.length > 0) {
          const values = validSubjects.map((sid) => [
            newStudentId,
            parseInt(sid),
            enrollment_year,
          ]);

          const [subjectResult] = await connection.query(
            `INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?`,
            [values]
          );
          console.log(
            `✅ Successfully inserted ${subjectResult.affectedRows} subject enrollments`
          );
        }
      }
    }

    await connection.commit();
    console.log("✅ Transaction committed successfully");

    res.status(201).json({
      message: "Student created successfully",
      studentId: newStudentId,
      academic_year_id: finalAcademicYearId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("❌ CREATE STUDENT ERROR:", error);
    res.status(500).json({
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    connection.release();
  }
};

const updateStudent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const studentId = req.params.id;

    console.log("🔄 UPDATE STUDENT - ID:", studentId);
    console.log("🔄 UPDATE STUDENT - Body:", JSON.stringify(req.body, null, 2));

    const {
      first_name,
      middle_name,
      last_name,
      registration_no,
      symbol_no,
      gender,
      dob_bs,
      parent_name,
      enrollment_year,
      academic_year_id,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      subject_ids,
    } = req.body;

    // 1. Calculate AD Date if BS date is provided
    let dob_ad = null;
    if (dob_bs) {
      dob_ad = convertBStoAD(dob_bs);
      if (!dob_ad) throw new Error("Invalid BS Date format");
    }

    // 🔧 FIX: Handle academic_year_id properly
    let finalAcademicYearId = academic_year_id;

    if (!finalAcademicYearId || finalAcademicYearId === "") {
      console.log(
        "⚠️ No academic_year_id in request, fetching student's current value..."
      );

      const [currentStudent] = await connection.query(
        "SELECT academic_year_id FROM students WHERE id = ?",
        [studentId]
      );

      if (currentStudent.length > 0 && currentStudent[0].academic_year_id) {
        finalAcademicYearId = currentStudent[0].academic_year_id;
        console.log("✅ Using existing academic year ID:", finalAcademicYearId);
      } else {
        // If student doesn't have one, get current year
        const [currentYear] = await connection.query(
          "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1"
        );

        if (currentYear.length > 0) {
          finalAcademicYearId = currentYear[0].id;
          console.log(
            "✅ Using current academic year ID:",
            finalAcademicYearId
          );
        } else {
          // Last resort: set to null
          finalAcademicYearId = null;
          console.warn("⚠️ No academic year found, setting to NULL");
        }
      }
    }

    // 2. Prepare Update Query - Convert all undefined/empty to null
    let updateQuery = `UPDATE students SET 
            first_name=?, middle_name=?, last_name=?, 
            registration_no=?, symbol_no=?, 
            gender=?, dob_bs=?, dob_ad=?, 
            parent_name=?, enrollment_year=?, 
            academic_year_id=?,
            class_level=?, faculty=?, section=?, 
            address=?, contact_no=?`;

    // 🔧 FIX: Convert empty strings and undefined to null
    const params = [
      first_name || null,
      middle_name || null,
      last_name || null,
      registration_no || null,
      symbol_no || null,
      gender || null,
      dob_bs || null,
      dob_ad,
      parent_name || null,
      enrollment_year || null,
      finalAcademicYearId, // ✅ Always has a valid value now
      class_level || null,
      faculty || null,
      section || null,
      address || null,
      contact_no || null,
    ];

    console.log("📝 Update params (converted empty to null):", params);

    // Handle Image Update (only if new file uploaded)
    if (req.file) {
      updateQuery += `, image_url=?`;
      params.push(`/uploads/students/${req.file.filename}`);
    }

    updateQuery += ` WHERE id=?`;
    params.push(studentId);

    await connection.execute(updateQuery, params);
    console.log("✅ Student basic info updated");
    if (finalAcademicYearId) {
      console.log("✅ Academic year:", finalAcademicYearId);
    }

    // 3. Update Subjects (Delete old, Insert new)
    if (subject_ids !== undefined) {
      console.log("📚 Updating subjects for student:", studentId);
      console.log("📚 Received subject_ids:", subject_ids);

      let subjectsToEnroll = [];
      if (typeof subject_ids === "string") {
        try {
          subjectsToEnroll = JSON.parse(subject_ids);
        } catch (e) {
          console.error("❌ JSON Parse Error:", e.message);
          subjectsToEnroll = subject_ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);
        }
      } else if (Array.isArray(subject_ids)) {
        subjectsToEnroll = subject_ids;
      }

      console.log("📚 Subjects to enroll:", subjectsToEnroll);

      // Remove existing subjects
      const [deleteResult] = await connection.execute(
        `DELETE FROM student_subjects WHERE student_id = ?`,
        [studentId]
      );
      console.log(
        `🗑️ Deleted ${deleteResult.affectedRows} existing subject enrollments`
      );

      // Add new subjects
      if (subjectsToEnroll.length > 0) {
        const enrollmentValues = subjectsToEnroll
          .filter((sid) => !isNaN(parseInt(sid)))
          .map((subId) => [
            studentId,
            parseInt(subId),
            enrollment_year || null,
          ]);

        console.log("📚 Inserting subjects:", enrollmentValues);

        const [insertResult] = await connection.query(
          `INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?`,
          [enrollmentValues]
        );
        console.log(
          `✅ Inserted ${insertResult.affectedRows} new subject enrollments`
        );
      }
    }

    await connection.commit();
    console.log("✅ Update transaction committed");

    res.json({ message: "Student updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("❌ UPDATE STUDENT ERROR:", error);
    console.error("❌ Error Stack:", error.stack);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const getAllStudents = async (req, res) => {
  try {
    const { class_level, faculty, search, academic_year_id } = req.query;

    let sql = `
      SELECT 
        s.*,
        ay.year_name as academic_year_name,
        ay.is_current as is_current_year
      FROM students s
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE 1=1
    `;

    const params = [];

    if (class_level) {
      sql += ` AND s.class_level = ?`;
      params.push(class_level);
    }

    if (faculty) {
      sql += ` AND s.faculty = ?`;
      params.push(faculty);
    }

    if (search) {
      sql += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.registration_no LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (academic_year_id) {
      sql += ` AND s.academic_year_id = ?`;
      params.push(academic_year_id);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ GET ALL STUDENTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    // 1. Get Student Basic Info with Academic Year
    const [rows] = await db.query(
      `SELECT 
        s.*,
        ay.year_name as academic_year_name,
        ay.start_date_bs,
        ay.end_date_bs,
        ay.is_current as is_current_year
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = rows[0];

    // 2. Get Enrolled Subjects with Details
    const [subjects] = await db.query(
      `SELECT 
        s.id, s.subject_name, s.theory_code, s.practical_code,
        s.theory_full_marks, s.practical_full_marks, s.total_credit_hour
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
    console.error("❌ GET STUDENT ERROR:", error);
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
