import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  BellRing,
  GitCommit,
  Database
} from 'lucide-react';

export default function Sidebar({ alertCount = 0, dbConnected = false }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <ShieldAlert size={22} />
        </div>
        <div className="brand-text">
          <h1>LogSentinel</h1>
          <p>Network Analyzer</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <UploadCloud size={18} />
          <span>Log Upload</span>
        </NavLink>

        <NavLink
          to="/logs"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileSearch size={18} />
          <span>Log Analysis</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <BellRing size={18} />
          <span>Security Alerts</span>
          {alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
        </NavLink>

        <NavLink
          to="/fsm"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <GitCommit size={18} />
          <span>FSM Visualization</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className={`status-dot ${dbConnected ? '' : 'offline'}`}></span>
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>
              {dbConnected ? 'MongoDB Connected' : 'Demo Memory Mode'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {dbConnected ? 'Persisting to DB' : 'MongoDB Offline'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
