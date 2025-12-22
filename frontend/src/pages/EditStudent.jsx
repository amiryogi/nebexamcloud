import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, Save, ArrowLeft, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    registration_no: "",
    symbol_no: "",
    gender: "Male",
    dob_bs: "",
    father_name: "",
    mother_name: "",
    enrollment_year: "",
    class_level: "11",
    faculty: "Science",
    section: "A",
    address: "",
    contact_no: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const getAuthHeaders = () => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        const token = userObj.token || userObj.accessToken;
        if (token) return { Authorization: `Bearer ${token}` };
      } catch (e) {}
    }
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

  const fetchSubjects = async (classLevel, faculty) => {
    try {
      const params = new URLSearchParams({
        class_level: classLevel,
        faculty: faculty,
      });

      const response = await fetch(`${API_BASE_URL}/api/subjects?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        setAvailableSubjects([]);
        return;
      }

      const data = await response.json();
      setAvailableSubjects(data);
    } catch (error) {
      console.error("Subject fetch error:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) throw new Error("Invalid Student ID");

        const studentRes = await fetch(`${API_BASE_URL}/api/students/${id}`, {
          headers: getAuthHeaders(),
        });

        if (!studentRes.ok) {
          if (studentRes.status === 401) throw new Error("Unauthorized");
          if (studentRes.status === 404) throw new Error("Student not found");
          throw new Error("Failed to fetch student");
        }

        const studentData = await studentRes.json();

        setFormData({
          first_name: studentData.first_name || "",
          middle_name: studentData.middle_name || "",
          last_name: studentData.last_name || "",
          registration_no: studentData.registration_no || "",
          symbol_no: studentData.symbol_no || "",
          gender: studentData.gender || "Male",
          dob_bs: studentData.dob_bs || "",
          father_name: studentData.father_name || "",
          mother_name: studentData.mother_name || "",
          enrollment_year: studentData.enrollment_year || "",
          class_level: studentData.class_level || "11",
          faculty: studentData.faculty || "Science",
          section: studentData.section || "A",
          address: studentData.address || "",
          contact_no: studentData.contact_no || "",
        });

        if (studentData.image_url) {
          const imgUrl = studentData.image_url.startsWith("http")
            ? studentData.image_url
            : `${API_BASE_URL}${studentData.image_url}`;
          setImagePreview(imgUrl);
        }

        if (studentData.subjects && Array.isArray(studentData.subjects)) {
          setSelectedSubjects(studentData.subjects.map((s) => s.id));
        }

        await fetchSubjects(
          studentData.class_level || "11",
          studentData.faculty || "Science"
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message || "Could not load student data");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAcademicChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "class_level" || name === "faculty") {
      const newClass = name === "class_level" ? value : formData.class_level;
      const newFaculty = name === "faculty" ? value : formData.faculty;
      setSelectedSubjects([]);
      await fetchSubjects(newClass, newFaculty);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (image) {
        data.append("image", image);
      }

      data.append("subject_ids", JSON.stringify(selectedSubjects));

      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: data,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Update failed");
      }

      toast.success("Student updated successfully!");
      navigate("/students");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Edit Student</h1>
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back to List
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8"
      >
        {/* Personal Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Personal Details
          </h3>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image Upload */}
            <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center gap-4">
              <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative hover:border-blue-400 transition-colors">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera className="mx-auto" size={32} />
                    <p className="text-xs mt-1">Upload Photo</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Click to change
              </p>
            </div>

            {/* Input Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Name *
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  value={formData.father_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mother's Name *
                </label>
                <input
                  type="text"
                  name="mother_name"
                  required
                  value={formData.mother_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DOB (BS) *
                </label>
                <input
                  type="text"
                  name="dob_bs"
                  placeholder="YYYY-MM-DD"
                  required
                  value={formData.dob_bs}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact No
                </label>
                <input
                  type="text"
                  name="contact_no"
                  value={formData.contact_no}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Academic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrollment Year (BS)
              </label>
              <input
                type="number"
                name="enrollment_year"
                value={formData.enrollment_year}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Level
              </label>
              <select
                name="class_level"
                value={formData.class_level}
                onChange={handleAcademicChange}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleAcademicChange}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NEB Reg. No
              </label>
              <input
                type="text"
                name="registration_no"
                value={formData.registration_no}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol No
              </label>
              <input
                type="text"
                name="symbol_no"
                value={formData.symbol_no}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Subject Enrollment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Subject Enrollment
          </h3>
          {availableSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSubjects.map((sub) => (
                <label
                  key={sub.id}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedSubjects.includes(sub.id)
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white border-gray-200 hover:border-blue-400 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedSubjects.includes(sub.id)}
                    onChange={() => handleSubjectToggle(sub.id)}
                  />
                  <div className="flex-1">
                    <span className="font-semibold block">
                      {sub.subject_name}
                    </span>
                    <div className="text-xs mt-1">Code: {sub.theory_code}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No subjects found</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate("/students")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            Update Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
