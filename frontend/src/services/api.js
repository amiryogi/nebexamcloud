import axios from "axios";

// 1. Create a centralized Axios instance
// This is better than using default 'axios' because we can configure it once here.
const api = axios.create({
  baseURL: "http://localhost:5000/api", // The address of our Node.js Backend
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Add an "Interceptor"
// Think of this as a checkpoint. Every time the frontend sends a request,
// this function runs FIRST before the request leaves the browser.
api.interceptors.request.use(
  (config) => {
    // Look in the browser's LocalStorage to see if a user is logged in
    const userStr = localStorage.getItem("user");

    if (userStr) {
      const user = JSON.parse(userStr);

      // If we have a token, attach it to the request Headers.
      // This satisfies the 'authMiddleware' we wrote in the backend!
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    // If something goes wrong setting up the request, just reject it
    return Promise.reject(error);
  }
);

export default api;
