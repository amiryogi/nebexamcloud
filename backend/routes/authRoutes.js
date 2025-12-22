const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", protect, registerUser); // Protected: Only authenticated users can register new users
router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;
