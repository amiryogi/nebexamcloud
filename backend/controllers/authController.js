const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id, username, role) => {
  return jwt.sign({ id, username, role }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });
};

// @desc    Register a new Admin/Teacher
// @route   POST /api/auth/register
// @access  Public (In production, you might want to remove/protect this)
const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, password_hash, role || "admin"]
    );

    if (result.insertId) {
      res.status(201).json({
        _id: result.insertId,
        username: username,
        role: role || "admin",
        token: generateToken(result.insertId, username, role || "admin"),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for user
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      res.json({
        _id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.username, user.role),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by the middleware
    const [users] = await db.query(
      "SELECT id, username, role FROM users WHERE id = ?",
      [req.user.id]
    );
    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe };
