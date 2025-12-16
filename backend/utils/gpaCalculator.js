/**
 * NEB Grade Calculation Utilities
 * Based on Visual Basic logic provided
 */

/**
 * Calculate Grade Point from score and full marks
 * @param {number} score - Obtained marks
 * @param {number} fullMarks - Total marks
 * @returns {number} Grade Point (0 to 4.0)
 */
const calculateGP = (score, fullMarks) => {
  if (!fullMarks || fullMarks === 0) return 0;

  const percentage = (score / fullMarks) * 100;

  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.6;
  if (percentage >= 70) return 3.2;
  if (percentage >= 60) return 2.8;
  if (percentage >= 50) return 2.4;
  if (percentage >= 40) return 2.0;
  if (percentage >= 35) return 1.6;
  return 0;
};

/**
 * Get Letter Grade from Grade Point
 * @param {number} gp - Grade Point
 * @returns {string} Letter Grade (A+, A, B+, etc.)
 */
const getLetterGrade = (gp) => {
  if (gp === 4.0) return "A+";
  if (gp === 3.6) return "A";
  if (gp === 3.2) return "B+";
  if (gp === 2.8) return "B";
  if (gp === 2.4) return "C+";
  if (gp === 2.0) return "C";
  if (gp === 1.6) return "D";
  return "NG";
};

/**
 * Calculate Final Subject Grade using weighted average of Theory & Practical GPs
 * @param {number} gpTheory - Theory Grade Point
 * @param {number} gpPractical - Practical Grade Point
 * @param {number} chTheory - Theory Credit Hours
 * @param {number} chPractical - Practical Credit Hours
 * @returns {string} Final Letter Grade
 */
const calculateFinalGrade = (gpTheory, gpPractical, chTheory, chPractical) => {
  const totalCreditHours = chTheory + chPractical;

  if (totalCreditHours === 0) return "NG";

  // Weighted average of GPs
  const finalGP =
    (gpTheory * chTheory + gpPractical * chPractical) / totalCreditHours;

  // Convert weighted GP to grade
  if (finalGP > 3.6) return "A+";
  if (finalGP > 3.2) return "A";
  if (finalGP > 2.8) return "B+";
  if (finalGP > 2.4) return "B";
  if (finalGP > 2.0) return "C+";
  if (finalGP > 1.6) return "C";
  if (finalGP === 1.6) return "D";
  return "NG";
};

/**
 * Calculate Final Grade Point (weighted average)
 * @param {number} gpTheory - Theory Grade Point
 * @param {number} gpPractical - Practical Grade Point
 * @param {number} chTheory - Theory Credit Hours
 * @param {number} chPractical - Practical Credit Hours
 * @returns {number} Final Grade Point
 */
const calculateFinalGP = (gpTheory, gpPractical, chTheory, chPractical) => {
  const totalCreditHours = chTheory + chPractical;

  if (totalCreditHours === 0) return 0;

  return (gpTheory * chTheory + gpPractical * chPractical) / totalCreditHours;
};

/**
 * Calculate complete subject grade details
 * Returns all grade components for a subject
 */
const calculateSubjectGrades = (
  theoryObtained,
  theoryFullMarks,
  practicalObtained,
  practicalFullMarks,
  theoryCreditHour,
  practicalCreditHour
) => {
  // Calculate Theory GP and Grade
  const theoryGP = calculateGP(theoryObtained || 0, theoryFullMarks || 0);
  const theoryGrade = getLetterGrade(theoryGP);

  // Calculate Practical GP and Grade
  const practicalGP = calculateGP(
    practicalObtained || 0,
    practicalFullMarks || 0
  );
  const practicalGrade = getLetterGrade(practicalGP);

  // Calculate Final GP and Grade
  const finalGP = calculateFinalGP(
    theoryGP,
    practicalGP,
    theoryCreditHour || 0,
    practicalCreditHour || 0
  );
  const finalGrade = calculateFinalGrade(
    theoryGP,
    practicalGP,
    theoryCreditHour || 0,
    practicalCreditHour || 0
  );

  return {
    theory: {
      obtained: theoryObtained || 0,
      fullMarks: theoryFullMarks || 0,
      gradePoint: theoryGP,
      grade: theoryGrade,
      creditHour: theoryCreditHour || 0,
    },
    practical: {
      obtained: practicalObtained || 0,
      fullMarks: practicalFullMarks || 0,
      gradePoint: practicalGP,
      grade: practicalGrade,
      creditHour: practicalCreditHour || 0,
    },
    final: {
      gradePoint: parseFloat(finalGP.toFixed(2)),
      grade: finalGrade,
      totalCreditHour: (theoryCreditHour || 0) + (practicalCreditHour || 0),
    },
  };
};

/**
 * Calculate overall GPA from multiple subjects
 * @param {Array} subjects - Array of subject grade data
 * @returns {string} GPA (formatted to 2 decimal places)
 */
const calculateOverallGPA = (subjects) => {
  let totalWeightedGP = 0;
  let totalCreditHours = 0;

  subjects.forEach((subject) => {
    const creditHour = parseFloat(subject.total_credit_hour || 0);
    const gradePoint = parseFloat(subject.grade_point || 0);

    if (creditHour > 0 && gradePoint > 0) {
      totalWeightedGP += gradePoint * creditHour;
      totalCreditHours += creditHour;
    }
  });

  if (totalCreditHours === 0) return "0.00";

  return (totalWeightedGP / totalCreditHours).toFixed(2);
};

// Backward compatibility exports
const getGradeDetails = (obtainedMarks, totalMarks) => {
  const gp = calculateGP(obtainedMarks, totalMarks);
  const grade = getLetterGrade(gp);
  return { grade, point: gp };
};

const calculateFinalSubjectGrade = (
  theoryObt,
  theoryFull,
  pracObt,
  pracFull
) => {
  const totalObt = (theoryObt || 0) + (pracObt || 0);
  const totalFull = (theoryFull || 0) + (pracFull || 0);
  return getGradeDetails(totalObt, totalFull);
};

module.exports = {
  calculateGP,
  getLetterGrade,
  calculateFinalGrade,
  calculateFinalGP,
  calculateSubjectGrades,
  calculateOverallGPA,
  // Backward compatibility
  getGradeDetails,
  calculateFinalSubjectGrade,
};
