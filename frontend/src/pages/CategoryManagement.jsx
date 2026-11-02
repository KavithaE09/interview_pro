import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  FolderKanban,
  PlusCircle,
  Edit2,
  Trash2,
  Layers,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Save
} from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.category_name);
    setDescription(cat.description || '');
    setError('');
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setModalLoading(true);
      setError('');

      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, {
          category_name: categoryName,
          description
        });
        setSuccessMsg('Category updated successfully!');
      } else {
        await api.post('/admin/categories', {
          category_name: categoryName,
          description
        });
        setSuccessMsg('New category created successfully!');
      }

      setShowModal(false);
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category? Assessments under it will have category set to null.')) {
      return;
    }

    try {
      await api.delete(`/admin/categories/${catId}`);
      setSuccessMsg('Category deleted successfully.');
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Category Management
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                Organize MCQ interview rounds into technical disciplines (e.g., Digital Marketing, Google Analytics, Microsoft Excel).
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} />
              <span>Create New Category</span>
            </button>
          </div>

          {successMsg && (
            <div style={{
              background: 'var(--success-light)',
              border: '1px solid var(--success-border)',
              color: 'var(--success)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Categories Table Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No categories defined yet. Click "Create New Category" to get started.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Category Name</th>
                      <th>Curriculum / Description</th>
                      <th style={{ width: '15%' }}>Assessments</th>
                      <th style={{ width: '15%' }}>Created Date</th>
                      <th style={{ width: '14%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(cat => (
                      <tr key={cat.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Layers size={16} />
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.975rem' }}>
                              {cat.category_name}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                          {cat.description || 'No description provided.'}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileCheck size={12} />
                            <span>{cat.assessment_count || 0} Assessments</span>
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(cat.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openEditModal(cat)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Assessment Category' : 'Create New Assessment Category'}
        subtitle={editingCategory ? 'Update domain discipline name and curriculum topics' : 'Define a new technical interview assessment domain'}
        icon={<FolderKanban size={18} />}
        maxWidth="520px"
      >
        <form onSubmit={handleSaveCategory}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem'
            }}>
              <span>Category Name <span style={{ color: '#ef4444' }}>*</span></span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>Domain Title</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Layers size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                required
                placeholder="e.g. Digital Marketing, Google Analytics, Microsoft Excel"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: '2.6rem',
                  height: '46px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem'
            }}>
              <span>Curriculum / Topic Description</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', textTransform: 'none' }}>Optional</span>
            </label>
            <textarea
              rows={4}
              placeholder="List core topics covered, e.g. Meta Ads, Facebook Pixel, CPA/CTR optimization, A/B Testing, Cost Per Result..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{
                minHeight: '110px',
                lineHeight: '1.5',
                padding: '0.85rem 1rem'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
              Topics give administrators and candidates clear visibility on what skills are evaluated.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                height: '44px',
                fontWeight: 600,
                border: '1.5px solid #e2e8f0'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="btn btn-primary"
              style={{
                flex: 1.4,
                height: '44px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={16} />
              <span>{modalLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
