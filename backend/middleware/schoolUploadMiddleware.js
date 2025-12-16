const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = {
  logo: "uploads/school/logos",
  seal: "uploads/school/seals",
  signature: "uploads/school/signatures",
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on fieldname
    let uploadPath = "uploads/school";

    if (file.fieldname === "logo") {
      uploadPath = uploadDirs.logo;
    } else if (file.fieldname === "seal") {
      uploadPath = uploadDirs.seal;
    } else if (file.fieldname === "signature") {
      uploadPath = uploadDirs.signature;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fieldPrefix = file.fieldname; // logo, seal, or signature
    cb(
      null,
      `${fieldPrefix}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File Filter (Images only - more permissive for school documents)
const fileFilter = (req, file, cb) => {
  // Accept common image formats
  const allowedTypes = /jpeg|jpg|png|gif|svg/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed! (.png, .jpg, .jpeg, .gif, .svg)"
      )
    );
  }
};

// Multer Configuration
const schoolUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (larger than student photos)
  },
  fileFilter: fileFilter,
});

/**
 * Helper function to delete old file
 * @param {string} filePath - Relative path to file (e.g., '/uploads/school/logos/logo-123.png')
 */
const deleteOldFile = (filePath) => {
  if (!filePath) return;

  try {
    // Remove leading slash and construct full path
    const fullPath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted old file: ${fullPath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${filePath}:`, error.message);
  }
};

module.exports = schoolUpload;
module.exports.deleteOldFile = deleteOldFile;