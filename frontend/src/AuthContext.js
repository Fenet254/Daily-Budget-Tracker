import { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const register = async (userData) => {
    try {
      setError(null);
      const res = await API.post("/auth/register", userData);
      const { token } = res.data;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token });
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
      const { token } = res.data;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token });
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Login failed");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ register, login, user, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
