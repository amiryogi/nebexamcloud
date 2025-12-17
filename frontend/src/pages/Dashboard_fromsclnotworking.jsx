import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  ClipboardCheck,
  ChevronDown,
  History,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
    students: { total: 0, byClass: {}, byFaculty: {} },
    subjects: { total: 0 },
    exams: { total: 0, upcoming: [], recent: [] },
    current_year: null,
    available_years: [],
  });
  
  const [selectedYearId, setSelectedYearId] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [initialized, setInitialized] = useState(false);

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

  // 🔧 FIX: Single useEffect with proper dependency management
  useEffect(() => {
    fetchDashboardData();
  }, [selectedYearId]); // Refetch when year changes

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build URL with year parameter
      const url = selectedYearId
        ? `${API_BASE_URL}/api/dashboard/stats?academic_year_id=${selectedYearId}`
        : `${API_BASE_URL}/api/dashboard/stats`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();
      console.log("📊 Dashboard data:", data);

      setStats(data);

      // 🔧 FIX: Only set year on FIRST load, not every fetch
      if (!initialized && !selectedYearId && data.current_year?.id) {
        setSelectedYearId(data.current_year.id.toString());
        setInitialized(true); // Prevent setting year again
      }

      // Fetch activities
      const yearToFetch = selectedYearId || data.current_year?.id;
      if (yearToFetch) {
        fetchRecentActivities(yearToFetch);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async (yearId) => {
    if (!yearId) return;
    
    try {
      const url = `${API_BASE_URL}/api/dashboard/activity?academic_year_id=${yearId}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const activities = await res.json();
        setRecentActivities(activities);
      }
    } catch (err) {
      console.log("Recent activities not available:", err);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              value
            )}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.username || "Admin"} 👋
            </h1>
            <p className="mt-1 opacity-90">
              Here's what's happening in Grade 11/12 today.
            </p>
          </div>

          {/* Year Selector */}
          {stats.available_years.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[250px]">
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide">
                Academic Year
              </label>
              <div className="relative">
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full bg-white text-gray-800 rounded-lg px-4 py-2 pr-10 font-semibold text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-white/50 outline-none"
                >
                  {stats.available_years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year_name} {year.is_current && "⭐ Current"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
              </div>
              
              {stats.current_year && !stats.current_year.is_current && (
                <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
                  <History className="w-3 h-3" />
                  <span>Viewing historical data</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.students?.total || 0}
          color="border-l-blue-500"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={stats.subjects?.total || 0}
          color="border-l-green-500"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Exams"
          value={stats.exams?.upcomingCount || 0}
          color="border-l-purple-500"
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Total Exams"
          value={stats.exams?.total || 0}
          color="border-l-orange-500"
          bgColor="bg-orange-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Class Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Class 11</span>
              <span className="text-xl font-bold text-blue-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.students?.byClass?.class_11 || 0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Class 12</span>
              <span className="text-xl font-bold text-green-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.students?.byClass?.class_12 || 0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Faculty Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Faculty Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Science</span>
              <span className="text-xl font-bold text-purple-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.students?.byFaculty?.Science || 0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Management</span>
              <span className="text-xl font-bold text-orange-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.students?.byFaculty?.Management || 0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Humanities</span>
              <span className="text-xl font-bold text-pink-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.students?.byFaculty?.Humanities || 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming & Recent Exams */}
      {(stats.exams?.upcoming?.length > 0 || stats.exams?.recent?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Exams */}
          {stats.exams?.upcoming?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📅 Upcoming Exams
              </h3>
              <div className="space-y-3">
                {stats.exams.upcoming.map((exam, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {exam.exam_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {exam.is_final ? "Final Exam" : "Regular Exam"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Exams */}
          {stats.exams?.recent?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📝 Recent Exams
              </h3>
              <div className="space-y-3">
                {stats.exams.recent.map((exam, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {exam.exam_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {exam.is_final ? "Final Exam" : "Regular Exam"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-medium text-gray-800">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.students?.total === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">
            No data for this academic year
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Students and exams will appear here once added.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;