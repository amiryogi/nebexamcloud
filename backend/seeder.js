const db = require("./config/db");
const bcrypt = require("bcryptjs");

const seedData = async () => {
  const connection = await db.getConnection();

  try {
    console.log("🌱 Starting Database Seeder...");

    console.log("👤 Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("amir", salt); // Default Password

    await connection.query(
      `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ["admin", hashedPassword, "admin"]
    );
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

seedData();
