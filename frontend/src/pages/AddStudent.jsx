import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSubjects } from "../services/subjectService";
import { createStudent } from "../services/studentService";
import toast from "react-hot-toast";

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. Form State
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
    enrollment_year: new Date().getFullYear() + 57, // e.g., 2024 -> 2081
    class_level: "11",
    faculty: "Science",
    section: "A",
    address: "",
    contact_no: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 2. Subject Selection State
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // 3. Fetch Subjects when Class/Faculty changes
  useEffect(() => {
    fetchSubjects();
  }, [formData.class_level, formData.faculty]);

  const fetchSubjects = async () => {
    try {
      const data = await getAllSubjects({
        class_level: formData.class_level,
        faculty: formData.faculty,
      });
      setAvailableSubjects(data);
      setSelectedSubjects([]);
    } catch (error) {
      console.error(error);
      toast.error("Could not load subjects");
    }
  };

  // --- Handlers ---

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

    if (selectedSubjects.length !== 6) {
      toast("Note: Standard enrollment usually requires 6 subjects.", {
        icon: "⚠️",
      });
    }

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

      await createStudent(data);
      toast.success("Student registered successfully!");
      navigate("/students");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        New Student Admission
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8"
      >
        {/* Section 1: Personal Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Personal Details
          </h3>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image Upload Column */}
            <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center gap-4">
              <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative hover:border-blue-400 transition-colors">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <i className="ph ph-camera text-3xl"></i>
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
                Passport Size (JPG/PNG)
              </p>
            </div>

            {/* Input Fields Column */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Name Row */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Parent Details Row */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father's Name *
                </label>
                <input
                  type="text"
                  name="father_name"
                  required
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Full name of father"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
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
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Full name of mother"
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
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Details */}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                placeholder="Optional"
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
                placeholder="Optional"
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
                placeholder="e.g. A"
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Subject Enrollment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Subject Enrollment
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800 flex items-start gap-2">
            <i className="ph ph-info text-lg mt-0.5"></i>
            <div>
              Showing subjects for{" "}
              <strong>
                Class {formData.class_level} ({formData.faculty})
              </strong>
              .
              <br />
              Please select the 6 subjects this student will take.
            </div>
          </div>

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
                    <div
                      className={`text-xs mt-1 ${
                        selectedSubjects.includes(sub.id)
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      Code: {sub.theory_code}{" "}
                      {sub.practical_code ? `/ ${sub.practical_code}` : ""}
                      <br />
                      Cr: {sub.total_credit_hour}
                    </div>
                  </div>
                  {selectedSubjects.includes(sub.id) && (
                    <i className="ph ph-check-circle text-xl"></i>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">
                No subjects found in the database.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Please ask Admin to seed the Subjects table.
              </p>
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
            {loading && <i className="ph ph-spinner animate-spin"></i>}
            Register Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
