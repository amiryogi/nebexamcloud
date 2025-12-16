const mysql = require("mysql2");
const dotenv = require("dotenv");

// Load env vars if this file is run independently or early
dotenv.config();

// Create a connection pool (better performance than single connections)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "neb_school_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the "promise" version so we can use async/await
module.exports = pool.promise();
