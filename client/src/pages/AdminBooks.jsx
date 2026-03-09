import React, { useEffect, useState } from 'react';
import { adminApi, bookApi } from '../services/api';
import { FileText, Edit2, Trash2, Plus, List } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import './AdminCategories.css'; // Shared table styles
import './AdminBooks.css';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const page = parseInt(params.get('page')) || 1;
  const limit = 15;

  const loadBooks = () => {
    setLoading(true);
    bookApi.getBooks({ page, limit })
      .then(res => {
        setBooks(res.data.data);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain? Deleting a book will permanently delete all its chapters.')) return;
    try {
      await adminApi.deleteBook(id);
      loadBooks();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error deleting book');
    }
  };

  return (
    <div className="admin-books">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <FileText className="title-icon" /> Book Management
        </h1>
        <Link to="/admin/books/new" className="admin-btn primary">
          <Plus size={16} /> Add New Book
        </Link>
      </div>

      <div className="admin-table-wrapper glass-panel">
        {loading ? (
          <div className="admin-table-msg">Loading library...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title & Author</th>
                  <th>Category</th>
                  <th>Featured</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id}>
                    <td>
                      <div className="admin-list-cover">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt="Cover" />
                        ) : (
                          <div className="admin-list-cover-placeholder" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-white">{book.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{book.author}</div>
                    </td>
                    <td className="text-muted">{book.category ? book.category.name : 'Uncategorized'}</td>
                    <td>
                       <span className={`admin-badge-status ${book.isFeatured ? 'active' : ''}`}>
                         {book.isFeatured ? 'Yes' : 'No'}
                       </span>
                    </td>
                    <td className="text-right table-actions inline-actions" style={{ minWidth: '160px' }}>
                      <Link to={`/admin/books/${book.id}/chapters`} className="action-btn text-muted" title="Manage Chapters">
                        <List size={16} />
                      </Link>
                      <Link to={`/admin/books/${book.id}`} className="action-btn edit" title="Edit Book">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(book.id)} className="action-btn delete" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {books.length === 0 && (
                  <tr>
                    <td colSpan="5" className="admin-table-msg">No books found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ padding: '0 24px' }}>
              <Pagination total={total} limit={limit} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
