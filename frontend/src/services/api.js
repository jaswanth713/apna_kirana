import axios from "axios";

let rawBaseUrl = import.meta.env.VITE_API_URL;

// If VITE_API_URL is unset or accidentally set to the literal variable name in Vercel
if (!rawBaseUrl || rawBaseUrl === "VITE_API_URL" || rawBaseUrl.includes("VITE_API_URL") || rawBaseUrl === "undefined") {
  rawBaseUrl = import.meta.env.PROD 
    ? "https://apna-kirana-mz8d.onrender.com" 
    : "http://localhost:8000";
}

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standard response unpacking
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default api;
