const db = require("../config/db");
const { deleteOldFile } = require("../middleware/schoolUploadMiddleware");

// @desc    Get School Settings
// @route   GET /api/school-settings
// @access  Private
const getSchoolSettings = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM school_settings WHERE id = 1");

    if (rows.length === 0) {
      return res.status(404).json({
        message: "School settings not found. Please run migration script.",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get School Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update School Settings (Text Fields Only)
// @route   PUT /api/school-settings
// @access  Private
const updateSchoolSettings = async (req, res) => {
  try {
    const {
      school_name,
      school_address,
      school_phone,
      school_email,
      school_website,
      principal_name,
    } = req.body;

    // Validation
    if (!school_name || !school_address || !principal_name) {
      return res.status(400).json({
        message: "School name, address, and principal name are required.",
      });
    }

    // Email validation (basic)
    if (school_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(school_email)) {
        return res.status(400).json({
          message: "Invalid email format.",
        });
      }
    }

    // Update query
    await db.query(
      `UPDATE school_settings 
       SET school_name = ?, 
           school_address = ?, 
           school_phone = ?, 
           school_email = ?, 
           school_website = ?, 
           principal_name = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [
        school_name,
        school_address,
        school_phone || null,
        school_email || null,
        school_website || null,
        principal_name,
      ]
    );

    // Fetch updated settings
    const [updated] = await db.query(
      "SELECT * FROM school_settings WHERE id = 1"
    );

    res.json({
      message: "School settings updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update School Settings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload School Logo
// @route   POST /api/school-settings/upload-logo
// @access  Private
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const logoPath = `/uploads/school/logos/${req.file.filename}`;

    // Get current settings to delete old logo
    const [current] = await db.query(
      "SELECT school_logo_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].school_logo_path) {
      deleteOldFile(current[0].school_logo_path);
    }

    // Update database
    await db.query(
      "UPDATE school_settings SET school_logo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
      [logoPath]
    );

    console.log("✅ School logo uploaded:", logoPath);

    res.json({
      message: "Logo uploaded successfully",
      logoPath,
    });
  } catch (error) {
    console.error("Upload Logo Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload School Seal
// @route   POST /api/school-settings/upload-seal
// @access  Private
const uploadSeal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const sealPath = `/uploads/school/seals/${req.file.filename}`;

    // Get current settings to delete old seal
    const [current] = await db.query(
      "SELECT school_seal_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].school_seal_path) {
      deleteOldFile(current[0].school_seal_path);
    }

    // Update database
    await db.query(
      "UPDATE school_settings SET school_seal_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
      [sealPath]
    );

    console.log("✅ School seal uploaded:", sealPath);

    res.json({
      message: "Seal uploaded successfully",
      sealPath,
    });
  } catch (error) {
    console.error("Upload Seal Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload Principal Signature
// @route   POST /api/school-settings/upload-signature
// @access  Private
const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const signaturePath = `/uploads/school/signatures/${req.file.filename}`;

    // Get current settings to delete old signature
    const [current] = await db.query(
      "SELECT principal_signature_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].principal_signature_path) {
      deleteOldFile(current[0].principal_signature_path);
    }

    // Update database
    await db.query(
      "UPDATE school_settings SET principal_signature_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
      [signaturePath]
    );

    console.log("✅ Principal signature uploaded:", signaturePath);

    res.json({
      message: "Signature uploaded successfully",
      signaturePath,
    });
  } catch (error) {
    console.error("Upload Signature Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete School Logo
// @route   DELETE /api/school-settings/delete-logo
// @access  Private
const deleteLogo = async (req, res) => {
  try {
    const [current] = await db.query(
      "SELECT school_logo_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].school_logo_path) {
      deleteOldFile(current[0].school_logo_path);
      await db.query(
        "UPDATE school_settings SET school_logo_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      );

      console.log("✅ School logo deleted");

      res.json({ message: "Logo deleted successfully" });
    } else {
      res.status(404).json({ message: "No logo found to delete" });
    }
  } catch (error) {
    console.error("Delete Logo Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete School Seal
// @route   DELETE /api/school-settings/delete-seal
// @access  Private
const deleteSeal = async (req, res) => {
  try {
    const [current] = await db.query(
      "SELECT school_seal_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].school_seal_path) {
      deleteOldFile(current[0].school_seal_path);
      await db.query(
        "UPDATE school_settings SET school_seal_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      );

      console.log("✅ School seal deleted");

      res.json({ message: "Seal deleted successfully" });
    } else {
      res.status(404).json({ message: "No seal found to delete" });
    }
  } catch (error) {
    console.error("Delete Seal Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Principal Signature
// @route   DELETE /api/school-settings/delete-signature
// @access  Private
const deleteSignature = async (req, res) => {
  try {
    const [current] = await db.query(
      "SELECT principal_signature_path FROM school_settings WHERE id = 1"
    );

    if (current.length > 0 && current[0].principal_signature_path) {
      deleteOldFile(current[0].principal_signature_path);
      await db.query(
        "UPDATE school_settings SET principal_signature_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      );

      console.log("✅ Principal signature deleted");

      res.json({ message: "Signature deleted successfully" });
    } else {
      res.status(404).json({ message: "No signature found to delete" });
    }
  } catch (error) {
    console.error("Delete Signature Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export all controller functions
module.exports = {
  getSchoolSettings,
  updateSchoolSettings,
  uploadLogo,
  uploadSeal,
  uploadSignature,
  deleteLogo,
  deleteSeal,
  deleteSignature,
};
