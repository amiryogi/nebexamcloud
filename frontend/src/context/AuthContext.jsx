import { createContext, useState, useEffect } from "react";
// We import the 'api' instance we created in the previous step
// This ensures our login request goes to the right URL
import api from "../services/api";

// 1. Create the Context object
// This is like creating a "Radio Frequency" that components can tune into
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State to hold the current logged-in user
  const [user, setUser] = useState(null);

  // State to track if we are still checking LocalStorage (to prevent screen flashing)
  const [loading, setLoading] = useState(true);

  // 2. Check for existing login on Page Load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      // If we found data in storage, put it in State
      setUser(JSON.parse(storedUser));
    }
    // We are done checking
    setLoading(false);
  }, []);

  // 3. Login Function
  const login = async (username, password) => {
    try {
      // Use our centralized API to make the POST request
      const { data } = await api.post("/auth/login", {
        username,
        password,
      });

      // If successful:
      // a. Save to Browser Storage (so it survives refresh)
      localStorage.setItem("user", JSON.stringify(data));
      // b. Update State (so the App knows we are logged in)
      setUser(data);

      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      // Return a helpful error message to display in the UI
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 4. Logout Function
  const logout = () => {
    // Clear everything
    localStorage.removeItem("user");
    setUser(null);
  };

  // 5. Provide these values to the rest of the app
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* 'children' represents the whole App component inside this wrapper */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
