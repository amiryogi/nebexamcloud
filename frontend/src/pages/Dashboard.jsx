import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAcademicYear } from "../context/AcademicYearContext";
import { useSchoolSettings } from "../context/SchoolSettingsContext";
import { dashboardAPI } from "../services/api";
import AcademicYearSelector from "../components/AcademicYearSelector";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const Dashboard = () => {
  const { selectedYear } = useAcademicYear();
  const {
    schoolSettings,
    schoolName,
    logoUrl,
    loading: settingsLoading,
  } = useSchoolSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard stats whenever selected year changes
  useEffect(() => {
    fetchDashboardStats();
  }, [selectedYear]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getStats(selectedYear);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section with School Info */}
      <SchoolHeader
        schoolSettings={schoolSettings}
        schoolName={schoolName}
        logoUrl={logoUrl}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.students?.total || 0}
          icon="👥"
          color="bg-blue-500"
          link="/students"
        />

        <StatCard
          title="Total Exams"
          value={stats?.exams?.total || 0}
          icon="📝"
          color="bg-green-500"
          link="/exams"
          subtitle={`${stats?.exams?.final_exams || 0} Final, ${
            stats?.exams?.regular_exams || 0
          } Regular`}
        />

        <StatCard
          title="Total Subjects"
          value={stats?.subjects?.total || 0}
          icon="📚"
          color="bg-purple-500"
          link="/subjects"
        />

        <StatCard
          title="Upcoming Exams"
          value={stats?.exams?.upcomingCount || 0}
          icon="📅"
          color="bg-orange-500"
          link="/exams"
        />
      </div>

      {/* Class & Faculty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Students by Class
          </h2>
          <div className="space-y-3">
            {stats?.students?.byClass &&
            Object.keys(stats.students.byClass).length > 0 ? (
              Object.entries(stats.students.byClass).map(
                ([classKey, count]) => {
                  const classLevel = classKey.replace("class_", "");
                  return (
                    <div
                      key={classKey}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-700">Class {classLevel}</span>
                      <span className="font-semibold text-blue-600">
                        {count} students
                      </span>
                    </div>
                  );
                }
              )
            ) : (
              <p className="text-gray-500">No students enrolled yet</p>
            )}
          </div>
        </div>

        {/* Faculty Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Students by Faculty
          </h2>
          <div className="space-y-3">
            {stats?.students?.byFaculty &&
            Object.keys(stats.students.byFaculty).length > 0 ? (
              Object.entries(stats.students.byFaculty).map(
                ([faculty, count]) => (
                  <div
                    key={faculty}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-700">{faculty}</span>
                    <span className="font-semibold text-green-600">
                      {count} students
                    </span>
                  </div>
                )
              )
            ) : (
              <p className="text-gray-500">No faculty data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming & Recent Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Exams
          </h2>
          {stats?.exams?.upcoming?.length > 0 ? (
            <div className="space-y-3">
              {stats.exams.upcoming.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming exams scheduled</p>
          )}
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Exams
          </h2>
          {stats?.exams?.recent?.length > 0 ? (
            <div className="space-y-3">
              {stats.exams.recent.map((exam) => (
                <ExamCard key={exam.id} exam={exam} isPast />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent exams</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            to="/students/add"
            icon="➕"
            label="Add Student"
            color="bg-blue-500 hover:bg-blue-600"
          />
          <QuickActionButton
            to="/exams"
            icon="📝"
            label="Create Exam"
            color="bg-green-500 hover:bg-green-600"
          />
          <QuickActionButton
            to="/attendance"
            icon="✅"
            label="Mark Attendance"
            color="bg-purple-500 hover:bg-purple-600"
          />
          <QuickActionButton
            to="/reports/gradesheet"
            icon="📊"
            label="View Reports"
            color="bg-orange-500 hover:bg-orange-600"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== Sub Components ====================

// School Header Component - Dedicated component for school settings display
const SchoolHeader = ({ schoolSettings, schoolName, logoUrl }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          {/* School Logo */}
          <div className="flex-shrink-0">
            {logoUrl && !logoError ? (
              <div className="w-20 h-20 bg-white rounded-full p-2 shadow-lg">
                <img
                  src={logoUrl}
                  alt={`${schoolName} Logo`}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/30">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* School Information */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-md">
              {schoolName || "School Management System"}
            </h1>

            {schoolSettings?.school_address && (
              <div className="flex items-center gap-2 text-white/90 mb-1">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm">{schoolSettings.school_address}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              {schoolSettings?.school_phone && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>{schoolSettings.school_phone}</span>
                </div>
              )}

              {schoolSettings?.school_email && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{schoolSettings.school_email}</span>
                </div>
              )}

              {schoolSettings?.school_website && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <a
                    href={
                      schoolSettings.school_website.startsWith("http")
                        ? schoolSettings.school_website
                        : `https://${schoolSettings.school_website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {schoolSettings.school_website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Year Selector */}
        <div className="flex-shrink-0">
          <AcademicYearSelector />
        </div>
      </div>

      {/* Optional: Principal Information */}
      {schoolSettings?.principal_name && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-white/90">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm">
              <span className="font-semibold">Principal:</span>{" "}
              {schoolSettings.principal_name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, link, subtitle }) => {
  const CardContent = (
    <div
      className={`${color} text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{CardContent}</Link> : CardContent;
};

// Exam Card Component
const ExamCard = ({ exam, isPast = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`border-l-4 ${
        isPast ? "border-gray-400" : "border-blue-500"
      } pl-4 py-2 hover:bg-gray-50 transition-colors rounded-r`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{exam.exam_name}</h3>
          <p className="text-sm text-gray-600">
            Class {exam.class_level} - {exam.faculty || "All Faculties"}
            {exam.is_final ? " (Final)" : ""}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isPast ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"
          }`}
        >
          {formatDate(exam.exam_date)}
        </span>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ to, icon, label, color }) => {
  return (
    <Link
      to={to}
      className={`${color} text-white rounded-lg p-4 text-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </Link>
  );
};

export default Dashboard;
