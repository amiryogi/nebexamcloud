import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { SchoolSettingsContext } from "../context/SchoolSettingsContext"; // 🆕 NEW
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useContext(AuthContext);
  
  // 🆕 Access School Settings
  const {
    schoolName,
    schoolAddress,
    logoUrl,
    loading: settingsLoading,
  } = useContext(SchoolSettingsContext);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(username, password);

    if (result.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-100">
        {/* Header Section */}
        <div className="text-center mb-8">
          {/* 🆕 School Logo or Fallback Icon */}
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm overflow-hidden">
            {settingsLoading ? (
              // Loading state
              <div className="w-full h-full bg-gray-200 animate-pulse"></div>
            ) : logoUrl ? (
              // School Logo
              <img
                src={logoUrl}
                alt={`${schoolName} Logo`}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              // Fallback Icon
              <i className="ph ph-graduation-cap text-blue-600 text-4xl"></i>
            )}
          </div>

          {/* 🆕 Dynamic School Name */}
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {settingsLoading ? (
              <span className="inline-block w-48 h-7 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              schoolName
            )}
          </h1>

          {/* 🆕 School Address (if available) */}
          {!settingsLoading && schoolAddress && (
            <p className="text-gray-500 text-xs mt-1">{schoolAddress}</p>
          )}

          <p className="text-gray-600 text-sm mt-2 font-medium">
            Admin Login
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <i className="ph ph-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <i className="ph ph-lock-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Protected System for Authorized Personnel Only
        </div>
      </div>
    </div>
  );
};

export default Login;