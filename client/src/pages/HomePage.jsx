import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, TrendingUp, Grid, Sparkles, Feather, Archive } from 'lucide-react';
import { bookApi, categoryApi } from '../services/api';
import BookCard from '../components/BookCard';
import './HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookApi.getBooks({ featured: true, limit: 12 }),
      categoryApi.getCategories()
    ])
      .then(([booksRes, catsRes]) => {
        setFeatured(booksRes.data.data);
        setCategories(catsRes.data.data);
      })
      .catch(err => console.error("Error loading homepage data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <p className="loading-text">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="container hero-content">
          <div className="hero-badge">
            <Sparkles size={16} className="hero-badge-icon" />
            <span>Welcome to the new BookShell</span>
          </div>
          <h1 className="hero-title">
            Your Digital Library, <br />
            <span className="text-gradient">Redefined.</span>
          </h1>
          <p className="hero-subtitle">
            Immerse yourself in a beautiful, distraction-free reading experience.
            Thousands of true classics and modern stories, elegantly presented.
          </p>
          <div className="hero-actions">
            <a href="#featured" className="btn btn-primary">Start Reading</a>
            <Link to="/categories" className="btn btn-secondary glass-panel">Browse Categories</Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">10k+</span>
              <span className="stat-label">Free Books</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">Zero</span>
              <span className="stat-label">Distractions</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">Sync</span>
              <span className="stat-label">Anywhere</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container main-content-spacing">
        {/* Features Section */}
        <section className="features-section">
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper"><BookOpen size={24} /></div>
            <h3>Pure Reading</h3>
            <p>A minimalist interface designed solely for your reading pleasure, without ads or clutter.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper"><Archive size={24} /></div>
            <h3>Curated Collections</h3>
            <p>Hand-picked selections spanning across multiple genres, eras, and literary movements.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="feature-icon-wrapper"><Feather size={24} /></div>
            <h3>Always Free</h3>
            <p>Access our entire catalog without subscriptions, paywalls, or hidden fees.</p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2 className="section-title">
              <Grid className="section-icon" /> Browse by Category
            </h2>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.id}`} className="category-card glass-panel">
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-desc">{cat.description || 'Explore books in this category'}</p>
                <div className="category-meta">
                  <BookOpen size={14} />
                  <span>{cat.bookCount} books</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Books Section */}
        <section id="featured" className="featured-section">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp className="section-icon text-gradient" /> Featured Reads
            </h2>
            <Link to="/search" className="view-all-link">Search All Books →</Link>
          </div>
          
          {featured.length > 0 ? (
            <div className="books-grid">
              {featured.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="empty-state glass-panel">
              <p>No featured books available at the moment.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
