import { useState, useEffect } from "react";
import { Search, Printer, Loader2, AlertCircle, FileText } from "lucide-react";

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

  // NEW: School Settings State
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
      console.error(error);
    }
  };

  const generateReport = async (student) => {
    if (!selectedExam) {
      alert("Please select an exam first");
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
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReportData(data);
      setBatchData([]);
    } catch (error) {
      console.error(error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateBatchReport = async (classLevel) => {
    if (!selectedExam) {
      alert("Please select an exam first");
      return;
    }
    const confirmMsg = `Generate gradesheets for Class ${classLevel} ${
      batchFaculty ? `(${batchFaculty})` : ""
    } ${batchYear ? `Year ${batchYear}` : ""}?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setViewMode("batch");
    setBatchData([]);
    setReportData(null);

    try {
      const params = new URLSearchParams({ exam_id: selectedExam });
      if (batchFaculty) params.append("faculty", batchFaculty);
      if (batchYear) params.append("year", batchYear);

      const res = await fetch(
        `${API_BASE_URL}/api/reports/class/${classLevel}?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch batch reports");
      const data = await res.json();
      if (data.length === 0) {
        alert("No students found");
        setBatchData([]);
      } else {
        setBatchData(data);
        alert(`Generated ${data.length} gradesheets`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to fetch batch reports");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // Show loading state if school settings aren't loaded yet
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

        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Select Exam
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
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Batch Print
            </h3>
            <div className="flex gap-3 mb-4">
              <select
                value={batchFaculty}
                onChange={(e) => setBatchFaculty(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="Science">Science</option>
                <option value="Management">Management</option>
                <option value="Humanities">Humanities</option>
              </select>
              <input
                type="text"
                placeholder="Year (BS)"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => generateBatchReport("11")}
                disabled={!selectedExam || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Class 11
              </button>
              <button
                onClick={() => generateBatchReport("12")}
                disabled={!selectedExam || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Class 12
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Single Student
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
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                    >
                      <p className="font-bold">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reg: {student.registration_no || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {(reportData || batchData.length > 0) && (
          <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl flex justify-between items-center">
            <span className="font-medium text-green-800">
              {batchData.length > 0
                ? `${batchData.length} gradesheets ready`
                : "1 gradesheet ready"}
            </span>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={20} /> Print {batchData.length > 0 ? "All" : ""}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
          <p className="text-gray-500">Generating...</p>
        </div>
      )}

      {!loading && !reportData && batchData.length === 0 && (
        <div className="text-center py-20 text-gray-400 print:hidden">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p>No gradesheet generated yet</p>
        </div>
      )}

      {!loading && viewMode === "single" && reportData && schoolSettings && (
        <GradesheetTemplate data={reportData} schoolSettings={schoolSettings} />
      )}
      {!loading &&
        viewMode === "batch" &&
        batchData.length > 0 &&
        schoolSettings &&
        batchData.map((report, idx) => (
          <GradesheetTemplate key={idx} data={report} schoolSettings={schoolSettings} />
        ))}
    </div>
  );
};

const GradesheetTemplate = ({ data, schoolSettings }) => {
  return (
    <div
      className="bg-white mx-auto print:break-after-page"
      style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm" }}
    >
      {/* Header with Logo and School Info */}
      <div className="flex items-start gap-4 mb-6">
        {/* School Logo */}
        <div className="w-20 h-20 flex-shrink-0">
          {schoolSettings.school_logo_path ? (
            <img
              src={`${API_BASE_URL}${schoolSettings.school_logo_path}`}
              alt="School Logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="black"
                strokeWidth="2"
              />
              <text
                x="50"
                y="55"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
              >
                LOGO
              </text>
            </svg>
          )}
        </div>

        {/* School Name and Address */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold mb-1">
            {schoolSettings.school_name}
          </h1>
          <p className="text-sm mb-3">{schoolSettings.school_address}</p>
          {schoolSettings.school_phone && (
            <p className="text-xs text-gray-600">
              Phone: {schoolSettings.school_phone}
              {schoolSettings.school_email && ` | Email: ${schoolSettings.school_email}`}
            </p>
          )}
          <h2 className="text-2xl font-bold mb-4 mt-2">GRADE-SHEET</h2>
        </div>

        {/* School Seal (Optional) */}
        {schoolSettings.school_seal_path && (
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={`${API_BASE_URL}${schoolSettings.school_seal_path}`}
              alt="School Seal"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Student Info */}
      <div className="mb-4 text-sm">
        <p className="mb-1">
          <span className="font-bold">
            THE GRADE(S) SECURED BY: {data.student.first_name.toUpperCase()}{" "}
            {data.student.last_name.toUpperCase()}
          </span>
        </p>
        <div className="flex gap-8 mb-1">
          <p>
            DATE OF BIRTH:{" "}
            <span className="font-bold">{data.student.dob_bs}</span> ({" "}
            {new Date(data.student.dob_ad).toLocaleDateString()} )
          </p>
        </div>
        <div className="flex gap-4 mb-1">
          <p>
            REGISTRATION NO.{" "}
            <span className="font-bold">
              {data.student.registration_no || "N/A"}
            </span>
          </p>
          <p>
            SYMBOL NO.{" "}
            <span className="font-bold">{data.student.symbol_no || "N/A"}</span>
          </p>
          <p>
            <span className="font-bold">
              GRADE {data.student.class_level === "11" ? "XI" : "XII"}
            </span>
          </p>
        </div>
        <p className="mb-3">
          IN THE FINAL EXAMINATION CONDUCTED IN{" "}
          <span className="font-bold">
            {data.student.enrollment_year} B.S. (2024 A.D.)
          </span>
        </p>
        <p className="mb-4">ARE GIVEN BELOW.</p>
      </div>

      {/* Marks Table */}
      <table
        className="w-full border-2 border-black text-xs"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr className="border-b-2 border-black">
            <th className="border-r border-black p-2 text-center font-bold">
              SUBJECT
              <br />
              CODE
            </th>
            <th className="border-r border-black p-2 text-left font-bold">
              SUBJECTS
            </th>
            <th className="border-r border-black p-2 text-center font-bold">
              CREDIT
              <br />
              HOURS
              <br />
              (CH)
            </th>
            <th className="border-r border-black p-2 text-center font-bold">
              GRADE
              <br />
              POINT
              <br />
              (GP)
            </th>
            <th className="border-r border-black p-2 text-center font-bold">
              GRADE
            </th>
            <th className="border-r border-black p-2 text-center font-bold">
              FINAL
              <br />
              GRADE
              <br />
              (FG)
            </th>
            <th className="p-2 text-center font-bold">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {data.subjects &&
            data.subjects.map((sub, idx) => {
              const theoryCode = sub.theory_code || sub.subject_code || "";
              const practicalCode = sub.practical_code || "";

              const theoryGP = parseFloat(sub.theory_grade_point || 0);
              const practicalGP = parseFloat(sub.practical_grade_point || 0);
              const theoryGrade = sub.theory_grade || "NG";
              const practicalGrade = sub.practical_grade || "NG";

              const finalGrade = sub.final_grade || "NG";
              const finalGP = parseFloat(
                sub.final_grade_point || sub.grade_point || 0
              ).toFixed(1);

              return (
                <>
                  {/* Theory Row */}
                  <tr key={`th-${idx}`} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center font-bold">
                      {theoryCode}
                    </td>
                    <td className="border-r border-black p-2 font-bold">
                      {sub.subject_name} (Th)
                    </td>
                    <td className="border-r border-black p-2 text-center">
                      {sub.theory_credit_hour || "3.00"}
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      {theoryGP.toFixed(1)}
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      {theoryGrade}
                    </td>
                    <td
                      rowSpan="2"
                      className="border-r border-black p-2 text-center font-bold text-base"
                    >
                      {finalGrade}
                    </td>
                    <td rowSpan="2" className="p-2"></td>
                  </tr>

                  {/* Practical/Internal Row */}
                  <tr key={`pr-${idx}`} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center font-bold">
                      {practicalCode}
                    </td>
                    <td className="border-r border-black p-2 font-bold">
                      {sub.subject_name} (In)
                    </td>
                    <td className="border-r border-black p-2 text-center">
                      {sub.practical_credit_hour || "1.00"}
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      {practicalGP.toFixed(1)}
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      {practicalGrade}
                    </td>
                  </tr>
                </>
              );
            })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan="7" className="p-2 text-center">
              <span className="font-bold">Grade Point Average (GPA)</span>
              <span className="ml-8 text-xl font-bold">
                {data.gpa || "0.00"}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer with Principal Signature */}
      <div className="mt-12 text-xs">
        <div className="flex justify-between mb-8">
          <div>
            PREPARED BY:-......................................................
          </div>
          <div>
            CHECKED BY:-....................................................
          </div>
        </div>
        <div className="text-right">
          {/* Principal Signature */}
          {schoolSettings.principal_signature_path ? (
            <div className="mb-2">
              <img
                src={`${API_BASE_URL}${schoolSettings.principal_signature_path}`}
                alt="Principal Signature"
                className="h-12 ml-auto object-contain"
              />
            </div>
          ) : (
            <p>........................................</p>
          )}
          <p className="font-bold">{schoolSettings.principal_name}</p>
          <p className="font-bold">PRINCIPAL</p>
        </div>
        <div className="mt-4">
          <p>
            DATE OF ISSUE:-{" "}
            <span className="font-bold">
              {data.student.enrollment_year}-05-15 B.S.
            </span>
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 text-[10px] border-t pt-2">
        <p>Note : 1 Credit Hour is equal to 32 working hours.</p>
        <p>
          IN (Internal) : Project work, Practical, Presentation, Community Work,
          Presentation, Terminal Examinations
        </p>
        <p>TH (Theory): Written External Examination</p>
      </div>
    </div>
  );
};

export default NEBGradesheet;