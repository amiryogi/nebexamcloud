import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { SchoolSettingsProvider } from "./context/SchoolSettingsContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";

/**
 * 🔥 FIXED: SchoolSettings is now ALWAYS available (even on login page)
 * AcademicYear only loads after authentication
 */
export const AppProviders = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // Show loading spinner while checking auth
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

  // 🔥 KEY FIX: If user is logged in, wrap with ALL contexts
  if (user) {
    return (
      <SchoolSettingsProvider>
        <AcademicYearProvider>{children}</AcademicYearProvider>
      </SchoolSettingsProvider>
    );
  }

  // 🔥 KEY FIX: If NOT logged in, still provide SchoolSettings
  // (Login page needs it for school logo/name/branding)
  return <SchoolSettingsProvider>{children}</SchoolSettingsProvider>;
};