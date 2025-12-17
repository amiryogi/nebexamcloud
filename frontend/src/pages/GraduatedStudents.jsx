import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Users,
  Award,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GraduatedStudents = () => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    searchQuery: "",
    graduationYear: "",
    faculty: "",
    grade: "",
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    byYear: {},
    byFaculty: {},
    byGrade: {},
  });

  useEffect(() => {
    fetchGraduatedStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const fetchGraduatedStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/students?status=graduated`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const graduatedStudents = response.data || [];
      setStudents(graduatedStudents);
      calculateStatistics(graduatedStudents);
    } catch (error) {
      console.error("Error fetching graduated students:", error);
      toast.error("Failed to load graduated students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data) => {
    const byYear = {};
    const byFaculty = {};
    const byGrade = {};

    data.forEach((student) => {
      // By Year
      const year = student.enrollment_year || "Unknown";
      byYear[year] = (byYear[year] || 0) + 1;

      // By Faculty
      const faculty = student.faculty || "Unknown";
      byFaculty[faculty] = (byFaculty[faculty] || 0) + 1;

      // By Grade
      const grade = student.class_level || "Unknown";
      byGrade[grade] = (byGrade[grade] || 0) + 1;
    });

    setStats({
      total: data.length,
      byYear,
      byFaculty,
      byGrade,
    });
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
          student.registration_no?.toLowerCase().includes(query) ||
          student.symbol_no?.toLowerCase().includes(query)
      );
    }

    // Graduation year filter
    if (filters.graduationYear) {
      filtered = filtered.filter(
        (student) => student.enrollment_year === filters.graduationYear
      );
    }

    // Faculty filter
    if (filters.faculty) {
      filtered = filtered.filter((student) => student.faculty === filters.faculty);
    }

    // Grade filter
    if (filters.grade) {
      filtered = filtered.filter(
        (student) => student.class_level === parseInt(filters.grade)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleViewGradesheet = (studentId) => {
    navigate(`/reports/gradesheet?student=${studentId}`);
  };

  const handleViewCertificate = (studentId) => {
    navigate(`/reports/certificate?student=${studentId}`);
  };

  const handleExportData = () => {
    // Create CSV data
    const headers = [
      "Name",
      "Registration No",
      "Symbol No",
      "Grade",
      "Faculty",
      "Enrollment Year",
      "Date of Birth",
      "Contact",
    ];

    const csvData = filteredStudents.map((student) => [
      `${student.first_name} ${student.middle_name || ""} ${student.last_name}`,
      student.registration_no || "",
      student.symbol_no || "",
      student.class_level || "",
      student.faculty || "",
      student.enrollment_year || "",
      student.dob_bs || "",
      student.contact_no || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graduated-students-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Alumni data exported successfully!");
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      graduationYear: "",
      faculty: "",
      grade: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading alumni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-purple-600" size={32} />
            Alumni (Graduated Students)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage students who have completed their studies
          </p>
        </div>
        <button
          onClick={handleExportData}
          disabled={filteredStudents.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Download size={18} />
          Export Alumni Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Alumni</p>
              <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
            </div>
            <GraduationCap size={40} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Science Faculty</p>
              <h3 className="text-3xl font-bold mt-1">
                {stats.byFaculty["Science"] || 0}
              </h3>
            </div>
            <Users size={40} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Management</p>
              <h3 className="text-3xl font-bold mt-1">
                {stats.byFaculty["Management"] || 0}
              </h3>
            </div>
            <Users size={40} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Humanities</p>
              <h3 className="text-3xl font-bold mt-1">
                {stats.byFaculty["Humanities"] || 0}
              </h3>
            </div>
            <Users size={40} className="opacity-30" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or registration..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
            />
          </div>

          {/* Graduation Year */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.graduationYear}
            onChange={(e) =>
              setFilters({ ...filters, graduationYear: e.target.value })
            }
          >
            <option value="">All Years</option>
            {Object.keys(stats.byYear)
              .sort()
              .reverse()
              .map((year) => (
                <option key={year} value={year}>
                  {year} ({stats.byYear[year]})
                </option>
              ))}
          </select>

          {/* Faculty */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.faculty}
            onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
          >
            <option value="">All Faculties</option>
            <option value="Science">Science</option>
            <option value="Management">Management</option>
            <option value="Humanities">Humanities</option>
          </select>

          {/* Grade */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
          >
            <option value="">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>

        {/* Active Filters & Reset */}
        {(filters.searchQuery ||
          filters.graduationYear ||
          filters.faculty ||
          filters.grade) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.searchQuery && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                Search: {filters.searchQuery}
              </span>
            )}
            {filters.graduationYear && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                Year: {filters.graduationYear}
              </span>
            )}
            {filters.faculty && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                Faculty: {filters.faculty}
              </span>
            )}
            {filters.grade && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                Grade: {filters.grade}
              </span>
            )}
            <button
              onClick={resetFilters}
              className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredStudents.length}</span> of{" "}
          <span className="font-semibold">{students.length}</span> alumni
        </p>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Alumni Found
          </h3>
          <p className="text-gray-500">
            {filters.searchQuery || filters.graduationYear || filters.faculty || filters.grade
              ? "Try adjusting your filters"
              : "No graduated students in the system yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Student Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {student.first_name.charAt(0)}
                  {student.last_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg truncate">
                    {student.first_name} {student.middle_name} {student.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Reg: {student.registration_no || "N/A"}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      Grade {student.class_level}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {student.faculty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>Graduated: {student.enrollment_year || "N/A"}</span>
                </div>
                {student.symbol_no && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award size={16} />
                    <span>Symbol: {student.symbol_no}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(student)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Details
                </button>
                <button
                  onClick={() => handleViewGradesheet(student.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Gradesheet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Alumni Details</h2>
                <p className="text-purple-100 text-sm">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Full Name:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.first_name} {selectedStudent.middle_name}{" "}
                      {selectedStudent.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date of Birth (BS):</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.dob_bs || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.contact_no || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-purple-600" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Registration No:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.registration_no || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Symbol No:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.symbol_no || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Grade:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.class_level || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Faculty:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.faculty || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Enrollment Year:</span>
                    <p className="font-medium text-gray-800">
                      {selectedStudent.enrollment_year || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Graduated
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleViewGradesheet(selectedStudent.id)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  View Gradesheet
                </button>
                <button
                  onClick={() => handleViewCertificate(selectedStudent.id)}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Award size={18} />
                  View Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraduatedStudents;