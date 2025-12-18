// Try both CommonJS and ES6 import patterns
let NepaliDate;

try {
  // Try default import first
  const imported = require("nepali-date-converter");
  NepaliDate = imported.default || imported.NepaliDate || imported;
} catch (error) {
  console.error("Failed to import nepali-date-converter:", error.message);
  throw new Error("nepali-date-converter library not found. Run: npm install nepali-date-converter");
}

/**
 * Converts a Nepali Date (BS) string to Gregorian Date (AD) string.
 * @param {string} bsDateString - Format "YYYY-MM-DD" or "YYYY/MM/DD"
 * @returns {string|null} - Format "YYYY-MM-DD" or null if conversion fails
 */
const convertBStoAD = (bsDateString) => {
  try {
    if (!bsDateString) {
      throw new Error("Date string is empty");
    }

    // Clean and parse the date string
    const cleanDate = bsDateString.replace(/[\/.]/g, "-").trim();
    const parts = cleanDate.split("-");

    if (parts.length !== 3) {
      throw new Error(`Invalid format: ${bsDateString}. Expected YYYY-MM-DD`);
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date components: ${year}-${month}-${day}`);
    }

    // Validate ranges
    if (year < 2000 || year > 2200) {
      throw new Error(`Year out of range: ${year}`);
    }
    if (month < 1 || month > 12) {
      throw new Error(`Month out of range: ${month}`);
    }
    if (day < 1 || day > 32) {
      throw new Error(`Day out of range: ${day}`);
    }

    // Create Nepali Date object
    // Different library versions use different month indexing
    let nepaliDate;
    let adDate;

    // Try with 1-indexed month first (most common)
    try {
      nepaliDate = new NepaliDate(year, month, day);
      adDate = nepaliDate.toJsDate();
      
      // Verify the conversion worked
      if (!adDate || isNaN(adDate.getTime())) {
        throw new Error("Invalid conversion with 1-indexed month");
      }
    } catch (err1) {
      // Try with 0-indexed month
      try {
        nepaliDate = new NepaliDate(year, month - 1, day);
        adDate = nepaliDate.toJsDate();
        
        if (!adDate || isNaN(adDate.getTime())) {
          throw new Error("Invalid conversion with 0-indexed month");
        }
      } catch (err2) {
        throw new Error(`Conversion failed: ${err1.message} | ${err2.message}`);
      }
    }

    // Format as YYYY-MM-DD
    return adDate.toISOString().split("T")[0];

  } catch (error) {
    console.error(`❌ BS to AD Conversion Failed`);
    console.error(`   Input: ${bsDateString}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
};

/**
 * Converts AD date to BS date string
 * @param {Date|string} adDate - AD date
 * @returns {string|null} - Format "YYYY-MM-DD" in BS
 */
const convertADtoBS = (adDate) => {
  try {
    const date = typeof adDate === 'string' ? new Date(adDate) : adDate;
    
    if (isNaN(date.getTime())) {
      throw new Error("Invalid AD date");
    }

    const nepaliDate = new NepaliDate(date);
    
    // Get components - handle both 0-indexed and 1-indexed months
    const year = nepaliDate.getYear();
    let month = nepaliDate.getMonth();
    
    // If month seems 0-indexed, add 1
    if (month < 12) {
      month = month + 1;
    }
    
    const day = nepaliDate.getDate();

    // Format with padding
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    return `${year}-${monthStr}-${dayStr}`;

  } catch (error) {
    console.error(`❌ AD to BS Conversion Failed`);
    console.error(`   Input: ${adDate}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
};

/**
 * Test the date converter to verify it's working
 * Call this on server startup to catch issues early
 */
const testDateConverter = () => {
  console.log("🧪 Testing Date Converter...");
  
  // Test BS to AD
  const testBS = "2080-01-01";
  const resultAD = convertBStoAD(testBS);
  console.log(`   BS ${testBS} → AD ${resultAD}`);
  
  // Test AD to BS
  const testAD = "2023-04-14";
  const resultBS = convertADtoBS(testAD);
  console.log(`   AD ${testAD} → BS ${resultBS}`);
  
  if (resultAD && resultBS) {
    console.log("✅ Date Converter working correctly");
  } else {
    console.error("❌ Date Converter has issues");
  }
};

module.exports = { 
  convertBStoAD, 
  convertADtoBS,
  testDateConverter 
};