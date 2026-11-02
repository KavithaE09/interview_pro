import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const ResultsManagement = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
    fetchAssessmentsList();
  }, []);

  const fetchResults = async (asmId = '', search = '') => {
    try {
      setLoading(true);
      let url = `/admin/results?`;
      if (asmId) url += `assessmentId=${asmId}&`;
      if (search) url += `search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setResults(res.data.results || []);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load assessment results.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentsList = async () => {
    try {
      const res = await api.get('/admin/assessments');
      if (res.data.success) {
        setAssessments(res.data.assessments || []);
      }
    } catch (err) {
      console.error('Error fetching assessments list:', err);
    }
  };

  const handleAssessmentFilterChange = (e) => {
    const val = e.target.value;
    setSelectedAssessmentId(val);
    fetchResults(val, searchTerm);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchResults(selectedAssessmentId, val);
  };

  const formatDuration = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="page-body">
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
           
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Results & Scores Management
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
              Complete audit trail of candidate MCQ interview attempts, correct/incorrect answer counts, marks, and pass/fail qualifications.
            </p>
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
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="Search by candidate name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input-field"
                style={{ paddingLeft: '2.5rem', margin: 0 }}
              />
            </div>

            <div style={{ minWidth: '240px' }}>
              <select
                value={selectedAssessmentId}
                onChange={handleAssessmentFilterChange}
                className="input-field"
                style={{ margin: 0 }}
              >
                <option value="">All Assessments</option>
                {assessments.map(asm => (
                  <option key={asm.id} value={asm.id}>
                    {asm.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Table */}
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
                <p style={{ color: 'var(--text-muted)' }}>Retrieving test results...</p>
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No completed results found for the selected criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Assessment Round</th>
                      <th>Category</th>
                      <th>Correct / Total</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Time Taken</th>
                      <th>Submitted</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.attempt_id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                            {r.candidate_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {r.candidate_email}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{r.assessment_title}</span>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{r.category_name || 'General'}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{r.correctCount}</span> / <span>{r.totalQuestions}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            ({r.incorrectCount} wrong, {r.unansweredCount} skipped)
                          </span>
                        </td>
                        <td>
                          <strong>{r.score}</strong> / {r.totalMarks}
                        </td>
                        <td>
                          <strong>{r.percentage}%</strong>
                        </td>
                        <td>
                          {r.isPassed ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatDuration(r.time_taken_seconds)}
                        </td>
                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/admin/results/${r.attempt_id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Inspect candidate answers"
                          >
                            <span>Inspect</span>
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
  );
};

export default ResultsManagement;
