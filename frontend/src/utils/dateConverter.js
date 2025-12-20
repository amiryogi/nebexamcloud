// src/utils/dateConverter.js

import NepaliDate from "nepali-date-converter";

/**
 * Converts a Nepali Date (BS) string to Gregorian Date (AD) string.
 * @param {string} bsDateString - Format "YYYY-MM-DD"
 * @returns {string|null} - Format "YYYY-MM-DD" or null if conversion fails
 */
export const convertBStoAD = (bsDateString) => {
  try {
    if (!bsDateString) {
      return null;
    }

    // Clean and parse the date string
    const cleanDate = bsDateString.replace(/[\/.]/g, "-").trim();
    const parts = cleanDate.split("-");

    if (parts.length !== 3) {
      console.error(`Invalid format: ${bsDateString}. Expected YYYY-MM-DD`);
      return null;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error(`Invalid date components: ${year}-${month}-${day}`);
      return null;
    }

    // Validate ranges
    if (year < 2000 || year > 2200) {
      console.error(`Year out of range: ${year}`);
      return null;
    }
    if (month < 1 || month > 12) {
      console.error(`Month out of range: ${month}`);
      return null;
    }
    if (day < 1 || day > 32) {
      console.error(`Day out of range: ${day}`);
      return null;
    }

    // Create Nepali Date object and convert
    // nepali-date-converter uses 0-indexed months
    const nepaliDate = new NepaliDate(year, month - 1, day);
    const adDate = nepaliDate.toJsDate();

    // Verify the conversion worked
    if (!adDate || isNaN(adDate.getTime())) {
      console.error("Invalid date conversion");
      return null;
    }

    // Format as YYYY-MM-DD
    const yyyy = adDate.getFullYear();
    const mm = String(adDate.getMonth() + 1).padStart(2, "0");
    const dd = String(adDate.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error(`BS to AD Conversion Failed:`, error);
    console.error(`Input: ${bsDateString}`);
    return null;
  }
};

/**
 * Converts AD date to BS date string
 * @param {Date|string} adDate - AD date
 * @returns {string|null} - Format "YYYY-MM-DD" in BS
 */
export const convertADtoBS = (adDate) => {
  try {
    const date = typeof adDate === "string" ? new Date(adDate) : adDate;

    if (isNaN(date.getTime())) {
      console.error("Invalid AD date");
      return null;
    }

    const nepaliDate = new NepaliDate(date);

    // Get components (library uses 0-indexed months)
    const year = nepaliDate.getYear();
    const month = nepaliDate.getMonth() + 1; // Convert to 1-indexed
    const day = nepaliDate.getDate();

    // Format with padding
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    return `${year}-${monthStr}-${dayStr}`;
  } catch (error) {
    console.error(`AD to BS Conversion Failed:`, error);
    console.error(`Input: ${adDate}`);
    return null;
  }
};

/**
 * Validates if a BS date string is in correct format
 * @param {string} bsDate - Format "YYYY-MM-DD"
 * @returns {boolean}
 */
export const isValidBSDate = (bsDate) => {
  if (!bsDate) return false;

  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(bsDate)) return false;

  const [year, month, day] = bsDate.split("-").map(Number);

  return (
    year >= 2000 &&
    year <= 2200 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 32
  );
};
