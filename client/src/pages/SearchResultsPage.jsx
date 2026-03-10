import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookApi, gutenbergApi, adminApi } from '../services/api';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { Search, Library, BookOpen, Download, CheckCircle, AlertCircle } from 'lucide-react';
import './ListPage.css';

// Per-card import state: idle | importing | done | error
function GutenbergCard({ book, isAdmin }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | importing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [importedId, setImportedId] = useState(null);

  const handleImport = async () => {
    setStatus('importing');
    setErrorMsg('');
    try {
      const res = await adminApi.importGutenbergBook(book.gutenbergId);
      setImportedId(res.data.data.book.id);
      setStatus('done');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Import failed';
      // 409 = already in library — treat as success and navigate
      if (err.response?.status === 409) {
        setImportedId(err.response.data.error.bookId);
        setStatus('done');
      } else {
        setErrorMsg(msg);
        setStatus('error');
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Reuse BookCard visuals but render as a non-link div */}
      <div
        className="book-card glass-panel"
        style={{ cursor: status === 'done' && importedId ? 'pointer' : 'default' }}
        onClick={() => status === 'done' && importedId && navigate(`/books/${importedId}`)}
      >
        <div className="book-cover">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} />
          ) : (
            <div className="book-cover-placeholder">
              <BookOpen size={48} className="placeholder-icon" />
            </div>
          )}
        </div>
        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">{book.author}</p>
          {book.subjects?.length > 0 && (
            <span className="book-category">{book.subjects[0]}</span>
          )}
        </div>
      </div>

      {/* Import overlay button */}
      {isAdmin && (
        <div style={{ padding: '8px 12px 12px' }}>
          {status === 'idle' && (
            <button
              onClick={handleImport}
              disabled={!book.hasText}
              title={!book.hasText ? 'No readable text available for this book' : 'Import into your library'}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: book.hasText ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                color: book.hasText ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: book.hasText ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              <Download size={14} />
              {book.hasText ? 'Import to Library' : 'No text available'}
            </button>
          )}
          {status === 'importing' && (
            <button disabled style={{
              width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-sans)', fontSize: '0.85rem', cursor: 'wait',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              Importing...
            </button>
          )}
          {status === 'done' && (
            <button
              onClick={() => importedId && navigate(`/books/${importedId}`)}
              style={{
                width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                background: 'rgba(34,197,94,0.2)', color: 'rgb(134,239,172)',
                fontFamily: 'var(--font-sans)', fontSize: '0.85rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <CheckCircle size={14} /> Imported — Read Now
            </button>
          )}
          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(248,113,113,0.9)', textAlign: 'center' }}>
                <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {errorMsg}
              </span>
              <button onClick={() => setStatus('idle')} style={{
                width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)',
                background: 'transparent', color: 'rgba(248,113,113,0.9)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
              }}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const page = parseInt(params.get('page')) || 1;
  const limit = 20;

  const [searchSource, setSearchSource] = useState('local'); // 'local' | 'gutenberg'

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [gutenbergHasNext, setGutenbergHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detect if user is logged in as admin (has token in localStorage)
  const isAdmin = !!localStorage.getItem('adminToken');

  useEffect(() => {
    if (!q) {
      setBooks([]);
      setTotal(0);
      return;
    }

    setBooks([]);
    setLoading(true);

    if (searchSource === 'local') {
      bookApi
        .search({ q, page, limit })
        .then((res) => {
          setBooks(res.data.data);
          setTotal(res.data.total);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Search Project Gutenberg via our own proxy endpoint
      gutenbergApi
        .search(q, page)
        .then((res) => {
          setBooks(res.data.data);
          setTotal(res.data.total);
          setGutenbergHasNext(res.data.hasNext);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [q, page, searchSource]);

  return (
    <div className="list-page">
      <div className="hero-banner glass-panel" style={{ padding: '60px 0' }}>
        <div className="container banner-content">
          <h1 className="banner-title">Search Results</h1>
          {q ? (
            <p className="banner-desc">
              Showing matches for <strong className="text-gradient">"{q}"</strong>
            </p>
          ) : (
            <p className="banner-desc">Enter a search term in the top bar to find books.</p>
          )}

          {q && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
              <button
                onClick={() => setSearchSource('local')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '99px',
                  border: searchSource === 'local' ? 'none' : '1px solid var(--border-delicate)',
                  background: searchSource === 'local' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Library size={18} /> Local Library
              </button>
              <button
                onClick={() => setSearchSource('gutenberg')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '99px',
                  border: searchSource === 'gutenberg' ? 'none' : '1px solid var(--border-delicate)',
                  background: searchSource === 'gutenberg' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <BookOpen size={18} /> Project Gutenberg
              </button>
            </div>
          )}

          {searchSource === 'gutenberg' && isAdmin && (
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Click <strong>Import to Library</strong> on any result to fetch and store the full book for reading here.
            </p>
          )}
          {searchSource === 'gutenberg' && !isAdmin && (
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Browsing 70,000+ free public domain books. Log in as admin to import any book for reading.
            </p>
          )}
        </div>
      </div>

      <div className="container list-content">
        {loading ? (
          <div className="center-message">
            <p className="loading-text">
              {searchSource === 'gutenberg' ? 'Searching Project Gutenberg...' : 'Searching database...'}
            </p>
          </div>
        ) : !q ? (
          <div className="empty-state glass-panel">
            <Search size={48} className="empty-icon text-muted" />
            <h3>Ready to Explore?</h3>
            <p>Use the search bar above to look up titles or authors.</p>
          </div>
        ) : books.length > 0 ? (
          <>
            <p className="results-count">
              {searchSource === 'gutenberg'
                ? `${total.toLocaleString()} results in Project Gutenberg — page ${page}`
                : `Found ${total} ${total === 1 ? 'result' : 'results'}`}
            </p>
            <div className="books-grid">
              {searchSource === 'local'
                ? books.map((book) => <BookCard key={book.id} book={book} />)
                : books.map((book) => (
                    <GutenbergCard key={book.gutenbergId ?? book.id} book={book} isAdmin={isAdmin} />
                  ))}
            </div>
            {searchSource === 'local' && <Pagination total={total} limit={limit} />}
            {searchSource === 'gutenberg' && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
                {page > 1 && (
                  <a
                    href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}
                    style={navBtnStyle}
                  >
                    ← Previous
                  </a>
                )}
                {gutenbergHasNext && (
                  <a
                    href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}
                    style={navBtnStyle}
                  >
                    Next →
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state glass-panel">
            <Search size={48} className="empty-icon text-muted" />
            <h3>No matches found</h3>
            <p>Try double checking your spelling or using different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtnStyle = {
  padding: '10px 24px',
  borderRadius: '99px',
  border: '1px solid var(--border-delicate)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  textDecoration: 'none',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  fontSize: '0.9rem',
};
