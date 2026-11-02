import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  FileCheck,
  PlusCircle,
  Edit2,
  Trash2,
  HelpCircle,
  UserPlus,
  Clock,
  Award,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Link2,
  BookOpen,
  Settings,
  ListOrdered,
  Users
} from 'lucide-react';

const AssessmentManagement = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Assessment Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('settings'); // 'settings' | 'questions'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    duration_minutes: 30,
    total_marks: 50,
    passing_marks: 30,
    status: 'published',
    allow_view_answers: 1
  });
  const [modalLoading, setModalLoading] = useState(false);

  // In-Modal Questions State
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionItem, setEditingQuestionItem] = useState(null);
  const [isAddingNewQuestion, setIsAddingNewQuestion] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    marks: 10,
    expected_keywords: '',
    explanation: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAssessment, setAssigningAssessment] = useState(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [asmRes, catRes, candRes] = await Promise.all([
        api.get('/admin/assessments'),
        api.get('/admin/categories'),
        api.get('/admin/candidates')
      ]);

      if (asmRes.data.success) setAssessments(asmRes.data.assessments || []);
      if (catRes.data.success) setCategories(catRes.data.categories || []);
      if (candRes.data.success) setCandidates(candRes.data.candidates || []);
    } catch (err) {
      console.error('Error fetching admin assessments data:', err);
      setError('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentQuestions = async (asmId) => {
    try {
      setLoadingQuestions(true);
      const res = await api.get(`/admin/assessments/${asmId}`);
      if (res.data.success && res.data.assessment) {
        setAssessmentQuestions(res.data.assessment.questions || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCopyDirectLink = (asmId) => {
    const url = `${window.location.origin}/take-test/${asmId}`;
    navigator.clipboard.writeText(url);
    setSuccessMsg(`Direct test link copied! Candidates can take it without login: ${url}`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const openCreateModal = () => {
    setEditingAssessment(null);
    setActiveModalTab('settings');
    setAssessmentQuestions([]);
    setEditingQuestionItem(null);
    setIsAddingNewQuestion(false);
    setFormData({
      title: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      duration_minutes: 30,
      total_marks: 50,
      passing_marks: 30,
      status: 'published',
      allow_view_answers: 1
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (asm) => {
    setEditingAssessment(asm);
    setActiveModalTab('settings');
    setEditingQuestionItem(null);
    setIsAddingNewQuestion(false);
    setFormData({
      title: asm.title,
      description: asm.description || '',
      category_id: asm.category_id || '',
      duration_minutes: asm.duration_minutes || 30,
      total_marks: asm.total_marks || 50,
      passing_marks: asm.passing_marks || 30,
      status: asm.status || 'published',
      allow_view_answers: asm.allow_view_answers ? 1 : 0
    });
    setError('');
    setShowModal(true);
    fetchAssessmentQuestions(asm.id);
  };

  const handleStartEditQuestion = (q) => {
    setEditingQuestionItem(q);
    setIsAddingNewQuestion(false);
    let kw = '';
    if (q.expected_keywords) {
      try {
        const parsed = JSON.parse(q.expected_keywords);
        kw = Array.isArray(parsed) ? parsed.join(', ') : q.expected_keywords;
      } catch {
        kw = q.expected_keywords;
      }
    }
    setQuestionFormData({
      question_text: q.question_text || '',
      marks: q.marks || 10,
      expected_keywords: kw,
      explanation: q.explanation || ''
    });
  };

  const handleStartAddQuestion = () => {
    setEditingQuestionItem(null);
    setIsAddingNewQuestion(true);
    setQuestionFormData({
      question_text: '',
      marks: 10,
      expected_keywords: '',
      explanation: ''
    });
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionItem(null);
    setIsAddingNewQuestion(false);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionFormData.question_text.trim()) return;

    try {
      setSavingQuestion(true);
      const keywordsArray = questionFormData.expected_keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      if (isAddingNewQuestion) {
        await api.post('/admin/questions/mcq', {
          assessment_id: editingAssessment.id,
          question_text: questionFormData.question_text.trim(),
          marks: Number(questionFormData.marks) || 10,
          question_order: assessmentQuestions.length + 1,
          explanation: questionFormData.explanation,
          expected_keywords: keywordsArray
        });
        setSuccessMsg('Question added successfully!');
      } else if (editingQuestionItem) {
        await api.put(`/admin/questions/mcq/${editingQuestionItem.id}`, {
          question_text: questionFormData.question_text.trim(),
          marks: Number(questionFormData.marks) || 10,
          question_order: editingQuestionItem.question_order || 1,
          explanation: questionFormData.explanation,
          expected_keywords: keywordsArray
        });
        setSuccessMsg('Question updated successfully!');
      }

      await fetchAssessmentQuestions(editingAssessment.id);
      fetchInitialData();
      setEditingQuestionItem(null);
      setIsAddingNewQuestion(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${questionId}`);
      setSuccessMsg('Question deleted successfully!');
      await fetchAssessmentQuestions(editingAssessment.id);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Assessment title is required.');
      return;
    }

    try {
      setModalLoading(true);
      setError('');

      if (editingAssessment) {
        await api.put(`/admin/assessments/${editingAssessment.id}`, formData);
        setSuccessMsg('Assessment updated successfully!');
      } else {
        const res = await api.post('/admin/assessments', formData);
        setSuccessMsg('Assessment created successfully!');
        if (res.data.assessmentId) {
          setShowModal(false);
          // Redirect to add questions
          navigate(`/admin/assessments/${res.data.assessmentId}/questions`);
          return;
        }
      }

      setShowModal(false);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assessment.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleTogglePublish = async (asmId) => {
    try {
      const res = await api.patch(`/admin/assessments/${asmId}/toggle-publish`);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchInitialData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const handleDeleteAssessment = async (asmId) => {
    if (!window.confirm('Are you sure you want to delete this assessment? All associated questions and attempts will be removed.')) {
      return;
    }

    try {
      await api.delete(`/admin/assessments/${asmId}`);
      setSuccessMsg('Assessment deleted successfully.');
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assessment.');
    }
  };

  // Open Assign Modal
  const openAssignModal = (asm) => {
    setAssigningAssessment(asm);
    setSelectedCandidateIds([]);
    setError('');
    setShowAssignModal(true);
  };

  const handleSelectCandidate = (candId) => {
    if (selectedCandidateIds.includes(candId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== candId));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, candId]);
    }
  };

  const handleSelectAllCandidates = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.id));
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (selectedCandidateIds.length === 0) {
      setError('Please select at least one candidate to assign.');
      return;
    }

    try {
      setAssignLoading(true);
      await api.post('/admin/assign', {
        assessmentId: assigningAssessment.id,
        candidateIds: selectedCandidateIds
      });

      setSuccessMsg(`Assessment assigned to ${selectedCandidateIds.length} candidate(s)!`);
      setShowAssignModal(false);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign assessment.');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                MCQ Assessment Management
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                Create, configure time limits, manage 4-choice questions, and publish interview rounds.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={16} />
              <span>Create New Assessment</span>
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

          {/* Assessments Table Card */}
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
                <p style={{ color: 'var(--text-muted)' }}>Loading assessment rounds...</p>
              </div>
            ) : assessments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No assessments found. Click "Create New Assessment" to configure your first round.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Assessment Title</th>
                      <th>Category</th>
                      <th>Duration</th>
                      <th>Marks (Pass/Total)</th>
                      <th>MCQs</th>
                      <th>Assigned</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map(asm => (
                      <tr key={asm.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.975rem' }}>
                            {asm.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {asm.description ? asm.description.substring(0, 60) + '...' : ''}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={12} />
                            <span>{asm.category_name || 'General'}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                            <Clock size={14} />
                            <span>{asm.duration_minutes} Mins</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{asm.passing_marks} / {asm.total_marks}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/assessments/${asm.id}/questions`)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <HelpCircle size={13} color="var(--primary)" />
                            <span>{asm.question_count || 0} Questions</span>
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => openAssignModal(asm)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Assign to Candidates"
                          >
                            <UserPlus size={13} />
                            <span>{asm.assigned_count || 0} Assigned</span>
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleTogglePublish(asm.id)}
                            className={`badge ${asm.status === 'published' ? 'badge-success' : 'badge-warning'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Click to toggle publish status"
                          >
                            {asm.status === 'published' ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleCopyDirectLink(asm.id)}
                              className="btn btn-secondary btn-sm"
                              title="Copy Direct Candidate Link (No Login Required)"
                            >
                              <Link2 size={14} color="var(--primary)" />
                            </button>
                            <button
                              onClick={() => openEditModal(asm)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Assessment"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAssessment(asm.id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Assessment"
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

      {/* Create / Edit Assessment Modal with Question Management */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAssessment ? `Edit Assessment: ${editingAssessment.title}` : 'Create New Assessment'}
        subtitle={editingAssessment ? 'Configure assessment settings, passing scores & question bank' : 'Configure round title, duration, passing criteria & domain'}
        icon={<FileCheck size={18} />}
        maxWidth={editingAssessment ? '840px' : '620px'}
      >
        {/* Top Tab Bar (Only when editing existing assessment) */}
        {editingAssessment && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '2px solid #f1f5f9',
            marginBottom: '1.5rem',
            paddingBottom: '2px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveModalTab('settings'); setEditingQuestionItem(null); setIsAddingNewQuestion(false); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.65rem 1.15rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: activeModalTab === 'settings' ? '#4f46e5' : '#64748b',
                borderBottom: activeModalTab === 'settings' ? '3px solid #4f46e5' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-4px',
                transition: 'all 0.2s ease'
              }}
            >
              <Settings size={16} />
              <span>Assessment Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('questions')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.65rem 1.15rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: activeModalTab === 'questions' ? '#4f46e5' : '#64748b',
                borderBottom: activeModalTab === 'questions' ? '3px solid #4f46e5' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-4px',
                transition: 'all 0.2s ease'
              }}
            >
              <HelpCircle size={16} />
              <span>Manage Questions</span>
              <span style={{
                background: activeModalTab === 'questions' ? '#eef2ff' : '#f1f5f9',
                color: activeModalTab === 'questions' ? '#4f46e5' : '#64748b',
                padding: '0.15rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: activeModalTab === 'questions' ? '1px solid #c7d2fe' : '1px solid #e2e8f0'
              }}>
                {assessmentQuestions.length}
              </span>
            </button>
          </div>
        )}

        {/* TAB 1: Assessment Details */}
        {activeModalTab === 'settings' && (
          <form onSubmit={handleSaveAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {editingAssessment && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#475569'
              }}>
                <span>Questions in this assessment: <strong style={{ color: '#0f172a' }}>{assessmentQuestions.length} Questions</strong></span>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('questions')}
                  style={{
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4f46e5',
                    borderRadius: '6px',
                    padding: '0.3rem 0.75rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Edit Questions →
                </button>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Assessment Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Round 1: Digital Marketing Strategy Assessment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '44px',
                  padding: '0 0.9rem',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '44px',
                  padding: '0 0.9rem',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Description / Interview Overview
              </label>
              <textarea
                rows={3}
                placeholder="Summary of assessment syllabus and evaluation objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Duration (Mins) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.9rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Total Marks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.9rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Passing Marks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.9rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.9rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="published">Published (Visible to Candidates)</option>
                  <option value="draft">Draft (Hidden from Candidates)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Allow Candidate to Review Answers?
                </label>
                <select
                  value={formData.allow_view_answers}
                  onChange={(e) => setFormData({ ...formData, allow_view_answers: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 0.9rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value={1}>Yes, show correct answers & explanations</option>
                  <option value={0}>No, hide correct answers & explanations</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.75rem', borderRadius: '8px', fontWeight: 700 }}
              >
                {modalLoading ? 'Saving...' : editingAssessment ? 'Update Assessment' : 'Save & Configure Questions'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Questions Management */}
        {activeModalTab === 'questions' && (
          <div>
            {/* If adding or editing a question */}
            {(isAddingNewQuestion || editingQuestionItem) ? (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      {editingQuestionItem ? editingQuestionItem.question_order : assessmentQuestions.length + 1}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {editingQuestionItem ? 'Edit Question Statement & Keywords' : 'Add New Question'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelQuestionEdit}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Question Statement *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. What is the difference between CPM and CPC in Meta Ads campaign optimization?"
                      value={questionFormData.question_text}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, question_text: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.75rem 0.9rem',
                        fontSize: '0.925rem',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Marks *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={questionFormData.marks}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, marks: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          height: '42px',
                          padding: '0 0.85rem',
                          fontSize: '0.925rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                        Expected Keywords for Auto-Scoring <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>(Comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CPM, CPC, Cost Per Click, Cost Per Mille, Impression"
                        value={questionFormData.expected_keywords}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, expected_keywords: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          height: '42px',
                          padding: '0 0.85rem',
                          fontSize: '0.925rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Model Answer / Explanation <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>(Shown to candidate during review)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Provide the ideal explanation or answer summary..."
                      value={questionFormData.explanation}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.75rem 0.9rem',
                        fontSize: '0.925rem',
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleCancelQuestionEdit}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingQuestion}
                      style={{
                        padding: '0.6rem 1.5rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        cursor: savingQuestion ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      {savingQuestion ? 'Saving...' : editingQuestionItem ? 'Save Changes' : 'Add Question'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      Questions ({assessmentQuestions.length})
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Candidate typed answers will be evaluated based on keyword matching
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartAddQuestion}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.55rem 1.2rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                    }}
                  >
                    <PlusCircle size={15} />
                    <span>Add Question</span>
                  </button>
                </div>

                {loadingQuestions ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading questions...</p>
                  </div>
                ) : assessmentQuestions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1.5px dashed #cbd5e1'
                  }}>
                    <HelpCircle size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.4rem', color: '#1e293b' }}>No questions configured yet</h4>
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                      Add open-ended questions and target keywords for auto-evaluation.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartAddQuestion}
                      style={{
                        padding: '0.6rem 1.35rem',
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Question
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {assessmentQuestions.map((q, idx) => {
                      let keywords = [];
                      if (q.expected_keywords) {
                        try {
                          const parsed = JSON.parse(q.expected_keywords);
                          keywords = Array.isArray(parsed) ? parsed : q.expected_keywords.split(',').map(s => s.trim());
                        } catch {
                          keywords = String(q.expected_keywords).split(',').map(s => s.trim());
                        }
                      }
                      return (
                        <div
                          key={q.id || idx}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1.15rem 1.25rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: '#eef2ff',
                                color: '#4f46e5',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.65rem',
                                borderRadius: '6px'
                              }}>
                                Question {q.question_order || idx + 1}
                              </span>
                              <span style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px'
                              }}>
                                {q.marks || 10} Marks
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEditQuestion(q)}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Edit question text and keywords"
                              >
                                <Edit2 size={13} color="#4f46e5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.6rem',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                                title="Delete question"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                            {q.question_text}
                          </div>

                          {keywords.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px', marginTop: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Expected Keywords:</span>
                              {keywords.filter(Boolean).map((kw, kidx) => (
                                <span
                                  key={kidx}
                                  style={{
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#065f46',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '999px'
                                  }}
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}

                          {q.explanation && (
                            <div style={{
                              background: '#f8fafc',
                              border: '1px solid #f1f5f9',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              marginTop: '0.6rem',
                              fontSize: '0.8rem',
                              color: '#64748b'
                            }}>
                              <strong style={{ color: '#475569' }}>Explanation / Model Answer:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign to Candidates Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Assessment to Candidates"
        subtitle={`Allocating "${assigningAssessment?.title}" to selected candidates`}
        icon={<Users size={18} />}
        maxWidth="540px"
      >
        <form onSubmit={handleAssignSubmit}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select registered candidates who should have access to this assessment:
            </span>
            <button
              type="button"
              onClick={handleSelectAllCandidates}
              className="btn btn-secondary btn-sm"
            >
              {selectedCandidateIds.length === candidates.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div style={{
            maxHeight: '260px',
            overflowY: 'auto',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem'
          }}>
            {candidates.map(cand => {
              const isChecked = selectedCandidateIds.includes(cand.id);
              return (
                <label
                  key={cand.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isChecked ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleSelectCandidate(cand.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{cand.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cand.email} &bull; {cand.phone}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading || selectedCandidateIds.length === 0}
              className="btn btn-primary"
            >
              {assignLoading ? 'Assigning...' : `Assign to ${selectedCandidateIds.length} Candidate(s)`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssessmentManagement;
