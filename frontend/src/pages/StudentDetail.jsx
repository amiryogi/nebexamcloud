import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    let token = localStorage.getItem("token");
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {
          console.log(e);
        }
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchStudentDetail();
  }, [id]);

  const fetchStudentDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }

      const data = await response.json();
      setStudent(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load student details");
      navigate("/students");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Student not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back to Students
        </button>
        <Link
          to={`/students/edit/${student.id}`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Edit size={18} /> Edit Student
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section with Image */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white flex-shrink-0">
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
                <User size={48} />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {student.first_name} {student.middle_name} {student.last_name}
              </h1>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} />
                  <span>
                    Class {student.class_level} - {student.faculty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>Batch {student.enrollment_year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-8 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                label="Registration No"
                value={student.registration_no || "Not assigned"}
              />
              <InfoRow
                label="Symbol No"
                value={student.symbol_no || "Not assigned"}
              />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Date of Birth (BS)" value={student.dob_bs} />
              <InfoRow
                label="Date of Birth (AD)"
                value={new Date(student.dob_ad).toLocaleDateString()}
              />
              <InfoRow label="Parent/Guardian" value={student.parent_name} />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow
                label="Contact Number"
                value={student.contact_no || "Not provided"}
                icon={<Phone size={16} className="text-gray-400" />}
              />
              <InfoRow
                label="Address"
                value={student.address || "Not provided"}
                icon={<MapPin size={16} className="text-gray-400" />}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <InfoRow
                label="Class Level"
                value={`Grade ${student.class_level}`}
              />
              <InfoRow label="Faculty" value={student.faculty} />
              <InfoRow label="Section" value={student.section} />
              <InfoRow
                label="Enrollment Year"
                value={student.enrollment_year}
              />
              <InfoRow
                label="Status"
                value={
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.status === "active"
                        ? "bg-green-100 text-green-700"
                        : student.status === "alumni"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status.toUpperCase()}
                  </span>
                }
              />
            </div>

            {/* Enrolled Subjects */}
            {student.subjects && student.subjects.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Enrolled Subjects ({student.subjects.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {student.subjects.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {subject.subject_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {subject.theory_code} • Credit:{" "}
                          {subject.total_credit_hour}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/reports/gradesheet?student=${student.id}`}
            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 font-medium"
          >
            View Gradesheet
          </Link>
          <Link
            to={`/reports/certificate?student=${student.id}`}
            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 font-medium"
          >
            Generate Certificate
          </Link>
          <Link
            to={`/attendance?student=${student.id}`}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 font-medium"
          >
            View Attendance
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const InfoRow = ({ label, value, icon }) => (
  <div>
    <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
      {icon}
      {label}
    </p>
    <p className="text-base font-semibold text-gray-800">{value}</p>
  </div>
);

export default StudentDetail;
