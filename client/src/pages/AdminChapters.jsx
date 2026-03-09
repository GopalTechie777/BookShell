import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookApi, adminApi } from '../services/api';
import { ArrowLeft, BookOpen, Plus, Edit2, Trash2, ListOrdered } from 'lucide-react';
import './AdminCategories.css'; // Utilizing shared table and action styles

export default function AdminChapters() {
  const { id } = useParams(); // bookId
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBookData = () => {
    setLoading(true);
    bookApi.getBook(id)
      .then(res => setBook(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookData();
  }, [id]);

  const handleDelete = async (chapterId) => {
    if (!window.confirm('Are you certain? Deleting a chapter is permanent.')) return;
    try {
      await adminApi.deleteChapter(chapterId);
      loadBookData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error deleting chapter');
    }
  };

  if (loading) return <div className="admin-loading">Loading chapters...</div>;
  if (!book) return <div className="admin-error">Book not found.</div>;

  return (
    <div className="admin-chapters">
      <Link to="/admin/books" className="back-link" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Books List
      </Link>

      <div className="admin-page-header">
        <h1 className="admin-page-title inline-flex">
          <BookOpen className="title-icon" style={{ marginRight: '16px', color: 'var(--accent-primary)' }}/>
          Chapters for "{book.title}"
        </h1>
        <Link to={`/admin/books/${id}/chapters/new`} className="admin-btn primary">
          <Plus size={16} /> Add New Chapter
        </Link>
      </div>

      <div className="admin-table-wrapper glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Order</th>
              <th>Chapter Title</th>
              <th>Word Count (Est.)</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(book.chapters || []).map(ch => {
               // rough estimation of word count by counting spaces in HTML string
               const words = Math.ceil((ch.content || '').split(' ').length);
               return (
                  <tr key={ch.id}>
                    <td><div className="chapter-order-badge"><ListOrdered size={14}/> {ch.order}</div></td>
                    <td className="font-medium text-white">{ch.title}</td>
                    <td className="text-muted">{words.toLocaleString()} words</td>
                    <td className="text-right table-actions inline-actions">
                      <Link to={`/admin/books/${id}/chapters/${ch.id}/edit`} className="action-btn edit" title="Edit Chapter">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(ch.id)} className="action-btn delete" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
               );
            })}
            {(!book.chapters || book.chapters.length === 0) && (
              <tr>
                <td colSpan="4" className="admin-table-msg">No chapters found for this book.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
