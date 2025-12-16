import api from "./api";

// 1. Get Gradesheet Data
// Fetches student details + subject marks + calculated GPA
// Optional: Pass examId if you want a specific term, otherwise defaults to Final
export const getGradesheet = async (studentId, examId = null) => {
  // If examId exists, append it to query string: ?examId=123
  const url = examId
    ? `/reports/gradesheet/${studentId}?examId=${examId}`
    : `/reports/gradesheet/${studentId}`;

  const { data } = await api.get(url);
  return data;
};

// 2. Get Certificate Data
// Fetches bio data + cumulative GPA
export const getCertificate = async (studentId) => {
  const { data } = await api.get(`/reports/certificate/${studentId}`);
  return data;
};
