import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Key,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchSettings, updateSettings, resetSeedDocuments } from '../services/api';

export default function SettingsModal({ onClose, onNotification }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'local',
    apiKey: '',
    topK: 3,
    minScore: 0.28,
    modelName: 'gemini-1.5-flash',
    chunkSize: 650,
    chunkOverlap: 120
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(prev => ({
        ...prev,
        ...data,
        apiKey: data.apiKey || ''
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(settings);
      if (onNotification) onNotification('Settings saved successfully!', 'success');
      onClose();
    } catch (err) {
      if (onNotification) onNotification('Failed to save settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset vector database back to official college seed documents?')) return;
    try {
      setResetting(true);
      const res = await resetSeedDocuments();
      if (onNotification) onNotification(res.message, 'success');
      onClose();
    } catch (err) {
      if (onNotification) onNotification(err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>RAG & Generation Engine Settings</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Configure vector retrieval parameters and language models
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Provider Selection */}
          <div className="form-group">
            <label className="form-label">Generation Engine / LLM Provider</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <button
                type="button"
                className={`glass-card ${settings.provider === 'local' ? 'active-border' : ''}`}
                style={{
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderColor: settings.provider === 'local' ? 'var(--primary)' : 'var(--border-subtle)',
                  background: settings.provider === 'local' ? 'var(--primary-glow)' : 'var(--bg-card)'
                }}
                onClick={() => setSettings({ ...settings, provider: 'local' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem' }}>
                  <ShieldCheck size={16} color="var(--accent-emerald)" />
                  Built-in Local
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  100% offline, zero API keys required, strictly grounded.
                </div>
              </button>

              <button
                type="button"
                className={`glass-card ${settings.provider === 'gemini' ? 'active-border' : ''}`}
                style={{
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderColor: settings.provider === 'gemini' ? 'var(--primary)' : 'var(--border-subtle)',
                  background: settings.provider === 'gemini' ? 'var(--primary-glow)' : 'var(--bg-card)'
                }}
                onClick={() => setSettings({ ...settings, provider: 'gemini' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem' }}>
                  <Sparkles size={16} color="#818cf8" />
                  Google Gemini
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Gemini 1.5 Flash / Pro with grounding prompt.
                </div>
              </button>

              <button
                type="button"
                className={`glass-card ${settings.provider === 'openai' ? 'active-border' : ''}`}
                style={{
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderColor: settings.provider === 'openai' ? 'var(--primary)' : 'var(--border-subtle)',
                  background: settings.provider === 'openai' ? 'var(--primary-glow)' : 'var(--bg-card)'
                }}
                onClick={() => setSettings({ ...settings, provider: 'openai' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem' }}>
                  <Key size={16} color="var(--accent-gold)" />
                  OpenAI GPT
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  GPT-4o-mini with college document context.
                </div>
              </button>
            </div>
          </div>

          {/* API Key (if cloud provider chosen) */}
          {settings.provider !== 'local' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">
                {settings.provider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={settings.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                value={settings.apiKey}
                onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                Key is kept in your local session. Leave blank to fallback to built-in local engine anytime.
              </span>
            </div>
          )}

          {/* Top-K Chunks slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Top-K Retrieved Chunks: <strong>{settings.topK} chunks</strong>
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Default: 3</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={settings.topK}
              onChange={e => setSettings({ ...settings, topK: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              <span>1 (Precise)</span>
              <span>4 (Balanced)</span>
              <span>8 (Comprehensive)</span>
            </div>
          </div>

          {/* Minimum Similarity Threshold */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Cosine Similarity Threshold: <strong>{settings.minScore}</strong>
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Relevance cutoff</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.60"
              step="0.01"
              value={settings.minScore}
              onChange={e => setSettings({ ...settings, minScore: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
              Queries scoring below this threshold trigger the exact fallback: "I couldn't find enough information in the provided college documents to answer this question."
            </span>
          </div>

          {/* Reset button */}
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              onClick={handleResetSeed}
              disabled={resetting}
            >
              <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
              <span>{resetting ? 'Resetting...' : 'Re-index Seed Documents'}</span>
            </button>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
