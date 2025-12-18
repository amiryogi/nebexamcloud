import { useState, useEffect } from "react";
import { Search, Printer, Loader2, AlertCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const NEBGradesheet = () => {
  const [viewMode, setViewMode] = useState("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");

  const [batchFaculty, setBatchFaculty] = useState("Science");
  const [batchYear, setBatchYear] = useState("");

  const [reportData, setReportData] = useState(null);
  const [batchData, setBatchData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

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
    loadExams();
    loadSchoolSettings();
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
      setSchoolSettings({
        school_name: "Your School Name",
        school_address: "Your School Address",
        principal_name: "Principal Name",
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
      console.error("Load students error:", error);
      toast.error("Failed to load students");
    }
  };

  const loadExams = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/exams`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      setExams(data);
      if (data.length > 0) setSelectedExam(data[0].id.toString());
    } catch (error) {
      console.error("Load exams error:", error);
      toast.error("Failed to load exams");
    }
  };

  const generateReport = async (student) => {
    if (!selectedExam) {
      toast.error("Please select an exam first");
      return;
    }
    setLoading(true);
    setViewMode("single");
    setSearchTerm("");
    
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reports/student/${student.id}?exam_id=${selectedExam}`,
        { headers: getAuthHeaders() }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to generate report");
      }
      
      const data = await res.json();
      console.log("📄 Single report data:", data);
      
      setReportData(data);
      setBatchData([]);
      toast.success("Gradesheet generated successfully");
    } catch (error) {
      console.error("Generate report error:", error);
      toast.error(error.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateBatchReport = async (classLevel) => {
    if (!selectedExam) {
      toast.error("Please select an exam first");
      return;
    }
    
    const confirmMsg = `Generate gradesheets for Class ${classLevel}${
      batchFaculty ? ` (${batchFaculty})` : ""
    }${batchYear ? ` Year ${batchYear}` : ""}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setViewMode("batch");
    setBatchData([]);
    setReportData(null);

    try {
      const params = new URLSearchParams({ exam_id: selectedExam });
      if (batchFaculty && batchFaculty !== "All") {
        params.append("faculty", batchFaculty);
      }
      if (batchYear) {
        params.append("academic_year_id", batchYear);
      }

      console.log("📡 Fetching batch reports:", `/api/reports/class/${classLevel}?${params}`);

      const res = await fetch(
        `${API_BASE_URL}/api/reports/class/${classLevel}?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch batch reports");
      }
      
      const data = await res.json();
      
      console.log("📊 Batch API Response:", data);
      
      // 🔧 FIX: Extract reports array from nested structure
      const reportsArray = data.reports || [];
      
      console.log("📋 Reports array length:", reportsArray.length);
      
      if (reportsArray.length === 0) {
        toast.error("No students found matching the criteria");
        setBatchData([]);
      } else {
        setBatchData(reportsArray);
        toast.success(`Generated ${reportsArray.length} gradesheets`);
      }
    } catch (error) {
      console.error("Batch report error:", error);
      toast.error(error.message);
      setBatchData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
      <div className="print:hidden max-w-6xl mx-auto space-y-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> NEB Grade Sheet
          </h1>
          <p className="text-gray-500 text-sm">
            Official format matching NEB standards
          </p>
        </div>

        {/* Exam Selector */}
        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📝 Select Exam
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full md:w-96 border-2 border-yellow-400 rounded-lg px-4 py-2.5 text-base font-medium focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="">-- Choose an exam --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name} (
                {new Date(exam.exam_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batch Print */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              📚 Batch Print
            </h3>
            <div className="flex gap-3 mb-4">
              <select
                value={batchFaculty}
                onChange={(e) => setBatchFaculty(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Faculties</option>
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
              <input
                type="text"
                placeholder="Academic Year ID"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => generateBatchReport("11")}
                disabled={!selectedExam || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Class 11
              </button>
              <button
                onClick={() => generateBatchReport("12")}
                disabled={!selectedExam || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Class 12
              </button>
            </div>
          </div>

          {/* Single Student */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              🎓 Single Student
            </h3>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search name or reg number..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredStudents.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border shadow-xl rounded-lg mt-1 z-50 max-h-60 overflow-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => generateReport(student)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition"
                    >
                      <p className="font-bold">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reg: {student.registration_no || "N/A"} • Class{" "}
                        {student.class_level}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Button */}
        {(reportData || batchData.length > 0) && (
          <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl flex justify-between items-center">
            <span className="font-medium text-green-800">
              ✅ {batchData.length > 0
                ? `${batchData.length} gradesheets ready`
                : "1 gradesheet ready"}
            </span>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-md transition"
            >
              <Printer size={20} /> Print {batchData.length > 0 ? `All (${batchData.length})` : ""}
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
          <p className="text-gray-500">Generating gradesheets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !reportData && batchData.length === 0 && (
        <div className="text-center py-20 text-gray-400 print:hidden bg-white rounded-xl border border-gray-200 max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Gradesheet Generated
          </h3>
          <p className="text-sm">Select an exam and search for a student, or use batch generation.</p>
        </div>
      )}

      {/* Single Report */}
      {!loading && viewMode === "single" && reportData && schoolSettings && (
        <GradesheetTemplate data={reportData} schoolSettings={schoolSettings} />
      )}

      {/* Batch Reports */}
      {!loading && viewMode === "batch" && batchData.length > 0 && schoolSettings && (
        <div className="print:block">
          {batchData.map((report, idx) => (
            <GradesheetTemplate
              key={idx}
              data={report}
              schoolSettings={schoolSettings}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GradesheetTemplate = ({ data, schoolSettings }) => {
  return (
    <div
      className="bg-white mx-auto print:break-after-page mb-8 print:mb-0"
      style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 flex-shrink-0">
          {schoolSettings?.school_logo_path ? (
            <img
              src={`${API_BASE_URL}${schoolSettings.school_logo_path}`}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full border-2 border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
              LOGO
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold mb-1">
            {schoolSettings?.school_name || "School Name"}
          </h1>
          <p className="text-sm mb-3">
            {schoolSettings?.school_address || "School Address"}
          </p>
          <h2 className="text-2xl font-bold mb-4 mt-2">GRADE-SHEET</h2>
        </div>

        <div className="w-20 h-20 flex-shrink-0">
          {schoolSettings?.school_seal_path && (
            <img
              src={`${API_BASE_URL}${schoolSettings.school_seal_path}`}
              alt="Seal"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-4 text-sm space-y-1">
        <p className="font-bold">
          Student: {data.student.first_name} {data.student.last_name}
        </p>
        <p>DOB: {data.student.dob_bs} ({new Date(data.student.dob_ad).toLocaleDateString()})</p>
        <p>Reg No: {data.student.registration_no || "N/A"} | Symbol: {data.student.symbol_no || "N/A"} | Class: {data.student.class_level}</p>
        <p>Academic Year: {data.academic_year?.name || data.student.enrollment_year}</p>
      </div>

      {/* Marks Table */}
      <table className="w-full border-2 border-black text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr className="border-b-2 border-black bg-gray-50">
            <th className="border-r border-black p-2 font-bold">CODE</th>
            <th className="border-r border-black p-2 text-left font-bold">SUBJECT</th>
            <th className="border-r border-black p-2 font-bold">CH</th>
            <th className="border-r border-black p-2 font-bold">GP</th>
            <th className="border-r border-black p-2 font-bold">GRADE</th>
            <th className="border-r border-black p-2 font-bold">FINAL</th>
            <th className="p-2 font-bold">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {data.subjects?.map((sub, idx) => (
            <>
              <tr key={`th-${idx}`} className="border-b border-black">
                <td className="border-r border-black p-2 text-center">{sub.theory_code || sub.subject_code}</td>
                <td className="border-r border-black p-2">{sub.subject_name} (Th)</td>
                <td className="border-r border-black p-2 text-center">{sub.theory_credit_hour}</td>
                <td className="border-r border-black p-2 text-center font-bold">{sub.theory_grade_point}</td>
                <td className="border-r border-black p-2 text-center font-bold">{sub.theory_grade}</td>
                <td rowSpan="2" className="border-r border-black p-2 text-center font-bold text-base">
                  {sub.final_grade}
                </td>
                <td rowSpan="2" className="p-2"></td>
              </tr>
              <tr key={`pr-${idx}`} className="border-b border-black">
                <td className="border-r border-black p-2 text-center">{sub.practical_code}</td>
                <td className="border-r border-black p-2">{sub.subject_name} (Pr)</td>
                <td className="border-r border-black p-2 text-center">{sub.practical_credit_hour}</td>
                <td className="border-r border-black p-2 text-center font-bold">{sub.practical_grade_point}</td>
                <td className="border-r border-black p-2 text-center font-bold">{sub.practical_grade}</td>
              </tr>
            </>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan="7" className="p-3 text-center">
              <span className="font-bold">Grade Point Average (GPA):</span>
              <span className="ml-4 text-2xl font-bold text-blue-600">{data.gpa || "0.00"}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-8 text-xs">
        <div className="flex justify-between mb-6">
          <div>PREPARED BY: _________________</div>
          <div>CHECKED BY: _________________</div>
        </div>
        <div className="text-right">
          {schoolSettings?.principal_signature_path && (
            <img
              src={`${API_BASE_URL}${schoolSettings.principal_signature_path}`}
              alt="Signature"
              className="h-12 ml-auto mb-2"
            />
          )}
          <p className="font-bold">{schoolSettings?.principal_name || "Principal Name"}</p>
          <p className="font-bold">PRINCIPAL</p>
        </div>
        <p className="mt-4">DATE OF ISSUE: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default NEBGradesheet;