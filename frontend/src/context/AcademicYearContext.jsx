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
  return currentMonth >= 4
    ? currentYear.toString()
    : (currentYear - 1).toString();
};

// Provider Component
export const AcademicYearProvider = ({ children }) => {
  // 🔧 FIX: Initialize state without reading localStorage immediately
  const [selectedYear, setSelectedYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 🔧 FIX: Single useEffect that runs once on mount
  useEffect(() => {
    if (!initialized) {
      initializeYear();
      setInitialized(true);
    }
  }, []); // Empty array - runs once

  const initializeYear = () => {
    const storedYear = localStorage.getItem("selectedAcademicYear");
    const yearToUse = storedYear || getCurrentAcademicYear();
    
    setSelectedYear(yearToUse);
    fetchAvailableYears(yearToUse);
  };

  const fetchAvailableYears = async (currentSelectedYear) => {
    try {
      setLoading(true);
      const response = await examAPI.getAcademicYears();
      const years = response.data || [];

      // If no years exist, add current year
      if (years.length === 0) {
        const defaultYear = getCurrentAcademicYear();
        setAvailableYears([defaultYear]);
        setSelectedYear(defaultYear);
      } else {
        setAvailableYears(years);
        
        // Validate stored year still exists
        const yearExists = years.some(y => y.id?.toString() === currentSelectedYear || y === currentSelectedYear);
        if (!yearExists) {
          const defaultYear = getCurrentAcademicYear();
          changeYear(defaultYear);
        }
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
      // Fallback to current year
      const defaultYear = getCurrentAcademicYear();
      setAvailableYears([defaultYear]);
      setSelectedYear(defaultYear);
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
    refreshYears: () => fetchAvailableYears(selectedYear),
    currentYear: getCurrentAcademicYear(),
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export default AcademicYearContext;