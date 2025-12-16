const NepaliDate = require("nepali-date-converter");

/**
 * Converts a Nepali Date (BS) string to Gregorian Date (AD) string.
 * @param {string} bsDateString - Format "YYYY-MM-DD"
 * @returns {string} - Format "YYYY-MM-DD"
 */
const convertBStoAD = (bsDateString) => {
  try {
    if (!bsDateString) {
      throw new Error("Date string is empty");
    }

    // 1. Sanitize separators (allow -, /, .)
    // This handles 2054-05-01, 2054/05/01, or 2054.05.01
    const cleanDate = bsDateString.replace(/[\/.]/g, "-");
    const parts = cleanDate.split("-");

    if (parts.length !== 3) {
      throw new Error("Invalid format. Expected YYYY-MM-DD");
    }

    // 2. Parse numbers
    const yy = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10) - 1; // IMPORTANT: Library uses 0-11 for months (0 = Baishakh)
    const dd = parseInt(parts[2], 10);

    // 3. Create Date Object
    const bsDate = new NepaliDate(yy, mm, dd);

    // 4. Convert to AD
    const adDate = bsDate.toJsDate();
    return adDate.toISOString().split("T")[0];
  } catch (error) {
    console.error(
      "BS to AD Conversion Error for:",
      bsDateString,
      error.message
    );
    return null; // Controller will catch this and throw "Invalid BS Date format"
  }
};

module.exports = { convertBStoAD };
