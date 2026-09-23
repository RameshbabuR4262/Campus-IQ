import React, { useState } from 'react';
import {
  X,
  FileText,
  Bookmark,
  Calendar,
  Building2,
  Percent,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

export default function SourceViewerModal({ source, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!source) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(source.fullContent || source.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Source Context & Citation</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Official College Record Grounding Verification
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Metadata Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Document Title
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {source.documentTitle}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Section & Page
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '0.2rem' }}>
                Page {source.pageNumber} • {source.section}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Department
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {source.department}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Vector Similarity
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                {source.similarityScore} ({(source.relevancePercent || Math.round(source.similarityScore * 100))}% Match)
              </div>
            </div>
          </div>

          {/* Full Extracted Chunk Text */}
          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Retrieved Passage Excerpt
              </span>
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Passage'}</span>
              </button>
            </div>

            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-active)',
                borderRadius: '12px',
                padding: '1.25rem',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                maxHeight: '320px',
                overflowY: 'auto'
              }}
            >
              {source.fullContent || source.snippet}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-card)'
          }}
        >
          <button className="btn-primary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
