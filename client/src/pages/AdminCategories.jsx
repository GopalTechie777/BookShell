import React, { useEffect, useState } from 'react';
import { adminApi, categoryApi } from '../services/api';
import { Grid, Edit2, Trash2, Plus, X } from 'lucide-react';
import './AdminCategories.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadCategories = () => {
    setLoading(true);
    categoryApi.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setDescription('');
    setError('');
  };

  const handleEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setError('');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Books within it will be uncategorized.')) return;
    try {
      await adminApi.deleteCategory(id);
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error deleting');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (isEditing) {
        await adminApi.updateCategory(currentId, { name, description });
      } else {
        await adminApi.createCategory({ name, description });
      }
      resetForm();
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error saving category');
    }
  };

  return (
    <div className="admin-categories">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <Grid className="title-icon" /> Category Management
        </h1>
      </div>

      <div className="admin-form-panel glass-panel">
        <div className="panel-header">
          <h3>{isEditing ? 'Edit Category' : 'Create New Category'}</h3>
          {isEditing && (
            <button className="cancel-btn" onClick={resetForm}>
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-form layout-row">
          <div className="form-group flex-1">
            <label>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Science Fiction" 
            />
          </div>
          <div className="form-group flex-2">
            <label>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Brief description of the genre..." 
            />
          </div>
          <div className="form-submit-wrapper">
            <button type="submit" className="admin-btn primary">
               {isEditing ? 'Update' : <><Plus size={16}/> Create</>}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-table-wrapper glass-panel">
        {loading ? (
          <div className="admin-table-msg">Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Books Count</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="font-medium text-white">{cat.name}</td>
                  <td className="text-muted">{cat.description || '-'}</td>
                  <td>{cat.bookCount}</td>
                  <td className="text-right table-actions">
                    <button onClick={() => handleEdit(cat)} className="action-btn edit" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="action-btn delete" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="4" className="admin-table-msg">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
