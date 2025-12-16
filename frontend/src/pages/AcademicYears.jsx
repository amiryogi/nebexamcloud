import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, CheckCircle, BarChart3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const AcademicYears = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  const [formData, setFormData] = useState({
    year_name: "",
    start_date_bs: "",
    start_date_ad: "",
    end_date_bs: "",
    end_date_ad: "",
    status: "upcoming",
  });

  const getAuthHeaders = () => {
    let token = localStorage.getItem("token");
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {}
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic-years`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch academic years");
      const data = await res.json();
      setYears(data);
    } catch (error) {
      toast.error("Failed to load academic years");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedYear
        ? `${API_BASE_URL}/api/academic-years/${selectedYear.id}`
        : `${API_BASE_URL}/api/academic-years`;

      const method = selectedYear ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }

      toast.success(
        selectedYear
          ? "Academic year updated successfully"
          : "Academic year created successfully"
      );
      setShowModal(false);
      resetForm();
      fetchAcademicYears();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSetCurrent = async (yearId) => {
    if (!window.confirm("Set this as the current academic year?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/academic-years/${yearId}/set-current`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error("Failed to set current year");

      toast.success("Current academic year updated!");
      fetchAcademicYears();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (yearId) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/academic-years/${yearId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success("Academic year deleted successfully");
      fetchAcademicYears();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openEditModal = (year) => {
    setSelectedYear(year);
    setFormData({
      year_name: year.year_name,
      start_date_bs: year.start_date_bs,
      start_date_ad: year.start_date_ad,
      end_date_bs: year.end_date_bs,
      end_date_ad: year.end_date_ad,
      status: year.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedYear(null);
    setFormData({
      year_name: "",
      start_date_bs: "",
      start_date_ad: "",
      end_date_bs: "",
      end_date_ad: "",
      status: "upcoming",
    });
  };

  const getStatusBadge = (status, isCurrent) => {
    if (isCurrent) {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
          <CheckCircle size={14} /> Current
        </span>
      );
    }

    const badges = {
      upcoming: "bg-blue-100 text-blue-700",
      active: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`${badges[status]} px-3 py-1 rounded-full text-xs font-bold uppercase`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Academic Years
          </h1>
          <p className="text-gray-500 text-sm">
            Manage academic years for your school
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} /> Add New Year
        </button>
      </div>

      {/* Academic Years Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((year) => (
          <div
            key={year.id}
            className={`bg-white p-6 rounded-xl shadow-sm border-2 ${
              year.is_current
                ? "border-green-500 shadow-lg"
                : "border-gray-200"
            } hover:shadow-md transition`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-6 h-6" />
              </div>
              {getStatusBadge(year.status, year.is_current)}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {year.year_name}
            </h3>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>
                <span className="font-semibold">Start:</span>{" "}
                {year.start_date_bs} ({new Date(year.start_date_ad).toLocaleDateString()})
              </p>
              <p>
                <span className="font-semibold">End:</span> {year.end_date_bs}{" "}
                ({new Date(year.end_date_ad).toLocaleDateString()})
              </p>
            </div>

            <div className="flex gap-2">
              {!year.is_current && (
                <button
                  onClick={() => handleSetCurrent(year.id)}
                  className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition flex items-center justify-center gap-1"
                >
                  <CheckCircle size={16} /> Set Current
                </button>
              )}
              
              <button
                onClick={() => openEditModal(year)}
                className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Edit
              </button>
              
              {!year.is_current && (
                <button
                  onClick={() => handleDelete(year.id)}
                  className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {years.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Academic Years Found
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first academic year to get started
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Add Academic Year
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {selectedYear ? "Edit Academic Year" : "Create Academic Year"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2081-2082"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.year_name}
                  onChange={(e) =>
                    setFormData({ ...formData, year_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date (BS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2081-01-01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.start_date_bs}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date_bs: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date (AD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.start_date_ad}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date_ad: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (BS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2081-12-30"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.end_date_bs}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date_bs: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (AD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.end_date_ad}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date_ad: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {selectedYear ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYears;