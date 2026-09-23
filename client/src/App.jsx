import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ChatAssistant from './components/ChatAssistant';
import DocumentManager from './components/DocumentManager';
import RagPipelineVisualizer from './components/RagPipelineVisualizer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SourceViewerModal from './components/SourceViewerModal';
import SettingsModal from './components/SettingsModal';
import SnapView from './components/SnapView';
import ProfileView from './components/ProfileView';
import LoginView from './components/LoginView';
import { fetchDocuments, fetchStats } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('dark');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activePrompt, setActivePrompt] = useState('');
  const [activeSource, setActiveSource] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // User state persisted in localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusiq_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadInitialData = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      const st = await fetchStats();
      setStats(st);
    } catch (err) {
      console.warn('Could not connect to backend server. Ensure server is running on port 5000.', err.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSelectPrompt = (promptText) => {
    setActivePrompt(promptText);
    setActiveTab('chat');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('campusiq_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Storage unavailable');
    }
    showNotification(`Welcome, ${user.name}! Signed in as ${user.role}.`, 'success');
    setActiveTab('profile');
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('campusiq_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Storage unavailable');
    }
    showNotification('Profile updated successfully!', 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('campusiq_user');
    } catch (e) {
      console.warn('Storage unavailable');
    }
    showNotification('You have signed out.', 'success');
    setActiveTab('login');
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: '70px',
            right: '25px',
            zIndex: 999,
            background: notification.type === 'error' ? '#ef4444' : 'var(--accent-emerald)',
            color: 'white',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        documentCount={documents.length}
        user={currentUser}
        onLoginClick={() => setActiveTab('login')}
      />

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === 'home' && (
          <HomeView
            onSelectPrompt={handleSelectPrompt}
            setActiveTab={setActiveTab}
            documents={documents}
            stats={stats}
          />
        )}

        {activeTab === 'chat' && (
          <ChatAssistant
            initialPrompt={activePrompt}
            onClearInitialPrompt={() => setActivePrompt('')}
            onViewSource={src => setActiveSource(src)}
            documents={documents}
          />
        )}

        {activeTab === 'snap' && (
          <SnapView
            onSelectPrompt={handleSelectPrompt}
            setActiveTab={setActiveTab}
            onViewSource={src => setActiveSource(src)}
          />
        )}

        {activeTab === 'profile' && (
          currentUser ? (
            <ProfileView
              user={currentUser}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
              setActiveTab={setActiveTab}
              onSelectPrompt={handleSelectPrompt}
            />
          ) : (
            <LoginView
              onLoginSuccess={handleLoginSuccess}
            />
          )
        )}

        {activeTab === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentManager
            documents={documents}
            onRefreshDocs={loadInitialData}
            onNotification={showNotification}
          />
        )}

        {activeTab === 'pipeline' && (
          <RagPipelineVisualizer
            onViewSource={src => setActiveSource(src)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
          />
        )}
      </main>

      {/* Source Citation Modal */}
      {activeSource && (
        <SourceViewerModal
          source={activeSource}
          onClose={() => setActiveSource(null)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => {
            setIsSettingsOpen(false);
            loadInitialData();
          }}
          onNotification={showNotification}
        />
      )}
    </div>
  );
}
