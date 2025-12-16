import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllStudents } from "../services/studentService";
import { getAllSubjects } from "../services/subjectService";
import { saveBulkMarks, getMarks } from "../services/markService";
import toast from "react-hot-toast";

const MarksEntry = () => {
  const { examId } = useParams();
  const [loading, setLoading] = useState(false);

  // 1. Selection State
  const [filters, setFilters] = useState({
    class_level: "12",
    faculty: "Science",
  });
  const [selectedSubject, setSelectedSubject] = useState("");

  // 2. Data State
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // 3. Marks State: { studentId: { theory: 0, practical: 0 } }
  const [marksMap, setMarksMap] = useState({});

  // --- Load Subjects when Class/Faculty changes ---
  useEffect(() => {
    fetchSubjects();
  }, [filters]);

  // --- Load Students & Existing Marks when Subject changes ---
  useEffect(() => {
    if (selectedSubject) {
      fetchData();
    }
  }, [selectedSubject, filters]);

  const fetchSubjects = async () => {
    try {
      const data = await getAllSubjects(filters);
      setSubjects(data);
      setSelectedSubject(""); // Reset subject selection
      setStudents([]); // Clear grid
    } catch (error) {
      toast.error("Failed to load subjects");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Fetch Students for this Class
      const studentsData = await getAllStudents(filters);
      setStudents(studentsData);

      // B. Fetch Existing Marks (if any)
      const existingMarks = await getMarks(examId, selectedSubject);

      // C. Map existing marks to state
      const initialMarks = {};
      existingMarks.forEach((m) => {
        initialMarks[m.student_id] = {
          theory: m.theory_obtained,
          practical: m.practical_obtained,
        };
      });
      setMarksMap(initialMarks);
    } catch (error) {
      console.error(error);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleMarkChange = (studentId, field, value) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedSubject) return toast.error("Please select a subject");

    setLoading(true);
    try {
      // Convert Map back to Array for API
      // marks_data: [ { student_id: 1, theory: 50, practical: 20 }, ... ]
      const marksData = students.map((student) => {
        const entry = marksMap[student.id] || {};
        return {
          student_id: student.id,
          theory: entry.theory || 0,
          practical: entry.practical || 0,
        };
      });

      const payload = {
        exam_id: examId,
        subject_id: selectedSubject,
        marks_data: marksData,
      };

      await saveBulkMarks(payload);
      toast.success("Marks saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save marks");
    } finally {
      setLoading(false);
    }
  };

  // Find full subject object to get max marks for placeholder
  const currentSubjectObj = subjects.find((s) => s.id == selectedSubject);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Marks Entry</h1>
        <button
          onClick={handleSave}
          disabled={loading || !selectedSubject}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <i className="ph ph-spinner animate-spin"></i>
          ) : (
            <i className="ph ph-floppy-disk"></i>
          )}
          Save Marks
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
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
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Subject
          </label>
          <select
            className="border rounded-lg px-3 py-2 text-sm w-full font-medium"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Select Subject to Enter Marks --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.subject_name} ({sub.subject_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!selectedSubject ? (
          <div className="p-12 text-center text-gray-400">
            <i className="ph ph-arrow-up text-3xl mb-2"></i>
            <p>Please select a subject above to start entering marks.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="px-4 py-3 w-16">Reg No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 w-32 text-center">
                  Theory <br />
                  <span className="text-xxs text-gray-400">
                    Max: {currentSubjectObj?.theory_full_marks}
                  </span>
                </th>
                <th className="px-4 py-3 w-32 text-center">
                  Practical <br />
                  <span className="text-xxs text-gray-400">
                    Max: {currentSubjectObj?.practical_full_marks}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const marks = marksMap[student.id] || {
                  theory: "",
                  practical: "",
                };

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {student.registration_no || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="-"
                        value={marks.theory}
                        onChange={(e) =>
                          handleMarkChange(student.id, "theory", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="-"
                        value={marks.practical}
                        onChange={(e) =>
                          handleMarkChange(
                            student.id,
                            "practical",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;
