import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {ShieldCheck,Lock,Mail,User,Phone,ArrowRight,UserPlus,LogIn,CheckCircle2,AlertCircle,ArrowLeft} from 'lucide-react';

const AdminLogin = () => {

  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      if (res.data.success) {
        if (res.data.user.role !== 'admin') {
          setError('Access denied. Administrator privileges are required to access this portal.');
          return;
        }
        login(res.data.token, res.data.user);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regEmail.trim() || !emailRegex.test(regEmail.trim())) {
      setError('Please provide a valid email address (e.g. admin@company.com).');
      return;
    }

    if (!phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-\(\)\.]/g, '').replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register-admin', {
        name: name.trim(),
        email: regEmail.trim(),
        phone: phone.trim(),
        password: regPassword,
        confirmPassword
      });

      if (res.data.success) {
        setSuccessMsg('Administrator account registered successfully! Redirecting...');
        login(res.data.token, res.data.user);
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Administrator registration failed. Please try again.');
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
          .admin-login-card {
            padding: 1.5rem 1.15rem !important;
            border-radius: 14px !important;
          }
          .admin-login-logo {
            height: 56px !important;
            max-width: 200px !important;
          }
        }
      `}</style>
      <div className="admin-login-card" style={{
        maxWidth: mode === 'register' ? '480px' : '440px',
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '18px',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.08)',
        transition: 'all 0.3s ease'
      }}>
       
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="Med Manor Organics Logo"
              className="admin-login-logo"
              style={{
                height: '78px',
                maxWidth: '280px',
                objectFit: 'contain'
              }}
            />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>
            Admin Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {mode === 'login' ? 'Sign in with admin credentials' : 'Create a new admin account'}
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f1f5f9',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            style={{
              padding: '0.55rem 0',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} />
            <span>Admin Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            style={{
              padding: '0.55rem 0',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} />
            <span>Register Admin</span>
          </button>
        </div>

        {/* Notifications */}
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
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: SIGN IN */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Admin Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="e.g. admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Admin Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.background = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                marginTop: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#ffffff',
                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* MODE: REGISTER NEW ADMIN */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Admin Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.admin@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210 or +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>10-digit Indian mobile number</p>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Create Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                Confirm Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: '46px',
                    padding: '0 1rem 0 2.75rem',
                    fontSize: '0.925rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                marginTop: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#ffffff',
                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Creating Account...' : (
                <>
                  <span>Create Admin Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748b'
        }}>
          {mode === 'login' ? (
            <p style={{ margin: 0 }}>
              Need to create a new admin account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Register here
              </button>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Already registered as an admin?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Sign in here
              </button>
            </p>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

