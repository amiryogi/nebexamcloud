import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { SchoolSettingsProvider } from "./context/SchoolSettingsContext";
import { AcademicYearProvider } from "./context/AcademicYearContext";

/**
 * This wrapper only loads SchoolSettings and AcademicYear contexts
 * AFTER the user is authenticated.
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

  // If user is logged in, wrap with all contexts
  if (user) {
    return (
      <SchoolSettingsProvider>
        <AcademicYearProvider>{children}</AcademicYearProvider>
      </SchoolSettingsProvider>
    );
  }

  // If not logged in, just render children (Login page)
  return children;
};
