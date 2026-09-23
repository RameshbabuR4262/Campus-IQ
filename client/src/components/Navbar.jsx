import React from 'react';
import {
  GraduationCap,
  MessageSquare,
  FileText,
  Sliders,
  BarChart3,
  GitFork,
  Sun,
  Moon,
  Database,
  Zap,
  User,
  LogIn
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenSettings,
  documentCount = 0,
  user = null,
  onLoginClick
}) {
  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('home')}>
        <div className="nav-logo-icon">
          <GraduationCap size={24} />
        </div>
        <div className="brand-text">
          <h1>CampusIQ</h1>
          <p>AI College Knowledge Assistant</p>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <GraduationCap size={16} />
          <span>Overview</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>AI Chat</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'snap' ? 'active' : ''}`}
          onClick={() => setActiveTab('snap')}
        >
          <Zap size={16} color="var(--accent-gold)" />
          <span>Campus Snap</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={16} />
          <span>Document Hub</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <GitFork size={16} />
          <span>RAG Pipeline</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Analytics</span>
        </button>
      </nav>

      <div className="nav-actions">
        <div className="status-chip" title="Vector Database active">
          <span className="status-dot"></span>
          <Database size={13} />
          <span>{documentCount} Docs</span>
        </div>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="RAG & LLM Engine Settings"
        >
          <Sliders size={18} />
        </button>

        {/* User Account / Profile Chip or Login Button */}
        {user ? (
          <div
            className={`user-nav-chip ${activeTab === 'profile' ? 'active-user' : ''}`}
            onClick={() => setActiveTab('profile')}
            title="View Student Profile & Academic Health"
          >
            <div className="user-avatar-bubble">
              {user.avatar || 'U'}
            </div>
            <div className="user-nav-details">
              <span className="user-nav-name">{user.name.split(' ')[0]}</span>
              <span className="user-nav-role">{user.role}</span>
            </div>
          </div>
        ) : (
          <button
            className="btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            onClick={onLoginClick}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
