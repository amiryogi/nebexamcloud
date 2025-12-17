import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAcademicYear } from "../context/AcademicYearContext";
import { dashboardAPI } from "../services/api";
import AcademicYearSelector from "../components/AcademicYearSelector";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { selectedYear } = useAcademicYear();
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
  if (loading) {
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
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to NEB Student Management System
          </p>
        </div>
        <AcademicYearSelector />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <StatCard
          title="Total Students"
          value={stats?.students?.total || 0}
          icon="👥"
          color="bg-blue-500"
          link="/students"
        />

        {/* Total Exams Card */}
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

        {/* Total Subjects Card */}
        <StatCard
          title="Total Subjects"
          value={stats?.subjects?.total || 0}
          icon="📚"
          color="bg-purple-500"
          link="/subjects"
        />

        {/* Upcoming Exams Card */}
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
            icon="✓"
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

// Stat Card Component
const StatCard = ({ title, value, icon, color, link, subtitle }) => {
  const CardContent = (
    <div
      className={`${color} text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
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
      } pl-4 py-2`}
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
      className={`${color} text-white rounded-lg p-4 text-center transition-all duration-200 shadow-md hover:shadow-lg`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </Link>
  );
};

export default Dashboard;
