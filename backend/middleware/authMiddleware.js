const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (excluding password)
      // We attach the user info to the request object so controllers can use it
      const [users] = await db.query(
        "SELECT id, username, role FROM users WHERE id = ?",
        [decoded.id]
      );

      if (users.length === 0) {
        throw new Error("User not found");
      }

      req.user = users[0];

      next(); // Move to the next middleware/controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };