import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';

const ConfirmSubmit = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSession();
  }, [attemptId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assessments/attempts/${attemptId}/questions`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
        setAttempt(res.data.attempt);
        setQuestions(res.data.questions || []);
        setAnswers(res.data.savedAnswers || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to retrieve assessment summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/assessments/attempts/${attemptId}/submit`);
      if (res.data.success) {
        navigate(`/results/${attemptId}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      navigate(`/results/${attemptId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading submission summary...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  let answeredCount = 0;
  let markedCount = 0;
  questions.forEach(q => {
    const a = answers[q.id];
    if (a && a.selectedOptionId !== null && a.selectedOptionId !== undefined) {
      answeredCount++;
    }
    if (a && a.markedForReview) {
      markedCount++;
    }
  });
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        height: '66px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(15,23,42,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>InterviewPro</span>
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#eef2ff', color: '#4f46e5', border: '1px solid #e0e7ff' }}>
            Assessment Portal
          </span>
        </div>
        <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>
          {assessment?.title}
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '2.5rem auto', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', marginBottom: '0.75rem' }}>
              Final Review Step
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Confirm Assessment Submission
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Please review your attempt statistics below before finalizing. Once submitted, your answers will be automatically scored on the server.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{assessment?.title}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category: {assessment?.categoryName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-primary">{assessment?.durationMinutes} Mins Allowed</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalQuestions}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Questions</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--success-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success)' }}>{answeredCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>Answered</div>
              </div>
              <div style={{ textAlign: 'center', background: unansweredCount > 0 ? 'var(--danger-light)' : 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: unansweredCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{unansweredCount}</div>
                <div style={{ fontSize: '0.75rem', color: unansweredCount > 0 ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Unanswered</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--warning-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--warning)' }}>{markedCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Marked Review</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div style={{
                background: 'var(--warning-light)',
                border: '1px solid var(--warning-border)',
                color: '#b45309',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertTriangle size={20} />
                <span>
                  Notice: You currently have <strong>{unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}</strong>. Are you sure you are ready to conclude this interview?
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => navigate(`/interview/${attemptId}`)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft size={16} />
                <span>Return to Questions</span>
              </button>

              <button
                onClick={handleSubmitFinal}
                disabled={submitting}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '1rem' }}
              >
                {submitting ? (
                  <>
                    <div className="spinner-sm"></div>
                    <span>Evaluating Answers...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Confirm Final Submission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default ConfirmSubmit;
