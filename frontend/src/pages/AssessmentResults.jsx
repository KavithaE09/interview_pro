import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Home,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Terminal,
  X,
  Cpu,
  Check,
  AlertTriangle,
  RotateCcw,
  Award,
  BookOpen,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  User,
  Mail,
  Calendar,
  Filter,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';

const AssessmentResults = ({ isAdminView = false }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestionsReview, setShowQuestionsReview] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'correct', 'incorrect', 'unanswered'

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
            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Calculating your assessment score...</p>
          </div>
        </div>
      );
    }

    if (error || !result) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)' }}>
            <XCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Results Unavailable</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error || 'Could not locate results for this assessment attempt.'}</p>
            <button onClick={() => navigate('/candidate/dashboard')} style={{
              padding: '0.8rem 1.85rem', background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
            }}>
              <Home size={16} /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Calculations for metrics and distribution bar
    const totalQ = result.totalQuestions || 1;
    const correctPct = ((result.correctCount || 0) / totalQ) * 100;
    const incorrectPct = ((result.incorrectCount || 0) / totalQ) * 100;
    const unansweredPct = ((result.unansweredCount || 0) / totalQ) * 100;
    const accuracyRate = result.answeredCount > 0
      ? `${Math.round(((result.correctCount || 0) / result.answeredCount) * 100)}%`
      : '0%';
    const completionRate = `${Math.round(((result.answeredCount || 0) / totalQ) * 100)}%`;

    // Radial gauge calculation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, result.percentage || 0))) / 100;

    // Filter questions
    const questions = result.questionsReview || [];
    const filteredQuestions = questions.filter(q => {
      if (filter === 'correct') return q.scoreAwarded > 0;
      if (filter === 'incorrect') return !q.isUnanswered && q.scoreAwarded === 0;
      if (filter === 'unanswered') return q.isUnanswered;
      return true;
    });

    const isTerminated = result.status === 'terminated';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', color: '#0f172a' }}>
        <style>{`
          @media print {
            header, .no-print { display: none !important; }
            main { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          }

          /* Responsive Styles for Assessment Results */
          @media (max-width: 900px) {
            .results-hero-grid {
              grid-template-columns: 1fr !important;
              gap: 1.75rem !important;
              padding: 1.75rem 1.5rem !important;
            }
            .results-hero-title {
              font-size: 1.45rem !important;
            }
            .results-metric-grid {
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
            }
          }

          @media (max-width: 768px) {
            .results-navbar {
              height: auto !important;
              padding: 0.75rem 1rem !important;
              flex-wrap: wrap !important;
              gap: 0.75rem !important;
            }
            .results-nav-actions {
              width: 100% !important;
              justify-content: flex-end !important;
            }
            .results-stepper {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 0.75rem !important;
              padding: 1rem 1.15rem !important;
            }
            .results-stepper-line {
              display: none !important;
            }
            .results-perf-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 0.5rem !important;
            }
            .results-review-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 0.85rem !important;
            }
            .results-filter-pills {
              width: 100% !important;
              overflow-x: auto !important;
              padding-bottom: 4px !important;
            }
            .results-cta-card {
              flex-direction: column !important;
              align-items: flex-start !important;
              padding: 1.25rem !important;
            }
            .results-cta-actions {
              width: 100% !important;
            }
            .results-cta-actions button {
              width: 100% !important;
              justify-content: center !important;
            }
          }

          @media (max-width: 480px) {
            .results-navbar {
              padding: 0.6rem 0.85rem !important;
            }
            .results-nav-logo img {
              height: 38px !important;
              max-width: 140px !important;
            }
            .results-nav-portal-badge {
              display: none !important;
            }
            .results-hero-grid {
              padding: 1.25rem 1rem !important;
              border-radius: 16px !important;
            }
            .results-hero-title {
              font-size: 1.25rem !important;
            }
            .results-hero-actions button,
            .results-hero-actions a {
              width: 100% !important;
              justify-content: center !important;
            }
            .results-metric-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.75rem !important;
            }
            .results-metric-card {
              padding: 0.85rem 0.95rem !important;
            }
            .results-qcard {
              padding: 1rem !important;
            }
          }
        `}</style>

        {/* Candidate Navbar with Med Manor Logo */}
        <header className="results-navbar" style={{
          height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }}>
          <div className="results-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src="/logo.png"
              alt="Med Manor Organics"
              style={{ height: '48px', maxWidth: '190px', objectFit: 'contain', cursor: 'pointer' }}
              onClick={() => navigate('/candidate/dashboard')}
            />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>InterviewPro</span>
              <span className="results-nav-portal-badge" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '0.22rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                background: '#eef2ff', color: '#4f46e5', border: '1px solid #e0e7ff'
              }}>
                <Cpu size={12} /> Candidate Portal
              </span>
            </div>
          </div>

          <div className="results-nav-actions no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/candidate/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0.48rem 1.05rem', borderRadius: '10px', fontSize: '0.8rem',
                fontWeight: 700, background: '#4f46e5', color: '#ffffff',
                border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.25)'
              }}
            >
              <ArrowLeft size={15} /> Dashboard
            </button>
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: '1080px', width: '100%', margin: '1.5rem auto 3.5rem', padding: '0 1rem' }}>

          {/* Unified 4-Step Candidate Flow Stepper */}
          <div className="results-stepper no-print" style={{
            background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0',
            padding: '1rem 1.5rem', marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#10b981', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
              }}>✓</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>1. Candidate Login</span>
            </div>
            <div className="results-stepper-line" style={{ height: '2px', flex: 1, minWidth: '20px', maxWidth: '60px', background: '#10b981' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#10b981', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
              }}>✓</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>2. Candidate Dashboard</span>
            </div>
            <div className="results-stepper-line" style={{ height: '2px', flex: 1, minWidth: '20px', maxWidth: '60px', background: '#10b981' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#10b981', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
              }}>✓</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>3. Assessment Portal</span>
            </div>
            <div className="results-stepper-line" style={{ height: '2px', flex: 1, minWidth: '20px', maxWidth: '60px', background: '#4f46e5' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#4f46e5', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
              }}>4</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>4. Results & Performance Review</span>
            </div>
          </div>

          {/* Contextual Notice for Terminated or Early Submission */}
          {isTerminated && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
              boxShadow: '0 2px 6px rgba(245,158,11,0.06)'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fef3c7', color: '#d97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                marginTop: '2px'
              }}>
                <AlertTriangle size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                  Session Concluded Early (Proctoring Safeguard Triggered)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: '2px', lineHeight: 1.45 }}>
                  This test was automatically submitted due to window blur or tab navigation limits. Answers saved prior to session lock were evaluated. You can review all questions, model explanations, and key concepts below.
                </div>
              </div>
            </div>
          )}

          {/* Hero Banner: Responsive Grid */}
          <div className="results-hero-grid" style={{
            background: result.isPassed
              ? 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #059669 100%)'
              : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%)',
            color: '#ffffff',
            borderRadius: '22px',
            padding: '2.25rem 2.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 12px 35px -6px rgba(15,23,42,0.2)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)',
            gap: '2.25rem',
            alignItems: 'center'
          }}>
            {/* Left Column: Assessment Info & Actions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                  padding: '0.3rem 0.85rem', borderRadius: '999px',
                  fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase'
                }}>
                  {result.isPassed ? <CheckCircle2 size={13} /> : <FileCheck size={13} />}
                  {isTerminated ? 'Session Finalized' : 'Assessment Evaluated'}
                </span>

                {result.categoryName && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(255,255,255,0.14)',
                    padding: '0.3rem 0.85rem', borderRadius: '999px',
                    fontSize: '0.76rem', fontWeight: 600
                  }}>
                    <Layers size={13} /> {result.categoryName}
                  </span>
                )}
              </div>

              <h1 className="results-hero-title" style={{
                color: '#ffffff', fontSize: '1.75rem', fontWeight: 800,
                lineHeight: 1.25, marginBottom: '0.6rem', letterSpacing: '-0.02em'
              }}>
                {result.assessmentTitle}
              </h1>

              {result.assessmentDescription && (
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {result.assessmentDescription}
                </p>
              )}

              {/* Candidate Info Glass Card */}
              <div style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                fontSize: '0.85rem', color: 'rgba(255,255,255,0.92)', marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ opacity: 0.8 }} /> Candidate: <strong style={{ color: '#fff' }}>{result.candidateName}</strong>
                  </span>
                  {result.candidateEmail && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} style={{ opacity: 0.8 }} /> {result.candidateEmail}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', opacity: 0.85, fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} /> Completed: {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </span>
                  <span>Attempt ID: #{result.attemptId}</span>
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="results-hero-actions no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/candidate/dashboard')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '0.65rem 1.35rem', borderRadius: '10px',
                    fontSize: '0.85rem', fontWeight: 700,
                    background: '#ffffff', color: '#1e1b4b',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}
                >
                  <ArrowLeft size={15} /> Return to Dashboard
                </button>
                {result.allowViewAnswers && (
                  <a
                    href="#review-section"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '0.65rem 1.25rem', borderRadius: '10px',
                      fontSize: '0.85rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.18)', color: '#ffffff',
                      textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <BookOpen size={15} /> Review Questions
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Circular SVG Radial Score Meter & Verdict */}
            <div style={{
              background: '#ffffff', borderRadius: '18px', padding: '1.75rem 1.5rem',
              color: '#0f172a', textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: '#64748b', marginBottom: '0.85rem' }}>
                Assessment Score Breakdown
              </div>

              {/* SVG Radial Progress Meter */}
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0.25rem auto 1rem' }}>
                <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle
                    cx="65" cy="65" r={radius}
                    stroke="#f1f5f9" strokeWidth="10" fill="transparent"
                  />
                  {/* Animated Value Arc */}
                  <circle
                    cx="65" cy="65" r={radius}
                    stroke={result.isPassed ? '#10b981' : result.percentage >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10" strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round" fill="transparent"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                {/* Center text */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {result.percentage}%
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                    Score
                  </span>
                </div>
              </div>

              {/* Score Value Marks */}
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                {result.score} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>/ {result.totalMarks} Marks</span>
              </div>

              {/* Verdict Pill */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{
                  backgroundColor: result.isPassed ? '#ecfdf5' : '#fef2f2',
                  color: result.isPassed ? '#059669' : '#dc2626',
                  border: `1px solid ${result.isPassed ? '#a7f3d0' : '#fecaca'}`,
                  fontWeight: 800, fontSize: '0.78rem', padding: '0.4rem 1.1rem',
                  borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}>
                  {result.isPassed ? (
                    <>
                      <CheckCircle2 size={13} /> Assessment Passed
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> Needs Improvement
                    </>
                  )}
                </span>
              </div>

              {/* Passing threshold note */}
              <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4, borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', width: '100%' }}>
                Passing threshold: <strong>{result.passingMarks || Math.round(result.totalMarks * 0.5)} Marks</strong> ({Math.round(((result.passingMarks || (result.totalMarks * 0.5)) / (result.totalMarks || 1)) * 100)}%)
              </div>
            </div>
          </div>

          {/* 5 Balanced Metric Cards: Total, Correct, Incorrect, Unanswered, Time Taken */}
          <div className="results-metric-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            {[
              {
                label: 'Total Questions',
                value: result.totalQuestions,
                subtext: 'Questions in test',
                icon: <Layers size={20} />,
                accentColor: '#4f46e5',
                bgColor: '#eef2ff'
              },
              {
                label: 'Correct Answers',
                value: result.correctCount,
                subtext: `${correctPct.toFixed(0)}% of total`,
                icon: <CheckCircle2 size={20} />,
                accentColor: '#059669',
                bgColor: '#ecfdf5'
              },
              {
                label: 'Incorrect Answers',
                value: result.incorrectCount,
                subtext: `${incorrectPct.toFixed(0)}% of total`,
                icon: <XCircle size={20} />,
                accentColor: '#dc2626',
                bgColor: '#fef2f2'
              },
              {
                label: 'Unanswered',
                value: result.unansweredCount,
                subtext: `${unansweredPct.toFixed(0)}% of total`,
                icon: <HelpCircle size={20} />,
                accentColor: '#d97706',
                bgColor: '#fffbeb'
              },
              {
                label: 'Time Taken',
                value: formatDuration(result.timeTakenSeconds),
                subtext: 'Session duration',
                icon: <Clock size={20} />,
                accentColor: '#0284c7',
                bgColor: '#f0f9ff'
              }
            ].map((tile, i) => (
              <div
                key={i}
                className="results-metric-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  borderTop: `3px solid ${tile.accentColor}`,
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: '0 2px 8px -2px rgba(15,23,42,0.05)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: tile.bgColor, color: tile.accentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {tile.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {tile.label}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: '2px 0' }}>
                    {tile.value}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {tile.subtext}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Performance & Accuracy Distribution Bar */}
          <div style={{
            background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
            padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
            boxShadow: '0 1px 3px rgba(15,23,42,0.03)'
          }}>
            <div className="results-perf-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#4f46e5" />
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Performance Distribution</span>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                <span>Completion: <strong style={{ color: '#0f172a' }}>{completionRate}</strong></span>
                <span>•</span>
                <span>Accuracy on Attempted: <strong style={{ color: '#0f172a' }}>{accuracyRate}</strong></span>
              </div>
            </div>

            {/* Segmented Bar */}
            <div style={{ height: '12px', borderRadius: '999px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
              {result.correctCount > 0 && (
                <div
                  style={{ width: `${correctPct}%`, background: '#10b981', transition: 'width 0.8s ease' }}
                  title={`Correct: ${result.correctCount} (${correctPct.toFixed(0)}%)`}
                />
              )}
              {result.incorrectCount > 0 && (
                <div
                  style={{ width: `${incorrectPct}%`, background: '#ef4444', transition: 'width 0.8s ease' }}
                  title={`Incorrect: ${result.incorrectCount} (${incorrectPct.toFixed(0)}%)`}
                />
              )}
              {result.unansweredCount > 0 && (
                <div
                  style={{ width: `${unansweredPct}%`, background: '#f59e0b', transition: 'width 0.8s ease' }}
                  title={`Unanswered: ${result.unansweredCount} (${unansweredPct.toFixed(0)}%)`}
                />
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                Correct: <strong style={{ color: '#0f172a' }}>{result.correctCount}</strong> ({correctPct.toFixed(0)}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                Incorrect: <strong style={{ color: '#0f172a' }}>{result.incorrectCount}</strong> ({incorrectPct.toFixed(0)}%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Unanswered: <strong style={{ color: '#0f172a' }}>{result.unansweredCount}</strong> ({unansweredPct.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Detailed Question Review Section with Filter Pills */}
          <div id="review-section">
            {result.allowViewAnswers && questions.length > 0 ? (
              <div style={{
                background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0',
                boxShadow: '0 2px 12px -2px rgba(15,23,42,0.05)', marginBottom: '2rem', overflow: 'hidden'
              }}>
                {/* Section Header */}
                <div className="results-review-header" style={{
                  padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '1rem', background: '#ffffff'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#4f46e5" /> Detailed Question Analysis & Review
                    </h3>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Compare your submitted answers with key concept expectations and educational takeaways
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="results-filter-pills no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: `All (${questions.length})` },
                      { id: 'correct', label: `Correct (${result.correctCount})` },
                      { id: 'incorrect', label: `Incorrect (${result.incorrectCount})` },
                      { id: 'unanswered', label: `Unanswered (${result.unansweredCount})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: filter === tab.id ? 700 : 500,
                          border: filter === tab.id ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                          background: filter === tab.id ? '#4f46e5' : '#f8fafc',
                          color: filter === tab.id ? '#ffffff' : '#64748b',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question List */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {filteredQuestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <HelpCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>No questions match the "{filter}" filter.</p>
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const isUnanswered = q.isUnanswered;
                      const isCorrect = q.scoreAwarded > 0;

                      return (
                        <div
                          key={q.id}
                          className="results-qcard"
                          style={{
                            border: `1px solid ${isCorrect ? '#bbf7d0' : isUnanswered ? '#fde68a' : '#fecaca'}`,
                            borderRadius: '14px',
                            padding: '1.5rem',
                            background: isCorrect ? '#f0fdf4' : isUnanswered ? '#fffdf7' : '#fff5f5',
                            transition: 'box-shadow 0.15s'
                          }}
                        >
                          {/* Question Card Top Bar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span style={{
                                background: '#4f46e5', color: '#fff',
                                width: '28px', height: '28px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.82rem'
                              }}>
                                {idx + 1}
                              </span>
                              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                                Question {idx + 1} of {result.totalQuestions}
                              </span>
                              <span style={{
                                fontSize: '0.76rem', fontWeight: 600,
                                background: 'rgba(0,0,0,0.05)', color: '#475569',
                                padding: '0.2rem 0.55rem', borderRadius: '6px'
                              }}>
                                {q.marks} Marks
                              </span>
                            </div>

                            {/* Status Badge */}
                            {isUnanswered ? (
                              <span style={{
                                fontSize: '0.78rem', fontWeight: 700,
                                background: '#fef3c7', color: '#92400e',
                                padding: '0.28rem 0.85rem', borderRadius: '999px',
                                border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}>
                                <HelpCircle size={13} /> Unanswered (0 / {q.marks} Marks)
                              </span>
                            ) : isCorrect ? (
                              <span style={{
                                fontSize: '0.78rem', fontWeight: 700,
                                background: '#dcfce7', color: '#166534',
                                padding: '0.28rem 0.85rem', borderRadius: '999px',
                                border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}>
                                <Check size={13} /> Correct ({q.scoreAwarded} / {q.marks} Marks)
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.78rem', fontWeight: 700,
                                background: '#fee2e2', color: '#991b1b',
                                padding: '0.28rem 0.85rem', borderRadius: '999px',
                                border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}>
                                <X size={13} /> Needs Improvement ({q.scoreAwarded} / {q.marks} Marks)
                              </span>
                            )}
                          </div>

                          {/* Question Prompt */}
                          <div style={{
                            fontSize: '1.02rem', fontWeight: 700, color: '#0f172a',
                            marginBottom: '1.15rem', lineHeight: 1.55
                          }}>
                            {q.questionText}
                          </div>

                          {/* Candidate's Submitted Response */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                              Your Submitted Response:
                            </div>
                            <div style={{
                              padding: '0.95rem 1.15rem',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: isUnanswered ? '#94a3b8' : '#1e293b',
                              fontSize: '0.92rem',
                              lineHeight: 1.6,
                              fontStyle: isUnanswered ? 'italic' : 'normal',
                              display: 'flex',
                              alignItems: isUnanswered ? 'center' : 'flex-start',
                              gap: isUnanswered ? '0.5rem' : '0'
                            }}>
                              {isUnanswered ? (
                                <>
                                  <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                                  <span>No answer was submitted for this question.</span>
                                </>
                              ) : (
                                q.candidateAnswer
                              )}
                            </div>
                          </div>

                          {/* Matched Keywords & Expected Keywords */}
                          {q.expectedKeywords && q.expectedKeywords.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                                Target Concepts & Keywords:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {q.expectedKeywords.map((kw, ki) => {
                                  const isMatched = q.matchedKeywords && q.matchedKeywords.some(m => m.toLowerCase().trim() === kw.toLowerCase().trim());
                                  return (
                                    <span
                                      key={ki}
                                      style={{
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        padding: '0.2rem 0.65rem',
                                        borderRadius: '999px',
                                        background: isMatched ? '#dcfce7' : '#f1f5f9',
                                        color: isMatched ? '#166534' : '#475569',
                                        border: `1px solid ${isMatched ? '#a7f3d0' : '#e2e8f0'}`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      {isMatched && <Check size={11} />} {kw.trim()}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Model Explanation / Educational Feedback */}
                          {q.explanation && (
                            <div style={{
                              background: '#eff6ff',
                              borderLeft: '4px solid #3b82f6',
                              padding: '0.95rem 1.15rem',
                              borderRadius: '0 10px 10px 0',
                              fontSize: '0.88rem',
                              color: '#1e40af',
                              display: 'flex',
                              gap: '0.75rem',
                              lineHeight: 1.55
                            }}>
                              <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
                              <div>
                                <strong style={{ color: '#1d4ed8' }}>Key Concepts & Model Guide: </strong>
                                {q.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#ffffff', padding: '2rem', borderRadius: '16px',
                border: '1px solid #e2e8f0', marginBottom: '2rem', textAlign: 'center', color: '#64748b'
              }}>
                <Info size={32} style={{ margin: '0 auto 0.75rem', color: '#4f46e5' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Detailed Review Not Configured</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Model answer keys and question breakdowns are not enabled for this assessment evaluation.</p>
              </div>
            )}
          </div>

          {/* Bottom Skill Recommendation Card & Navigation */}
          <div className="results-cta-card no-print" style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            border: '1px solid #e0e7ff',
            borderRadius: '18px',
            padding: '1.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 2px 10px rgba(79,70,229,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: '#4f46e5', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)'
              }}>
                <Award size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem' }}>
                  Ready to Strengthen Your Skills?
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Explore guided learning modules and interview preparation topics on your candidate portal.
                </p>
              </div>
            </div>

            <div className="results-cta-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/candidate/dashboard')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.8rem 1.75rem',
                  background: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '12px',
                  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(79,70,229,0.28)'
                }}
              >
                <Home size={16} /> Candidate Dashboard <ArrowRight size={15} />
              </button>
            </div>
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
