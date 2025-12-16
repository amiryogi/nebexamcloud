import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Custom Hook to fetch and cache school settings
 * Use this throughout your app to display school name, logo, etc.
 *
 * Usage:
 * const { settings, loading, error, refreshSettings } = useSchoolSettings();
 */
const useSchoolSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if settings are cached in sessionStorage
      const cached = sessionStorage.getItem("school_settings");
      const cacheTimestamp = sessionStorage.getItem(
        "school_settings_timestamp"
      );

      // Cache for 1 hour
      const cacheValid =
        cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < 3600000;

      if (cached && cacheValid) {
        setSettings(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await axios.get(`${API_BASE}/api/school/settings`);

      setSettings(response.data);

      // Cache the response
      sessionStorage.setItem("school_settings", JSON.stringify(response.data));
      sessionStorage.setItem(
        "school_settings_timestamp",
        Date.now().toString()
      );

      setLoading(false);
    } catch (err) {
      console.error("Error fetching school settings:", err);
      setError(err.response?.data?.message || "Failed to load school settings");
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    // Clear cache and refetch
    sessionStorage.removeItem("school_settings");
    sessionStorage.removeItem("school_settings_timestamp");
    fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, refreshSettings };
};

export default useSchoolSettings;
