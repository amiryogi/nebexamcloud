import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

// Create the Context
const SchoolSettingsContext = createContext();

// API Base URL
const API_BASE_URL = "http://localhost:5000";

// Provider Component
export const SchoolSettingsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔧 Single useEffect with proper logic
  useEffect(() => {
    if (user) {
      // User is logged in - fetch real settings
      fetchSchoolSettings();
    } else {
      // User not logged in - set defaults and stop loading
      setSchoolSettings({
        school_name: "School Management System",
        school_address: "",
        school_phone: "",
        school_email: "",
        school_website: "",
        principal_name: "Principal",
        school_logo_path: null,
        school_seal_path: null,
        principal_signature_path: null,
      });
      setLoading(false);
    }
  }, [user]); // Only re-run when user authentication status changes

  // Helper to get auth headers
  const getAuthHeaders = () => {
    let token = localStorage.getItem("token");
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {
          console.error("Failed to parse user token");
        }
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch school settings from backend
  const fetchSchoolSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching school settings...");
      const response = await axios.get(`${API_BASE_URL}/api/school-settings`, {
        headers: getAuthHeaders(),
      });

      setSchoolSettings(response.data);
      console.log("✅ School settings loaded:", response.data);
    } catch (err) {
      console.error("❌ Failed to load school settings:", err);

      // Set default fallback values if API fails
      setSchoolSettings({
        school_name: "School Management System",
        school_address: "",
        school_phone: "",
        school_email: "",
        school_website: "",
        principal_name: "Principal",
        school_logo_path: null,
        school_seal_path: null,
        principal_signature_path: null,
      });

      setError(err.response?.data?.message || "Failed to load school settings");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    return `${API_BASE_URL}${path}`;
  };

  // Refresh function (useful after updating settings)
  const refreshSettings = () => {
    if (user) {
      fetchSchoolSettings();
    }
  };

  // Context value to be shared
  const contextValue = {
    schoolSettings,
    loading,
    error,
    refreshSettings,
    getImageUrl,

    // Convenient shortcuts for commonly used values
    schoolName: schoolSettings?.school_name || "School Management System",
    schoolAddress: schoolSettings?.school_address || "",
    principalName: schoolSettings?.principal_name || "Principal",
    logoUrl: schoolSettings?.school_logo_path
      ? getImageUrl(schoolSettings.school_logo_path)
      : null,
    sealUrl: schoolSettings?.school_seal_path
      ? getImageUrl(schoolSettings.school_seal_path)
      : null,
    signatureUrl: schoolSettings?.principal_signature_path
      ? getImageUrl(schoolSettings.principal_signature_path)
      : null,
  };

  return (
    <SchoolSettingsContext.Provider value={contextValue}>
      {children}
    </SchoolSettingsContext.Provider>
  );
};

// Custom Hook to use School Settings
export const useSchoolSettings = () => {
  const context = useContext(SchoolSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSchoolSettings must be used within SchoolSettingsProvider"
    );
  }
  return context;
};

// Named export for direct context access (if needed)
export { SchoolSettingsContext };

// Default export
export default SchoolSettingsContext;
