import React, { useState } from 'react';
import {
  GitFork,
  Cpu,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { submitRagQuery } from '../services/api';

export default function RagPipelineVisualizer({ onViewSource }) {
  const [query, setQuery] = useState('What are the attendance requirements for semester examination eligibility?');
  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState(null);

  const sampleQueries = [
    'What are the attendance requirements for semester examination eligibility?',
    'What is the hostel gate curfew time and night out pass procedure?',
    'What is the One-Student-One-Job policy and dream offer criteria?',
    'How do I build a rocket to travel to Mars?'
  ];


  const handleRunPipeline = async (customQuery) => {
    const q = (customQuery || query).trim();
    if (!q || loading) return;

    try {
      setLoading(true);
      const res = await submitRagQuery({ query: q, topK: 3 });
      setPipelineData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <div className="hero-pill" style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <GitFork size={14} />
          <span>Interactive RAG Pipeline Inspector</span>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>End-to-End RAG Execution Visualizer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Inspect step-by-step how CampusIQ retrieves relevant college handbook chunks, checks thresholds, and prevents hallucinations.
        </p>
      </div>

      {/* Interactive Query Input Card */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Play size={16} color="var(--primary)" />
          <span>Test a Question Through the Pipeline</span>
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <input
            type="text"
            className="form-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type or select a question to run..."
          />
          <button
            className="btn-primary"
            style={{ padding: '0.65rem 1.5rem', flexShrink: 0 }}
            onClick={() => handleRunPipeline()}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Running...' : 'Execute Pipeline'}
          </button>
        </div>

        {/* Quick buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Presets:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              className="citation-pill-btn"
              style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
              onClick={() => {
                setQuery(sq);
                handleRunPipeline(sq);
              }}
            >
              {sq.length > 40 ? sq.substring(0, 40) + '...' : sq}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Diagram & Results */}
      {pipelineData && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Step 1: Input Query */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                Stage 1: Input Student Query
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                {pipelineData.pipelineTrace?.query.length} Characters
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              "{pipelineData.pipelineTrace?.query}"
            </div>
          </div>

          {/* Step 2: Dense Embedding */}
          <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>
                Stage 2: Dense Semantic Vector Embedding
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Dimension: 384 • Normalized L2
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Tokens vectorized with character n-grams and college terminology TF-IDF weights into high-dimensional space.
            </p>
            {/* Visual Vector Representation Bar */}
            <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', gap: '1px', background: 'var(--bg-elevated)' }}>
              {Array.from({ length: 48 }).map((_, idx) => {
                const opacity = ((idx * 37) % 100) / 100 * 0.8 + 0.2;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      background: `rgba(139, 92, 246, ${opacity})`
                    }}
                    title={`Dim chunk ${idx}: magnitude ${(opacity).toFixed(2)}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Step 3: Vector Cosine Retrieval & Top-K Chunks */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                Stage 3: Vector Cosine Similarity Search
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                Retrieved {pipelineData.sources?.length || 0} Chunks (Latency: {pipelineData.retrievalLatencyMs}ms)
              </span>
            </div>

            {pipelineData.sources && pipelineData.sources.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pipelineData.sources.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                        Rank #{i + 1}: {src.documentTitle}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                          Page {src.pageNumber} • {src.section}
                        </span>
                        <span className="citation-score-tag">
                          Score: {src.similarityScore} ({src.relevancePercent}%)
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      "{src.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '1rem', color: '#ef4444', fontSize: '0.88rem' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                No document chunks scored above the minimum similarity threshold (0.28). Guardrail triggered to prevent hallucination.
              </div>
            )}
          </div>

          {/* Step 4 & 5: Grounded Answer & Citations */}
          <div className="glass-card" style={{ borderLeft: `4px solid ${pipelineData.isGrounded ? 'var(--accent-emerald)' : '#ef4444'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pipelineData.isGrounded ? 'var(--accent-emerald)' : '#ef4444', textTransform: 'uppercase' }}>
                Stage 4 & 5: Prompt Assembly & Grounded Response
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: pipelineData.isGrounded ? 'var(--accent-emerald-bg)' : 'rgba(239, 68, 68, 0.15)',
                  color: pipelineData.isGrounded ? 'var(--accent-emerald)' : '#ef4444'
                }}
              >
                {pipelineData.isGrounded ? 'GROUNDED IN COLLEGE REGULATIONS' : 'UNGROUNDED FALLBACK TRIGGERED'}
              </span>
            </div>

            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1.1rem', fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {pipelineData.answer}
            </div>

            {pipelineData.sources && pipelineData.sources.length > 0 && (
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Verified Sources:</span>
                {pipelineData.sources.map((s, i) => (
                  <button
                    key={i}
                    className="citation-pill-btn"
                    onClick={() => onViewSource(s)}
                  >
                    <span>{s.documentTitle}</span>
                    <span style={{ color: 'var(--accent-gold)' }}>p.{s.pageNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
