import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck,
  FolderKanban,
  Users,
  Award,
  LogOut,
  Video
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ padding: '1.25rem 1rem 1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
          <div style={{
            background: '#ffffff',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src="/logo.png"
              alt="Med Manor Organics"
              style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, padding: '0.5rem 0.75rem', letterSpacing: '0.05em' }}>
          Management
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
        <NavLink to="/admin/modules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Video size={18} />
          <span>Learning Modules</span>
        </NavLink>
        <NavLink to="/admin/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Award size={18} />
          <span>Results & Scores</span>
        </NavLink>
      </nav>

    </aside>
  );
};

export default Sidebar;
