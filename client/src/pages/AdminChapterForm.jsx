import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi, bookApi } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';
import './AdminForm.css'; // Generic complex form styles

export default function AdminChapterForm() {
  const { id, chapterId } = useParams(); // id = bookId
  const isEditing = chapterId && chapterId !== 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(1);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isEditing) {
      bookApi.getChapter(id, chapterId)
        .then(res => {
          const ch = res.data.data;
          setTitle(ch.title);
          setOrder(ch.order);
          setContent(ch.content);
        })
        .catch(() => setError('Failed to load chapter data'))
        .finally(() => setLoading(false));
    }
  }, [id, chapterId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and Content are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        await adminApi.updateChapter(chapterId, { title, order: Number(order), content });
      } else {
        await adminApi.createChapter(id, { title, order: Number(order), content });
      }
      navigate(`/admin/books/${id}/chapters`);
    } catch (err) {
      // Catch specific pg unique violation passed from our backend
      if (err.response?.status === 409) {
         setError('A chapter with that order number already exists for this book.');
      } else {
         setError(err.response?.data?.error?.message || 'Error saving chapter');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading form...</div>;

  return (
    <div className="admin-chapter-form-page">
      <Link to={`/admin/books/${id}/chapters`} className="back-link" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Chapters
      </Link>
      
      <div className="admin-page-header">
        <h1 className="admin-page-title">{isEditing ? 'Edit Chapter' : 'Add New Chapter'}</h1>
      </div>

      <div className="admin-form-panel glass-panel">
        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-complex-form">
          <div className="form-layout">
            <div className="form-main" style={{ flex: 3 }}>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Chapter Title *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Chapter 1: The Beginning"
                    required
                  />
                </div>
                <div className="form-group" style={{ width: '120px' }}>
                  <label>Order *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={order} 
                    onChange={e => setOrder(e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Chapter Content (HTML Format) *</label>
                <div className="editor-hint text-muted" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  Raw HTML input enabled. Use &lt;p&gt; and &lt;h2&gt; tags directly. Content is natively rendered.
                </div>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="<h2>Chapter 1</h2><p>Once upon a time...</p>"
                  rows={25}
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
             <button type="submit" className="admin-btn primary" disabled={saving}>
               <Save size={18} /> {saving ? 'Saving...' : 'Save Chapter'}
             </button>
          </div>
        </form>
      </div>

    </div>
  );
}
