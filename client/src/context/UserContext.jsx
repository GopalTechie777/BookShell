import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../services/api';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // { id, email, username }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const stored = localStorage.getItem('userProfile');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('userProfile');
      }
    }
    setLoading(false);
  }, []);

  const requestSignupOtp = async (email, username, password) => {
    const res = await userApi.requestSignupOtp({ email, username, password });
    return res.data.data;
  };

  const verifySignupOtp = async (email, otp) => {
    const res = await userApi.verifySignupOtp({ email, otp });
    const { token, user: profile } = res.data.data;
    localStorage.setItem('userToken', token);
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const requestPasswordResetOtp = async (email) => {
    const res = await userApi.requestPasswordResetOtp({ email });
    return res.data.data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await userApi.resetPassword({ email, otp, newPassword });
    const { token, user: profile } = res.data.data;
    localStorage.setItem('userToken', token);
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const login = async (identifier, password) => {
    const res = await userApi.login({ identifier, password });
    const { token, user: profile } = res.data.data;
    localStorage.setItem('userToken', token);
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userProfile');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, requestSignupOtp, verifySignupOtp, requestPasswordResetOtp, resetPassword, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
