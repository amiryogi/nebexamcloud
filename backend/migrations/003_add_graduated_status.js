const db = require("../config/db");

/**
 * Migration: Add 'graduated' status to students
 */

const runMigration = async () => {
  const connection = await db.getConnection();

  try {
    console.log("🚀 Adding 'graduated' status to students...");

    // Check current enum values
    const [columns] = await connection.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'status'
    `);

    const currentEnum = columns[0]?.COLUMN_TYPE || "";

    if (!currentEnum.includes("graduated")) {
      console.log("📝 Updating status enum...");

      await connection.query(`
        ALTER TABLE students 
        MODIFY COLUMN status ENUM('active', 'alumni', 'dropped', 'graduated') 
        DEFAULT 'active'
      `);

      console.log("✅ 'graduated' status added successfully!");
    } else {
      console.log("✅ 'graduated' status already exists");
    }

    console.log("🎉 Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
};

runMigration();
