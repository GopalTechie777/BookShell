import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('adminToken');
    const username = localStorage.getItem('adminUsername');
    if (token) {
      setAdmin({ token, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await adminApi.login({ username, password });
      const { token, username: returnedUsername } = res.data.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUsername', returnedUsername);
      setAdmin({ token, username: returnedUsername });
      return true;
    } catch (err) {
      throw err.response?.data?.error?.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
