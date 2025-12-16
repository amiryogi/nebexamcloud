import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllExams, createExam } from "../services/examService";
import toast from "react-hot-toast";

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State for New Exam
  const [formData, setFormData] = useState({
    exam_name: "",
    exam_date: "",
    is_final: false,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await getAllExams();
      setExams(data);
    } catch (error) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExam(formData);
      toast.success("Exam created successfully");
      setShowModal(false);
      setFormData({ exam_name: "", exam_date: "", is_final: false }); // Reset
      fetchExams(); // Refresh list
    } catch (error) {
      toast.error("Failed to create exam");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
          <p className="text-gray-500 text-sm">Create exams and enter marks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <i className="ph ph-plus"></i> Create New Exam
        </button>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <i className="ph ph-exam text-2xl"></i>
              </div>
              {exam.is_final ? (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase">
                  Final Term
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">
                  Internal
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-800">
              {exam.exam_name}
            </h3>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
              <i className="ph ph-calendar"></i>{" "}
              {new Date(exam.exam_date).toDateString()}
            </p>

            <Link
              to={`/exams/${exam.id}/marks`}
              className="block w-full text-center bg-gray-50 text-gray-700 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors border border-gray-200"
            >
              Enter Marks <i className="ph ph-arrow-right ml-1"></i>
            </Link>
          </div>
        ))}
      </div>

      {loading && <p className="text-center text-gray-500">Loading exams...</p>}

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Schedule New Exam
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term 2081"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.exam_name}
                  onChange={(e) =>
                    setFormData({ ...formData, exam_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.exam_date}
                  onChange={(e) =>
                    setFormData({ ...formData, exam_date: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFinal"
                  className="w-4 h-4 text-blue-600"
                  checked={formData.is_final}
                  onChange={(e) =>
                    setFormData({ ...formData, is_final: e.target.checked })
                  }
                />
                <label htmlFor="isFinal" className="text-sm text-gray-700">
                  This is a Final Board Exam (Used for Certificates)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
