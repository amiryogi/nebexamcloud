const db = require("../config/db");

// @desc    Get all subjects
// @route   GET /api/subjects
const getAllSubjects = async (req, res) => {
  try {
    const { class_level, faculty } = req.query;

    let query = "SELECT * FROM subjects WHERE 1=1";
    const params = [];

    if (class_level) {
      query += " AND class_level = ?";
      params.push(class_level);
    }

    if (faculty) {
      query += " AND (faculty = ? OR faculty IS NULL)";
      params.push(faculty);
    }

    query += " ORDER BY class_level, faculty, subject_name";

    const [subjects] = await db.query(query, params);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
const createSubject = async (req, res) => {
  try {
    const {
      subject_name,
      theory_code,
      practical_code,
      theory_full_marks,
      practical_full_marks,
      theory_credit_hour,
      practical_credit_hour,
      class_level,
      faculty,
      is_compulsory,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO subjects (
                subject_name, theory_code, practical_code, 
                theory_full_marks, practical_full_marks, 
                theory_credit_hour, practical_credit_hour, 
                class_level, faculty, is_compulsory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject_name,
        theory_code,
        practical_code || null,
        theory_full_marks || 75,
        practical_full_marks || 25,
        theory_credit_hour || 3,
        practical_credit_hour || 1,
        class_level,
        faculty || null,
        is_compulsory ? 1 : 0,
      ]
    );
    res.status(201).json({ message: "Subject created", id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject_name,
      theory_code,
      practical_code,
      theory_full_marks,
      practical_full_marks,
      theory_credit_hour,
      practical_credit_hour,
      class_level,
      faculty,
      is_compulsory,
    } = req.body;

    await db.query(
      `UPDATE subjects SET
                subject_name=?, theory_code=?, practical_code=?,
                theory_full_marks=?, practical_full_marks=?,
                theory_credit_hour=?, practical_credit_hour=?,
                class_level=?, faculty=?, is_compulsory=?
             WHERE id=?`,
      [
        subject_name,
        theory_code,
        practical_code || null,
        theory_full_marks,
        practical_full_marks,
        theory_credit_hour,
        practical_credit_hour,
        class_level,
        faculty || null,
        is_compulsory ? 1 : 0,
        id,
      ]
    );
    res.json({ message: "Subject updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
const deleteSubject = async (req, res) => {
  try {
    await db.query("DELETE FROM subjects WHERE id=?", [req.params.id]);
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    // Handle Foreign Key constraint if subject is used in marks/enrollments
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({
          message:
            "Cannot delete: Students are already enrolled or have marks in this subject.",
        });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
