import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck,
  FolderKanban,
  Users,
  Award,
  UserCheck,
  Terminal,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Terminal size={26} color="var(--primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              InterviewPro
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              MCQ Assessment Platform
            </span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, padding: '0.5rem 0.75rem', letterSpacing: '0.05em' }}>
              Administration
            </div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FolderKanban size={18} />
              <span>Categories</span>
            </NavLink>
            <NavLink to="/admin/assessments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileCheck size={18} />
              <span>Assessments</span>
            </NavLink>
            <NavLink to="/admin/candidates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Candidates</span>
            </NavLink>
            <NavLink to="/admin/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Award size={18} />
              <span>Results & Scores</span>
            </NavLink>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, padding: '0.5rem 0.75rem', letterSpacing: '0.05em' }}>
              Candidate Portal
            </div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/assessments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileCheck size={18} />
              <span>Available Assessments</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={18} />
              <span>My Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
