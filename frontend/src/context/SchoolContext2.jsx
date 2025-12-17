import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Context
export const SchoolContext = createContext();

// Provider Component
export const SchoolProvider = ({ children }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'Loading...',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    principalName: '',
    schoolLogoPath: null,
    schoolSealPath: null,
    principalSignaturePath: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch school settings from backend
  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // If no token, set default values
        setSchoolSettings({
          schoolName: 'NEB School Management System',
          schoolAddress: 'Kathmandu, Nepal',
          schoolPhone: '',
          schoolEmail: '',
          principalName: 'Principal',
          schoolLogoPath: null,
          schoolSealPath: null,
          principalSignaturePath: null,
        });
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/school-settings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setSchoolSettings({
          schoolName: response.data.school_name || 'NEB School Management System',
          schoolAddress: response.data.school_address || 'Kathmandu, Nepal',
          schoolPhone: response.data.school_phone || '',
          schoolEmail: response.data.school_email || '',
          principalName: response.data.principal_name || 'Principal',
          schoolLogoPath: response.data.school_logo_path || null,
          schoolSealPath: response.data.school_seal_path || null,
          principalSignaturePath: response.data.principal_signature_path || null,
        });
      }
    } catch (err) {
      console.error('Failed to fetch school settings:', err);
      // Set default values on error
      setSchoolSettings({
        schoolName: 'NEB School Management System',
        schoolAddress: 'Kathmandu, Nepal',
        schoolPhone: '',
        schoolEmail: '',
        principalName: 'Principal',
        schoolLogoPath: null,
        schoolSealPath: null,
        principalSignaturePath: null,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSchoolSettings = () => {
    fetchSchoolSettings();
  };

  return (
    <SchoolContext.Provider 
      value={{ 
        ...schoolSettings,
        loading,
        error,
        refreshSchoolSettings
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};