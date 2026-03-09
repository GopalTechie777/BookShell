import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, TrendingUp, Grid } from 'lucide-react';
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
        <div className="hero-background"></div>
        <div className="container hero-content">
          <h1 className="hero-title">
            Discover Your Next <br />
            <span className="text-gradient">Great Adventure</span>
          </h1>
          <p className="hero-subtitle">
            A minimalist library of timeless literature and modern stories.
            Free from distractions, built for readers.
          </p>
          <a href="#featured" className="hero-btn active">Start Browsing</a>
        </div>
      </section>

      <div className="container">
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
