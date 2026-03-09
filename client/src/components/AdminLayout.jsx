import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, LayoutDashboard, Grid, FileText } from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <div className="admin-loading">Checking auth...</div>;
  if (!admin) return <Navigate to="/admin/login" state={{ from: location }} replace />;

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar glass-panel">
        <div className="admin-brand">
          <BookOpen className="brand-icon" size={24} />
          <span className="brand-text text-gradient">BookShell</span>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className={`admin-nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/admin/books" className={`admin-nav-link ${location.pathname.startsWith('/admin/books') ? 'active' : ''}`}>
            <FileText size={18} /> Books
          </Link>
          <Link to="/admin/categories" className={`admin-nav-link ${location.pathname.startsWith('/admin/categories') ? 'active' : ''}`}>
            <Grid size={18} /> Categories
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span>Logged in as <strong>{admin.username}</strong></span>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
