const db = require("../config/db");

/**
 * Migration: Add missing columns to exams table
 * Adds: class_level, faculty, academic_year, remarks
 */

const runMigration = async () => {
  const connection = await db.getConnection();

  try {
    console.log("🚀 Starting Exam Table Migration...");

    // Check current columns in exams table
    const [columns] = await connection.query("SHOW COLUMNS FROM exams");
    const columnNames = columns.map((col) => col.Field);

    console.log("📋 Current columns:", columnNames);

    // Add class_level if missing
    if (!columnNames.includes("class_level")) {
      console.log("📝 Adding class_level column...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN class_level ENUM('11', '12') NULL AFTER exam_date
      `);
      console.log("✅ class_level added!");
    } else {
      console.log("✅ class_level already exists");
    }

    // Add faculty if missing
    if (!columnNames.includes("faculty")) {
      console.log("📝 Adding faculty column...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN faculty VARCHAR(50) NULL AFTER class_level
      `);
      console.log("✅ faculty added!");
    } else {
      console.log("✅ faculty already exists");
    }

    // Add academic_year if missing (legacy support)
    if (!columnNames.includes("academic_year")) {
      console.log("📝 Adding academic_year column...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN academic_year INT NULL AFTER faculty,
        ADD INDEX idx_academic_year (academic_year)
      `);
      console.log("✅ academic_year added!");
    } else {
      console.log("✅ academic_year already exists");
    }

    // Add remarks if missing
    if (!columnNames.includes("remarks")) {
      console.log("📝 Adding remarks column...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN remarks TEXT NULL AFTER academic_year_id
      `);
      console.log("✅ remarks added!");
    } else {
      console.log("✅ remarks already exists");
    }

    // Add created_at if missing
    if (!columnNames.includes("created_at")) {
      console.log("📝 Adding created_at column...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log("✅ created_at added!");
    } else {
      console.log("✅ created_at already exists");
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📋 Final exams table structure:");
    
    const [finalColumns] = await connection.query("DESCRIBE exams");
    console.table(finalColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
};

runMigration();