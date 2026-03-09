import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard or intended route
  if (admin) {
    const from = location.state?.from?.pathname || '/admin/dashboard';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(username, password);
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-brand">
            <BookOpen size={32} className="brand-icon" />
          </div>
          <h1 className="login-title">Admin Access</h1>
          <p className="login-subtitle">Sign in to manage the BookShell library</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <Lock size={18} /> Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
