import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  FileCheck,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [assRes, histRes] = await Promise.all([
        api.get('/assessments/my-assessments'),
        api.get('/assessments/history')
      ]);

      if (assRes.data.success) {
        setAssessments(assRes.data.assessments || []);
      }
      if (histRes.data.success) {
        setHistory(histRes.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching candidate dashboard data:', err);
      setError('Failed to load dashboard assessments.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (assessmentId) => {
    try {
      setStartingId(assessmentId);
      setError('');
      const res = await api.post('/assessments/start', { assessmentId });
      if (res.data.success && res.data.attemptId) {
        navigate(`/interview/${res.data.attemptId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not start assessment.';
      setError(msg);
      // If already completed or attempt exists, navigate to results if provided
      if (err.response?.data?.attemptId && err.response?.data?.isCompleted) {
        navigate(`/results/${err.response.data.attemptId}`);
      }
    } finally {
      setStartingId(null);
    }
  };

  // Compute summary metrics
  const activeAssessments = assessments.filter(a => a.assignment_status !== 'completed' && a.attempt_status !== 'submitted' && a.attempt_status !== 'auto_submitted');
  const completedAttempts = history.length;
  const passedAttempts = history.filter(h => h.isPassed).length;
  const avgScore = completedAttempts > 0 
    ? Math.round(history.reduce((acc, h) => acc + h.percentage, 0) / completedAttempts) 
    : 0;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Welcome Banner */}
          <div className="welcome-banner" style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: '#ffffff',
            padding: '2rem 2.5rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Round 1 MCQ Assessment System
              </span>
              <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginTop: '0.6rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                Welcome, {user?.name}! 👋
              </h1>
              <p style={{ color: '#e0e7ff', fontSize: '0.975rem', maxWidth: '620px', lineHeight: 1.5 }}>
                Attend your assigned multiple-choice interview rounds below within the configured time limit. Answers are automatically evaluated upon submission.
              </p>
            </div>
            <div>
              <button 
                onClick={() => navigate('/assessments')} 
                className="btn btn-secondary" 
                style={{ 
                  backgroundColor: '#ffffff', 
                  color: 'var(--primary)', 
                  fontWeight: 600, 
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Browse All Rounds</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

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
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <FileCheck size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Available Rounds</span>
                <span className="stat-value">{activeAssessments.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--teal-light)', color: 'var(--teal)' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Completed Rounds</span>
                <span className="stat-value">{completedAttempts}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                <Award size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Rounds Cleared</span>
                <span className="stat-value">{passedAttempts}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                <TrendingUp size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">{avgScore}%</span>
              </div>
            </div>
          </div>

          {/* Section: Available Interview Assessments */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Available Interview Assessments
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Multiple-choice assessment rounds ready for your attempt.
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p>Loading assessment rounds...</p>
              </div>
            ) : activeAssessments.length === 0 ? (
              <div className="empty-state-card" style={{
                background: 'var(--bg-card)',
                padding: '3rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-medium)'
              }}>
                <CheckCircle2 size={44} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  All Assigned Assessments Completed!
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto' }}>
                  You have completed all currently assigned MCQ rounds. Check your assessment history below for scores and detailed performance.
                </p>
              </div>
            ) : (
              <div className="assessment-grid">
                {activeAssessments.map(asm => {
                  const isStarted = asm.attempt_status === 'in_progress' && Number(asm.remaining_seconds) > 0;

                  return (
                    <div key={asm.assessment_id} className="assessment-card">
                      <div className="card-top">
                        <span className="category-tag">
                          <Layers size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {asm.category_name || 'General Technical'}
                        </span>
                        {isStarted ? (
                          <span className="badge badge-warning">Attempt in Progress</span>
                        ) : (
                          <span className="badge badge-primary">Ready to Start</span>
                        )}
                      </div>

                      <h3 className="assessment-title">{asm.title}</h3>
                      <p className="assessment-desc">{asm.description || 'Assesses candidate aptitude and domain expertise.'}</p>

                      <div className="assessment-meta">
                        <div className="meta-item">
                          <HelpCircle size={15} />
                          <span>{asm.question_count || 10} Questions (MCQ)</span>
                        </div>
                        <div className="meta-item">
                          <Clock size={15} />
                          <span>{asm.duration_minutes} Minutes</span>
                        </div>
                        <div className="meta-item">
                          <Award size={15} />
                          <span>{asm.passing_marks}/{asm.total_marks} to Pass</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <button
                          onClick={() => handleStartInterview(asm.assessment_id)}
                          disabled={startingId === asm.assessment_id}
                          className={`btn ${isStarted ? 'btn-warning' : 'btn-primary'} btn-block`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <Play size={16} fill="currentColor" />
                          <span>{isStarted ? 'Resume Interview' : 'Start Interview'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Assessment History */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Assessment History & Results
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Review scores and breakdown for your completed MCQ interview rounds.
              </p>
            </div>

            {history.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                padding: '2.5rem',
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)'
              }}>
                <Clock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p>No completed assessments yet. Complete an interview round to see your score here.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)'
              }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Assessment Title</th>
                      <th>Category</th>
                      <th>Questions</th>
                      <th>Score Obtained</th>
                      <th>Percentage</th>
                      <th>Result Status</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.attempt_id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.assessment_title}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            {item.category_name || 'General'}
                          </span>
                        </td>
                        <td>{item.total_questions} MCQs</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.score} / {item.totalMarks}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{item.percentage}%</span>
                        </td>
                        <td>
                          {item.isPassed ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} />
                              <span>Needs Improvement</span>
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/results/${item.attempt_id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <span>View Breakdown</span>
                            <ArrowRight size={14} />
                          </button>
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
    </div>
  );
};

export default CandidateDashboard;
