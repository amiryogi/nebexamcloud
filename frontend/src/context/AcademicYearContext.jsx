import React, { createContext, useContext, useState, useEffect } from "react";
import { examAPI } from "../services/api";

// Create Context
const AcademicYearContext = createContext();

// Custom hook to use the context
export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error("useAcademicYear must be used within AcademicYearProvider");
  }
  return context;
};

// Get current academic year (auto-detect based on month)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed

  // If it's April or later, use current year; otherwise use previous year
  // Adjust this logic based on your school's academic calendar
  return currentMonth >= 4
    ? currentYear.toString()
    : (currentYear - 1).toString();
};

// Provider Component
export const AcademicYearProvider = ({ children }) => {
  // Check localStorage first, fallback to current year
  const storedYear = localStorage.getItem("selectedAcademicYear");
  const [selectedYear, setSelectedYear] = useState(
    storedYear || getCurrentAcademicYear()
  );

  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available academic years on mount
  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    try {
      setLoading(true);
      const response = await examAPI.getAcademicYears();
      const years = response.data || [];

      // If no years exist, add current year
      if (years.length === 0) {
        years.push(getCurrentAcademicYear());
      }

      setAvailableYears(years);

      // If stored year doesn't exist in available years, reset to current
      if (storedYear && !years.includes(storedYear)) {
        changeYear(getCurrentAcademicYear());
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
      // Fallback to current year
      setAvailableYears([getCurrentAcademicYear()]);
    } finally {
      setLoading(false);
    }
  };

  // Change academic year
  const changeYear = (year) => {
    setSelectedYear(year);
    localStorage.setItem("selectedAcademicYear", year);
  };

  // Reset to current year
  const resetToCurrentYear = () => {
    const currentYear = getCurrentAcademicYear();
    changeYear(currentYear);
  };

  // Add a new academic year
  const addYear = (year) => {
    if (!availableYears.includes(year)) {
      setAvailableYears((prev) => [year, ...prev].sort((a, b) => b - a));
    }
  };

  const value = {
    selectedYear,
    availableYears,
    loading,
    changeYear,
    resetToCurrentYear,
    addYear,
    refreshYears: fetchAvailableYears,
    currentYear: getCurrentAcademicYear(),
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export default AcademicYearContext;
