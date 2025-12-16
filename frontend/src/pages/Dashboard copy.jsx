import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    upcomingExams: 0,
    recentExams: 0,
    class11Count: 0,
    class12Count: 0,
    scienceCount: 0,
    managementCount: 0,
    humanitiesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard statistics
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();

      console.log("📊 Dashboard API Response:", data);

      // Transform nested API response to flat structure
      setStats({
        totalStudents: data.students?.total || 0,
        totalSubjects: data.subjects?.total || 0,
        upcomingExams: data.exams?.upcomingCount || 0,
        recentExams: data.exams?.recent?.length || 0,
        class11Count: data.students?.byClass?.class_11 || 0,
        class12Count: data.students?.byClass?.class_12 || 0,
        scienceCount: data.students?.byFaculty?.Science || 0,
        managementCount: data.students?.byFaculty?.Management || 0,
        humanitiesCount: data.students?.byFaculty?.Humanities || 0,
      });

      // Fetch recent activities (optional)
      try {
        const activityRes = await fetch(
          `${API_BASE_URL}/api/dashboard/activity`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (activityRes.ok) {
          const activities = await activityRes.json();

          // Format activities for display
          const formattedActivities = [
            ...activities.recentStudents.map((s) => ({
              description: `New student: ${s.name}`,
              timestamp: new Date(s.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              type: "Student",
            })),
            ...activities.recentExams.map((e) => ({
              description: `Exam: ${e.exam_name}`,
              timestamp: new Date(e.exam_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              type: "Exam",
            })),
          ].slice(0, 8);

          setRecentActivities(formattedActivities);
        }
      } catch (err) {
        console.log("Recent activities not available");
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.username || "Admin"} 👋
        </h1>
        <p className="mt-1 opacity-90">
          Here's what's happening in Grade 11/12 today.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          color="border-l-blue-500"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={stats.totalSubjects}
          color="border-l-green-500"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Exams"
          value={stats.upcomingExams}
          color="border-l-purple-500"
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Recent Exams"
          value={stats.recentExams}
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
                  stats.class11Count
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Class 12</span>
              <span className="text-xl font-bold text-green-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.class12Count
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
                  stats.scienceCount
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Management</span>
              <span className="text-xl font-bold text-orange-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.managementCount
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Humanities</span>
              <span className="text-xl font-bold text-pink-600">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stats.humanitiesCount
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

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
                  <p className="font-medium text-gray-800">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no activities */}
      {!loading && recentActivities.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">
            All systems operational
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Dashboard is ready to track your school's progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
