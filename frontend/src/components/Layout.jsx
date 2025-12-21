import { Outlet } from "react-router-dom";
import { useContext } from "react";
import Sidebar from "./Sidebar";
import { SchoolSettingsContext } from "../context/SchoolSettingsContext";

const Layout = () => {
  // Access School Settings for header with safe fallback
  const context = useContext(SchoolSettingsContext);

  // Safe fallback if context is undefined
  const schoolName = context?.schoolName || "NEB School Management System";
  const settingsLoading = context?.loading || false;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Hidden in print via print:hidden class in Sidebar.jsx */}
      <Sidebar />

      {/* Main Content Area - Removes left margin in print with print:ml-0 */}
      <main className="ml-64 flex-1 flex flex-col h-full overflow-hidden print:ml-0">
        {/* Header - Hidden in print with print:hidden */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm print:hidden">
          {/* Dynamic School Name in Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              {settingsLoading ? (
                <span className="inline-block w-48 h-6 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                `${schoolName} - Academic Management`
              )}
            </h2>
          </div>

          {/* Right side - Current Date */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* The Page Content - No padding and visible overflow in print */}
        <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
