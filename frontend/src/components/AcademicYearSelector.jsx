import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import axios from "axios";

const API_URL = "https://svc.nevanhandicraft.com.np"; // Hardcoded for production

/**
 * Reusable Academic Year Selector Component
 * 
 * Usage:
 * <AcademicYearSelector 
 *   value={selectedYear} 
 *   onChange={(yearId) => setSelectedYear(yearId)}
 *   showAllOption={true}
 *   className="custom-class"
 * />
 */
const AcademicYearSelector = ({ 
  value, 
  onChange, 
  showAllOption = false,
  showCurrentBadge = true,
  className = "",
  label = "Academic Year",
  disabled = false 
}) => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/academic-years`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setYears(data);

      // Auto-select current year if no value is set
      if (!value && data.length > 0) {
        const currentYear = data.find((y) => y.is_current);
        if (currentYear && onChange) {
          onChange(currentYear.id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <Calendar 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
          size={18} 
        />
        
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled || loading}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            loading ? "animate-pulse" : ""
          }`}
        >
          {loading ? (
            <option>Loading years...</option>
          ) : (
            <>
              {showAllOption && <option value="">All Years</option>}
              
              {years.length === 0 ? (
                <option value="">No years available</option>
              ) : (
                years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name}
                    {showCurrentBadge && year.is_current ? " (Current)" : ""}
                  </option>
                ))
              )}
            </>
          )}
        </select>
      </div>

      {/* Current Year Badge (optional display below dropdown) */}
      {showCurrentBadge && !loading && years.length > 0 && (
        <div className="mt-2">
          {years.find((y) => y.id.toString() === value)?.is_current && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Current Academic Year
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicYearSelector;