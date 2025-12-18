import axios from "axios";

// Base API URL - Update this based on your environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔧 FIX: Correctly extract token from user object
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage
    let token = localStorage.getItem("token");

    // If not found directly, check inside user object
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {
          console.error("Failed to parse user from localStorage");
        }
      }
    }

    // Only add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear ALL auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== DASHBOARD APIs ====================

export const dashboardAPI = {
  // Get dashboard stats with optional academic year filter
  getStats: (academicYear) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    return api.get("/dashboard/stats", { params });
  },

  // Get recent activity
  getActivity: (academicYear) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    return api.get("/dashboard/activity", { params });
  },

  // Quick search students
  search: (query, academicYear) => {
    const params = { q: query };
    if (academicYear) params.academic_year = academicYear;
    return api.get("/dashboard/search", { params });
  },

  // Get year summary
  getYearSummary: (academicYear) => {
    return api.get(`/dashboard/year-summary/${academicYear}`);
  },

  // Get performance analytics
  getAnalytics: (filters) => {
    return api.get("/dashboard/analytics", { params: filters });
  },
};

// ==================== EXAM APIs ====================

export const examAPI = {
  // Get all exams with filters
  getAll: (filters = {}) => {
    return api.get("/exams", { params: filters });
  },

  // Get single exam
  getById: (id) => {
    return api.get(`/exams/${id}`);
  },

  // Create new exam
  create: (examData) => {
    return api.post("/exams", examData);
  },

  // Update exam
  update: (id, examData) => {
    return api.put(`/exams/${id}`, examData);
  },

  // Delete exam
  delete: (id) => {
    return api.delete(`/exams/${id}`);
  },

  // Get available academic years
  getAcademicYears: () => {
    return api.get("/academic-years");
  },

  // Get exam statistics for a year
  getStats: (academicYear) => {
    return api.get(`/exams/stats/${academicYear}`);
  },
};

// ==================== STUDENT APIs ====================

export const studentAPI = {
  // Get all students with filters
  getAll: (filters = {}) => {
    return api.get("/students", { params: filters });
  },

  // Get single student
  getById: (id) => {
    return api.get(`/students/${id}`);
  },

  // Create student
  create: (formData) => {
    return api.post("/students", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Update student
  update: (id, formData) => {
    return api.put(`/students/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete student
  delete: (id) => {
    return api.delete(`/students/${id}`);
  },
};

// ==================== SUBJECT APIs ====================

export const subjectAPI = {
  // Get all subjects with filters
  getAll: (filters = {}) => {
    return api.get("/subjects", { params: filters });
  },

  // Create subject
  create: (subjectData) => {
    return api.post("/subjects", subjectData);
  },

  // Update subject
  update: (id, subjectData) => {
    return api.put(`/subjects/${id}`, subjectData);
  },

  // Delete subject
  delete: (id) => {
    return api.delete(`/subjects/${id}`);
  },
};

// ==================== MARKS APIs ====================

export const marksAPI = {
  // Enter marks in bulk
  enterBulk: (marksData) => {
    return api.post("/marks/bulk", marksData);
  },

  // Get marks for exam and subject
  getByExamSubject: (examId, subjectId) => {
    return api.get(`/marks/${examId}/${subjectId}`);
  },

  // Get marks entry form data
  getEntryForm: (examId, subjectId, filters = {}) => {
    return api.get(`/marks/entry-form/${examId}/${subjectId}`, {
      params: filters,
    });
  },
};

// ==================== REPORT APIs ====================

export const reportAPI = {
  // Get student gradesheet
  getStudentGradesheet: (studentId, examId) => {
    return api.get(`/reports/student/${studentId}`, {
      params: { exam_id: examId },
    });
  },

  // Get class gradesheets
  getClassGradesheets: (classLevel, filters = {}) => {
    return api.get(`/reports/class/${classLevel}`, { params: filters });
  },
};

// ==================== ATTENDANCE APIs ====================

export const attendanceAPI = {
  // Get attendance sheet
  get: (date, classLevel, faculty) => {
    return api.get("/attendance", {
      params: { date, class_level: classLevel, faculty },
    });
  },

  // Save attendance
  save: (attendanceData) => {
    return api.post("/attendance", attendanceData);
  },
};

// ==================== SCHOOL SETTINGS APIs ====================

export const schoolSettingsAPI = {
  // Get school settings
  get: () => {
    return api.get("/school-settings");
  },

  // Update school settings
  update: (settingsData) => {
    return api.put("/school-settings", settingsData);
  },

  // Upload logo
  uploadLogo: (formData) => {
    return api.post("/school-settings/upload-logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Upload seal
  uploadSeal: (formData) => {
    return api.post("/school-settings/upload-seal", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Upload signature
  uploadSignature: (formData) => {
    return api.post("/school-settings/upload-signature", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete logo
  deleteLogo: () => {
    return api.delete("/school-settings/delete-logo");
  },

  // Delete seal
  deleteSeal: () => {
    return api.delete("/school-settings/delete-seal");
  },

  // Delete signature
  deleteSignature: () => {
    return api.delete("/school-settings/delete-signature");
  },
};

// ==================== AUTH APIs ====================

export const authAPI = {
  // Login
  login: (credentials) => {
    return api.post("/auth/login", credentials);
  },

  // Register
  register: (userData) => {
    return api.post("/auth/register", userData);
  },

  // Get current user
  getMe: () => {
    return api.get("/auth/me");
  },
};

export default api;
