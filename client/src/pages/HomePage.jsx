import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Flame, Star, Clock, Heart, ChevronRight } from 'lucide-react';
import { bookApi } from '../services/api';
import BookCard from '../components/BookCard';
import './HomePage.css';

export default function HomePage() {
  const [editorsChoice, setEditorsChoice] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newlyAdded, setNewlyAdded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch different sections of books to mimic ManyBooks.net
    Promise.all([
      bookApi.getBooks({ featured: true, limit: 6 }), // Editor's Choice
      bookApi.getBooks({ limit: 6, page: 2 }),        // Fake Trending (just another page for now)
      bookApi.getBooks({ limit: 12, page: 1 })        // Newly Added
    ])
      .then(([featuredRes, trendingRes, newRes]) => {
        setEditorsChoice(featuredRes.data.data);
        setTrending(trendingRes.data.data);
        setNewlyAdded(newRes.data.data);
      })
      .catch(err => console.error("Error loading homepage data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <p className="loading-text">Loading the library...</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="mb-hero-section">
        <div className="container mb-hero-content">
          <h1 className="mb-hero-title">
            50,000+ Free eBooks in the Genres you Love
          </h1>
          <p className="mb-hero-subtitle">
            Join us in exploring a world of literature. Read timeless classics and discover modern gems.
          </p>
          
          <form className="mb-search-form" onSubmit={handleSearch}>
            <div className="mb-search-input-wrapper">
              <Search className="mb-search-icon" size={24} />
              <input 
                type="text" 
                placeholder="Search by title, author, or keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-search-input"
              />
              <button type="submit" className="mb-search-button">
                SEARCH
              </button>
            </div>
          </form>
          
          <div className="mb-hero-links">
            <Link to="/categories">Browse Categories</Link>
            <span className="dot-separator">•</span>
            <Link to="/search">Advanced Search</Link>
          </div>
        </div>
      </section>

      <div className="container mb-main-content">
        
        {/* Editor's Choice */}
        {editorsChoice.length > 0 && (
          <section className="mb-book-section">
            <div className="mb-section-header">
              <h2 className="mb-section-title">
                <Star className="mb-section-icon icon-yellow" /> Editor's Choice
              </h2>
              <Link to="/search?featured=true" className="mb-view-all">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mb-books-grid">
              {editorsChoice.map(book => (
                <BookCard key={`featured-${book.id}`} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Trending Books */}
        {trending.length > 0 && (
          <section className="mb-book-section mb-section-alt">
            <div className="mb-section-header">
              <h2 className="mb-section-title">
                <Flame className="mb-section-icon icon-orange" /> Trending Books
              </h2>
              <Link to="/search" className="mb-view-all">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mb-books-grid">
              {trending.map(book => (
                <BookCard key={`trending-${book.id}`} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Newly Added eBooks */}
        {newlyAdded.length > 0 && (
          <section className="mb-book-section">
            <div className="mb-section-header">
              <h2 className="mb-section-title">
                <Clock className="mb-section-icon icon-green" /> Newly Added eBooks
              </h2>
              <Link to="/search" className="mb-view-all">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mb-books-grid">
              {newlyAdded.map(book => (
                <BookCard key={`new-${book.id}`} book={book} />
              ))}
            </div>
          </section>
        )}

        {/* Categories / Genres callout */}
        <section className="mb-genres-banner">
          <div className="mb-genres-banner-content">
            <h3>Find Your Next Favorite Genre</h3>
            <p>From pulse-pounding thrillers to heartwarming romances, we have it all.</p>
            <Link to="/categories" className="btn mb-genres-btn">
              Explore All Categories
            </Link>
          </div>
          <div className="mb-genres-banner-icon">
            <Heart size={80} className="icon-red" />
          </div>
        </section>

      </div>
    </div>
  );
}
