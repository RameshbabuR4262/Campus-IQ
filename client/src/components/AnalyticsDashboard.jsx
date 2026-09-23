import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Database,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Building2,
  RefreshCw,
  Search
} from 'lucide-react';
import { fetchStats } from '../services/api';

export default function AnalyticsDashboard({ stats: initialStats }) {
  const [stats, setStats] = useState(initialStats || null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Vector Database & System Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor vector store health, document index coverage, and RAG retrieval latency.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={loadData}
          disabled={loading}
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Documents Ingested
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary)' }}>
                {stats?.totalDocuments || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Official handbooks & policies
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Vector Chunks
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-emerald)' }}>
                {stats?.totalChunks || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Avg {stats?.averageChunkSize || 0} chars per chunk
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Words Vectorized
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-purple)' }}>
                {(stats?.totalWordsIndexed || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            384-Dimensional Embedding Space
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Queries Processed
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-gold)' }}>
                {stats?.totalQueriesAnswered || 0}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Sub-10ms Cosine Search Latency
          </div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Categories */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={16} color="var(--primary)" />
            <span>Category Coverage</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {stats?.categories && Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{cat}</span>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                  {count} doc{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} color="var(--accent-emerald)" />
            <span>Departmental Sources</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {stats?.departments && Object.entries(stats.departments).map(([dept, count]) => (
              <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{dept}</span>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem' }}>
                  {count} doc{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Query Audit Log */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} color="var(--primary)" />
          <span>Recent Query Audit & Grounding Verification Log</span>
        </h3>

        {stats?.recentQueries && stats.recentQueries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '0.65rem' }}>Time</th>
                  <th style={{ padding: '0.65rem' }}>Student Query</th>
                  <th style={{ padding: '0.65rem' }}>Status</th>
                  <th style={{ padding: '0.65rem' }}>Sources</th>
                  <th style={{ padding: '0.65rem' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentQueries.map((q, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem', color: 'var(--text-dim)' }}>
                      {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.query}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      {q.hasAnswer ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Grounded
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <AlertCircle size={13} /> Fallback
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      {q.sourcesCount} chunks
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-dim)' }}>
                      {q.retrievalLatencyMs}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No queries logged yet. Ask questions in the AI Chat Assistant to view live audit traces.
          </p>
        )}
      </div>
    </div>
  );
}
