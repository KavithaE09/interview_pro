import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  RotateCcw,
  Send,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Award,
  Layers,
  CheckCircle2,
  FileText,
  Clock,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  ShieldAlert,
  Mic,
  MicOff
} from 'lucide-react';

/* ─── Proctoring state machine ────────────────────────────────
   PHASE 1 – 'setup'    → camera/mic/screen-share permissions
   PHASE 2 – 'ready'    → permissions granted, waiting to start
   PHASE 3 – 'active'   → interview is live with monitoring
   PHASE 4 – 'terminated' → violation detected, session ended
──────────────────────────────────────────────────────────────*/

const McqInterview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // ── Assessment State ───────────────────────────────────────
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [expiredWarning, setExpiredWarning] = useState(false);
  const saveTimeoutRef = useRef(null);

  // ── Proctoring State ───────────────────────────────────────
  const [proctoringPhase, setProctoringPhase] = useState('setup'); // setup | ready | active | terminated
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasScreenPermission, setHasScreenPermission] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [violationReason, setViolationReason] = useState('');
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [isTerminating, setIsTerminating] = useState(false);

  // ── Refs for media ─────────────────────────────────────────
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const tabSwitchWarningsRef = useRef(0);
  const isTerminatedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // PROCTORING: Request Camera + Microphone
  // ─────────────────────────────────────────────────────────────
  const requestCameraAccess = async () => {
    setMediaError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: true
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setHasCameraPermission(true);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera/mic error:', err);
      setMediaError('Camera & microphone access is required to take this interview. Please allow access and try again.');
      setHasCameraPermission(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PROCTORING: Request Screen Share
  // ─────────────────────────────────────────────────────────────
  const requestScreenShare = async () => {
    setMediaError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setHasScreenPermission(true);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      // If user stops screen share manually → terminate
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (!isTerminatedRef.current) {
          handleViolation('Screen sharing was stopped during the interview.');
        }
      });
    } catch (err) {
      console.error('Screen share error:', err);
      setMediaError('Screen sharing is required for this interview. Please share your entire screen and try again.');
      setHasScreenPermission(false);
    }
  };

  // Attach camera video ref when stream arrives
  useEffect(() => {
    if (cameraStream && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Auto-advance to 'ready' when both permissions are granted
  useEffect(() => {
    if (hasCameraPermission && hasScreenPermission && proctoringPhase === 'setup') {
      setProctoringPhase('ready');
    }
  }, [hasCameraPermission, hasScreenPermission, proctoringPhase]);

  // ─────────────────────────────────────────────────────────────
  // PROCTORING: Tab / Window Switch Detection
  // ─────────────────────────────────────────────────────────────
  const handleViolation = useCallback(async (reason) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setIsTerminating(true);
    setViolationReason(reason);
    setProctoringPhase('terminated');

    // Stop all media
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());

    try {
      await api.post(`/assessments/attempts/${attemptId}/terminate`, { reason });
    } catch (err) {
      console.error('Error terminating attempt:', err);
    }
    setIsTerminating(false);
  }, [attemptId]);

  useEffect(() => {
    if (proctoringPhase !== 'active') return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminatedRef.current) {
        const newCount = tabSwitchWarningsRef.current + 1;
        tabSwitchWarningsRef.current = newCount;
        setTabSwitchWarnings(newCount);

        if (newCount >= 1) {
          // Zero-tolerance: first switch terminates
          handleViolation('Candidate switched away from the interview tab.');
        }
      }
    };

    const handleWindowBlur = () => {
      if (!isTerminatedRef.current) {
        const newCount = tabSwitchWarningsRef.current + 1;
        tabSwitchWarningsRef.current = newCount;
        setTabSwitchWarnings(newCount);

        if (newCount >= 2) {
          handleViolation('Candidate switched to another window during the interview.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [proctoringPhase, handleViolation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ASSESSMENT: Load Questions
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (proctoringPhase === 'active') {
      fetchAttemptQuestions();
    }
  }, [proctoringPhase, attemptId]);

  const fetchAttemptQuestions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get(`/assessments/attempts/${attemptId}/questions`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
        setAttempt(res.data.attempt);
        setQuestions(res.data.questions || []);
        if (res.data.savedAnswers) {
          setAnswers(res.data.savedAnswers);
        }
      }
    } catch (err) {
      console.error('Error fetching interview questions:', err);
      const isExpired = err.response?.data?.isExpired;
      if (isExpired) {
        setExpiredWarning(true);
        setTimeout(() => navigate(`/results/${attemptId}`), 2500);
      } else {
        setErrorMsg(err.response?.data?.message || 'Could not load interview session.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ANSWER: Auto-save
  // ─────────────────────────────────────────────────────────────
  const persistAnswer = async (qId, answerText, markedForReview) => {
    try {
      setSavingAnswer(true);
      await api.put(`/assessments/attempts/${attemptId}/save-answer`, {
        questionId: qId,
        answerText,
        markedForReview
      });
    } catch (err) {
      if (err.response?.data?.isExpired) handleTimerExpire();
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleAnswerTextChange = (text) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { answerText: '', markedForReview: false };
    setAnswers({ ...answers, [currentQ.id]: { ...currentAns, answerText: text } });
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistAnswer(currentQ.id, text, currentAns.markedForReview);
    }, 600);
  };

  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { answerText: '', markedForReview: false };
    setAnswers({ ...answers, [currentQ.id]: { ...currentAns, answerText: '' } });
    persistAnswer(currentQ.id, '', currentAns.markedForReview);
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { answerText: '', markedForReview: false };
    const newMarked = !currentAns.markedForReview;
    setAnswers({ ...answers, [currentQ.id]: { ...currentAns, markedForReview: newMarked } });
    persistAnswer(currentQ.id, currentAns.answerText, newMarked);
  };

  const handleNext = () => {
    const currentQ = questions[currentIndex];
    if (currentQ && answers[currentQ.id]) {
      persistAnswer(currentQ.id, answers[currentQ.id].answerText, answers[currentQ.id].markedForReview);
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    const currentQ = questions[currentIndex];
    if (currentQ && answers[currentQ.id]) {
      persistAnswer(currentQ.id, answers[currentQ.id].answerText, answers[currentQ.id].markedForReview);
    }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleJumpToQuestion = (index) => {
    const currentQ = questions[currentIndex];
    if (currentQ && answers[currentQ.id]) {
      persistAnswer(currentQ.id, answers[currentQ.id].answerText, answers[currentQ.id].markedForReview);
    }
    setCurrentIndex(index);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmModal(false);
      await api.post(`/assessments/attempts/${attemptId}/submit`);
      // Stop media after voluntary submit
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      navigate(`/results/${attemptId}`);
    } catch (err) {
      navigate(`/results/${attemptId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerExpire = async () => {
    try {
      setIsSubmitting(true);
      await api.post(`/assessments/attempts/${attemptId}/submit`);
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      navigate(`/results/${attemptId}`);
    } catch (err) {
      navigate(`/results/${attemptId}`);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: Setup / Permission Phase
  // ─────────────────────────────────────────────────────────────
  if (proctoringPhase === 'setup' || proctoringPhase === 'ready') {
    const allReady = hasCameraPermission && hasScreenPermission;
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        {/* Professional top header bar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>InterviewPro</span>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', padding: '0.3rem 0.85rem',
            borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'blink 1.2s infinite' }} />
            LIVE MONITORING
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '720px', width: '100%' }}>

            {/* Title block */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
              }}>
                <ShieldAlert size={28} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                System & Permission Check
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto' }}>
                Before starting the interview, please grant access to your camera, microphone, and screen. All three are required.
              </p>
            </div>

            {/* Zero-tolerance warning */}
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderLeft: '4px solid #f97316',
              borderRadius: '10px',
              padding: '0.9rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={18} color="#f97316" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.55 }}>
                <strong style={{ color: '#c2410c' }}>Zero-Tolerance Policy:</strong>{' '}
                Switching tabs, opening other windows, or stopping your screen share will{' '}
                <strong>immediately terminate</strong> your interview. Your partial score will be recorded.
              </div>
            </div>

            {/* Media Error */}
            {mediaError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444',
                borderRadius: '10px', padding: '0.9rem 1.25rem', marginBottom: '1.5rem',
                fontSize: '0.85rem', color: '#991b1b',
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
              }}>
                <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{mediaError}</span>
              </div>
            )}

            {/* Step cards container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

              {/* Step 1: Camera */}
              <div style={{
                background: '#fff',
                border: `1.5px solid ${hasCameraPermission ? '#86efac' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                boxShadow: hasCameraPermission ? '0 0 0 3px rgba(134,239,172,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.25s ease'
              }}>
                {/* Step number / status */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: hasCameraPermission ? '#22c55e' : '#f1f5f9',
                  border: `2px solid ${hasCameraPermission ? '#22c55e' : '#e2e8f0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem',
                  color: hasCameraPermission ? '#fff' : '#94a3b8'
                }}>
                  {hasCameraPermission ? '✓' : '1'}
                </div>

                {/* Camera preview box */}
                <div style={{
                  width: '100px', height: '75px', background: '#0f172a',
                  borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {hasCameraPermission ? (
                    <video ref={cameraVideoRef} autoPlay muted playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <CameraOff size={24} color="#475569" />
                  )}
                  {hasCameraPermission && (
                    <div style={{
                      position: 'absolute', top: '5px', right: '5px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#22c55e', animation: 'blink 1.2s infinite'
                    }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Camera &amp; Microphone</span>
                    {hasCameraPermission && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.55rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>✓ ACTIVE</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
                    Your face must be clearly visible throughout the entire interview.
                  </p>
                  {!hasCameraPermission ? (
                    <button onClick={requestCameraAccess} style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#fff', border: 'none',
                      padding: '0.5rem 1.35rem', borderRadius: '8px',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                    }}>
                      Enable Camera &amp; Mic
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Mic size={13} /> Audio &amp; video are active
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Screen Share */}
              <div style={{
                background: '#fff',
                border: `1.5px solid ${hasScreenPermission ? '#86efac' : '#e2e8f0'}`,
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                boxShadow: hasScreenPermission ? '0 0 0 3px rgba(134,239,172,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.25s ease'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: hasScreenPermission ? '#22c55e' : '#f1f5f9',
                  border: `2px solid ${hasScreenPermission ? '#22c55e' : '#e2e8f0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem',
                  color: hasScreenPermission ? '#fff' : '#94a3b8'
                }}>
                  {hasScreenPermission ? '✓' : '2'}
                </div>

                <div style={{
                  width: '100px', height: '75px', background: '#0f172a',
                  borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {hasScreenPermission ? (
                    <video ref={screenVideoRef} autoPlay muted playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <MonitorOff size={24} color="#475569" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Screen Recording</span>
                    {hasScreenPermission && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.55rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>✓ SHARING</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
                    Share your <strong style={{ color: '#1e293b' }}>entire screen</strong> (not a tab or window). Stopping during the interview will end your session.
                  </p>
                  {!hasScreenPermission ? (
                    <button
                      onClick={requestScreenShare}
                      disabled={!hasCameraPermission}
                      style={{
                        background: hasCameraPermission
                          ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                          : '#f1f5f9',
                        color: hasCameraPermission ? '#fff' : '#94a3b8',
                        border: hasCameraPermission ? 'none' : '1px solid #e2e8f0',
                        padding: '0.5rem 1.35rem', borderRadius: '8px',
                        fontWeight: 600, fontSize: '0.85rem',
                        cursor: hasCameraPermission ? 'pointer' : 'not-allowed',
                        boxShadow: hasCameraPermission ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                      }}
                    >
                      {hasCameraPermission ? 'Share My Screen' : 'Complete Step 1 first'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Monitor size={13} /> Entire screen is being recorded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setProctoringPhase('active')}
              disabled={!allReady}
              style={{
                width: '100%', padding: '1rem 1.5rem',
                background: allReady
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : '#f1f5f9',
                color: allReady ? '#fff' : '#94a3b8',
                border: allReady ? 'none' : '1px solid #e2e8f0',
                borderRadius: '12px', fontWeight: 800, fontSize: '1rem',
                cursor: allReady ? 'pointer' : 'not-allowed',
                boxShadow: allReady ? '0 4px 16px rgba(34,197,94,0.35)' : 'none',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
              }}
            >
              {allReady ? (
                <><CheckCircle2 size={20} /> Start Proctored Interview</>
              ) : (
                `Complete ${[hasCameraPermission && 'Camera', hasScreenPermission && 'Screen'].filter(Boolean).length === 0 ? 'both steps' : '1 more step'} above to begin`
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '1rem' }}>
              By starting, you agree to this session being recorded for evaluation purposes.
            </p>
          </div>
        </div>

        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Terminated / Violation Screen
  // ─────────────────────────────────────────────────────────────
  if (proctoringPhase === 'terminated') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fef2f2',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)'
      }}>
        {/* Header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #fecaca',
          padding: '0 2rem', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>InterviewPro</span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.3rem 0.85rem', borderRadius: '999px' }}>
            SESSION TERMINATED
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{
            background: '#fff',
            border: '1px solid #fecaca',
            borderTop: '4px solid #ef4444',
            borderRadius: '16px',
            padding: '3rem 2.5rem',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(239,68,68,0.1)'
          }}>
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: '#fee2e2',
            border: '2px solid #fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            animation: 'shake 0.5s ease'
          }}>
            <ShieldAlert size={36} color="#ef4444" />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626', marginBottom: '0.5rem' }}>
            Interview Terminated
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            A proctoring violation was detected. Your interview has been ended and your partial responses have been automatically scored.
          </p>

          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            textAlign: 'left',
            fontSize: '0.875rem'
          }}>
            <div style={{ color: '#dc2626', fontWeight: 700, marginBottom: '0.3rem' }}>📋 Violation Reason:</div>
            <div style={{ color: '#7f1d1d' }}>{violationReason || 'Proctoring violation detected.'}</div>
          </div>

          {isTerminating ? (
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              <div className="spinner" style={{ margin: '0 auto 0.75rem' }}></div>
              Saving your responses...
            </div>
          ) : (
            <button
              onClick={() => navigate(`/results/${attemptId}`)}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '0.85rem 2.5rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              View Your Results →
            </button>
          )}
          </div>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }}></div>
          <h3 style={{ color: 'var(--text-main)', fontWeight: 600 }}>Loading Interview Questions...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Initializing timed session</p>
        </div>
      </div>
    );
  }

  if (expiredWarning) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '520px', textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertOctagon size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Time Limit Expired</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Your answers have been automatically submitted and scored.
          </p>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.75rem' }}>Redirecting to Results...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '2.5rem' }}>
          <AlertTriangle size={44} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Unable to Access Assessment</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{errorMsg}</p>
          <button onClick={() => navigate('/assessments')} className="btn btn-primary">
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Active Interview
  // ─────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let markedCount = 0;
  questions.forEach(q => {
    const a = answers[q.id];
    if (a && a.answerText && a.answerText.trim().length > 0) answeredCount++;
    if (a && a.markedForReview) markedCount++;
  });
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const currentAnswerText = currentAnswer ? currentAnswer.answerText : '';
  const isMarkedForReview = Boolean(currentAnswer && currentAnswer.markedForReview);
  const wordCount = currentAnswerText ? currentAnswerText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* ── Top Navbar ── */}
      <header className="top-navbar" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
              Round 1 Interview
            </div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
              {assessment?.title}
            </h2>
          </div>
          <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} />
            <span>{assessment?.categoryName || 'Digital Marketing'}</span>
          </span>

          {/* Live proctoring indicator */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.775rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#dc2626',
              display: 'inline-block',
              animation: 'pulse 1.2s infinite'
            }} />
            PROCTORED
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Camera miniature in header */}
          <div style={{
            width: '60px', height: '45px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '2px solid #10b981',
            flexShrink: 0
          }}>
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          </div>

          {attempt && (
            <CountdownTimer
              attemptId={attemptId}
              initialRemainingSeconds={attempt.remainingSeconds}
              onExpire={handleTimerExpire}
            />
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Send size={16} />
            <span>Submit Round 1</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem', gap: '1.5rem' }}>

        {/* Left: Question + Answer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Progress bar */}
          <div style={{
            background: 'var(--bg-card)', padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
            marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Progress: {answeredCount} of {totalQuestions} answered ({progressPercent}%)
              </span>
              <span style={{ color: savingAnswer ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.78rem', fontWeight: 500 }}>
                {savingAnswer ? 'Auto-saving...' : 'Responses saved to server'}
              </span>
            </div>
            <div className="progress-bar-container" style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`, height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, var(--teal) 100%)',
                borderRadius: '999px', transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div style={{
              background: 'var(--bg-card)', padding: '2rem',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-md)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                {/* Question header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                      padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-md)',
                      fontWeight: 700, fontSize: '0.9rem'
                    }}>
                      Question {currentIndex + 1} of {totalQuestions}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Worth {currentQuestion.marks} Marks
                    </span>
                  </div>
                  <button
                    onClick={handleToggleReview}
                    className={`btn btn-sm ${isMarkedForReview ? 'btn-warning' : 'btn-secondary'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
                  >
                    <Bookmark size={15} fill={isMarkedForReview ? 'currentColor' : 'none'} />
                    <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Question text */}
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {currentQuestion.question_text}
                </div>

                {/* Answer textarea */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={16} color="var(--primary)" />
                      <span>Your Answer / Explanation:</span>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {wordCount} words &bull; {currentAnswerText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder="Type your detailed answer here... (Auto-scored based on key concepts and technical terminology)"
                    value={currentAnswerText}
                    onChange={(e) => handleAnswerTextChange(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%', fontFamily: 'var(--font-sans)',
                      fontSize: '1rem', lineHeight: 1.6,
                      padding: '1rem', borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--border-light)', resize: 'vertical',
                      backgroundColor: '#fcfcfd', minHeight: '180px'
                    }}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {currentAnswerText.trim().length > 0 && (
                    <button onClick={handleClearAnswer} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                      <RotateCcw size={14} />
                      <span>Clear Answer</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button onClick={handlePrev} disabled={currentIndex === 0} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ArrowLeft size={16} />
                    <span>Previous</span>
                  </button>
                  {currentIndex < totalQuestions - 1 ? (
                    <button onClick={handleNext} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Next Question</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={() => setShowConfirmModal(true)} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--teal)', borderColor: 'var(--teal)' }}>
                      <CheckCircle2 size={16} />
                      <span>Review &amp; Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Question palette */}
          <div style={{
            background: 'var(--bg-card)', padding: '1.5rem',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
              Question Palette
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success)' }}></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--border-medium)' }}></span>
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--warning)' }}></span>
                <span>Review ({markedCount})</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans && ans.answerText && ans.answerText.trim().length > 0;
                const isMarked = ans && ans.markedForReview;
                const isCurrent = idx === currentIndex;
                let bg = 'var(--bg-subtle)', color = 'var(--text-secondary)', border = '1px solid var(--border-light)';
                if (isMarked) { bg = 'var(--warning)'; color = '#fff'; border = '1px solid var(--warning)'; }
                else if (isAnswered) { bg = 'var(--success)'; color = '#fff'; border = '1px solid var(--success)'; }
                if (isCurrent) { border = '2px solid var(--primary)'; if (!isAnswered && !isMarked) { color = 'var(--primary)'; bg = 'var(--primary-light)'; } }
                return (
                  <button key={q.id} onClick={() => handleJumpToQuestion(idx)} style={{ height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: bg, color, border, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <button onClick={() => setShowConfirmModal(true)} className="btn btn-primary btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Send size={16} />
                <span>Submit Assessment</span>
              </button>
            </div>
          </div>

          {/* Live Camera Preview in Sidebar */}
          <div style={{
            background: 'var(--bg-card)', padding: '1rem',
            borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.65rem', fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
              Camera Live – You Are Being Recorded
            </div>
            <video
              autoPlay
              muted
              playsInline
              ref={el => { if (el && cameraStream) el.srcObject = cameraStream; }}
              style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '4/3', background: '#000', transform: 'scaleX(-1)' }}
            />
          </div>
        </aside>
      </div>

      {/* Confirm Submit Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Assessment Submission">
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Are you sure you want to submit your interview answers? The evaluation engine will score your written responses based on required technical keywords.
          </p>
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalQuestions}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{answeredCount}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Answered</div>
            </div>
          </div>
          {unansweredCount > 0 && (
            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', color: '#b45309', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>You have <strong>{unansweredCount} unanswered question(s)</strong> — they will receive 0 marks.</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary">Return to Test</button>
            <button onClick={handleFinalSubmit} disabled={isSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmitting ? (
                <><div className="spinner-sm"></div><span>Evaluating...</span></>
              ) : (
                <><Send size={16} /><span>Yes, Submit Assessment</span></>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default McqInterview;
