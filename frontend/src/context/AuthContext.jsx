import React, { createContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token is still valid
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Auth check failed:", error);
      // Token is invalid, clear it
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, ...userData } = response.data;

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      return response.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, ...user } = response.data;

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);

      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
