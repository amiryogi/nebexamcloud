import { useState, useEffect } from "react";
import {
  ArrowRight,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  TrendingUp,
  History,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAllAcademicYears,
  getStudentsByYear,
  promoteStudents,
  getPromotionHistory,
} from "../services/academicYearService";

const StudentPromotion = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [promoteClass, setPromoteClass] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promotionHistory, setPromotionHistory] = useState([]);

  const [filters, setFilters] = useState({
    class_level: "",
    faculty: "",
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (fromYearId) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [fromYearId, filters]);

  const fetchAcademicYears = async () => {
    try {
      const data = await getAllAcademicYears();
      setAcademicYears(data);

      // Auto-select current year as "from"
      const currentYear = data.find((y) => y.is_current);
      if (currentYear) {
        setFromYearId(currentYear.id.toString());
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load academic years");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudentsByYear(fromYearId, filters);
      setStudents(data);
      setSelectedStudents([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getPromotionHistory();
      setPromotionHistory(data);
      setShowHistory(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load promotion history");
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromote = async () => {
    if (!fromYearId || !toYearId) {
      toast.error("Please select both source and destination years");
      return;
    }

    if (fromYearId === toYearId) {
      toast.error("Source and destination years cannot be the same");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student to promote");
      return;
    }

    const confirmMsg = `Are you sure you want to promote ${
      selectedStudents.length
    } student(s) to the next academic year? ${
      promoteClass ? "Their class level will be increased (11→12)." : ""
    }`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      await promoteStudents({
        from_year_id: fromYearId,
        to_year_id: toYearId,
        student_ids: selectedStudents,
        promote_class: promoteClass,
      });

      toast.success(
        `Successfully promoted ${selectedStudents.length} students!`
      );

      // Refresh student list
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to promote students"
      );
    } finally {
      setLoading(false);
    }
  };

  const fromYear = academicYears.find((y) => y.id.toString() === fromYearId);
  const toYear = academicYears.find((y) => y.id.toString() === toYearId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Student Promotion
          </h1>
          <p className="text-gray-500 text-sm">
            Promote students to the next academic year
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <History size={18} />
          View History
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle
          className="text-yellow-600 flex-shrink-0 mt-0.5"
          size={20}
        />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Promotion moves students from one academic year to another</li>
            <li>Enable "Promote Class Level" to advance Grade 11 → Grade 12</li>
            <li>
              Grade 12 students should be marked as alumni instead of promoted
            </li>
            <li>This action can be undone from the history page</li>
          </ul>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Select Years</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* From Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Year (Source)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
            >
              <option value="">-- Select Year --</option>
              {academicYears
                .filter((y) => y.status !== "closed")
                .map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name} {year.is_current ? "(Current)" : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex justify-center items-end pb-2">
            <ArrowRight className="text-green-600" size={32} />
          </div>

          {/* To Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To Year (Destination)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={toYearId}
              onChange={(e) => setToYearId(e.target.value)}
            >
              <option value="">-- Select Year --</option>
              {academicYears
                .filter(
                  (y) => y.status !== "closed" && y.id.toString() !== fromYearId
                )
                .map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name} {year.is_current ? "(Current)" : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Promote Class Option */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={promoteClass}
              onChange={(e) => setPromoteClass(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-semibold text-gray-800">
                Promote Class Level (11 → 12)
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                Check this to automatically advance students from Grade 11 to
                Grade 12
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Filters */}
      {fromYearId && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={18} />
            <span className="text-sm font-medium">Filter Students:</span>
          </div>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            value={filters.class_level}
            onChange={(e) =>
              setFilters({ ...filters, class_level: e.target.value })
            }
          >
            <option value="">All Classes</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            value={filters.faculty}
            onChange={(e) =>
              setFilters({ ...filters, faculty: e.target.value })
            }
          >
            <option value="">All Faculties</option>
            <option value="Science">Science</option>
            <option value="Management">Management</option>
            <option value="Humanities">Humanities</option>
          </select>
        </div>
      )}

      {/* Student List */}
      {fromYearId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-gray-800">
                Students in {fromYear?.year_name}
              </h3>
              <span className="text-sm text-gray-500">
                {selectedStudents.length} of {students.length} selected
              </span>
            </div>
            {students.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
              >
                {selectedStudents.length === students.length ? (
                  <>
                    <CheckSquare size={16} /> Deselect All
                  </>
                ) : (
                  <>
                    <Square size={16} /> Select All
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">
                Try changing the filters or select a different year
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {student.first_name} {student.last_name}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Reg: {student.registration_no || "N/A"}</span>
                      <span>Class {student.class_level}</span>
                      <span>{student.faculty}</span>
                    </div>
                  </div>
                  {promoteClass && student.class_level === "11" && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                      Will become Grade 12
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promotion Button */}
      {fromYearId && toYearId && students.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ready to promote</p>
              <p className="text-lg font-bold text-gray-800">
                {selectedStudents.length} students from {fromYear?.year_name} →{" "}
                {toYear?.year_name}
              </p>
            </div>
            <button
              onClick={handlePromote}
              disabled={loading || selectedStudents.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Promoting...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Promote Students
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History size={24} />
                Promotion History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {promotionHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No promotion history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {promotionHistory.map((promo) => (
                    <div
                      key={promo.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">
                            {promo.from_year_name} → {promo.to_year_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {promo.student_count} students promoted
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(promo.promoted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {promo.promoted_by && (
                        <p className="text-xs text-gray-500">
                          By: {promo.promoted_by}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPromotion;
