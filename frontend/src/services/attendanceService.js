import api from "./api";

// 1. Get Attendance Sheet
// Fetches the list of students for a specific date/class/faculty.
// Each student object will have a 'status' field (Present/Absent/null).
export const getAttendance = async (params) => {
  // params = { date: '2024-05-12', class_level: '12', faculty: 'Science' }
  const { data } = await api.get("/attendance", { params });
  return data;
};

// 2. Save Attendance
// Payload: { date: '2024-05-12', attendance_data: [{ student_id: 1, status: 'Present' }, ...] }
export const saveAttendance = async (payload) => {
  const { data } = await api.post("/attendance", payload);
  return data;
};
