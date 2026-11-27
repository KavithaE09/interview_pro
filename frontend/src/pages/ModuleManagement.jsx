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
  Sparkles,
  UploadCloud,
  Link2,
  Globe
} from 'lucide-react';

const isEmbedVideo = (url) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('youtube.com') ||
    u.includes('youtu.be') ||
    u.includes('vimeo.com') ||
    u.endsWith('.mp4') ||
    u.endsWith('.webm')
  );
};

const getPlatformInfo = (url) => {
  if (!url) return { name: 'Online Tutorial', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.15)' };
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return { name: 'YouTube Video', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  }
  if (u.includes('udemy.com')) {
    return { name: 'Udemy Course', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
  }
  if (u.includes('coursera.org')) {
    return { name: 'Coursera Course', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' };
  }
  if (u.includes('vimeo.com')) {
    return { name: 'Vimeo Video', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
  }
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return { name: domain, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
  } catch {
    return { name: 'Website Tutorial', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.15)' };
  }
};

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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showManualLink, setShowManualLink] = useState(false);

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
    setShowManualLink(false);
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
      if (mod.resource_url && !mod.resource_url.startsWith('/uploads/')) {
        setShowManualLink(true);
      }
    } else {
      setEditingModule(null);
      setFormData({
        title: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        assessment_id: '',
        video_url: '',
        resource_url: '',
        file_name: '',
        order_index: modules.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/modules/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          resource_url: res.data.file_url,
          file_name: res.data.file_name || file.name
        }));
      } else {
        alert(res.data.message || 'File upload failed.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert(err.response?.data?.message || 'Error uploading file.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.video_url.trim()) {
      alert('Module title and learning URL (YouTube, Udemy, or website link) are required.');
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
                    {/* Media Preview or External Course Card */}
                    {isEmbedVideo(m.video_url) ? (
                      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1rem' }}>
                        <iframe
                          src={m.video_url}
                          title={m.title}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: '170px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        marginBottom: '1rem',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '0.6rem',
                        boxSizing: 'border-box'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          background: getPlatformInfo(m.video_url).bg,
                          color: getPlatformInfo(m.video_url).color,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          <Globe size={13} />
                          <span>{getPlatformInfo(m.video_url).name}</span>
                        </span>
                        <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}>
                          Online Course / Website
                        </div>
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '6px',
                            background: 'var(--primary, #4f46e5)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <span>Open Course</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}

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
            <label className="form-label">Video / Website / Course URL *</label>
            <input
              type="text"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="e.g. YouTube watch URL, Udemy course link, Coursera, or website tutorial"
              className="form-control"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Paste YouTube video, Vimeo, Udemy course, Coursera, or any website link. YouTube/Vimeo will embed automatically, while online courses will display an interactive course portal card.
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

          {/* Resource / CheatSheet File Upload & Link Section */}
          <div style={{
            background: 'var(--bg-card, #f8fafc)',
            border: '1.5px dashed var(--border, #cbd5e1)',
            borderRadius: '12px',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary, #4f46e5)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                  Resource / CheatSheet File (PDF, Excel, Docs, etc.)
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>Optional</span>
            </div>

            {/* If a file is uploaded / linked */}
            {formData.resource_url ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: '#ffffff',
                border: '1.5px solid #10b981',
                borderRadius: '8px',
                gap: '0.75rem',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                  <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formData.file_name || 'Uploaded Document'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formData.resource_url}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, resource_url: '', file_name: '' })}
                  title="Remove file"
                  className="btn btn-sm"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={14} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Remove</span>
                </button>
              </div>
            ) : (
              /* Drop / Click to Upload */
              <div>
                <input
                  type="file"
                  id="resource-file-input"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="resource-file-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem 1rem',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <UploadCloud size={28} color={uploadingFile ? '#94a3b8' : 'var(--primary, #4f46e5)'} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                    {uploadingFile ? 'Uploading file to server...' : 'Click to Upload CheatSheet / Resource File'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                    Supports PDF, Excel, Word, PPT, TXT, Images, ZIP (Max 50MB)
                  </div>
                </label>
              </div>
            )}

            {/* Toggle to enter external link manually */}
            <div>
              <button
                type="button"
                onClick={() => setShowManualLink(!showManualLink)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #4f46e5)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Link2 size={13} />
                <span>{showManualLink ? 'Hide manual URL fields' : 'Or enter an external URL / custom name manually'}</span>
              </button>

              {showManualLink && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.65rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource / CheatSheet Link</label>
                    <input
                      type="text"
                      value={formData.resource_url}
                      onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                      placeholder="https://example.com/notes.pdf or /uploads/..."
                      className="form-control"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource File Name</label>
                    <input
                      type="text"
                      value={formData.file_name}
                      onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                      placeholder="Excel_Formulas_CheatSheet.pdf"
                      className="form-control"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}
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
        subtitle="This action will permanently delete this module"
        icon={<Trash2 size={20} color="#ef4444" />}
        maxWidth="480px"
      >
        <div style={{ padding: '0.25rem 0' }}>
          <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
            Are you sure you want to delete the module <strong>&ldquo;{moduleToDelete?.title}&rdquo;</strong>?
          </p>

          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.825rem',
            color: '#be123c',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>Candidates will no longer be able to view this module and its resources.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Trash2 size={15} />
              <span>Yes, Delete Module</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModuleManagement;
