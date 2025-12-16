import api from "./api";

// 1. Get all students
// Supports filtering like: getAllStudents({ class_level: '12', faculty: 'Science' })
export const getAllStudents = async (params) => {
  const { data } = await api.get("/students", { params });
  return data;
};

// 2. Get single student details (including their subjects)
export const getStudentById = async (id) => {
  const { data } = await api.get(`/students/${id}`);
  return data;
};

// 3. Create a new student
// NOTE: We pass 'formData' here instead of a JSON object because
// we are uploading an image file.
export const createStudent = async (formData) => {
  const { data } = await api.post("/students", formData);
  return data;
};
// 4. Delete student
export const deleteStudent = async (id) => {
  const { data } = await api.delete(`/students/${id}`);
  return data;
};
