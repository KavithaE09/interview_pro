import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Award,
  Layers,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

const QuestionManagement = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState(5);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [assessmentId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/assessments/${assessmentId}`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
        setQuestions(res.data.assessment.questions || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions for this assessment.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setMarks(5);
    setQuestionOrder(questions.length + 1);
    setExplanation('');
    setOptions([
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]);
    setCorrectOptionIndex(0);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    setMarks(q.marks || 5);
    setQuestionOrder(q.question_order || 1);
    setExplanation(q.explanation || '');

    const opts = (q.options || []).map(o => ({
      id: o.id,
      text: o.option_text,
      is_correct: Boolean(o.is_correct)
    }));

    // Pad to 4 options if fewer
    while (opts.length < 4) {
      opts.push({ text: '', is_correct: false });
    }

    const correctIdx = opts.findIndex(o => o.is_correct);
    setCorrectOptionIndex(correctIdx >= 0 ? correctIdx : 0);
    setOptions(opts);
    setError('');
    setShowModal(true);
  };

  const handleOptionTextChange = (index, value) => {
    const updated = [...options];
    updated[index].text = value;
    setOptions(updated);
  };

  const handleCorrectOptionSelect = (index) => {
    setCorrectOptionIndex(index);
    const updated = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index
    }));
    setOptions(updated);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    const filledOptions = options.filter(o => o.text && o.text.trim());
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 options (preferably all 4).');
      return;
    }

    const payloadOptions = options.map((opt, idx) => ({
      option_text: opt.text.trim(),
      is_correct: idx === correctOptionIndex ? 1 : 0
    }));

    try {
      setModalLoading(true);
      setError('');

      if (editingQuestion) {
        await api.put(`/admin/questions/mcq/${editingQuestion.id}`, {
          question_text: questionText.trim(),
          marks: Number(marks) || 1,
          question_order: Number(questionOrder) || 1,
          explanation: explanation.trim(),
          options: payloadOptions
        });
        setSuccessMsg('Question updated successfully!');
      } else {
        await api.post('/admin/questions/mcq', {
          assessment_id: assessmentId,
          question_text: questionText.trim(),
          marks: Number(marks) || 1,
          question_order: Number(questionOrder) || 1,
          explanation: explanation.trim(),
          options: payloadOptions
        });
        setSuccessMsg('Question added successfully!');
      }

      setShowModal(false);
      fetchQuestions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.delete(`/admin/questions/${qId}`);
      setSuccessMsg('Question deleted successfully.');
      fetchQuestions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Top Navigation & Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => navigate('/admin/assessments')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Assessments</span>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} />
                  <span>{assessment?.category_name || 'MCQ Round'}</span>
                </span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Questions Bank: {assessment?.title}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {questions.length} Questions Configured &bull; Total Marks: {assessment?.total_marks} &bull; Passing Score: {assessment?.passing_marks} Marks
                </p>
              </div>

              <button
                onClick={openAddModal}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusCircle size={16} />
                <span>Add MCQ Question</span>
              </button>
            </div>
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

          {/* Questions List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-medium)',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <HelpCircle size={40} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Questions Added Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Add 4-option multiple-choice questions to activate this interview assessment.
              </p>
              <button onClick={openAddModal} className="btn btn-primary">
                Add First MCQ Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        Q{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(q)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Question"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {q.question_text}
                  </div>

                  {/* 4 Options Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    {q.options && q.options.map((opt, optIdx) => {
                      const isCorrect = Boolean(opt.is_correct);
                      const optionLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${isCorrect ? 'var(--success)' : 'var(--border-light)'}`,
                            backgroundColor: isCorrect ? 'var(--success-light)' : 'var(--bg-subtle)',
                            fontSize: '0.9rem'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: isCorrect ? 'var(--success)' : 'var(--border-medium)',
                            color: '#ffffff'
                          }}>
                            {optionLetter}
                          </div>
                          <span style={{ flex: 1, color: isCorrect ? '#065f46' : 'var(--text-main)', fontWeight: isCorrect ? 600 : 400 }}>
                            {opt.option_text}
                          </span>
                          {isCorrect && (
                            <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                              ✓ Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Note */}
                  {q.explanation && (
                    <div style={{
                      backgroundColor: 'var(--primary-light)',
                      borderLeft: '4px solid var(--primary)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--primary)' }}>Explanation: </strong>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingQuestion ? 'Edit MCQ Question' : 'Add MCQ Question'}
        subtitle={editingQuestion ? 'Update question statement, 4 choices, and correct answer' : 'Define question text, 4 answer options, and set the correct choice'}
        icon={<HelpCircle size={18} />}
        maxWidth="640px"
      >
        <form onSubmit={handleSaveQuestion}>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
              rows={3}
              required
              placeholder="Enter question text clearly..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input
                type="number"
                min="1"
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Question Order</label>
              <input
                type="number"
                min="1"
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Four Options (Select the Radio Button next to the Correct Option) *
            </label>

            {options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrect = idx === correctOptionIndex;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.65rem'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isCorrect ? 'var(--success)' : 'var(--text-muted)'
                    }}
                    title="Mark this option as correct"
                  >
                    <input
                      type="radio"
                      name="correct_option"
                      checked={isCorrect}
                      onChange={() => handleCorrectOptionSelect(idx)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--success)', cursor: 'pointer' }}
                    />
                    <span>Opt {letter}</span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder={`Enter text for option ${letter}...`}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    className="input-field"
                    style={{
                      margin: 0,
                      borderColor: isCorrect ? 'var(--success)' : 'var(--border-light)',
                      backgroundColor: isCorrect ? 'var(--success-light)' : '#ffffff'
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="form-group">
            <label className="form-label">Explanation (Visible after submission if enabled)</label>
            <textarea
              rows={2}
              placeholder="Explain the rationale behind the correct answer..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="btn btn-primary"
            >
              {modalLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionManagement;
