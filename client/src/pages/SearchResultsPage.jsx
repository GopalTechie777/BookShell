import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookApi } from '../services/api';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { Search, Library, Globe } from 'lucide-react';
import './ListPage.css';

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const page = parseInt(params.get('page')) || 1;
  const limit = 20;

  const [searchSource, setSearchSource] = useState('local'); // 'local' | 'openlibrary'
  
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setBooks([]);
      setTotal(0);
      return;
    }

    setLoading(true);

    if (searchSource === 'local') {
      bookApi.search({ q, page, limit })
        .then(res => {
          setBooks(res.data.data);
          setTotal(res.data.total);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Dynamic Open Library Search mapping straight into our frontend!
      fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.docs.map((doc, idx) => ({
            id: doc.key || `ol-${idx}`,
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
            isExternal: true,
            externalUrl: `https://openlibrary.org${doc.key}`,
            category: { name: 'External Resource' }
          }));
          setBooks(formatted);
          setTotal(data.numFound);
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
            <p className="banner-desc">Showing matches for <strong className="text-gradient">"{q}"</strong></p>
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
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Library size={18} /> Local Library
              </button>
              <button 
                onClick={() => setSearchSource('openlibrary')}
                style={{
                  padding: '10px 20px', 
                  borderRadius: '99px',
                  border: searchSource === 'openlibrary' ? 'none' : '1px solid var(--border-delicate)',
                  background: searchSource === 'openlibrary' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Globe size={18} /> Open Library API Walk-in
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container list-content">
        {loading ? (
          <div className="center-message"><p className="loading-text">Searching database...</p></div>
        ) : !q ? (
           <div className="empty-state glass-panel">
             <Search size={48} className="empty-icon text-muted" />
             <h3>Ready to Explore?</h3>
             <p>Use the search bar above to look up titles or authors.</p>
           </div>
        ) : books.length > 0 ? (
          <>
            <p className="results-count">
              Found {total} {total === 1 ? 'result' : 'results'} 
              {searchSource === 'openlibrary' && ' in the Open Library global database'}
            </p>
            <div className="books-grid">
              {books.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            {/* Open Library returns massive datasets, we rely purely on their page offset logic via the same pagination component */}
            <Pagination total={total} limit={limit} />
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
