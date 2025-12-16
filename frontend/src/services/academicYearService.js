import api from "./api";

// 1. Get all academic years
export const getAllAcademicYears = async () => {
  const { data } = await api.get("/academic-years");
  return data;
};

// 2. Get current active academic year
export const getCurrentAcademicYear = async () => {
  const { data } = await api.get("/academic-years/current");
  return data;
};

// 3. Create a new academic year
// Payload: { year_name: "2081-2082", start_date_bs: "2081-04-01", end_date_bs: "2082-03-30" }
export const createAcademicYear = async (yearData) => {
  const { data } = await api.post("/academic-years", yearData);
  return data;
};

// 4. Update academic year
export const updateAcademicYear = async (id, yearData) => {
  const { data } = await api.put(`/academic-years/${id}`, yearData);
  return data;
};

// 5. Set academic year as active/current
export const setActiveAcademicYear = async (id) => {
  const { data } = await api.put(`/academic-years/${id}/set-active`);
  return data;
};

// 6. Close/Archive academic year
export const closeAcademicYear = async (id) => {
  const { data } = await api.put(`/academic-years/${id}/close`);
  return data;
};

// 7. Get students by academic year
export const getStudentsByYear = async (yearId, params = {}) => {
  const { data } = await api.get(`/academic-years/${yearId}/students`, {
    params,
  });
  return data;
};

// 8. Promote students to next year
// Payload: { from_year_id: 1, to_year_id: 2, student_ids: [1,2,3], promote_class: true }
export const promoteStudents = async (promotionData) => {
  const { data } = await api.post("/academic-years/promote", promotionData);
  return data;
};

// 9. Get promotion history
export const getPromotionHistory = async (params = {}) => {
  const { data } = await api.get("/academic-years/promotions", { params });
  return data;
};

// 10. Rollback promotion (if needed)
export const rollbackPromotion = async (promotionId) => {
  const { data } = await api.delete(
    `/academic-years/promotions/${promotionId}`
  );
  return data;
};
