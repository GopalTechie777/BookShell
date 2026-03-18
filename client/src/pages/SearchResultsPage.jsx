import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookApi, gutenbergApi, adminApi } from '../services/api';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { Search, Library, BookOpen, Download, CheckCircle, AlertCircle } from 'lucide-react';
import './ListPage.css';

// Per-card import state: idle | importing | done | error
function GutenbergCard({ book, canImport }) {
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
      } else if (err.response?.status === 401) {
        setErrorMsg('Session expired. Please log in as Admin.');
        setStatus('error');
      } else {
        setErrorMsg(msg);
        setStatus('error');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Reuse BookCard visuals but render as a non-link div flex-grow to push button down */}
      <div
        className="book-card glass-panel"
        style={{ cursor: status === 'done' && importedId ? 'pointer' : 'default', flexGrow: 1 }}
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
      {canImport && (
        <div style={{ paddingTop: '12px', marginTop: 'auto' }}>
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
  const localLimit = 20;
  const gutenbergLimit = 32;

  const [searchSource, setSearchSource] = useState('local'); // 'local' | 'gutenberg'

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [gutenbergHasNext, setGutenbergHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  // Detect if user is logged in as admin (has token in localStorage)
  const isUser = !!localStorage.getItem('userToken');
  const canImport = !!localStorage.getItem('adminToken') || isUser;

  useEffect(() => {
    if (!q) {
      setBooks([]);
      setTotal(0);
      setErrorMsg(null);
      return;
    }

    setBooks([]);
    setLoading(true);
    setErrorMsg(null);
    setNoticeMsg(null);

    if (searchSource === 'local') {
      bookApi
        .search({ q, page, limit: localLimit })
        .then((res) => {
          setBooks(res.data.data);
          setTotal(res.data.total);
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg('Failed to search local library. Please try again.');
        })
        .finally(() => setLoading(false));
    } else {
      // Search Project Gutenberg via our own proxy endpoint
      gutenbergApi
        .search(q, page)
        .then((res) => {
          setBooks(res.data.data);
          setTotal(res.data.total);
          setGutenbergHasNext(res.data.hasNext);
          if (
            res.data.degraded &&
            res.data.message &&
            !res.data.message.includes('Using Project Gutenberg fallback search source')
          ) {
            setNoticeMsg(res.data.message);
          }
        })
        .catch((err) => {
          console.error('Gutenberg search error:', err.response?.status || err.message);
          setErrorMsg(err.response?.data?.error?.message || 'Gutenberg search unavailable. Please try again.');
        })
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
                className="search-source-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: '99px',
                  border: searchSource === 'local' ? 'none' : '1px solid var(--border-delicate)',
                  background: searchSource === 'local' ? 'var(--accent-primary)' : '#fff',
                  color: searchSource === 'local' ? '#fff' : 'var(--text-main)',
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
                className="search-source-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: '99px',
                  border: searchSource === 'gutenberg' ? 'none' : '1px solid var(--border-delicate)',
                  background: searchSource === 'gutenberg' ? 'var(--accent-primary)' : '#fff',
                  color: searchSource === 'gutenberg' ? '#fff' : 'var(--text-main)',
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

          {searchSource === 'gutenberg' && canImport && (
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Click <strong>Import to Library</strong> on any result to fetch and store the full book for reading here.
            </p>
          )}
          {searchSource === 'gutenberg' && !canImport && (
            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Browsing 70,000+ free public domain books. Log in to import any book for reading.
            </p>
          )}
        </div>
      </div>

      <div className={`container list-content ${searchSource === 'local' ? 'list-content-wide' : ''}`}>
        {noticeMsg && (
          <div
            className="glass-panel"
            style={{
              padding: '12px 14px',
              marginBottom: '16px',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.08)',
              color: 'var(--text-main)',
              fontSize: '0.92rem',
            }}
          >
            {noticeMsg}
          </div>
        )}
        {loading ? (
          <div className="center-message">
            <p className="loading-text loading-inline" aria-live="polite">
              {searchSource === 'gutenberg' ? 'Searching Project Gutenberg' : 'Searching database'}
              <span className="loading-dots" aria-hidden="true"></span>
            </p>
          </div>
        ) : errorMsg ? (
          <div className="empty-state glass-panel">
            <AlertCircle size={48} className="empty-icon" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
            <h3>Search Failed</h3>
            <p>{errorMsg}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
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
            <div className={`books-grid ${searchSource === 'local' ? 'books-grid-local' : ''}`}>
              {searchSource === 'local'
                ? books.map((book) => <BookCard key={book.id} book={book} />)
                : books.map((book) => (
                    <GutenbergCard key={book.gutenbergId ?? book.id} book={book} canImport={canImport} />
                  ))}
            </div>
            {searchSource === 'local' && <Pagination total={total} limit={localLimit} />}
            {searchSource === 'gutenberg' && <Pagination total={total} limit={gutenbergLimit} />}
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

