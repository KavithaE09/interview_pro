import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

const CandidateProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments/history');
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching candidate history:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAttempted = history.length;
  const totalPassed = history.filter(h => h.isPassed).length;
  const passRate = totalAttempted > 0 ? Math.round((totalPassed / totalAttempted) * 100) : 0;
  const avgScore = totalAttempted > 0 ? Math.round(history.reduce((a, b) => a + b.percentage, 0) / totalAttempted) : 0;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Candidate Profile & Performance
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage your personal interview account and review your historical test credentials.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Left Column: Profile Card */}
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: '#ffffff',
                fontSize: '2.25rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {user?.name}
              </h2>
              <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.75rem' }}>
                {user?.role} Candidate
              </span>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Mail size={16} color="var(--primary)" />
                  <span>{user?.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Phone size={16} color="var(--primary)" />
                  <span>{user?.phone || '+1-555-0100'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Shield size={16} color="var(--primary)" />
                  <span>Verified Candidate Access</span>
                </div>
              </div>
            </div>

            {/* Right Column: Statistics & Assessment Records */}
            <div>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <FileCheck size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Rounds Attempted</span>
                    <span className="stat-value">{totalAttempted}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Rounds Cleared</span>
                    <span className="stat-value">{totalPassed}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--teal-light)', color: 'var(--teal)' }}>
                    <Award size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Pass Rate</span>
                    <span className="stat-value">{passRate}%</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Average Score</span>
                    <span className="stat-value">{avgScore}%</span>
                  </div>
                </div>
              </div>

              {/* Completed Tests Table */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Interview Records & Official Transcripts
                  </h3>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>Loading history records...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No completed assessments yet. Complete an interview round to record history.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Assessment Title</th>
                          <th>Category</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Status</th>
                          <th>Submitted Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(item => (
                          <tr key={item.attempt_id}>
                            <td style={{ fontWeight: 600 }}>{item.assessment_title}</td>
                            <td>
                              <span className="badge badge-neutral">{item.category_name || 'Technical'}</span>
                            </td>
                            <td>{item.score} / {item.totalMarks}</td>
                            <td><strong>{item.percentage}%</strong></td>
                            <td>
                              {item.isPassed ? (
                                <span className="badge badge-success">Passed</span>
                              ) : (
                                <span className="badge badge-danger">Failed</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(item.submitted_at).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                onClick={() => navigate(`/results/${item.attempt_id}`)}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <span>View Results</span>
                                <ArrowRight size={13} />
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
      </div>
    </div>
  );
};

export default CandidateProfile;
