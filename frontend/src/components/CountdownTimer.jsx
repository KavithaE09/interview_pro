import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, AlertOctagon } from 'lucide-react';
import api from '../services/api';

const CountdownTimer = ({ attemptId, initialRemainingSeconds = 0, onExpire, onWarningFiveMin, onWarningOneMin }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialRemainingSeconds);
  const [hasWarnedFiveMin, setHasWarnedFiveMin] = useState(false);
  const [hasWarnedOneMin, setHasWarnedOneMin] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(null); // 'five_min' | 'one_min' | null
  const timerRef = useRef(null);

  // Synchronize with server time every 30 seconds to prevent clock drift/tampering
  useEffect(() => {
    setSecondsLeft(initialRemainingSeconds);

    const syncWithServer = async () => {
      try {
        if (!attemptId) return;
        const res = await api.get(`/assessments/attempts/${attemptId}/timer`);
        if (res.data.success) {
          const serverRemaining = res.data.remainingSeconds;
          setSecondsLeft(serverRemaining);
          if (serverRemaining <= 0) {
            if (onExpire) onExpire();
          }
        }
      } catch (err) {
        console.error('Timer sync error:', err);
      }
    };

    const syncInterval = setInterval(syncWithServer, 30000);
    return () => clearInterval(syncInterval);
  }, [attemptId, initialRemainingSeconds, onExpire]);

  // Main 1-second countdown tick
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onExpire) onExpire();
          return 0;
        }

        const next = prev - 1;

        // 5-minute warning (300 seconds)
        if (next <= 300 && next > 298 && !hasWarnedFiveMin) {
          setHasWarnedFiveMin(true);
          setShowWarningBanner('five_min');
          if (onWarningFiveMin) onWarningFiveMin();
        }

        // 1-minute critical warning (60 seconds)
        if (next <= 60 && next > 58 && !hasWarnedOneMin) {
          setHasWarnedOneMin(true);
          setShowWarningBanner('one_min');
          if (onWarningOneMin) onWarningOneMin();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [hasWarnedFiveMin, hasWarnedOneMin, onExpire, onWarningFiveMin, onWarningOneMin]);

  // Format HH:MM:SS
  const formatTime = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const isCritical = secondsLeft <= 60;
  const isWarning = secondsLeft <= 300 && !isCritical;

  let timerClass = 'timer-normal';
  if (isCritical) {
    timerClass = 'timer-critical';
  } else if (isWarning) {
    timerClass = 'timer-warning';
  }

  return (
    <>
      <div className={`timer-container ${timerClass}`} title="Server-enforced assessment deadline">
        {isCritical ? (
          <AlertOctagon size={20} className="animate-spin" />
        ) : isWarning ? (
          <AlertTriangle size={20} />
        ) : (
          <Clock size={20} />
        )}
        <span>{formatTime(secondsLeft)}</span>
      </div>

      {/* Floating 5-minute warning banner */}
      {showWarningBanner === 'five_min' && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          color: '#92400e',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 99
        }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 700 }}>5 Minutes Remaining!</div>
            <div style={{ fontSize: '0.85rem' }}>Please review your answers and prepare to submit.</div>
          </div>
          <button
            onClick={() => setShowWarningBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#92400e', marginLeft: '0.5rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Floating 1-minute critical warning banner */}
      {showWarningBanner === 'one_min' && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          color: '#991b1b',
          padding: '1.1rem 1.35rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 99,
          animation: 'pulse-red 1s infinite'
        }}>
          <AlertOctagon size={26} color="#ef4444" />
          <div>
            <div style={{ fontWeight: 800 }}>1 Minute Remaining – Urgency!</div>
            <div style={{ fontSize: '0.85rem' }}>The assessment will automatically submit when the timer reaches zero.</div>
          </div>
          <button
            onClick={() => setShowWarningBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#991b1b', marginLeft: '0.5rem' }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default CountdownTimer;
