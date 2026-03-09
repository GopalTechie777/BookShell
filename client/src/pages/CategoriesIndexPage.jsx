import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi } from '../services/api';
import { Grid, BookOpen } from 'lucide-react';
import './ListPage.css';

export default function CategoriesIndexPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="list-page">
      <div className="hero-banner glass-panel" style={{ padding: '60px 0' }}>
        <div className="container banner-content">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1 className="banner-title">Browse Categories</h1>
          <p className="banner-desc">Explore our entire library structured by genre and topic.</p>
        </div>
      </div>

      <div className="container list-content">
        {loading ? (
          <div className="center-message"><p className="loading-text">Loading...</p></div>
        ) : (
          <div className="categories-grid" style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '24px'
          }}>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.id}`} className="category-card glass-panel" style={{ padding: '32px' }}>
                <h3 className="category-name" style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#fff' }}>{cat.name}</h3>
                <p className="category-desc" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '32px', flex: 1 }}>{cat.description}</p>
                <div className="category-meta" style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent-primary)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 500, alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} />
                  <span>{cat.bookCount} books</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
