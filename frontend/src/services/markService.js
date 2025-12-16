import api from "./api";

// 1. Save Marks (Bulk Entry)
// Payload structure:
// {
//    exam_id: 1,
//    subject_id: 5,
//    marks_data: [ { student_id: 101, theory: 50, practical: 20 }, ... ]
// }
export const saveBulkMarks = async (payload) => {
  const { data } = await api.post("/marks/bulk", payload);
  return data;
};

// 2. Get Marks for a specific Exam & Subject
// Used to pre-fill the form when you want to edit marks later
export const getMarks = async (examId, subjectId) => {
  const { data } = await api.get(`/marks/${examId}/${subjectId}`);
  return data;
};
