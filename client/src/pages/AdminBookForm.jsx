import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi, categoryApi, bookApi } from '../services/api';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import './AdminForm.css';

export default function AdminBookForm() {
  const { id } = useParams();
  const isEditing = id !== 'new';
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  
  // File upload state
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null); // URL of existing or selected

  useEffect(() => {
    categoryApi.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(console.error);

    if (isEditing) {
      bookApi.getBook(id)
        .then(res => {
          const book = res.data.data;
          setTitle(book.title);
          setAuthor(book.author);
          setDescription(book.description || '');
          setCategoryId(book.categoryId || '');
          setIsFeatured(book.isFeatured || false);
          if (book.coverImage) setCoverImagePreview(book.coverImage);
        })
        .catch(err => setError('Failed to load book data'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError('Title and Author are required');
      return;
    }

    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    if (description) formData.append('description', description);
    if (categoryId) formData.append('categoryId', categoryId);
    formData.append('isFeatured', isFeatured.toString());
    
    if (coverImageFile) {
      formData.append('coverImage', coverImageFile);
    } 
    // In our backend, if no coverImage is set but we want to delete, it handles standard PUT.
    // If we only wanted to delete existing, we'd add logic, but we'll stick to updating existing or adding new.

    try {
      if (isEditing) {
        await adminApi.updateBook(id, formData);
      } else {
        await adminApi.createBook(formData);
      }
      navigate('/admin/books');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error saving book');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading form...</div>;

  return (
    <div className="admin-book-form-page">
      <Link to="/admin/books" className="back-link" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Books
      </Link>
      
      <div className="admin-page-header">
        <h1 className="admin-page-title">{isEditing ? 'Edit Book' : 'Add New Book'}</h1>
      </div>

      <div className="admin-form-panel glass-panel">
        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-complex-form">
          <div className="form-layout">
            <div className="form-main">
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. The Great Gatsby"
                  required
                />
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input 
                  type="text" 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)} 
                  placeholder="e.g. F. Scott Fitzgerald"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Enter a captivating summary..."
                  rows={6}
                />
              </div>
            </div>

            <div className="form-sidebar">
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="fancy-select"
                >
                  <option value="">-- No Category --</option>
                  {categories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group inline-checkbox">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              <div className="form-group upload-group">
                <label>Cover Image (Max 5MB)</label>
                <div className="upload-area">
                  {coverImagePreview ? (
                     <div className="cover-preview">
                       <img src={coverImagePreview} alt="Preview" />
                       <button type="button" onClick={removeImage} className="remove-img-btn">
                          <X size={16} /> Remove
                       </button>
                     </div>
                  ) : (
                     <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                       <Upload size={32} className="upload-icon" />
                       <span>Click to browse</span>
                       <small>JPEG, PNG, WebP supported</small>
                     </div>
                  )}
                  <input 
                    type="file" 
                    onChange={handleImageChange} 
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden-file-input"
                    ref={fileInputRef}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="form-actions">
             <button type="submit" className="admin-btn primary" disabled={saving}>
               <Save size={18} /> {saving ? 'Saving...' : 'Save Book'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
