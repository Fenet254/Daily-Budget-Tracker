import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Set up axios interceptor to add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Set up response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Try to get user data from API
          const res = await API.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          // If API call fails, use saved user data
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            // Token invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const res = await API.post("/auth/register", userData);
      const { token, user: userInfo } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      return true;
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Registration failed");
      return false;
    }
  };

  const login = async (userData) => {
    try {
      setError(null);
      const res = await API.post("/auth/login", userData);
      const { token, user: userInfo } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Login failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ register, login, logout, user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
