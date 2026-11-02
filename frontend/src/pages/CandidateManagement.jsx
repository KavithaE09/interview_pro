import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  Users,
  Search,
  UserCheck,
  Award,
  FileCheck,
  History,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  ClipboardList,
  BookOpen,
  Clock,
  User
} from 'lucide-react';


const CandidateManagement = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Candidate History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateHistory, setCandidateHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Assign Assessment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAssessmentId, setAssignAssessmentId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchAssessments();
  }, []);

  const fetchCandidates = async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/candidates?search=${encodeURIComponent(searchTerm)}`);
      if (res.data.success) {
        setCandidates(res.data.candidates || []);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load registered candidates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/admin/assessments');
      if (res.data.success) {
        setAssessments(res.data.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCandidates(val);
  };

  const openHistoryModal = async (cand) => {
    setSelectedCandidate(cand);
    setShowHistoryModal(true);
    try {
      setHistoryLoading(true);
      const res = await api.get(`/admin/candidates/${cand.id}`);
      if (res.data.success) {
        setCandidateHistory(res.data.candidate.history || []);
      }
    } catch (err) {
      console.error('Error fetching candidate history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openAssignModal = (cand) => {
    setSelectedCandidate(cand);
    setAssignAssessmentId(assessments.length > 0 ? assessments[0].id : '');
    setError('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignAssessmentId) {
      setError('Please select an assessment to assign.');
      return;
    }

    try {
      setAssignLoading(true);
      await api.post('/admin/assign', {
        assessmentId: assignAssessmentId,
        candidateIds: [selectedCandidate.id]
      });

      setSuccessMsg(`Assessment successfully assigned to ${selectedCandidate.name}!`);
      setShowAssignModal(false);
      fetchCandidates(search);
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
                Candidate Management
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                View registered interview candidates, allocate assessments, and inspect performance transcripts.
              </p>
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

          {/* Search Box */}
          <div style={{
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.75rem',
            boxShadow: '0 1px 6px rgba(15,23,42,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
              <div style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6366f1', pointerEvents: 'none', flexShrink: 0
              }}>
                <Search size={15} />
              </div>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: '46px',
                  paddingLeft: '3.25rem',
                  paddingRight: '1rem',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchCandidates(''); }}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: '#e2e8f0', border: 'none', borderRadius: '6px',
                    width: '22px', height: '22px', cursor: 'pointer', color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                    fontWeight: 700, lineHeight: 1
                  }}
                  title="Clear search"
                >✕</button>
              )}
            </div>
          </div>

          {/* Candidates Table */}
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
                <p style={{ color: 'var(--text-muted)' }}>Loading candidates...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No candidate accounts match your search.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Email & Phone</th>
                      <th>Assigned Rounds</th>
                      <th>Completed</th>
                      <th>Avg Score</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(cand => (
                      <tr key={cand.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}>
                              {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              {cand.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{cand.email}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cand.phone}</div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{cand.assigned_count || 0} Assigned</span>
                        </td>
                        <td>
                          <span className="badge badge-success">{cand.completed_count || 0} Completed</span>
                        </td>
                        <td>
                          <strong>{Math.round(cand.avg_score || 0)} pts</strong>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(cand.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => openHistoryModal(cand)}
                              className="btn btn-secondary btn-sm"
                              title="View History & Scores"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <History size={13} />
                              <span>History</span>
                            </button>
                            <button
                              onClick={() => openAssignModal(cand)}
                              className="btn btn-primary btn-sm"
                              title="Assign Assessment"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <PlusCircle size={13} />
                              <span>Assign</span>
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

      {/* Candidate Assessment History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`${selectedCandidate?.name}`}
        subtitle="Assessment attempt history & performance scores"
        icon={<History size={18} />}
        maxWidth="720px"
      >
        <div style={{ padding: '0.25rem 0' }}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Retrieving test history...</p>
            </div>
          ) : candidateHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }} />
              <p style={{ fontSize: '0.95rem' }}>This candidate has not attempted any assessments yet.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateHistory.map(h => (
                    <tr key={h.attempt_id}>
                      <td style={{ fontWeight: 600 }}>{h.assessment_title}</td>
                      <td><span className="badge badge-neutral">{h.category_name}</span></td>
                      <td>{h.score} / {h.total_marks}</td>
                      <td><strong>{h.percentage}%</strong></td>
                      <td>
                        {h.isPassed ? (
                          <span className="badge badge-success">Passed</span>
                        ) : (
                          <span className="badge badge-danger">Failed</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Assessment to Candidate Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Assessment Round"
        subtitle={`Allocating a test round to ${selectedCandidate?.name}`}
        icon={<ClipboardList size={18} />}
        maxWidth="480px"
      >
        <form onSubmit={handleAssignSubmit}>
          {/* Candidate Info Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              flexShrink: 0
            }}>
              {selectedCandidate?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>{selectedCandidate?.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCandidate?.email}</div>
            </div>
          </div>

          {/* Assessment Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem'
            }}>
              Select Assessment Round *
            </label>
            <div style={{ position: 'relative' }}>
              <ClipboardList size={16} style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none'
              }} />
              <select
                value={assignAssessmentId}
                onChange={(e) => setAssignAssessmentId(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                  e.target.style.background = '#ffffff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#f8fafc';
                }}
              >
                {assessments.map(asm => (
                  <option key={asm.id} value={asm.id}>
                    {asm.title} — {asm.category_name || 'General'} · {asm.duration_minutes} Mins
                  </option>
                ))}
              </select>
              {/* Custom chevron */}
              <div style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading}
              className="btn btn-primary"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              {assignLoading ? (
                <><div className="spinner-sm"></div><span>Assigning...</span></>
              ) : (
                <><CheckCircle2 size={15} /><span>Confirm Assignment</span></>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CandidateManagement;
