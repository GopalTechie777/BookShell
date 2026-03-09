import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { categoryApi } from '../services/api';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { ArrowLeft, BookOpen } from 'lucide-react';
import './ListPage.css';

export default function CategoryPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const page = parseInt(params.get('page')) || 1;
  const limit = 20;

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Fetch category specific details alongside its books
    Promise.all([
      categoryApi.getCategoryBooks(id, { page, limit }),
      // To get the category name, we fetch all and find it since we don't have a single /categories/:id endpoint
      categoryApi.getCategories()
    ])
    .then(([booksRes, catsRes]) => {
      setBooks(booksRes.data.data);
      setTotal(booksRes.data.total);
      
      const foundCat = catsRes.data.data.find(c => c.id === id);
      setCategoryInfo(foundCat || { name: 'Unknown Category', description: '' });
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));

  }, [id, page]);

  if (loading) {
    return (
      <div className="container center-message">
        <p className="loading-text">Loading books...</p>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="container center-message">
        <h2>Category Not Found</h2>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="list-page">
      <div className="hero-banner glass-panel">
        <div className="container banner-content">
          <Link to="/" className="back-link"><ArrowLeft size={16}/> Back to Library</Link>
          <h1 className="banner-title">{categoryInfo.name}</h1>
          <p className="banner-desc">{categoryInfo.description}</p>
          <div className="banner-meta">
            <BookOpen size={16} />
            <span>{total} books available</span>
          </div>
        </div>
      </div>

      <div className="container list-content">
        {books.length > 0 ? (
          <>
            <div className="books-grid">
              {books.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            <Pagination total={total} limit={limit} />
          </>
        ) : (
          <div className="empty-state glass-panel">
            <BookOpen size={48} className="empty-icon text-muted" />
            <h3>No books found in this category</h3>
            <p>Our library is constantly expanding. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
