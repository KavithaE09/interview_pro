import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Terminal,
  Clock,
  Award,
  HelpCircle,
  Layers,
  ArrowRight,
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
  const { user, isAuthenticated, login } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [availableList, setAvailableList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Candidate Details Form
  const [name, setName] = useState(() => localStorage.getItem('interviewpro_candidate_name') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('interviewpro_candidate_email') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('interviewpro_candidate_phone') || '');

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
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please enter your full legal name, email address, and contact phone number.');
      return;
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
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      if (res.data.success) {
        localStorage.setItem('interviewpro_candidate_name', name.trim());
        localStorage.setItem('interviewpro_candidate_email', email.trim());
        localStorage.setItem('interviewpro_candidate_phone', phone.trim());

        if (res.data.token) {
          localStorage.setItem('interviewpro_token', res.data.token);
          localStorage.setItem('interviewpro_user', JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role: 'candidate'
          }));
          if (login) {
            login(res.data.token, {
              name: name.trim(),
              email: email.trim(),
              role: 'candidate'
            });
          }
        }

        if (res.data.isCompleted) {
          navigate(`/results/${res.data.attemptId}`);
          return;
        }

        navigate(`/interview/${res.data.attemptId}`);
      }
    } catch (err) {
      console.error('Error starting direct test:', err);
      setError(err.response?.data?.message || 'Failed to start assessment. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const candidateInitials = name.trim()
    ? name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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
      
      {/* Top Professional Navigation Bar */}
      <header style={{
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
          }}>
            <Terminal size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              InterviewPro
            </span>
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

        {/* Right side of header: subtle round selector if multiple assessments exist */}
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
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1120px', width: '100%', margin: '2rem auto 3rem', padding: '0 1.5rem' }}>
        
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

          <div style={{ padding: '2rem 2.25rem 1.75rem' }}>
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
            <h1 style={{
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          
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
                    Enter your full legal name, email address, and contact phone number. All fields are mandatory and linked to your official assessment evaluation.
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
            {/* Header with Dynamic Candidate Avatar */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Candidate Information
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '2px 0 0 0' }}>
                  Enter your details to begin the assessment
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

            <form onSubmit={handleStartDirect} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.45rem'
                }}>
                  Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    style={{
                      paddingLeft: '2.6rem',
                      height: '46px',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.45rem'
                }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. candidate@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{
                      paddingLeft: '2.6rem',
                      height: '46px',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.45rem'
                }}>
                  Contact Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    style={{
                      paddingLeft: '2.6rem',
                      height: '46px',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={starting}
                style={{
                  width: '100%',
                  height: '50px',
                  background: starting
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.985rem',
                  cursor: starting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  boxShadow: starting ? 'none' : '0 4px 16px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  if (!starting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.45)';
                  }
                }}
                onMouseLeave={e => {
                  if (!starting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(79, 70, 229, 0.35)';
                  }
                }}
              >
                {starting ? (
                  <>
                    <div className="spinner-sm"></div>
                    <span>Initializing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Timed Assessment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TakeAssessment;
