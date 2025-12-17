import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  TrendingUp,
  Award,
  UserCheck,
  School,
  CalendarCheck,
  Building2,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <School className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold">NEB School</h1>
            <p className="text-xs text-blue-300">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? "bg-white text-blue-900 shadow-lg font-semibold"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* Students Section */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-4">
            Students
          </p>
          
          <NavLink
            to="/students"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <Users size={20} />
            <span>All Students</span>
          </NavLink>

          <NavLink
            to="/students/add"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <UserCheck size={20} />
            <span>Add Student</span>
          </NavLink>

          {/* 🆕 NEW - Student Promotion */}
          <NavLink
            to="/students/promotion"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <TrendingUp size={20} />
            <span>Promote Students</span>
          </NavLink>

          {/* 🆕 NEW - Graduated Students */}
          <NavLink
            to="/students/graduated"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <GraduationCap size={20} />
            <span>Alumni</span>
          </NavLink>
        </div>

        {/* Academic Section */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-4">
            Academic
          </p>

          <NavLink
            to="/subjects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <BookOpen size={20} />
            <span>Subjects</span>
          </NavLink>

          <NavLink
            to="/exams"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <ClipboardList size={20} />
            <span>Exams</span>
          </NavLink>

          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <CalendarCheck size={20} />
            <span>Attendance</span>
          </NavLink>
        </div>

        {/* Reports Section */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-4">
            Reports
          </p>

          <NavLink
            to="/reports/gradesheet"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <FileText size={20} />
            <span>Gradesheet</span>
          </NavLink>

          <NavLink
            to="/reports/certificate"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <Award size={20} />
            <span>Character Certificate</span>
          </NavLink>
        </div>

        {/* Settings Section */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 px-4">
            Settings
          </p>

          {/* 🆕 NEW - Academic Years */}
          <NavLink
            to="/settings/academic-years"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <Calendar size={20} />
            <span>Academic Years</span>
          </NavLink>

          <NavLink
            to="/settings/school"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-blue-900 shadow-lg font-semibold"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`
            }
          >
            <Building2 size={20} />
            <span>School Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;