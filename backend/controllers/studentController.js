const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { convertBStoAD } = require("../utils/dateConverter");

// Configure multer for student images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/students";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `student_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValid =
      allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
      allowedTypes.test(file.mimetype);
    isValid
      ? cb(null, true)
      : cb(new Error("Only image files (jpeg, jpg, png) are allowed"));
  },
});

// @desc    Get all students with filters
// @route   GET /api/students?class_level=11&faculty=Science&status=active&academic_year_id=1
const getAllStudents = async (req, res) => {
  try {
    const { class_level, faculty, status, academic_year_id, search } = req.query;

    let query = `
      SELECT 
        s.*,
        ay.year_name,
        ay.is_current as is_current_year
      FROM students s
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];

    // YEAR FILTER - If not provided, default to current year
    if (academic_year_id) {
      query += " AND s.academic_year_id = ?";
      params.push(academic_year_id);
    } else {
      // Default to current academic year if no year specified
      query += " AND ay.is_current = TRUE";
    }

    if (class_level) {
      query += " AND s.class_level = ?";
      params.push(class_level);
    }

    if (faculty) {
      query += " AND s.faculty = ?";
      params.push(faculty);
    }

    if (status) {
      query += " AND s.status = ?";
      params.push(status);
    }

    if (search) {
      query += ` AND (
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        s.registration_no LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY s.created_at DESC";

    const [students] = await db.query(query, params);
    res.json(students);
  } catch (error) {
    console.error("Get Students Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `SELECT 
        s.*,
        ay.year_name,
        ay.start_date_bs,
        ay.end_date_bs,
        ay.is_current as is_current_year
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.id = ?`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get enrolled subjects
    const [subjects] = await db.query(
      `SELECT 
        s.id, s.subject_name, s.theory_code, s.practical_code,
        s.theory_credit_hour, s.practical_credit_hour,
        ss.academic_year
       FROM student_subjects ss
       JOIN subjects s ON ss.subject_id = s.id
       WHERE ss.student_id = ?`,
      [id]
    );

    res.json({
      ...students[0],
      subjects,
    });
  } catch (error) {
    console.error("Get Student Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new student
// @route   POST /api/students
const createStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      registration_no,
      symbol_no,
      first_name,
      middle_name,
      last_name,
      gender,
      dob_ad,
      dob_bs,
      parent_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      academic_year_id,
      subjects,
    } = req.body;

    // 🆕 AUTO-CONVERT BS DATE TO AD IF NOT PROVIDED
    let finalDobAd = dob_ad;
    let finalDobBs = dob_bs;

    if (!finalDobAd && finalDobBs) {
      // Convert BS to AD
      finalDobAd = convertBStoAD(finalDobBs);
      
      if (!finalDobAd) {
        await connection.rollback();
        return res.status(400).json({
          message: `Invalid date of birth (BS): ${finalDobBs}. Please use format YYYY-MM-DD`,
        });
      }
      
      console.log(`✅ Converted DOB: ${finalDobBs} (BS) → ${finalDobAd} (AD)`);
    }

    if (!finalDobAd) {
      await connection.rollback();
      return res.status(400).json({
        message: "Date of birth is required (either dob_bs or dob_ad)",
      });
    }

    // AUTO-ASSIGN CURRENT ACADEMIC YEAR IF NOT PROVIDED
    let yearId = academic_year_id;

    if (!yearId) {
      const [currentYear] = await connection.query(
        "SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1"
      );

      if (currentYear.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          message: "No current academic year found. Please create one first.",
        });
      }

      yearId = currentYear[0].id;
      console.log(`✅ Auto-assigned to current academic year: ${yearId}`);
    }

    const image_url = req.file
      ? `/uploads/students/${req.file.filename}`
      : null;

    // Insert student
    const [result] = await connection.query(
      `INSERT INTO students 
      (registration_no, symbol_no, first_name, middle_name, last_name, 
       gender, dob_ad, dob_bs, parent_name, enrollment_year, 
       class_level, faculty, section, address, contact_no, 
       image_url, academic_year_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        registration_no,
        symbol_no,
        first_name,
        middle_name,
        last_name,
        gender,
        finalDobAd,
        finalDobBs,
        parent_name,
        enrollment_year,
        class_level,
        faculty,
        section,
        address,
        contact_no,
        image_url,
        yearId,
      ]
    );

    const studentId = result.insertId;

    // Enroll subjects
    if (subjects && subjects.length > 0) {
      const subjectValues = subjects.map((subjectId) => [
        studentId,
        subjectId,
        enrollment_year,
      ]);

      await connection.query(
        "INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?",
        [subjectValues]
      );
    }

    await connection.commit();

    console.log(
      `✅ Student created: ${first_name} ${last_name} (Year: ${yearId})`
    );

    res.status(201).json({
      message: "Student created successfully",
      studentId,
      academic_year_id: yearId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Student Error:", error);

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Registration number or symbol number already exists",
      });
    }

    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
const updateStudent = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      registration_no,
      symbol_no,
      first_name,
      middle_name,
      last_name,
      gender,
      dob_ad,
      dob_bs,
      parent_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      status,
      academic_year_id,
      subjects,
    } = req.body;

    const [existing] = await connection.query(
      "SELECT * FROM students WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    // 🆕 AUTO-CONVERT BS DATE TO AD IF NEEDED
    let finalDobAd = dob_ad || existing[0].dob_ad;
    let finalDobBs = dob_bs || existing[0].dob_bs;

    // If BS date changed but AD not provided, convert it
    if (dob_bs && dob_bs !== existing[0].dob_bs && !dob_ad) {
      finalDobAd = convertBStoAD(dob_bs);
      
      if (!finalDobAd) {
        await connection.rollback();
        return res.status(400).json({
          message: `Invalid date of birth (BS): ${dob_bs}`,
        });
      }
      
      console.log(`✅ Converted DOB: ${finalDobBs} (BS) → ${finalDobAd} (AD)`);
    }

    let image_url = existing[0].image_url;

    if (req.file) {
      if (existing[0].image_url) {
        const oldPath = `.${existing[0].image_url}`;
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      image_url = `/uploads/students/${req.file.filename}`;
    }

    // Update student
    let updateQuery = `
      UPDATE students 
      SET registration_no = ?, symbol_no = ?, first_name = ?, 
          middle_name = ?, last_name = ?, gender = ?, dob_ad = ?, 
          dob_bs = ?, parent_name = ?, enrollment_year = ?, 
          class_level = ?, faculty = ?, section = ?, address = ?, 
          contact_no = ?, status = ?, image_url = ?
    `;

    const updateParams = [
      registration_no,
      symbol_no,
      first_name,
      middle_name,
      last_name,
      gender,
      finalDobAd,
      finalDobBs,
      parent_name,
      enrollment_year,
      class_level,
      faculty,
      section,
      address,
      contact_no,
      status,
      image_url,
    ];

    // Add academic year if provided
    if (academic_year_id !== undefined) {
      updateQuery += ", academic_year_id = ?";
      updateParams.push(academic_year_id);
    }

    updateQuery += " WHERE id = ?";
    updateParams.push(id);

    await connection.query(updateQuery, updateParams);

    // Update subjects
    if (subjects) {
      await connection.query(
        "DELETE FROM student_subjects WHERE student_id = ?",
        [id]
      );

      if (subjects.length > 0) {
        const subjectValues = subjects.map((subjectId) => [
          id,
          subjectId,
          enrollment_year,
        ]);

        await connection.query(
          "INSERT INTO student_subjects (student_id, subject_id, academic_year) VALUES ?",
          [subjectValues]
        );
      }
    }

    await connection.commit();
    console.log(`✅ Student updated: ID ${id}`);

    res.json({ message: "Student updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update Student Error:", error);

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query("SELECT * FROM students WHERE id = ?", [
      id,
    ]);

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (students[0].image_url) {
      const imagePath = `.${students[0].image_url}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query("DELETE FROM students WHERE id = ?", [id]);

    console.log(`✅ Student deleted: ID ${id}`);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete Student Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students eligible for promotion
// @route   GET /api/students/promotion/eligible?class_level=11&academic_year_id=1
const getPromotionEligibleStudents = async (req, res) => {
  try {
    const { class_level, academic_year_id } = req.query;

    if (!class_level || !academic_year_id) {
      return res.status(400).json({
        message: "class_level and academic_year_id are required",
      });
    }

    const [students] = await db.query(
      `SELECT 
        s.id,
        s.registration_no,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.class_level,
        s.faculty,
        ay.year_name
       FROM students s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       WHERE s.class_level = ? 
       AND s.academic_year_id = ?
       AND s.status = 'active'
       ORDER BY s.first_name ASC`,
      [class_level, academic_year_id]
    );

    res.json(students);
  } catch (error) {
    console.error("Get Promotion Eligible Students Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getPromotionEligibleStudents,
  upload,
};