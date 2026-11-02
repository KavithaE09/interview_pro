import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Navbar = ({ assessmentTitle = null, timerComponent = null }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {assessmentTitle ? (
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live Assessment Session
            </div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>{assessmentTitle}</h2>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Welcome back,
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.name}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {timerComponent}

        {user && (
          <div className="navbar-user">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-candidate'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ marginLeft: '0.5rem', padding: '0.4rem 0.6rem' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
