import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  Video,
  PlusCircle,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  Search,
  Sparkles
} from 'lucide-react';

const ModuleManagement = () => {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    assessment_id: '',
    video_url: '',
    resource_url: '',
    file_name: '',
    order_index: 1
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [modRes, catRes, asmRes] = await Promise.all([
        api.get('/modules'),
        api.get('/admin/categories'),
        api.get('/admin/assessments')
      ]);

      if (modRes.data.success) setModules(modRes.data.modules || []);
      if (catRes.data.success) setCategories(catRes.data.categories || []);
      if (asmRes.data.success) setAssessments(asmRes.data.assessments || []);
    } catch (err) {
      console.error('Error fetching module management data:', err);
      setError('Failed to load modules. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mod = null) => {
    if (mod) {
      setEditingModule(mod);
      setFormData({
        title: mod.title,
        description: mod.description || '',
        category_id: mod.category_id || '',
        assessment_id: mod.assessment_id || '',
        video_url: mod.video_url,
        resource_url: mod.resource_url || '',
        file_name: mod.file_name || '',
        order_index: mod.order_index || 1
      });
    } else {
      setEditingModule(null);
      setFormData({
        title: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        assessment_id: '',
        video_url: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
        resource_url: '',
        file_name: '',
        order_index: modules.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.video_url.trim()) {
      alert('Module title and YouTube video URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, formData);
      } else {
        await api.post('/modules', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving module:', err);
      alert(err.response?.data?.message || 'Error saving learning module.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;
    try {
      await api.delete(`/modules/${moduleToDelete.id}`);
      setIsDeleteModalOpen(false);
      setModuleToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Failed to delete module.');
    }
  };

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.category_name && m.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                Learning Modules & YouTube Training
              </h1>
              
            </div>

            <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={18} />
              <span>Create New Module</span>
            </button>
          </div>

          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Search bar */}
          <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search modules by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Modules Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Video size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No learning modules found. Click "Create New Module" above to add one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {filteredModules.map((m) => (
                <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* YouTube Video Preview Frame */}
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
                      <iframe
                        src={m.video_url}
                        title={m.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">
                        {m.category_name || 'General Category'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Order #{m.order_index}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                      {m.title}
                    </h3>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {m.description || 'No description provided.'}
                    </p>

                    {m.assessment_title && (
                      <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                        <CheckCircle2 size={14} />
                        <span>Linked Assessment: <strong>{m.assessment_title}</strong></span>
                      </div>
                    )}

                    {(m.resource_url || m.file_name) && (
                      <div style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                        <FileText size={14} />
                        <span>Resource: {m.file_name || m.resource_url}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <button
                      onClick={() => handleOpenModal(m)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setModuleToDelete(m);
                        setIsDeleteModalOpen(true);
                      }}
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? 'Edit Learning Module' : 'Create Learning Module'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Module Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Basics of Excel - Complete Beginner Guide"
              className="form-control"
              required
            />
          </div>

          <div>
            <label className="form-label">YouTube Video URL *</label>
            <input
              type="text"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=Vl0H-qTclOg"
              className="form-control"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Paste standard YouTube watch URL or youtu.be link. It will automatically convert to an embed player.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="form-control"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Linked Assessment (Optional)</label>
              <select
                value={formData.assessment_id}
                onChange={(e) => setFormData({ ...formData, assessment_id: e.target.value })}
                className="form-control"
              >
                <option value="">-- None / General Training --</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Description & Instructions</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the purpose of this module and key concepts covered in the video..."
              rows={3}
              className="form-control"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource / CheatSheet Link (Optional)</label>
              <input
                type="text"
                value={formData.resource_url}
                onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                placeholder="https://example.com/notes.pdf"
                className="form-control"
              />
            </div>

            <div>
              <label className="form-label">Resource File Name (Optional)</label>
              <input
                type="text"
                value={formData.file_name}
                onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                placeholder="Excel_Formulas_CheatSheet.pdf"
                className="form-control"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Display Order Index</label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
              className="form-control"
              min={1}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : editingModule ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Learning Module"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)' }}>
            Are you sure you want to delete the module <strong>"{moduleToDelete?.title}"</strong>? Candidates will no longer see this video.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete Module
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModuleManagement;
