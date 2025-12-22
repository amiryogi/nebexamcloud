import { useState, useEffect } from "react";
import {
  TrendingUp,
  GraduationCap,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "https://svc.nevanhandicraft.com.np"; // Hardcoded for production

const StudentPromotion = () => {
  const [currentYear, setCurrentYear] = useState("");
  const [nextYear, setNextYear] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [class11Students, setClass11Students] = useState([]);
  const [class12Students, setClass12Students] = useState([]);
  const [selectedClass11, setSelectedClass11] = useState([]);
  const [selectedClass12, setSelectedClass12] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (currentYear && nextYear) {
      fetchPromotionSummary();
      fetchStudents();
    }
  }, [currentYear, nextYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/academic-years`, {
        headers: getAuthHeaders(),
      });

      // 🔧 FIX: Handle different response structures
      let yearsData = [];
      
      if (Array.isArray(response.data)) {
        yearsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        yearsData = response.data.data;
      } else if (response.data.success && Array.isArray(response.data.data)) {
        yearsData = response.data.data;
      } else {
        console.error("Unexpected API response structure:", response.data);
        yearsData = [];
      }

      setAcademicYears(yearsData);

      // Auto-select current year
      if (yearsData.length > 0) {
        const current = yearsData.find((y) => y.is_current);
        if (current) {
          setCurrentYear(current.id.toString());
          
          // Auto-select next year (if available)
          const currentIndex = yearsData.findIndex((y) => y.id === current.id);
          if (currentIndex >= 0 && currentIndex < yearsData.length - 1) {
            setNextYear(yearsData[currentIndex + 1].id.toString());
          }
        }
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Failed to load academic years");
      setAcademicYears([]);
    }
  };

  const fetchPromotionSummary = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/students/promote/summary`,
        {
          params: {
            current_year_id: currentYear,
            next_year_id: nextYear,
          },
          headers: getAuthHeaders(),
        }
      );

      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Failed to load promotion summary");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch Class 11 students
      const class11Response = await axios.get(`${API_URL}/api/students`, {
        params: {
          class_level: "11",
          academic_year_id: currentYear,
          status: "active",
        },
        headers: getAuthHeaders(),
      });

      setClass11Students(Array.isArray(class11Response.data) ? class11Response.data : []);

      // Fetch Class 12 students
      const class12Response = await axios.get(`${API_URL}/api/students`, {
        params: {
          class_level: "12",
          academic_year_id: currentYear,
          status: "active",
        },
        headers: getAuthHeaders(),
      });

      setClass12Students(Array.isArray(class12Response.data) ? class12Response.data : []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
      setClass11Students([]);
      setClass12Students([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToClass12 = async () => {
    if (selectedClass11.length === 0) {
      toast.error("Please select students to promote");
      return;
    }

    if (!window.confirm(
      `Promote ${selectedClass11.length} students from Class 11 to Class 12?`
    )) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/students/promote/to-class-12`,
        {
          student_ids: selectedClass11,
          new_academic_year_id: parseInt(nextYear),
        },
        { headers: getAuthHeaders() }
      );

      toast.success(response.data.message);
      setSelectedClass11([]);
      fetchStudents();
      fetchPromotionSummary();
    } catch (error) {
      console.error("Promotion error:", error);
      toast.error(error.response?.data?.message || "Failed to promote students");
    } finally {
      setLoading(false);
    }
  };

  const handleGraduate = async () => {
    if (selectedClass12.length === 0) {
      toast.error("Please select students to graduate");
      return;
    }

    if (!window.confirm(
      `Graduate ${selectedClass12.length} students from Class 12?`
    )) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/students/promote/graduate`,
        {
          student_ids: selectedClass12,
          graduation_date: new Date().toISOString().split("T")[0],
        },
        { headers: getAuthHeaders() }
      );

      toast.success(response.data.message);
      setSelectedClass12([]);
      fetchStudents();
      fetchPromotionSummary();
    } catch (error) {
      console.error("Graduation error:", error);
      toast.error(error.response?.data?.message || "Failed to graduate students");
    } finally {
      setLoading(false);
    }
  };

  const toggleClass11Selection = (studentId) => {
    setSelectedClass11((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleClass12Selection = (studentId) => {
    setSelectedClass12((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllClass11 = () => {
    if (selectedClass11.length === class11Students.length) {
      setSelectedClass11([]);
    } else {
      setSelectedClass11(class11Students.map((s) => s.id));
    }
  };

  const selectAllClass12 = () => {
    if (selectedClass12.length === class12Students.length) {
      setSelectedClass12([]);
    } else {
      setSelectedClass12(class12Students.map((s) => s.id));
    }
  };

  // 🔧 FIX: Safe array access with fallback
  const currentYearName = academicYears.find((y) => y.id.toString() === currentYear)?.year_name || "N/A";
  const nextYearName = academicYears.find((y) => y.id.toString() === nextYear)?.year_name || "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <TrendingUp className="text-blue-600" size={28} />
          Student Promotion System
        </h1>
        <p className="text-gray-600 mt-2">
          Promote Class 11 students to Class 12 or graduate Class 12 students
        </p>
      </div>

      {/* Year Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          Select Academic Years
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Academic Year
            </label>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Current Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_name}
                  {year.is_current ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Academic Year
            </label>
            <select
              value={nextYear}
              onChange={(e) => setNextYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Next Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentYear && nextYear && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <ArrowRight className="text-blue-600" size={20} />
            <span className="text-blue-800">
              Promoting from <strong>{currentYearName}</strong> to{" "}
              <strong>{nextYearName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <Users size={32} className="opacity-80 mb-2" />
            <h3 className="text-3xl font-bold">
              {summary.summary.class_11_eligible}
            </h3>
            <p className="text-blue-100 text-sm">Class 11 Students</p>
            <p className="text-blue-100 text-xs mt-1">Eligible for promotion</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <GraduationCap size={32} className="opacity-80 mb-2" />
            <h3 className="text-3xl font-bold">
              {summary.summary.class_12_eligible}
            </h3>
            <p className="text-green-100 text-sm">Class 12 Students</p>
            <p className="text-green-100 text-xs mt-1">Eligible for graduation</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <TrendingUp size={32} className="opacity-80 mb-2" />
            <h3 className="text-3xl font-bold">
              {summary.summary.total_students}
            </h3>
            <p className="text-purple-100 text-sm">Total Students</p>
            <p className="text-purple-100 text-xs mt-1">To be processed</p>
          </div>
        </div>
      )}

      {currentYear && nextYear && !loading && (
        <>
          {/* Class 11 Promotion Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={20} />
                    Promote Class 11 → Class 12
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {class11Students.length} students available
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={selectAllClass11}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {selectedClass11.length === class11Students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={handlePromoteToClass12}
                    disabled={selectedClass11.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition font-medium"
                  >
                    <CheckCircle size={18} />
                    Promote ({selectedClass11.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {class11Students.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>No Class 11 students found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {class11Students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => toggleClass11Selection(student.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedClass11.includes(student.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Reg: {student.registration_no}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.faculty}
                          </p>
                        </div>
                        {selectedClass11.includes(student.id) && (
                          <CheckCircle
                            className="text-blue-600 flex-shrink-0"
                            size={20}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Class 12 Graduation Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="text-green-600" size={20} />
                    Graduate Class 12 Students
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {class12Students.length} students available
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={selectAllClass12}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {selectedClass12.length === class12Students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={handleGraduate}
                    disabled={selectedClass12.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition font-medium"
                  >
                    <GraduationCap size={18} />
                    Graduate ({selectedClass12.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {class12Students.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>No Class 12 students found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {class12Students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => toggleClass12Selection(student.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedClass12.includes(student.id)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Reg: {student.registration_no}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.faculty}
                          </p>
                        </div>
                        {selectedClass12.includes(student.id) && (
                          <CheckCircle
                            className="text-green-600 flex-shrink-0"
                            size={20}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading students...</span>
        </div>
      )}

      {!currentYear || !nextYear ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">
              Select Academic Years
            </h3>
            <p className="text-yellow-700 text-sm">
              Please select both current and next academic years to view and
              promote students.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentPromotion;