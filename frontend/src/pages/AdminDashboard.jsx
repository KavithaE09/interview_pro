import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Users,
  FileCheck,
  PlusCircle,
  FolderKanban,
  Award,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalAssessments: 0,
    completedAttempts: 0,
    inProgressAttempts: 0,
    avgScore: 0
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats || {});
        setRecentAttempts(res.data.recentAttempts || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError('Failed to load administrator statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Header Title & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
             
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Administrator Dashboard
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                Manage MCQ assessment rounds, question banks, candidate allocations, and evaluation metrics.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/admin/categories')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FolderKanban size={16} />
                <span>Categories</span>
              </button>
              <button
                onClick={() => navigate('/admin/assessments')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={16} />
                <span>Manage Assessments</span>
              </button>
            </div>
          </div>



          {/* Quick Management Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div
              onClick={() => navigate('/admin/categories')}
              className="card"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={20} />
                </div>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Category Management</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure interview domains like Digital Marketing, GA4, Excel.</p>
            </div>

            <div
              onClick={() => navigate('/admin/assessments')}
              className="card"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={20} />
                </div>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Assessments & Questions</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set durations, passing marks, add 4 options, and publish tests.</p>
            </div>

            <div
              onClick={() => navigate('/admin/candidates')}
              className="card"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--teal-light)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Candidate Management</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search registered candidates and allocate assessment rounds.</p>
            </div>

            <div
              onClick={() => navigate('/admin/results')}
              className="card"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} />
                </div>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Scores & Analytics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Inspect detailed correct/incorrect answer breakdowns.</p>
            </div>
          </div>

          {/* Section: Recent Assessment Submissions */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Recent Candidate Submissions
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Latest completed and in-progress assessment attempts
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/results')}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>View Full Results</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading recent submissions...</p>
              </div>
            ) : recentAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No candidate submissions recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Assessment Round</th>
                      <th>Category</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.map(att => {
                      const isPassed = Number(att.score) >= Number(att.passing_marks);
                      const isCompleted = att.status === 'submitted' || att.status === 'auto_submitted';

                      return (
                        <tr key={att.attempt_id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{att.candidate_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{att.candidate_email}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500 }}>{att.assessment_title}</span>
                          </td>
                          <td>
                            <span className="badge badge-neutral">{att.category_name || 'General'}</span>
                          </td>
                          <td>
                            {isCompleted ? (
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                {att.score} / {att.total_marks}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            {att.status === 'in_progress' ? (
                              <span className="badge badge-warning">In Progress</span>
                            ) : isPassed ? (
                              <span className="badge badge-success">Passed</span>
                            ) : (
                              <span className="badge badge-danger">Failed</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'Active session'}
                          </td>
                          <td>
                            {isCompleted && (
                              <button
                                onClick={() => navigate(`/admin/results/${att.attempt_id}`)}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <span>Inspect</span>
                                <ArrowRight size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

export default AdminDashboard;
