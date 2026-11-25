import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Terminal,
  Clock,
  Award,
  HelpCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  AlertCircle,
  Check,
  FileCheck2,
  Cpu,
  ChevronDown
} from 'lucide-react';

const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [availableList, setAvailableList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Candidate Details
  const [name, setName] = useState(() => user?.name || localStorage.getItem('interviewpro_candidate_name') || '');
  const [email, setEmail] = useState(() => user?.email || localStorage.getItem('interviewpro_candidate_email') || '');
  const [phone, setPhone] = useState(() => user?.phone || localStorage.getItem('interviewpro_candidate_phone') || '');

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    fetchAssessmentDetails();
  }, [assessmentId]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      setError('');

      let targetId = assessmentId;
      try {
        const publicRes = await api.get('/assessments/public');
        if (publicRes.data.success && Array.isArray(publicRes.data.assessments)) {
          setAvailableList(publicRes.data.assessments);
          if (!targetId && publicRes.data.assessments.length > 0) {
            targetId = publicRes.data.assessments[0].id;
          }
        }
      } catch (e) {
        console.warn('Could not fetch public assessments list', e);
      }

      if (!targetId) {
        setError('No active assessment rounds are currently published.');
        setLoading(false);
        return;
      }

      const res = await api.get(`/assessments/direct/${targetId}`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
      }
    } catch (err) {
      console.error('Error fetching assessment info:', err);
      setError('Assessment round not found or not currently published.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDirect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const candidateName = (name || user?.name || '').trim();
    const candidateEmail = (email || user?.email || '').trim();
    const candidatePhone = (phone || user?.phone || '').trim();

    if (!candidateName || !candidateEmail) {
      setError('Please provide your name and email address to begin.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(candidateEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (candidatePhone) {
      const cleanPhone = candidatePhone.replace(/[\s\-\(\)\.]/g, '').replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }
    }

    const targetId = assessment?.id || assessmentId;
    if (!targetId) {
      setError('No assessment selected.');
      return;
    }

    try {
      setStarting(true);
      setError('');

      const res = await api.post(`/assessments/${targetId}/start-direct`, {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone
      });

      if (res.data.success) {
        localStorage.setItem('interviewpro_candidate_name', candidateName);
        localStorage.setItem('interviewpro_candidate_email', candidateEmail);
        localStorage.setItem('interviewpro_candidate_phone', candidatePhone);

        if (res.data.token) {
          localStorage.setItem('interviewpro_token', res.data.token);
          const userData = {
            id: res.data.candidate?.id || user?.id,
            name: candidateName,
            email: candidateEmail,
            role: 'candidate'
          };
          localStorage.setItem('interviewpro_user', JSON.stringify(userData));
          if (login) {
            login(res.data.token, userData);
          }
        }

        if (res.data.isCompleted) {
          navigate(`/results/${res.data.attemptId}`);
          return;
        }

        navigate(`/interview/${res.data.attemptId}`);
      }
    } catch (err) {
      console.error('Error starting test:', err);
      setError(err.response?.data?.message || 'Failed to start assessment. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const candidateInitials = (name || user?.name || '').trim()
    ? (name || user?.name).trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>Initializing assessment portal...</p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem' }}>
          <AlertCircle size={44} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.3rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800 }}>Assessment Unavailable</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media (max-width: 860px) {
          .take-test-navbar {
            height: auto !important;
            padding: 0.75rem 1rem !important;
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
          }
          .take-test-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .take-test-hero-padding {
            padding: 1.5rem 1.25rem !important;
          }
          .take-test-stepper {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .take-test-stepper-divider {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .take-test-hero-title {
            font-size: 1.35rem !important;
          }
        }
      `}</style>
      
      {/* Top Professional Navigation Bar */}
      <header className="take-test-navbar" style={{
        height: '66px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src="/logo.png"
            alt="Med Manor Organics"
            style={{ height: '44px', maxWidth: '180px', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => navigate('/candidate/dashboard')}
          />
          <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#eef2ff',
              color: '#4f46e5',
              border: '1px solid #e0e7ff'
            }}>
              <Cpu size={12} />
              <span>Assessment Portal</span>
            </span>
          </div>
        </div>

        {/* Right side of header: Back to Dashboard & Assessment switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/candidate/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.95rem',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={15} />
            <span>Candidate Dashboard</span>
          </button>

          {availableList.length > 1 && (
            <div style={{ position: 'relative' }}>
              <select
                value={assessment?.id || ''}
                onChange={(e) => navigate(`/take-test/${e.target.value}`)}
                style={{
                  height: '36px',
                  padding: '0 2rem 0 0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  fontFamily: 'inherit'
                }}
              >
                {availableList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.category_name || 'General'})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1120px', width: '100%', margin: '2rem auto 3rem', padding: '0 1.5rem' }}>
        
        {/* Step Indicator Flow */}
        <div className="take-test-stepper" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          background: '#ffffff',
          padding: '0.9rem 1.5rem',
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</span>
            <span>1. Candidate Login</span>
          </div>
          <div className="take-test-stepper-divider" style={{ width: '32px', height: '2px', background: '#16a34a' }} />
          <div
            onClick={() => navigate('/candidate/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</span>
            <span>2. Candidate Dashboard</span>
          </div>
          <div className="take-test-stepper-divider" style={{ width: '32px', height: '2px', background: '#4f46e5' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: 800, fontSize: '0.85rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '2px solid #4f46e5' }}>3</span>
            <span>3. Assessment Portal (Active Step)</span>
          </div>
        </div>
        
        {/* Modern Assessment Header Hero Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          {/* Top subtle indigo gradient strip */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)'
          }}></div>

          <div className="take-test-hero-padding" style={{ padding: '2rem 2.25rem 1.75rem' }}>
            {/* Top metadata tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: '#eef2ff',
                color: '#4f46e5',
                border: '1px solid #e0e7ff'
              }}>
                <Layers size={13} />
                <span>{assessment?.category_name || 'Technical Round'}</span>
              </div>
            </div>

            {/* Assessment Title */}
            <h1 className="take-test-hero-title" style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.3
            }}>
              {assessment?.title}
            </h1>

            {/* Assessment Description */}
            <p style={{
              color: '#475569',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              margin: '0 0 1.75rem 0',
              maxWidth: '820px'
            }}>
              {assessment?.description || 'Evaluation covering technical multiple-choice questions, domain problem-solving, and analytical proficiency.'}
            </p>

            {/* Metric Tiles Ribbon - 3 Clean Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9'
            }}>
              {/* Duration */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: '#f8fafc',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid #edf2f7'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Limit</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{assessment?.duration_minutes} Minutes</div>
                </div>
              </div>

              {/* Question Count */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: '#f8fafc',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid #edf2f7'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Format</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{assessment?.question_count || 5} Questions</div>
                </div>
              </div>

              {/* Passing Criteria */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: '#f8fafc',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid #edf2f7'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Passing Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{assessment?.passing_marks} / {assessment?.total_marks} Marks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Instructions vs Candidate Form */}
        <div className="take-test-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Left Column: Assessment Instructions */}
          <div style={{
            background: '#ffffff',
            padding: '2rem 2.25rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileCheck2 size={18} />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Assessment Guidelines
              </h2>
            </div>

            {/* Guidelines List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginTop: '1px'
                }}>1</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                    Candidate Identification & Verification
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
                    Enter your full name, email address, and contact phone number. All fields are mandatory and linked to your official assessment evaluation.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginTop: '1px'
                }}>2</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                    Server-Synchronized Timer
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
                    The countdown timer begins immediately upon clicking "Begin Timed Assessment". The clock runs continuously on the server and cannot be paused.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginTop: '1px'
                }}>3</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                    Real-Time Question Autosave
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
                    Your responses are automatically synced and saved securely in real time. You can freely navigate back and forth across all questions using the question index.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginTop: '1px'
                }}>4</div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                    Instant Evaluation & Score Breakdown
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
                    Upon submitting your test or when the countdown finishes, your comprehensive performance breakdown, score, and answer review will be generated immediately.
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Flight Checklist */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                System Readiness Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Desktop or laptop browser recommended</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Reliable high-speed internet connection</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#16a34a" />
                  <span>Quiet environment free from distractions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Candidate Information Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
            padding: '2.25rem 2.25rem',
            position: 'sticky',
            top: '86px'
          }}>
            {/* Header with Candidate Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.05rem',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)'
              }}>
                {candidateInitials || <User size={22} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Candidate Profile
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '2px 0 0 0' }}>
                  Step 3: Verification & Launch
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 1.5rem 0' }} />

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Information & Action CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="#64748b" />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Candidate:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{name || user?.name || 'Candidate'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#64748b" />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Email:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{email || user?.email || 'N/A'}</strong>
                  </div>
                  {(phone || user?.phone) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={16} color="#64748b" />
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Phone:</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{phone || user?.phone}</strong>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                  <Check size={14} /> Ready for Assessment Round
                </div>
              </div>

              {/* Start Assessment CTA */}
              <button
                type="button"
                onClick={handleStartDirect}
                disabled={starting}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  background: starting
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  cursor: starting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: starting ? 'none' : '0 4px 16px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {starting ? (
                  <>
                    <div className="spinner-sm"></div>
                    <span>Initializing Assessment...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Timed Assessment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/candidate/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Candidate Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeAssessment;
