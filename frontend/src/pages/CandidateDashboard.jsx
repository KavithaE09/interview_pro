import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import {
  Play,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Layers,
  Globe
} from 'lucide-react';

const isEmbedVideo = (url) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('youtube.com') ||
    u.includes('youtu.be') ||
    u.includes('vimeo.com') ||
    u.endsWith('.mp4') ||
    u.endsWith('.webm')
  );
};

const getPlatformInfo = (url) => {
  if (!url) return { name: 'Online Tutorial', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.15)' };
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return { name: 'YouTube Video', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  }
  if (u.includes('udemy.com')) {
    return { name: 'Udemy Course', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
  }
  if (u.includes('coursera.org')) {
    return { name: 'Coursera Course', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' };
  }
  if (u.includes('vimeo.com')) {
    return { name: 'Vimeo Video', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
  }
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return { name: domain, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
  } catch {
    return { name: 'Website Tutorial', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.15)' };
  }
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modules, setModules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/modules/dashboard');
      if (res.data.success) {
        setCandidateInfo(res.data.candidate || null);
        setModules(res.data.modules || []);
        setAssessments(res.data.assessments || []);
        if (res.data.modules && res.data.modules.length > 0) {
          setSelectedModule(res.data.modules[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Unable to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (moduleId) => {
    try {
      setCompletingId(moduleId);
      const res = await api.post(`/modules/${moduleId}/complete`);
      if (res.data.success) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, is_completed: 1, completed_at: new Date().toISOString() } : m
          )
        );
        if (selectedModule?.id === moduleId) {
          setSelectedModule((prev) => ({ ...prev, is_completed: 1 }));
        }
      }
    } catch (err) {
      console.error('Error completing module:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleStartAssessment = (assessmentId) => {
    navigate(`/take-test/${assessmentId}`);
  };

  const completedModulesCount = modules.filter((m) => m.is_completed).length;
  const completedAssessmentsCount = assessments.filter(
    (a) => a.attempt_status === 'submitted' || a.attempt_status === 'auto_submitted'
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <style>{`
        @media (max-width: 860px) {
          .dashboard-module-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-stepper {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            padding: 1rem 1.15rem !important;
          }
          .dashboard-stepper-divider {
            display: none !important;
          }
          .dashboard-welcome-banner {
            padding: 1.25rem !important;
          }
        }
        @media (max-width: 540px) {
          .dashboard-assessments-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Candidate Flow Stepper */}
        <div className="dashboard-stepper" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          background: '#ffffff',
          padding: '0.9rem 1.5rem',
          borderRadius: '14px',
          border: '1.5px solid var(--border-light, #e2e8f0)',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✓</span>
            <span>1. Candidate Login</span>
          </div>
          <div className="dashboard-stepper-divider" style={{ width: '32px', height: '2px', background: 'var(--primary, #4f46e5)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary, #4f46e5)', fontWeight: 800, fontSize: '0.85rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', border: '2px solid var(--primary, #4f46e5)' }}>2</span>
            <span>2. Candidate Dashboard (Current)</span>
          </div>
          <div className="dashboard-stepper-divider" style={{ width: '32px', height: '2px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span>
            <span>3. Assessment Portal (Next Step)</span>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="dashboard-welcome-banner" style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          <div>
            {(candidateInfo?.category_name || user?.category_name) && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                background: 'rgba(79, 70, 229, 0.15)',
                color: '#4f46e5',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                border: '1px solid rgba(79, 70, 229, 0.25)'
              }}>
                <Layers size={14} />
                <span>Selected Domain: {candidateInfo?.category_name || user?.category_name}</span>
              </div>
            )}
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Welcome, {user?.name || 'Candidate'}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, maxWidth: '650px' }}>
              {candidateInfo?.category_name || user?.category_name
                ? `Showing training modules & assessments exclusively for "${candidateInfo?.category_name || user?.category_name}". Review the tutorials and proceed to take your assessment round.`
                : "Review the training modules and YouTube reference tutorials below. Once you're ready, proceed to take your assigned assessment rounds."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem 1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {completedModulesCount} / {modules.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Modules Watched
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem 1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                {completedAssessmentsCount} / {assessments.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Assessments Done
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Section 1: Learning Modules & YouTube Video Player */}
            <section style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                    <Play size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                      Learning Modules & Course Tutorials
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Study the training videos or online courses before starting your assessment
                    </p>
                  </div>
                </div>
              </div>

              {modules.length === 0 ? (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <BookOpen size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <p>No learning modules have been published by the administrator yet.</p>
                </div>
              ) : (
                <div className="dashboard-module-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Active Video Player or External Course Card */}
                  {selectedModule && (
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}>
                      {/* Responsive Media Embed or External Course Card */}
                      {isEmbedVideo(selectedModule.video_url) ? (
                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000' }}>
                          <iframe
                            src={selectedModule.video_url}
                            title={selectedModule.title}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          padding: '2.5rem 1.75rem',
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          gap: '1.15rem'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 1rem',
                            borderRadius: '999px',
                            background: getPlatformInfo(selectedModule.video_url).bg,
                            color: getPlatformInfo(selectedModule.video_url).color,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            <Globe size={14} />
                            <span>{getPlatformInfo(selectedModule.video_url).name}</span>
                          </div>

                          <div>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
                              {selectedModule.title}
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0, maxWidth: '480px', lineHeight: 1.5 }}>
                              This course is hosted externally. Click below to open and study the course in a new tab. When you finish, mark as completed below.
                            </p>
                          </div>

                          <a
                            href={selectedModule.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.85rem 1.75rem',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.925rem',
                              textDecoration: 'none',
                              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>Open {getPlatformInfo(selectedModule.video_url).name} in New Tab</span>
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      )}

                      {/* Video Info & Action Footer */}
                      <div style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {selectedModule.category_name && (
                            <span style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '0.35rem',
                              background: 'rgba(79, 70, 229, 0.2)',
                              color: '#818cf8',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {selectedModule.category_name}
                            </span>
                          )}
                          {selectedModule.is_completed ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '0.35rem',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              <CheckCircle2 size={13} />
                              Watched & Completed
                            </span>
                          ) : null}
                        </div>

                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                          {selectedModule.title}
                        </h3>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          {selectedModule.description || 'Watch the tutorial carefully to master the essential concepts.'}
                        </p>

                        {/* Resource links */}
                        {(selectedModule.resource_url || selectedModule.file_name) && (
                          <div style={{
                            padding: '0.9rem 1.25rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(15, 23, 42, 0.4)',
                            border: '1px solid var(--border)',
                            marginBottom: '1.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <FileText size={18} color="var(--primary)" />
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                  Study Materials & Cheatsheets
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {selectedModule.file_name || 'Downloadable formula reference'}
                                </div>
                              </div>
                            </div>
                            {selectedModule.resource_url && (
                              <a
                                href={selectedModule.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  color: 'var(--primary)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                <span>Open Resource</span>
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Buttons: Mark Watched & Start Assessment */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleMarkCompleted(selectedModule.id)}
                            disabled={selectedModule.is_completed || completingId === selectedModule.id}
                            className={`btn ${selectedModule.is_completed ? 'btn-secondary' : 'btn-outline'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                          >
                            <CheckCircle2 size={16} color={selectedModule.is_completed ? '#10b981' : 'currentColor'} />
                            <span>
                              {selectedModule.is_completed
                                ? 'Completed'
                                : completingId === selectedModule.id
                                ? 'Saving...'
                                : 'Mark as Watched'}
                            </span>
                          </button>

                          {selectedModule.assessment_id && (
                            <button
                              onClick={() => handleStartAssessment(selectedModule.assessment_id)}
                              className="btn btn-primary"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                fontWeight: 700
                              }}
                            >
                              <span>Next: Start {selectedModule.assessment_title || 'Assessment'}</span>
                              <ChevronRight size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modules List Sidebar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      All Training Modules ({modules.length})
                    </div>
                    {modules.map((m, idx) => {
                      const isSelected = selectedModule?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedModule(m)}
                          style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            background: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-card)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Module #{idx + 1}
                            </span>
                            {m.is_completed ? (
                              <CheckCircle2 size={15} color="#10b981" />
                            ) : (
                              <Play size={13} color="var(--primary)" />
                            )}
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                            {m.title}
                          </div>
                          {m.category_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Category: {m.category_name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: Assigned Assessments */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                    My Assigned Assessments {(candidateInfo?.category_name || user?.category_name) ? `(${candidateInfo?.category_name || user?.category_name})` : ''}
                  </h2>
                  {(candidateInfo?.category_name || user?.category_name) && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      Showing assessments exclusively for the &ldquo;{candidateInfo?.category_name || user?.category_name}&rdquo; category.
                    </p>
                  )}
                </div>
              </div>

              {assessments.length === 0 ? (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <HelpCircle size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <p>
                    {(candidateInfo?.category_name || user?.category_name)
                      ? `No assessments are currently published under the "${candidateInfo?.category_name || user?.category_name}" category.`
                      : 'No assessments currently assigned to your account.'}
                  </p>
                </div>
              ) : (
                <div className="dashboard-assessments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {assessments.map((asm) => {
                    const isSubmitted = asm.attempt_status === 'submitted' || asm.attempt_status === 'auto_submitted';
                    const score = Number(asm.score || 0);
                    const totalMarks = Number(asm.total_marks || 0);
                    const isPassed = score >= Number(asm.passing_marks || 0);

                    return (
                      <div
                        key={asm.assignment_id || asm.assessment_id}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '1rem',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '0.35rem',
                              background: 'rgba(79, 70, 229, 0.15)',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {asm.category_name || 'General Assessment'}
                            </span>

                            {isSubmitted ? (
                              <span style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: '0.35rem',
                                background: isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isPassed ? '#10b981' : '#f87171',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                Score: {score}/{totalMarks}
                              </span>
                            ) : (
                              <span style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: '0.35rem',
                                background: 'rgba(14, 165, 233, 0.15)',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                Ready to Start
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                            {asm.title}
                          </h3>

                          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                            {asm.description || 'Test your proficiency with questions and practical scenarios.'}
                          </p>

                          <div style={{
                            display: 'flex',
                            gap: '1.25rem',
                            marginBottom: '1.5rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(15, 23, 42, 0.3)',
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={14} color="var(--primary)" />
                              <span>{asm.duration_minutes} Mins</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Award size={14} color="#10b981" />
                              <span>{asm.total_marks} Marks</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FileCheck size={14} color="#a855f7" />
                              <span>{asm.question_count || 0} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isSubmitted ? (
                            <Link
                              to={`/results/${asm.latest_attempt_id}`}
                              className="btn btn-secondary"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.75rem',
                                textDecoration: 'none'
                              }}
                            >
                              <span>View Score & Breakdown</span>
                              <ChevronRight size={16} />
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleStartAssessment(asm.assessment_id)}
                              className="btn btn-primary"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.85rem',
                                fontWeight: 700,
                                fontSize: '0.95rem'
                              }}
                            >
                              <span>Proceed to Assessment Portal</span>
                              <ChevronRight size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
