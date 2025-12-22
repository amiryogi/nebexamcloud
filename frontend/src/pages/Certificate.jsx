import { useState, useEffect } from "react";
import { Search, Printer, Loader2, AlertCircle, Award } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "https://svc.nevanhandicraft.com.np";

const Certificate = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW: School Settings State
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Certificate Data
  const [certificateData, setCertificateData] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    purpose: "To Whom It May Concern",
    conduct: "Excellent",
    character: "Good",
    remarks: "",
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
    loadStudents();
    loadSchoolSettings(); // NEW: Load school settings
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const results = students.filter(
      (s) =>
        s.first_name.toLowerCase().includes(lower) ||
        s.last_name.toLowerCase().includes(lower) ||
        (s.registration_no && s.registration_no.includes(lower))
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

  // NEW: Load School Settings
  const loadSchoolSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/school-settings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch school settings");
      const data = await res.json();
      setSchoolSettings(data);
    } catch (error) {
      console.error("Failed to load school settings:", error);
      toast.error("Failed to load school information. Using defaults.");
      // Set default fallback
      setSchoolSettings({
        school_name: "Your School Name",
        school_address: "Your School Address",
        principal_name: "Principal Name",
        school_logo_path: null,
        school_seal_path: null,
        principal_signature_path: null,
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const selectStudent = async (student) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${student.id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch student details");
      const data = await res.json();
      setSelectedStudent(data);
      setSearchTerm("");
      setFilteredStudents([]);
    } catch (error) {
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleInputChange = (e) => {
    setCertificateData({
      ...certificateData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading state if school settings aren't loaded yet
  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
      {/* Controls Section */}
      <div className="print:hidden max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="text-purple-600" /> Character Certificate
          </h1>
          <p className="text-gray-500 text-sm">
            Generate and print character certificates
          </p>
        </div>

        {/* Student Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Search size={16} /> Select Student
          </h3>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or registration number..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-lg mt-1 z-50 max-h-60 overflow-auto">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-0"
                  >
                    <p className="font-bold text-gray-800">
                      {student.first_name} {student.middle_name}{" "}
                      {student.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reg: {student.registration_no || "N/A"} • Class{" "}
                      {student.class_level} ({student.faculty})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Certificate Configuration */}
        {selectedStudent && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Certificate Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={certificateData.issueDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={certificateData.purpose}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conduct
                </label>
                <select
                  name="conduct"
                  value={certificateData.conduct}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Character
                </label>
                <select
                  name="character"
                  value={certificateData.character}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Remarks (Optional)
                </label>
                <textarea
                  name="remarks"
                  value={certificateData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Enter any additional remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handlePrint}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
              >
                <Printer size={20} /> Print Certificate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Preview/Print */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-600" />
          <p className="text-gray-500">Loading student data...</p>
        </div>
      )}

      {!loading && !selectedStudent && (
        <div className="text-center py-20 text-gray-400 print:hidden bg-white rounded-xl border border-dashed border-gray-300 mx-auto max-w-4xl mt-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500">
            No student selected
          </p>
          <p className="text-sm text-gray-400">
            Search and select a student to generate certificate
          </p>
        </div>
      )}

      {!loading && selectedStudent && schoolSettings && (
        <div
          className="bg-white mx-auto shadow-lg print:shadow-none mt-8 print:mt-0"
          style={{
            maxWidth: "210mm",
            minHeight: "297mm",
            padding: "25mm 20mm",
          }}
        >
          {/* Certificate Header with Logo */}
          <div className="text-center mb-8 pb-6 border-b-4 border-purple-600">
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* School Logo */}
              {schoolSettings.school_logo_path && (
                <img
                  src={`${API_BASE_URL}${schoolSettings.school_logo_path}`}
                  alt="School Logo"
                  className="w-24 h-24 object-contain"
                />
              )}

              <div>
                <h2 className="text-4xl font-bold text-purple-800 mb-2">
                  {schoolSettings.school_name}
                </h2>
                <p className="text-lg text-gray-600">
                  {schoolSettings.school_address}
                </p>
                {schoolSettings.school_phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    Phone: {schoolSettings.school_phone}
                  </p>
                )}
                {schoolSettings.school_email && (
                  <p className="text-sm text-gray-500">
                    Email: {schoolSettings.school_email}
                  </p>
                )}
              </div>

              {/* School Seal (if available) */}
              {schoolSettings.school_seal_path && (
                <img
                  src={`${API_BASE_URL}${schoolSettings.school_seal_path}`}
                  alt="School Seal"
                  className="w-24 h-24 object-contain"
                />
              )}
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-8">
            <div className="inline-block border-4 border-purple-600 px-8 py-3">
              <h1 className="text-3xl font-bold text-purple-800 uppercase tracking-wider">
                Character Certificate
              </h1>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="space-y-6 text-lg leading-relaxed text-gray-800 mb-12">
            <p className="text-center font-semibold text-xl">
              {certificateData.purpose}
            </p>

            <p className="indent-12 text-justify">
              This is to certify that{" "}
              <span className="font-bold underline decoration-2">
                {selectedStudent.gender === "Male" ? "Mr." : "Ms."}{" "}
                {selectedStudent.first_name} {selectedStudent.middle_name}{" "}
                {selectedStudent.last_name}
              </span>
              , son/daughter of{" "}
              <span className="font-bold">{selectedStudent.parent_name}</span>,
              was a bonafide student of this institution. He/She studied in
              Class{" "}
              <span className="font-bold">{selectedStudent.class_level}</span> (
              {selectedStudent.faculty}) during the academic year{" "}
              <span className="font-bold">
                {selectedStudent.enrollment_year}
              </span>
              .
            </p>

            <p className="indent-12 text-justify">
              During his/her stay in this institution, his/her conduct was{" "}
              <span className="font-bold underline decoration-2">
                {certificateData.conduct}
              </span>{" "}
              and character was{" "}
              <span className="font-bold underline decoration-2">
                {certificateData.character}
              </span>
              . He/She has shown dedication towards studies and maintained good
              discipline throughout the academic session.
            </p>

            {certificateData.remarks && (
              <p className="indent-12 text-justify">
                <span className="font-semibold">Remarks:</span>{" "}
                {certificateData.remarks}
              </p>
            )}

            <p className="indent-12 text-justify">
              We wish him/her all success in his/her future endeavors.
            </p>
          </div>

          {/* Student Details Table */}
          <div className="mb-12 border-2 border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-base">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-4 py-3 font-semibold w-1/3">
                    Registration No:
                  </td>
                  <td className="px-4 py-3">
                    {selectedStudent.registration_no || "N/A"}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    Date of Birth:
                  </td>
                  <td className="px-4 py-3">{selectedStudent.dob_bs} (BS)</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    Class & Faculty:
                  </td>
                  <td className="px-4 py-3">
                    Grade {selectedStudent.class_level} (
                    {selectedStudent.faculty})
                  </td>
                </tr>
                <tr>
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    Date of Issue:
                  </td>
                  <td className="px-4 py-3">
                    {new Date(certificateData.issueDate).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-16">
            <div className="text-center">
              <div className="w-48 border-b-2 border-black mb-2"></div>
              <p className="font-bold text-sm uppercase">Class Teacher</p>
            </div>

            <div className="text-center">
              {/* Principal Signature Image */}
              {schoolSettings.principal_signature_path ? (
                <div className="mb-2">
                  <img
                    src={`${API_BASE_URL}${schoolSettings.principal_signature_path}`}
                    alt="Principal Signature"
                    className="h-16 mx-auto object-contain"
                  />
                  <div className="w-48 border-b-2 border-black"></div>
                </div>
              ) : (
                <div className="w-48 border-b-2 border-black mb-2"></div>
              )}
              <p className="font-bold text-sm uppercase">
                {schoolSettings.principal_name}
              </p>
              <p className="font-bold text-sm uppercase">Campus Chief</p>
            </div>
          </div>

          {/* School Stamp Area */}
          <div className="mt-12 text-center">
            {schoolSettings.school_seal_path ? (
              <div className="inline-block">
                <img
                  src={`${API_BASE_URL}${schoolSettings.school_seal_path}`}
                  alt="School Seal"
                  className="h-24 object-contain"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Official School Seal
                </p>
              </div>
            ) : (
              <div className="inline-block border-2 border-dashed border-gray-400 px-12 py-8 rounded-lg">
                <p className="text-gray-400 text-sm">School Stamp</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificate;
