import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { SchoolSettingsContext } from "../context/SchoolSettingsContext"; // 🆕 NEW

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  
  // 🆕 Access School Settings
  const { schoolName, logoUrl, loading: settingsLoading } = useContext(SchoolSettingsContext);

  // Helper to style links based on whether they are active or not
  const getLinkClasses = ({ isActive }) => {
    const baseClasses =
      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors";
    return isActive
      ? `${baseClasses} bg-blue-600 text-white shadow-md`
      : `${baseClasses} text-slate-300 hover:bg-slate-800 hover:text-white`;
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      {/* 1. Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* 🆕 School Logo or Fallback Icon */}
          <div className="w-12 h-12 flex-shrink-0 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            {settingsLoading ? (
              // Loading state
              <div className="w-full h-full bg-slate-700 animate-pulse"></div>
            ) : logoUrl ? (
              // School Logo
              <img
                src={logoUrl}
                alt={`${schoolName} Logo`}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              // Fallback Icon
              <i className="ph ph-graduation-cap text-white text-2xl"></i>
            )}
          </div>

          {/* 🆕 Dynamic School Name */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-wide truncate">
              {settingsLoading ? (
                <span className="inline-block w-32 h-5 bg-slate-700 animate-pulse rounded"></span>
              ) : (
                schoolName
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              NEB Grade 11/12 System
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/" className={getLinkClasses} end>
          <i className="ph ph-squares-four text-xl"></i>
          Dashboard
        </NavLink>

        <NavLink to="/students" className={getLinkClasses}>
          <i className="ph ph-users text-xl"></i>
          Students
        </NavLink>

        <NavLink to="/subjects" className={getLinkClasses}>
          <i className="ph ph-books text-xl"></i>
          Subjects
        </NavLink>

        <NavLink to="/attendance" className={getLinkClasses}>
          <i className="ph ph-calendar-check text-xl"></i>
          Attendance
        </NavLink>

        <NavLink to="/exams" className={getLinkClasses}>
          <i className="ph ph-exam text-xl"></i>
          Exams & Marks
        </NavLink>

        {/* Reports Section */}
        <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Reports
        </div>

        <NavLink to="/reports/gradesheet" className={getLinkClasses}>
          <i className="ph ph-file-text text-xl"></i>
          Gradesheets
        </NavLink>

        <NavLink to="/reports/certificate" className={getLinkClasses}>
          <i className="ph ph-certificate text-xl"></i>
          Certificates
        </NavLink>

        {/* Settings Section */}
        <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Settings
        </div>

        <NavLink to="/settings/school" className={getLinkClasses}>
          <i className="ph ph-gear text-xl"></i>
          School Settings
        </NavLink>
      </nav>

      {/* 3. User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white py-2 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <i className="ph ph-sign-out"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;