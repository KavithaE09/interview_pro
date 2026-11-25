import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = ({ assessmentTitle = null, timerComponent = null }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="top-navbar">
      <style>{`
        @media (max-width: 768px) {
          .nav-brand-logo {
            height: 34px !important;
            max-width: 130px !important;
          }
          .nav-welcome-text {
            font-size: 0.8rem !important;
          }
          .nav-divider {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .nav-brand-logo {
            height: 28px !important;
            max-width: 110px !important;
          }
          .nav-welcome-text {
            display: none !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <img
            src="/logo.png"
            alt="Med Manor Organics"
            className="nav-brand-logo"
            style={{ height: '42px', maxWidth: '180px', objectFit: 'contain' }}
          />
        </div>
        <div className="nav-divider" style={{ height: '24px', width: '1px', background: 'var(--border-light, #e2e8f0)' }}></div>
        {assessmentTitle ? (
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live Assessment Session
            </div>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>{assessmentTitle}</h2>
          </div>
        ) : (
          <div className="nav-welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Welcome,
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>
              {user?.name}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {timerComponent}

        {user && (
          <div className="navbar-user">
            <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ fontSize: '0.825rem' }}>{user.name}</span>
              <span className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-candidate'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ marginLeft: '0.25rem', padding: '0.35rem 0.55rem' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
