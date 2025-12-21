import { useState, useEffect } from "react";
import { getAllStudents } from "../services/studentService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Edit,
  Trash2,
  UserPlus,
  Filter,
  User,
  Eye,
  Search,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    class_level: "",
    faculty: "",
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    // First check sessionStorage (where AuthContext stores it)
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        const token = userObj.token || userObj.accessToken;
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      } catch (e) {
        console.error("Error parsing user from sessionStorage:", e);
      }
    }

    // Fallback to localStorage for backward compatibility
    let token = localStorage.getItem("token");
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    }

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents(filters);
      setStudents(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    try {
      console.log("🗑️ Deleting student ID:", id);

      const headers = getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Student deleted successfully");
        setStudents(students.filter((s) => s.id !== id));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Delete failed:", errorData);

        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        } else {
          toast.error(errorData.message || "Failed to delete student");
        }
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Error deleting student: " + error.message);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const fullName = `${student.first_name} ${student.middle_name || ""} ${
      student.last_name
    }`.toLowerCase();
    const regNo = (student.registration_no || "").toLowerCase();
    const symbolNo = (student.symbol_no || "").toLowerCase();

    return (
      fullName.includes(searchLower) ||
      regNo.includes(searchLower) ||
      symbolNo.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500 text-sm">Manage Grade 11 & 12 students</p>
        </div>

        <Link
          to="/students/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 w-fit"
        >
          <UserPlus size={20} /> Add New Student
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        {/* Search Box */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, registration number, or symbol number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <select
            name="class_level"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleFilterChange}
            value={filters.class_level}
          >
            <option value="">All Classes</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>

          <select
            name="faculty"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleFilterChange}
            value={filters.faculty}
          >
            <option value="">All Faculties</option>
            <option value="Science">Science</option>
            <option value="Management">Management</option>
            <option value="Humanities">Humanities</option>
          </select>

          {/* Results Counter */}
          {searchTerm && (
            <span className="text-sm text-gray-600 ml-auto">
              Found{" "}
              <span className="font-semibold text-blue-600">
                {filteredStudents.length}
              </span>{" "}
              of {students.length} students
            </span>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading students...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Reg No.</th>
                  <th className="px-6 py-4 font-semibold">Student Name</th>
                  <th className="px-6 py-4 font-semibold">Class / Faculty</th>
                  <th className="px-6 py-4 font-semibold">Batch</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        {student.registration_no || (
                          <span className="text-orange-400 bg-orange-50 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                            {student.image_url ? (
                              <img
                                src={`${API_BASE_URL}${student.image_url}`}
                                alt="Student"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full items-center justify-center text-gray-400 ${
                                student.image_url ? "hidden" : "flex"
                              }`}
                            >
                              <User size={20} />
                            </div>
                          </div>
                          <div className="font-medium text-gray-900">
                            {student.first_name}{" "}
                            {student.middle_name && student.middle_name + " "}
                            {student.last_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">
                          Grade {student.class_level}
                        </span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span>{student.faculty}</span>
                      </td>
                      <td className="px-6 py-4">{student.enrollment_year}</td>

                      {/* ACTIONS COLUMN */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button */}
                          <Link
                            to={`/students/${student.id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>

                          {/* Edit Button */}
                          <Link
                            to={`/students/edit/${student.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Student"
                          >
                            <Edit size={18} />
                          </Link>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Student"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div>
                          <p className="mb-2">
                            No students found matching "{searchTerm}"
                          </p>
                          <button
                            onClick={clearSearch}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        "No students found. Try changing filters or add a new student."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredStudents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-800">
                {filteredStudents.length}
              </span>{" "}
              students displayed
            </div>
            {searchTerm && filteredStudents.length !== students.length && (
              <div className="text-gray-500">
                (filtered from {students.length} total)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
