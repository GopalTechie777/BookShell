import React, { useEffect, useState } from 'react';
import { bookApi, categoryApi } from '../services/api';
import { Book, Grid, Users, LayoutDashboard } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ categories: 0, books: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookApi.getBooks({ limit: 1 }), // efficient way to get total count
      categoryApi.getCategories()
    ])
    .then(([bookRes, catRes]) => {
      setStats({
        books: bookRes.data.total || 0,
        categories: catRes.data.data.length || 0,
      });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <LayoutDashboard className="title-icon" /> Overview
        </h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper blue">
            <Book size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-label">Total Books</h3>
            <p className="stat-value">{loading ? '...' : stats.books}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper purple">
            <Grid size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-label">Categories</h3>
            <p className="stat-value">{loading ? '...' : stats.categories}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper green">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-label">Active Admins</h3>
            <p className="stat-value">1</p>
          </div>
        </div>
      </div>
      
      <div className="admin-welcome glass-panel">
        <h2>Welcome to the Admin Portal</h2>
        <p>Use the sidebar navigation to manage books, categories, and chapters. Any changes made here are instantly reflected on the public frontend.</p>
      </div>
    </div>
  );
}
