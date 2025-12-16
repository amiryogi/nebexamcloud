import api from "./api";

// 1. Get all exams
// Used to list exams in the dashboard and dropdowns
export const getAllExams = async () => {
  const { data } = await api.get("/exams");
  return data;
};

// 2. Create a new exam
// Payload: { exam_name: "Term 1", exam_date: "2024-01-01", is_final: false }
export const createExam = async (examData) => {
  const { data } = await api.post("/exams", examData);
  return data;
};
