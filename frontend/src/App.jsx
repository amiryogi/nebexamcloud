import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { AppProviders } from "./AppProviders"; // 🆕 NEW
import { useContext } from "react";
import { Toaster } from "react-hot-toast";

// Import Pages & Components
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import StudentList from "./pages/StudentList";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import StudentDetail from "./pages/StudentDetail";
import StudentPromotion from "./pages/StudentPromotion";
import Exams from "./pages/Exams";
import MarksEntry from "./pages/MarksEntry";
import Gradesheet from "./pages/Gradesheet";
import Certificate from "./pages/Certificate";
import Attendance from "./pages/Attendance";
import Subjects from "./pages/Subjects";
import SchoolSettings from "./pages/SchoolSettings";
import AcademicYears from "./pages/AcademicYears";

// --- Security Guard Component ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* 🔧 KEY FIX: AppProviders only loads when user is authenticated */}
        <AppProviders>
          {/* Global Notification Popups */}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

          <Routes>
            {/* --- Public Route --- */}
            <Route path="/login" element={<Login />} />

            {/* --- Protected Routes (The Main App) --- */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Student Module */}
              <Route path="students" element={<StudentList />} />
              <Route path="students/add" element={<AddStudent />} />
              <Route path="students/edit/:id" element={<EditStudent />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="students/promotion" element={<StudentPromotion />} />

              {/* Subject Management Module */}
              <Route path="subjects" element={<Subjects />} />

              {/* Exams Module */}
              <Route path="exams" element={<Exams />} />
              <Route path="exams/:examId/marks" element={<MarksEntry />} />

              {/* Report Routes */}
              <Route path="reports/gradesheet" element={<Gradesheet />} />
              <Route path="reports/certificate" element={<Certificate />} />

              {/* Attendance Module */}
              <Route path="attendance" element={<Attendance />} />

              {/* Settings Routes */}
              <Route path="settings/academic-years" element={<AcademicYears />} />
              <Route path="settings/school" element={<SchoolSettings />} />
            </Route>
          </Routes>
        </AppProviders>
      </AuthProvider>
    </Router>
  );
}

export default App;