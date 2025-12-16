import { useState, useEffect } from "react";
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../services/subjectService";
import { Edit, Trash2, Plus, X, BookOpen, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Initial Form State
  const initialForm = {
    subject_name: "",
    theory_code: "",
    practical_code: "",
    theory_full_marks: 75,
    practical_full_marks: 25,
    theory_credit_hour: 3.0,
    practical_credit_hour: 1.0,
    class_level: "11",
    faculty: "Science",
    is_compulsory: false,
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      // Restored usage of your existing service
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub.id);
    setFormData({
      subject_name: sub.subject_name,
      theory_code: sub.theory_code || "",
      practical_code: sub.practical_code || "",
      theory_full_marks: sub.theory_full_marks,
      practical_full_marks: sub.practical_full_marks,
      theory_credit_hour: sub.theory_credit_hour,
      practical_credit_hour: sub.practical_credit_hour,
      class_level: sub.class_level,
      faculty: sub.faculty || "",
      is_compulsory: sub.is_compulsory === 1 || sub.is_compulsory === true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteSubject(id);
      toast.success("Subject deleted");
      // Update UI immediately
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare payload (convert empty strings to null for faculty/codes)
      const payload = {
        ...formData,
        practical_code: formData.practical_code || null,
        faculty: formData.faculty || null,
      };

      if (editingId) {
        await updateSubject(editingId, payload);
        toast.success("Subject updated");
      } else {
        await createSubject(payload);
        toast.success("Subject created");
      }

      setShowModal(false);
      setEditingId(null);
      setFormData(initialForm);
      fetchSubjects();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Subject Management
          </h1>
          <p className="text-gray-500 text-sm">
            Add, Edit or correct subject codes and credit hours
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add New Subject
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
            <p>No subjects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Class/Faculty</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Codes (TH / PR)</th>
                  <th className="px-4 py-3 text-center">Marks (TH / PR)</th>
                  <th className="px-4 py-3 text-center">Credit (TH / PR)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">
                        Class {sub.class_level}
                      </span>
                      <br />
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {sub.faculty || "Compulsory"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {sub.subject_name}
                      {sub.is_compulsory === 1 && (
                        <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          REQ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-gray-400">TH:</span>
                        <span className="font-semibold text-gray-700">
                          {sub.theory_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-6 text-gray-400">PR:</span>
                        <span
                          className={
                            sub.practical_code
                              ? "text-gray-700"
                              : "text-gray-300"
                          }
                        >
                          {sub.practical_code || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {sub.theory_full_marks} / {sub.practical_full_marks}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {sub.theory_credit_hour} / {sub.practical_credit_hour}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(sub)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                          title="Edit Subject"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Subject" : "Add New Subject"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Row 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Compulsory English"
                    value={formData.subject_name}
                    onChange={(e) =>
                      setFormData({ ...formData, subject_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Class Level
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.class_level}
                    onChange={(e) =>
                      setFormData({ ...formData, class_level: e.target.value })
                    }
                  >
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Faculty
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.faculty}
                    onChange={(e) =>
                      setFormData({ ...formData, faculty: e.target.value })
                    }
                  >
                    <option value="">Compulsory (All)</option>
                    <option value="Science">Science</option>
                    <option value="Management">Management</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Codes */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                  Subject Codes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Theory Code
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Phy.101"
                      value={formData.theory_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          theory_code: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Practical Code
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. Phy.101(P)"
                      value={formData.practical_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          practical_code: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Marks & Credits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    TH Marks
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.theory_full_marks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theory_full_marks: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    PR Marks
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.practical_full_marks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        practical_full_marks: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    TH Credit
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.theory_credit_hour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theory_credit_hour: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    PR Credit
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.practical_credit_hour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        practical_credit_hour: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isComp"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  checked={formData.is_compulsory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_compulsory: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="isComp"
                  className="text-sm font-medium text-gray-700 select-none cursor-pointer"
                >
                  Is this a Compulsory Subject?
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
