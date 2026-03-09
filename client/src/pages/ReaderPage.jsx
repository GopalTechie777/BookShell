import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookApi } from '../services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import './ReaderPage.css';

export default function ReaderPage() {
  const { id, chapterId } = useParams();
  const [data, setData] = useState({ chapter: null, prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    bookApi.getChapter(id, chapterId)
      .then(res => setData({
        chapter: res.data.data,
        prev: res.data.prev,
        next: res.data.next
      }))
      .catch(err => {
        setError(err.response?.data?.error?.message || 'Error loading chapter content');
      })
      .finally(() => {
        setLoading(false);
        window.scrollTo(0, 0); // Reset scroll on chapter change
      });
  }, [id, chapterId]);

  if (loading) {
    return (
      <div className="reader-wrapper center-message">
        <p className="loading-text">Loading text...</p>
      </div>
    );
  }

  if (error || !data.chapter) {
    return (
      <div className="reader-wrapper center-message">
        <h2>{error || 'Chapter not found'}</h2>
        <Link to={`/books/${id}`} className="back-link" style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} /> Return to Book Details
        </Link>
      </div>
    );
  }

  const { chapter, prev, next } = data;

  return (
    <div className="reader-wrapper">
      <div className="reader-toolbar glass-panel">
        <div className="container toolbar-content">
          <Link to={`/books/${id}`} className="nav-btn">
            <Menu size={20} />
            <span>Table of Contents</span>
          </Link>
          <div className="chapter-meta">
            <span className="chapter-label">Chapter {chapter.order}</span>
          </div>
          <div className="toolbar-spacer"></div>
        </div>
      </div>

      <div className="reader-container">
        <article 
          className="chapter-content"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />

        <div className="reader-navigation">
          {prev ? (
            <Link to={`/books/${id}/read/${prev.id}`} className="nav-btn primary glass-panel">
              <ChevronLeft size={20} />
              <span>Previous Chapter</span>
            </Link>
          ) : (
            <div className="nav-placeholder"></div>
          )}

          {next ? (
            <Link to={`/books/${id}/read/${next.id}`} className="nav-btn primary glass-panel">
              <span>Next Chapter</span>
              <ChevronRight size={20} />
            </Link>
          ) : (
             <Link to={`/books/${id}`} className="nav-btn primary glass-panel outline">
               <ArrowLeft size={20} />
               <span>Finished</span>
             </Link>
          )}
        </div>
      </div>
    </div>
  );
}
