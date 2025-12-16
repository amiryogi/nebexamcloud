const db = require("../config/db");

/**
 * Migration Script: Add Academic Years System
 * This adds academic_years table and updates existing tables to support multi-year tracking
 */

const runMigration = async () => {
  const connection = await db.getConnection();

  try {
    console.log("🚀 Starting Academic Years Migration...");

    // 1. Create academic_years table
    console.log("📝 Creating 'academic_years' table...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id INT PRIMARY KEY AUTO_INCREMENT,
        year_name VARCHAR(50) NOT NULL COMMENT 'e.g., 2080-2081',
        start_date_bs VARCHAR(15) NOT NULL COMMENT 'Nepali date',
        start_date_ad DATE NOT NULL COMMENT 'English date',
        end_date_bs VARCHAR(15) NOT NULL,
        end_date_ad DATE NOT NULL,
        is_current BOOLEAN DEFAULT FALSE COMMENT 'Currently active year',
        status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_year_name (year_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    console.log("✅ Table 'academic_years' created successfully!");

    // 2. Check if we need to add academic_year_id to students table
    console.log("📝 Checking students table for academic_year_id...");
    
    const [studentColumns] = await connection.query(
      "SHOW COLUMNS FROM students LIKE 'academic_year_id'"
    );

    if (studentColumns.length === 0) {
      console.log("📝 Adding academic_year_id to students table...");
      await connection.query(`
        ALTER TABLE students 
        ADD COLUMN academic_year_id INT DEFAULT NULL AFTER enrollment_year,
        ADD KEY idx_academic_year (academic_year_id)
      `);
      console.log("✅ Added academic_year_id to students table!");
    } else {
      console.log("✅ academic_year_id already exists in students table");
    }

    // 3. Check if we need to add academic_year_id to exams table
    console.log("📝 Checking exams table for academic_year_id...");
    
    const [examColumns] = await connection.query(
      "SHOW COLUMNS FROM exams LIKE 'academic_year_id'"
    );

    if (examColumns.length === 0) {
      console.log("📝 Adding academic_year_id to exams table...");
      await connection.query(`
        ALTER TABLE exams 
        ADD COLUMN academic_year_id INT DEFAULT NULL AFTER is_final,
        ADD KEY idx_academic_year (academic_year_id)
      `);
      console.log("✅ Added academic_year_id to exams table!");
    } else {
      console.log("✅ academic_year_id already exists in exams table");
    }

    // 4. Insert default academic years (current and next)
    console.log("📝 Inserting default academic years...");

    const [existingYears] = await connection.query(
      "SELECT COUNT(*) as count FROM academic_years"
    );

    if (existingYears[0].count === 0) {
      // Insert current academic year (2080-2081)
      await connection.query(`
        INSERT INTO academic_years 
        (year_name, start_date_bs, start_date_ad, end_date_bs, end_date_ad, is_current, status) 
        VALUES 
        ('2080-2081', '2080-01-01', '2023-04-14', '2080-12-30', '2024-04-12', TRUE, 'active'),
        ('2081-2082', '2081-01-01', '2024-04-13', '2081-12-30', '2025-04-12', FALSE, 'upcoming')
      `);
      console.log("✅ Default academic years inserted!");

      // 5. Link existing students to current academic year
      console.log("📝 Linking existing students to current academic year...");
      
      const [currentYear] = await connection.query(
        "SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1"
      );

      if (currentYear.length > 0) {
        await connection.query(
          "UPDATE students SET academic_year_id = ? WHERE academic_year_id IS NULL",
          [currentYear[0].id]
        );
        console.log("✅ Existing students linked to current year!");
      }

      // 6. Link existing exams to current academic year
      console.log("📝 Linking existing exams to current academic year...");
      
      if (currentYear.length > 0) {
        await connection.query(
          "UPDATE exams SET academic_year_id = ? WHERE academic_year_id IS NULL",
          [currentYear[0].id]
        );
        console.log("✅ Existing exams linked to current year!");
      }
    } else {
      console.log("✅ Academic years already exist. Skipping insert.");
    }

    // 7. Add foreign key constraints (optional - for data integrity)
    console.log("📝 Adding foreign key constraints...");
    
    try {
      // Check if constraint already exists for students
      const [studentConstraints] = await connection.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'students' 
        AND CONSTRAINT_NAME = 'fk_students_academic_year'
      `);

      if (studentConstraints.length === 0) {
        await connection.query(`
          ALTER TABLE students 
          ADD CONSTRAINT fk_students_academic_year 
          FOREIGN KEY (academic_year_id) 
          REFERENCES academic_years(id) 
          ON DELETE SET NULL
        `);
        console.log("✅ Foreign key added to students table!");
      }

      // Check if constraint already exists for exams
      const [examConstraints] = await connection.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'exams' 
        AND CONSTRAINT_NAME = 'fk_exams_academic_year'
      `);

      if (examConstraints.length === 0) {
        await connection.query(`
          ALTER TABLE exams 
          ADD CONSTRAINT fk_exams_academic_year 
          FOREIGN KEY (academic_year_id) 
          REFERENCES academic_years(id) 
          ON DELETE SET NULL
        `);
        console.log("✅ Foreign key added to exams table!");
      }
    } catch (error) {
      console.log("⚠️  Foreign key constraints may already exist:", error.message);
    }

    console.log("🎉 Migration completed successfully!");
    console.log("\n👉 Next steps:");
    console.log("   1. Restart your backend server");
    console.log("   2. Test the Academic Year endpoints");
    console.log("   3. Update your frontend to support year filtering");
    console.log("   4. Students and Exams now support academic years!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
};

// Run the migration
runMigration();