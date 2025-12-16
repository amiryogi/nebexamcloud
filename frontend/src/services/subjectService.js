import api from "./api";

// 1. Get all subjects
// Supports filtering: getAllSubjects({ class_level: '12', faculty: 'Science' })
// If no params are passed, it fetches ALL subjects (useful for the management table)
export const getAllSubjects = async (params) => {
  const { data } = await api.get("/subjects", { params });
  return data;
};

// 2. Create Subject
export const createSubject = async (subjectData) => {
  const { data } = await api.post("/subjects", subjectData);
  return data;
};

// 3. Update Subject
export const updateSubject = async (id, subjectData) => {
  const { data } = await api.put(`/subjects/${id}`, subjectData);
  return data;
};

// 4. Delete Subject
export const deleteSubject = async (id) => {
  const { data } = await api.delete(`/subjects/${id}`);
  return data;
};
