import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Home,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Terminal,
  Cpu,
  Check,
  X
} from 'lucide-react';

const AssessmentResults = ({ isAdminView = false }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestionsReview, setShowQuestionsReview] = useState(true);

  // Determine layout: candidate view is ALWAYS default on /results/:attemptId
  // Only show admin sidebar if explicitly passed isAdminView={true} OR on an /admin/* path
  const showAdminLayout = isAdminView || window.location.pathname.startsWith('/admin');

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/assessments/attempts/${attemptId}/result`);
      if (res.data.success) {
        setResult(res.data.result);

        // If passed, trigger celebration confetti
        if (res.data.result.isPassed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching result:', err);
      setError(err.response?.data?.message || 'Failed to retrieve assessment results.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  // ── CANDIDATE PORTAL: clean standalone results view (DEFAULT) ──
  if (!showAdminLayout) {
    if (loading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Calculating your score...</p>
          </div>
        </div>
      );
    }

    if (error || !result) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem' }}>
            <XCircle size={44} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Results Unavailable</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error || 'Could not locate results for this attempt.'}</p>
            <button onClick={() => navigate('/')} style={{
              padding: '0.75rem 1.75rem', background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Home size={16} /> Return to Portal
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* Candidate Navbar */}
        <header style={{
          height: '66px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(15,23,42,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 6px rgba(79,70,229,0.3)' }}>
              <Terminal size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>InterviewPro</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#eef2ff', color: '#4f46e5', border: '1px solid #e0e7ff' }}>
                <Cpu size={12} /> Assessment Portal
              </span>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: result.isPassed ? '#ecfdf5' : '#eff6ff', color: result.isPassed ? '#059669' : '#4f46e5', border: `1px solid ${result.isPassed ? '#a7f3d0' : '#c7d2fe'}` }}>
            <FileCheck size={14} /> Assessment Complete
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '2rem auto 3rem', padding: '0 1.5rem' }}>
          {/* Score Hero */}
          <div style={{ background: result.isPassed ? 'linear-gradient(135deg,#0d9488 0%,#10b981 100%)' : 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', color: '#fff', padding: '2.25rem 2.5rem', borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 8px 30px -4px rgba(15,23,42,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={14} /> <span>Assessment Submitted</span>
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>{result.assessmentTitle}</h1>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.93rem' }}>Candidate: <strong>{result.candidateName}</strong>{result.categoryName && <> &bull; Category: <strong>{result.categoryName}</strong></>}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '1.5rem 2.25rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)', minWidth: '160px' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '0.25rem' }}>Your Score</div>
              <div style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>{result.score} <span style={{ fontSize: '1.25rem', fontWeight: 500, opacity: 0.8 }}>/ {result.totalMarks}</span></div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem', color: '#fff' }}>{result.percentage}%</div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ backgroundColor: result.isPassed ? '#fff' : '#fee2e2', color: result.isPassed ? '#0f766e' : '#b91c1c', fontWeight: 800, fontSize: '0.8rem', padding: '0.35rem 1rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {result.isPassed ? '✓ Passed' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>

          {/* Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Questions', value: result.totalQuestions, icon: <HelpCircle size={20} />, bg: '#eef2ff', color: '#4f46e5' },
              { label: 'Correct', value: result.correctCount, icon: <CheckCircle2 size={20} />, bg: '#ecfdf5', color: '#059669' },
              { label: 'Incorrect', value: result.incorrectCount, icon: <XCircle size={20} />, bg: '#fef2f2', color: '#dc2626' },
              { label: 'Unanswered', value: result.unansweredCount, icon: <HelpCircle size={20} />, bg: '#fffbeb', color: '#d97706' },
              { label: 'Time Taken', value: formatDuration(result.timeTakenSeconds), icon: <Clock size={20} />, bg: '#f0f9ff', color: '#0284c7' },
            ].map((tile, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px -2px rgba(15,23,42,0.05)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tile.bg, color: tile.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{tile.icon}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tile.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{tile.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Answer Review */}
          {result.allowViewAnswers && result.questionsReview && result.questionsReview.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px -2px rgba(15,23,42,0.05)', marginBottom: '2rem', overflow: 'hidden' }}>
              <div onClick={() => setShowQuestionsReview(!showQuestionsReview)} style={{ padding: '1.25rem 1.75rem', borderBottom: showQuestionsReview ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>Detailed Answer Review</h3>
                  <span style={{ fontSize: '0.83rem', color: '#64748b' }}>See your answers compared to correct answers</span>
                </div>
                <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem 0.55rem', cursor: 'pointer', color: '#64748b' }}>
                  {showQuestionsReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {showQuestionsReview && (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {result.questionsReview.map((q, idx) => {
                    const isUnanswered = q.isUnanswered;
                    const isCorrect = q.scoreAwarded > 0;
                    return (
                      <div key={q.id} style={{ border: `1px solid ${isCorrect ? '#a7f3d0' : isUnanswered ? '#e2e8f0' : '#fecaca'}`, borderRadius: '12px', padding: '1.4rem', background: isCorrect ? '#f0fdf4' : isUnanswered ? '#f9fafb' : '#fff5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.9rem' }}>Q{idx + 1} <span style={{ color: '#64748b', fontWeight: 500 }}>({q.marks} marks)</span></span>
                          {isUnanswered ? (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.7rem', borderRadius: '999px' }}>Not Answered</span>
                          ) : isCorrect ? (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '0.25rem 0.7rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {q.scoreAwarded} / {q.marks} Marks</span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.7rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={12} /> 0 / {q.marks} Marks</span>
                          )}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', lineHeight: 1.5 }}>{q.questionText}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Your Answer:</div>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: isUnanswered ? '#94a3b8' : '#1e293b', fontSize: '0.9rem', lineHeight: 1.6, fontStyle: isUnanswered ? 'italic' : 'normal' }}>
                          {isUnanswered ? 'No answer submitted.' : q.candidateAnswer}
                        </div>
                        {q.explanation && (
                          <div style={{ marginTop: '0.85rem', background: '#eef2ff', borderLeft: '4px solid #4f46e5', padding: '0.85rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.865rem', color: '#3730a3', display: 'flex', gap: '0.65rem' }}>
                            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div><strong>Key Concepts: </strong>{q.explanation}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Info size={28} style={{ margin: '0 auto 0.5rem', color: '#4f46e5' }} />
              <p>Detailed answer review is not available for this assessment round.</p>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem', background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
              <Home size={16} /> Return to Portal
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── ADMIN: use original admin layout ──
  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="page-body" style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem' }}></div>
            <h3 style={{ color: 'var(--text-main)', fontWeight: 600 }}>Calculating Official Score...</h3>
            <p style={{ color: 'var(--text-muted)' }}>Evaluating answers against system answer key</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="page-body" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2.5rem' }}>
              <XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Result Not Available</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'Could not locate result for this assessment attempt.'}</p>
              <button onClick={() => navigate('/admin/results')} className="btn btn-primary">
                Return to Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Submission Confirmation & Score Banner */}
          <div style={{
            background: result.isPassed
              ? 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.75rem'
              }}>
                <CheckCircle2 size={14} />
                <span>Assessment Completed Successfully</span>
              </div>

              <h1 style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                {result.assessmentTitle}
              </h1>
              <p style={{ color: '#f0fdfa', fontSize: '0.95rem', opacity: 0.95 }}>
                Candidate: <strong>{result.candidateName}</strong> &bull; Category: <strong>{result.categoryName || 'Technical'}</strong>
              </p>
            </div>

            {/* Score & Pass Badge */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '1.5rem 2.25rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: '#e0e7ff', marginBottom: '0.25rem' }}>
                Overall Score
              </div>
              <div style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1, color: '#ffffff' }}>
                {result.score} <span style={{ fontSize: '1.35rem', fontWeight: 500, opacity: 0.85 }}>/ {result.totalMarks}</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.35rem', color: '#ffffff' }}>
                {result.percentage}%
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{
                  backgroundColor: result.isPassed ? '#ffffff' : '#fee2e2',
                  color: result.isPassed ? '#0f766e' : '#b91c1c',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  padding: '0.35rem 1rem',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {result.isPassed ? '✓ Passed Round 1' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Breakdown Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem'
          }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <HelpCircle size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Questions</span>
                <span className="stat-value">{result.totalQuestions}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{result.correctCount}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                <XCircle size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Incorrect Answers</span>
                <span className="stat-value" style={{ color: 'var(--danger)' }}>{result.incorrectCount}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                <Clock size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Unanswered</span>
                <span className="stat-value">{result.unansweredCount}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                <Clock size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Time Taken</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatDuration(result.timeTakenSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review (Visible if admin allowed view answers) */}
          {result.allowViewAnswers && result.questionsReview && result.questionsReview.length > 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '2.5rem',
              overflow: 'hidden'
            }}>
              <div
                onClick={() => setShowQuestionsReview(!showQuestionsReview)}
                style={{
                  padding: '1.25rem 1.75rem',
                  borderBottom: showQuestionsReview ? '1px solid var(--border-light)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                    Detailed Questions & Explanations Review
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Review your chosen answers alongside correct options and explanations.
                  </span>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.6rem' }}>
                  {showQuestionsReview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {showQuestionsReview && (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {result.questionsReview.map((q, idx) => {
                    const isFullMarks = q.scoreAwarded === Number(q.marks);
                    const isPartialMarks = q.scoreAwarded > 0 && q.scoreAwarded < Number(q.marks);
                    const isUnanswered = q.isUnanswered;

                    let statusBadge = (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} />
                        <span>Score: {q.scoreAwarded} / {q.marks} Marks</span>
                      </span>
                    );

                    if (isUnanswered) {
                      statusBadge = (
                        <span className="badge badge-warning">Unanswered (0 Marks)</span>
                      );
                    } else if (isPartialMarks) {
                      statusBadge = (
                        <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} />
                          <span>Score: {q.scoreAwarded} / {q.marks} Marks</span>
                        </span>
                      );
                    } else if (q.scoreAwarded === 0) {
                      statusBadge = (
                        <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <X size={12} />
                          <span>0 / {q.marks} Marks</span>
                        </span>
                      );
                    }

                    return (
                      <div
                        key={q.id}
                        style={{
                          border: `1px solid ${q.scoreAwarded > 0 ? 'var(--success-border)' : isUnanswered ? 'var(--border-medium)' : 'var(--danger-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1.5rem',
                          background: q.scoreAwarded > 0 ? '#fcfdfd' : '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                              Question {idx + 1}
                            </span>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>({q.marks} Marks)</span>
                          </div>
                          {statusBadge}
                        </div>

                        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                          {q.questionText}
                        </div>

                        {/* Candidate Written Answer */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                            Candidate Answer:
                          </div>
                          <div style={{
                            padding: '1rem 1.15rem',
                            backgroundColor: isUnanswered ? '#f9fafb' : '#f8fafc',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            color: isUnanswered ? 'var(--text-light)' : 'var(--text-main)',
                            fontSize: '0.925rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            fontStyle: isUnanswered ? 'italic' : 'normal'
                          }}>
                            {isUnanswered ? 'No answer submitted.' : q.candidateAnswer}
                          </div>
                        </div>

                        {/* Matched Keywords */}
                        {q.matchedKeywords && q.matchedKeywords.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', marginBottom: '0.35rem' }}>
                              ✓ Detected Keywords / Concepts:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {q.matchedKeywords.map((kw, kwIdx) => (
                                <span
                                  key={kwIdx}
                                  style={{
                                    backgroundColor: '#d1fae5',
                                    color: '#065f46',
                                    fontSize: '0.775rem',
                                    fontWeight: 600,
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '999px',
                                    border: '1px solid #a7f3d0'
                                  }}
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Explanation / Key concepts */}
                        {q.explanation && (
                          <div style={{
                            background: 'var(--primary-light)',
                            borderLeft: '4px solid var(--primary)',
                            padding: '0.85rem 1rem',
                            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            gap: '0.65rem'
                          }}>
                            <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ color: 'var(--primary)' }}>Key Concepts & Model Answer: </strong>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              marginBottom: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <Info size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
              <p>Detailed question explanations for this interview round are restricted by the administrator.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <button
              onClick={() => navigate('/admin/results')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
            >
              <span>Return to Results</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/assessments')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
