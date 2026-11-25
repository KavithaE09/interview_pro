import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Terminal, User, Mail, Phone, ArrowRight, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';

const CandidateLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from || '/candidate/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim().replace(/[\s\-\(\)\.]/g, '').replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).');
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/candidate-login', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate(redirectPath, { replace: true });
      } else {
        setError(res.data.message || 'Unable to start session. Please try again.');
      }
    } catch (err) {
      console.error('Candidate login error:', err);
      setError(err.response?.data?.message || 'Server error. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
      fontFamily: 'var(--font-sans)'
    }}>
      <style>{`
        @media (max-width: 480px) {
          .candidate-login-card {
            padding: 1.5rem 1.15rem !important;
            border-radius: 14px !important;
          }
          .candidate-login-logo {
            height: 56px !important;
            max-width: 200px !important;
          }
        }
      `}</style>
      <div className="candidate-login-card" style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '18px',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
        transition: 'all 0.3s ease'
      }}>
        {/* Brand / Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="Med Manor Organics"
              className="candidate-login-logo"
              style={{
                height: '78px',
                maxWidth: '280px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Candidate Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Enter your details to access your dashboard & assessments
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{error}</span>
          </div>
        )}

        {/* Quick Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
              Phone Number <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>(Optional — 10-digit mobile)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              marginTop: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{loading ? 'Starting Session...' : 'Enter Candidate Dashboard'}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CandidateLogin;
