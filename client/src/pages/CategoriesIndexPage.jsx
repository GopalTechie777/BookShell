import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi } from '../services/api';
import { ArrowLeft } from 'lucide-react';
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

  const getCategoryImage = (name) => {
    const seed = encodeURIComponent((name || 'genre').toLowerCase().replace(/\s+/g, '-'));
    return `https://picsum.photos/seed/bookshell-${seed}/960/560`;
  };

  return (
    <div className="list-page categories-page">
      <div className="container list-content categories-content">
        <div className="categories-heading-row">
          <Link to="/" className="back-link categories-back-link">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          <div className="genres-title-block">
            <h1 className="genres-title">BROWSE GENRES</h1>
            <span className="genres-view-all">(view all)</span>
          </div>
        </div>

        {loading ? (
          <div className="center-message"><p className="loading-text">Loading...</p></div>
        ) : sortedCategories.length === 0 ? (
          <div className="empty-state glass-panel">
            <h3>No categories yet</h3>
            <p>Add categories from admin to organize your library.</p>
          </div>
        ) : (
          <div className="genres-grid">
            {sortedCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="genre-tile"
                style={{ backgroundImage: `url(${getCategoryImage(cat.name)})` }}
              >
                <div className="genre-overlay">
                  <h3>{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
