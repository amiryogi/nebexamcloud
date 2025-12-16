import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext"; // Import AuthContext

// Create the Context
export const SchoolSettingsContext = createContext();

// API Base URL
const API_BASE_URL = "http://localhost:5000";

// Provider Component
export const SchoolSettingsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fetch school settings ONLY when user is logged in
  useEffect(() => {
    if (user) {
      fetchSchoolSettings();
    } else {
      // User not logged in, just use default values
      setLoading(false);
    }
  }, [user]); // Re-run when user changes

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

  // Fetch settings when component mounts
  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  // Helper function to get full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    return `${API_BASE_URL}${path}`;
  };

  // Refresh function (useful after updating settings)
  const refreshSettings = () => {
    fetchSchoolSettings();
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
