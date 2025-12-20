import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSchoolSettings } from "../context/SchoolSettingsContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  LogOut,
  GraduationCap,
  TrendingUp,
  Award,
  UserCheck,
  School,
  CalendarCheck,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const Sidebar = () => {
  const navigate = useNavigate();
  const { schoolSettings, schoolName, logoUrl } = useSchoolSettings();

  // State for collapsible menus
  const [openMenus, setOpenMenus] = useState({
    students: true,
    academic: true,
    reports: true,
    settings: true,
  });

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl z-50 flex flex-col">
      {/* School Logo & Info Section - Fixed at top */}
      <div className="flex-shrink-0 p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          {/* School Logo */}
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <School
              className="text-blue-600"
              size={24}
              style={{ display: logoUrl ? "none" : "block" }}
            />
          </div>

          {/* School Name */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">
              {schoolName || "NEB School"}
            </h1>
            <p className="text-xs text-blue-300 truncate">
              {schoolSettings?.school_address?.split(",")[0] ||
                "Management System"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable area */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-900">
        {/* Dashboard - Standalone */}
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

        {/* Students Section - Collapsible */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu("students")}
            className="w-full flex items-center justify-between px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Students
              </span>
            </div>
            {openMenus.students ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {openMenus.students && (
            <div className="mt-1 space-y-1 ml-2">
              <NavLink
                to="/students"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <Users size={18} />
                <span className="text-sm">All Students</span>
              </NavLink>

              <NavLink
                to="/students/add"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <UserCheck size={18} />
                <span className="text-sm">Add Student</span>
              </NavLink>

              <NavLink
                to="/students/promotion"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <TrendingUp size={18} />
                <span className="text-sm">Promote Students</span>
              </NavLink>

              <NavLink
                to="/students/graduated"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <GraduationCap size={18} />
                <span className="text-sm">Alumni</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Academic Section - Collapsible */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu("academic")}
            className="w-full flex items-center justify-between px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Academic
              </span>
            </div>
            {openMenus.academic ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {openMenus.academic && (
            <div className="mt-1 space-y-1 ml-2">
              <NavLink
                to="/subjects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <BookOpen size={18} />
                <span className="text-sm">Subjects</span>
              </NavLink>

              <NavLink
                to="/exams"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <ClipboardList size={18} />
                <span className="text-sm">Exams</span>
              </NavLink>

              <NavLink
                to="/attendance"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <CalendarCheck size={18} />
                <span className="text-sm">Attendance</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Reports Section - Collapsible */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu("reports")}
            className="w-full flex items-center justify-between px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Reports
              </span>
            </div>
            {openMenus.reports ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {openMenus.reports && (
            <div className="mt-1 space-y-1 ml-2">
              <NavLink
                to="/reports/gradesheet"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <FileText size={18} />
                <span className="text-sm">Gradesheet</span>
              </NavLink>

              <NavLink
                to="/reports/certificate"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <Award size={18} />
                <span className="text-sm">Character Certificate</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Settings Section - Collapsible */}
        <div className="pt-2 pb-4">
          <button
            onClick={() => toggleMenu("settings")}
            className="w-full flex items-center justify-between px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Settings
              </span>
            </div>
            {openMenus.settings ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {openMenus.settings && (
            <div className="mt-1 space-y-1 ml-2">
              <NavLink
                to="/settings/academic-years"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <Calendar size={18} />
                <span className="text-sm">Academic Years</span>
              </NavLink>

              <NavLink
                to="/settings/school"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-900 shadow-lg font-semibold"
                      : "text-blue-100 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <Building2 size={18} />
                <span className="text-sm">School Settings</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* User Info & Logout - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-blue-700">
        {/* Optional: Show logged in user info */}
        {schoolSettings?.principal_name && (
          <div className="px-4 py-3 bg-blue-800/50">
            <p className="text-xs text-blue-300 mb-1">Principal</p>
            <p className="text-sm font-semibold truncate">
              {schoolSettings.principal_name}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold shadow-lg"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
