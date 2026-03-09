import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookApi } from '../services/api';
import { ArrowLeft, Book as BookIcon, CheckCircle, Clock } from 'lucide-react';
import './BookDetailPage.css';

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    bookApi.getBook(id)
      .then(res => setBook(res.data.data))
      .catch(err => setError(err.response?.data?.error?.message || 'Error loading book'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container center-message">
        <p className="loading-text">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container center-message">
        <h2>{error || 'Book Not Found'}</h2>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Return to Home</Link>
      </div>
    );
  }

  const coverUrl = book.coverImage || null;
  const firstChapter = book.chapters && book.chapters.length > 0 ? book.chapters[0] : null;

  return (
    <div className="book-detail-page">
      <div className="detail-hero">
        <div className="container">
          <Link to={book.category ? `/categories/${book.category.id}` : '/'} className="back-link">
            <ArrowLeft size={16}/> 
            Back to {book.category ? book.category.name : 'Library'}
          </Link>
          
          <div className="detail-content glass-panel">
            <div className="detail-cover">
              {coverUrl ? (
                <img src={coverUrl} alt={book.title} />
              ) : (
                <div className="cover-placeholder">
                  <BookIcon size={64} className="placeholder-icon" />
                </div>
              )}
            </div>
            
            <div className="detail-info">
              {book.category && (
                <span className="detail-category">{book.category.name}</span>
              )}
              <h1 className="detail-title">{book.title}</h1>
              <p className="detail-author">By <strong>{book.author}</strong></p>
              
              <div className="detail-meta">
                <span className="meta-item"><Clock size={16} /> Added {new Date(book.createdAt).toLocaleDateString()}</span>
                <span className="meta-item"><CheckCircle size={16} /> {book.chapters?.length || 0} Chapters</span>
              </div>

              <div className="detail-desc">
                {book.description ? (
                  <p>{book.description}</p>
                ) : (
                  <p className="text-muted">No description available for this book.</p>
                )}
              </div>

              <div className="detail-actions">
                {firstChapter ? (
                  <Link to={`/books/${book.id}/read/${firstChapter.id}`} className="read-btn">
                    Start Reading
                  </Link>
                ) : (
                  <button className="read-btn" disabled>Waiting for Chapters</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container table-of-contents">
        <h2 className="toc-title">Table of Contents</h2>
        {book.chapters?.length > 0 ? (
          <ul className="chapter-list">
            {book.chapters.map((ch, idx) => (
              <li key={ch.id} className="chapter-item glass-panel">
                <Link to={`/books/${book.id}/read/${ch.id}`} className="chapter-link">
                  <span className="chapter-number">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="chapter-name">{ch.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state glass-panel">
            <p>No chapters have been published for this book yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
