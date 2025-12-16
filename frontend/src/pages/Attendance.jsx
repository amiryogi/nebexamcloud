import { useState, useEffect } from "react";
import { getAttendance, saveAttendance } from "../services/attendanceService";
import toast from "react-hot-toast";

const Attendance = () => {
  const [loading, setLoading] = useState(false);

  // 1. Control State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default Today
  const [filters, setFilters] = useState({
    class_level: "12",
    faculty: "Science",
  });

  // 2. Data State
  const [students, setStudents] = useState([]);

  // --- Fetch Data ---
  useEffect(() => {
    fetchData();
  }, [date, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAttendance({
        date,
        class_level: filters.class_level,
        faculty: filters.faculty,
      });

      // Map data to ensure every student has a status (Default to 'Present' if null)
      const mappedData = data.map((s) => ({
        ...s,
        status: s.status || "Present",
      }));

      setStudents(mappedData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance sheet");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const toggleStatus = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, status: newStatus } : s
      )
    );
  };

  const markAll = (status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        date,
        attendance_data: students.map((s) => ({
          student_id: s.student_id,
          status: s.status,
        })),
      };

      await saveAttendance(payload);
      toast.success("Attendance saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  // --- Stats Calculation ---
  const stats = {
    total: students.length,
    present: students.filter((s) => s.status === "Present").length,
    absent: students.filter((s) => s.status === "Absent").length,
    late: students.filter((s) => s.status === "Late").length,
    leave: students.filter((s) => s.status === "Leave").length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Attendance</h1>
          <p className="text-gray-500 text-sm">Mark attendance for {date}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={handleSave}
            disabled={loading || students.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <i className="ph ph-spinner animate-spin"></i>
            ) : (
              <i className="ph ph-check-circle"></i>
            )}
            Save
          </button>
        </div>
      </div>

      {/* Filters & Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Class
            </label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-32"
              value={filters.class_level}
              onChange={(e) =>
                setFilters({ ...filters, class_level: e.target.value })
              }
            >
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Faculty
            </label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-40"
              value={filters.faculty}
              onChange={(e) =>
                setFilters({ ...filters, faculty: e.target.value })
              }
            >
              <option value="Science">Science</option>
              <option value="Management">Management</option>
              <option value="Humanities">Humanities</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-around items-center text-center">
          <div>
            <span className="block text-2xl font-bold text-gray-800">
              {stats.total}
            </span>
            <span className="text-xs text-gray-500 uppercase">Total</span>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div>
            <span className="block text-2xl font-bold text-green-600">
              {stats.present}
            </span>
            <span className="text-xs text-gray-500 uppercase">Present</span>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div>
            <span className="block text-2xl font-bold text-red-600">
              {stats.absent}
            </span>
            <span className="text-xs text-gray-500 uppercase">Absent</span>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Student List</h3>
          <div className="text-xs flex gap-2">
            <button
              onClick={() => markAll("Present")}
              className="text-green-600 hover:underline"
            >
              Mark All Present
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => markAll("Absent")}
              className="text-red-600 hover:underline"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No students found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                        ${
                                          student.status === "Present"
                                            ? "bg-green-100 text-green-700"
                                            : student.status === "Absent"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-600"
                                        }
                                    `}
                  >
                    {student.first_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Reg: {student.registration_no || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {["Present", "Absent", "Late", "Leave"].map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(student.student_id, status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                                                ${
                                                  student.status === status
                                                    ? getActiveColor(status)
                                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                                }
                                            `}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for button colors
const getActiveColor = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-600 text-white border-green-600 shadow-md shadow-green-200";
    case "Absent":
      return "bg-red-600 text-white border-red-600 shadow-md shadow-red-200";
    case "Late":
      return "bg-orange-500 text-white border-orange-500";
    case "Leave":
      return "bg-blue-500 text-white border-blue-500";
    default:
      return "bg-gray-600 text-white";
  }
};

export default Attendance;
