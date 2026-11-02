import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Terminal,
  Search,
  Filter,
  Layers,
  Clock,
  HelpCircle,
  Award,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react';

const AvailableAssessments = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // Fetch public assessments directly without requiring password login
      const res = await api.get('/assessments/public');
      if (res.data.success) {
        setAssessments(res.data.assessments || []);

        const cats = Array.from(new Set(res.data.assessments.map(a => a.category_name).filter(Boolean)));
        setCategories(cats);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load available interview assessments.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = (assessmentId) => {
    // Navigate candidate directly to the candidate entry screen
    navigate(`/take-test/${assessmentId}`);
  };

  const filteredAssessments = assessments.filter(asm => {
    const matchesCategory = selectedCategory === 'ALL' || asm.category_name === selectedCategory;
    const matchesSearch = asm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asm.description && asm.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="top-navbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={24} color="var(--primary)" />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>InterviewPro</span>
          <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Candidate Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Direct Assessment Access
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '2rem auto', padding: '0 1.5rem' }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          color: '#ffffff',
          padding: '2.25rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Direct Candidate Assessment
            </span>
            <h1 style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '0.35rem' }}>
              Available MCQ Interview Assessments
            </h1>
            <p style={{ color: '#e0e7ff', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.5 }}>
              No login or password required. Choose your domain round, enter your name and email, and complete your timed MCQ evaluation.
            </p>
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

        {/* Filter & Search Bar */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Search assessment rounds (e.g. Meta Ads, GA4, Excel)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', margin: 0 }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Assessments Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Fetching interview assessment rounds...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            padding: '3rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)'
          }}>
            <Filter size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No assessments found
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        ) : (
          <div className="assessment-grid">
            {filteredAssessments.map(asm => (
              <div key={asm.id} className="assessment-card">
                <div className="card-top">
                  <span className="category-tag">
                    <Layers size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {asm.category_name || 'Technical'}
                  </span>
                  <span className="badge badge-success">Direct Access</span>
                </div>

                <h3 className="assessment-title">{asm.title}</h3>
                <p className="assessment-desc">{asm.description || 'Assesses core principles and real-world aptitude.'}</p>

                <div className="assessment-meta">
                  <div className="meta-item">
                    <HelpCircle size={15} />
                    <span>{asm.question_count || 10} Questions</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={15} />
                    <span>{asm.duration_minutes} Mins Duration</span>
                  </div>
                  <div className="meta-item">
                    <Award size={15} />
                    <span>Pass: {asm.passing_marks}/{asm.total_marks} Marks</span>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    onClick={() => handleStartInterview(asm.id)}
                    className="btn btn-primary btn-block"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Take Assessment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableAssessments;
