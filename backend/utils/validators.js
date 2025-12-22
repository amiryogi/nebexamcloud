/**
 * Validation utilities for student data
 */

/**
 * Validates student data for create/update operations
 * @param {Object} data - Student data to validate
 * @param {boolean} isUpdate - If true, validation is less strict (for updates)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateStudent = (data, isUpdate = false) => {
  const errors = [];

  // For updates, only validate fields that are provided
  const checkRequired = (field, fieldName) => {
    if (!isUpdate && (!data[field] || data[field].toString().trim() === "")) {
      errors.push(`${fieldName} is required`);
      return false;
    }
    return true;
  };

  // First Name
  if (checkRequired("first_name", "First name")) {
    if (data.first_name && data.first_name.length > 50) {
      errors.push("First name must be 50 characters or less");
    }
  }

  // Last Name
  if (checkRequired("last_name", "Last name")) {
    if (data.last_name && data.last_name.length > 50) {
      errors.push("Last name must be 50 characters or less");
    }
  }

  // Middle Name (optional, but validate length if provided)
  if (data.middle_name && data.middle_name.length > 50) {
    errors.push("Middle name must be 50 characters or less");
  }

  // Registration Number
  checkRequired("registration_no", "Registration number");

  // Gender
  if (checkRequired("gender", "Gender")) {
    const validGenders = ["male", "female", "other"];
    if (
      data.gender &&
      !validGenders.includes(data.gender.toString().toLowerCase())
    ) {
      errors.push("Gender must be 'male', 'female', or 'other'");
    }
  }

  // Date of Birth (BS)
  if (checkRequired("dob_bs", "Date of birth (BS)")) {
    if (data.dob_bs) {
      // Accept formats: YYYY/MM/DD or YYYY-MM-DD
      const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
      if (!datePattern.test(data.dob_bs)) {
        errors.push(
          "Date of birth must be in format YYYY/MM/DD or YYYY-MM-DD"
        );
      }
    }
  }

  // Class Level
  if (checkRequired("class_level", "Class level")) {
    if (data.class_level) {
      const level = parseInt(data.class_level);
      if (isNaN(level) || level < 11 || level > 12) {
        errors.push("Class level must be 11 or 12");
      }
    }
  }

  // Faculty
  checkRequired("faculty", "Faculty");

  // Contact Number (optional, but validate format if provided)
  if (data.contact_no && data.contact_no.toString().trim() !== "") {
    const contactPattern = /^\d{10}$/;
    if (!contactPattern.test(data.contact_no.toString().replace(/\D/g, ""))) {
      errors.push("Contact number must be 10 digits");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateStudent,
};
