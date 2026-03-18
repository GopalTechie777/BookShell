import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi } from '../services/api';
import { ArrowLeft, BookOpen, ChevronRight, LibraryBig } from 'lucide-react';
import './ListPage.css';
import './CategoriesIndexPage.css';

export default function CategoriesIndexPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sortedCategories = [...categories].sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0));
  const totalBooks = sortedCategories.reduce((sum, cat) => sum + (cat.bookCount || 0), 0);

  return (
    <div className="list-page categories-page">
      <div className="hero-banner glass-panel categories-hero">
        <div className="container banner-content">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="categories-hero-title-row">
            <span className="categories-hero-icon" aria-hidden="true">
              <LibraryBig size={22} />
            </span>
            <h1 className="banner-title">Browse Categories</h1>
          </div>

          <p className="banner-desc">
            Explore the full library by genre and topic, then jump directly into what you love.
          </p>

          <div className="categories-summary">
            <span className="categories-summary-pill">
              <BookOpen size={16} /> {sortedCategories.length} categories
            </span>
            <span className="categories-summary-pill categories-summary-pill-accent">
              {totalBooks} total books
            </span>
          </div>
        </div>
      </div>

      <div className="container list-content">
        {loading ? (
          <div className="center-message"><p className="loading-text">Loading...</p></div>
        ) : sortedCategories.length === 0 ? (
          <div className="empty-state glass-panel">
            <BookOpen size={48} className="empty-icon text-muted" />
            <h3>No categories yet</h3>
            <p>Add categories from admin to organize your library.</p>
          </div>
        ) : (
          <div className="categories-grid">
            {sortedCategories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.id}`} className="category-card glass-panel">
                <div className="category-card-head">
                  <h3 className="category-name">{cat.name}</h3>
                  <span className="category-arrow" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </div>

                <p className="category-desc">
                  {cat.description || 'Explore books in this category.'}
                </p>

                <div className="category-meta">
                  <span className="category-count">
                    <BookOpen size={15} />
                    <span>{cat.bookCount || 0} books</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
