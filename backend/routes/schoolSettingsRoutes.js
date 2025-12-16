const express = require("express");
const router = express.Router();
const schoolSettingsController = require("../controllers/schoolSettingsController");
const schoolUpload = require("../middleware/schoolUploadMiddleware");

// Base path: /api/school-settings

// @route   GET /api/school-settings
// @desc    Get current school settings
// @access  Private (requires authentication)
router.get("/", schoolSettingsController.getSchoolSettings);

// @route   PUT /api/school-settings
// @desc    Update school settings (text fields only)
// @access  Private (requires authentication)
router.put("/", schoolSettingsController.updateSchoolSettings);

// @route   POST /api/school-settings/upload-logo
// @desc    Upload school logo
// @access  Private (requires authentication)
router.post(
  "/upload-logo",
  schoolUpload.single("logo"),
  schoolSettingsController.uploadLogo
);

// @route   POST /api/school-settings/upload-seal
// @desc    Upload school seal
// @access  Private (requires authentication)
router.post(
  "/upload-seal",
  schoolUpload.single("seal"),
  schoolSettingsController.uploadSeal
);

// @route   POST /api/school-settings/upload-signature
// @desc    Upload principal signature
// @access  Private (requires authentication)
router.post(
  "/upload-signature",
  schoolUpload.single("signature"),
  schoolSettingsController.uploadSignature
);

// @route   DELETE /api/school-settings/delete-logo
// @desc    Delete school logo
// @access  Private (requires authentication)
router.delete("/delete-logo", schoolSettingsController.deleteLogo);

// @route   DELETE /api/school-settings/delete-seal
// @desc    Delete school seal
// @access  Private (requires authentication)
router.delete("/delete-seal", schoolSettingsController.deleteSeal);

// @route   DELETE /api/school-settings/delete-signature
// @desc    Delete principal signature
// @access  Private (requires authentication)
router.delete("/delete-signature", schoolSettingsController.deleteSignature);

module.exports = router;
