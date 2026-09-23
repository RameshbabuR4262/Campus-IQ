import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Building,
  Briefcase,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  Search,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function HomeView({
  onSelectPrompt,
  setActiveTab,
  documents = [],
  stats = {}
}) {
  const samplePrompts = [
    {
      category: 'Academics',
      icon: <GraduationCap size={16} color="#3b82f6" />,
      text: 'What are the attendance requirements for semester examination eligibility?'
    },
    {
      category: 'Hostel Life',
      icon: <Building size={16} color="#10b981" />,
      text: 'What is the hostel gate curfew time and night out pass procedure?'
    },
    {
      category: 'Placement',
      icon: <Briefcase size={16} color="#f59e0b" />,
      text: 'What is the One-Student-One-Job policy and dream offer criteria?'
    },
    {
      category: 'Financial Aid',
      icon: <FileCheck size={16} color="#8b5cf6" />,
      text: 'What are the eligibility criteria and deadline for Merit scholarships?'
    },
    {
      category: 'Student Leave',
      icon: <FileText size={16} color="#06b6d4" />,
      text: 'What is the maximum allowable On-Duty (OD) limit for hackathons?'
    },
    {
      category: 'Examinations',
      icon: <BookOpen size={16} color="#ec4899" />,
      text: 'What are the rules and fees for revaluation of exam answer scripts?'
    },
    {
      category: 'Out of Scope',
      icon: <ShieldAlert size={16} color="#ef4444" />,
      text: 'How do I build a rocket to travel to Mars?'
    }
  ];


  return (
    <div className="animate-fade-in">
      {/* Hero Header */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Official Campus Knowledge Engine</span>
        </div>

        <h1 className="hero-title">
          CampusIQ <span>AI Knowledge Assistant</span> for College Students
        </h1>

        <p className="hero-subtitle">
          Say goodbye to searching through scattered PDFs and endless circulars.
          Ask any question in natural language and receive answers <strong>grounded strictly in official college documents</strong> with verified page citations.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={() => setActiveTab('chat')}
          >
            <span>Launch AI Chat Assistant</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
            onClick={() => setActiveTab('documents')}
          >
            <Database size={18} />
            <span>Manage College Documents</span>
          </button>
        </div>
      </section>

      {/* Quick Questions Starter Panel */}
      <section className="quick-questions-panel">
        <h3>
          <Search size={18} color="var(--primary)" />
          <span>Frequently Asked College Questions (Click to Ask)</span>
        </h3>
        <div className="question-chips-wrapper">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              className="question-chip-btn"
              onClick={() => onSelectPrompt(item.text)}
            >
              {item.icon}
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Three Pillars Cards */}
      <section className="feature-cards-grid">
        <div className="glass-card">
          <div className="card-icon-bubble" style={{ background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Strictly Grounded Answers
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Zero hallucination guarantee. If a rule or policy is not documented in the college handbooks, CampusIQ transparently declares insufficient info.
          </p>
        </div>

        <div className="glass-card">
          <div className="card-icon-bubble" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Exact Page & Section Citations
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Every answer displays the source document, page number, section header, and vector similarity match score so students can verify immediately.
          </p>
        </div>

        <div className="glass-card">
          <div className="card-icon-bubble" style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)' }}>
            <Layers size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Complete RAG Architecture
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            PDF/DOCX ingestion → Section-aware Chunking → 384-dim Dense Embeddings → Vector Cosine Search → Grounded LLM Synthesis.
          </p>
        </div>
      </section>

      {/* College Document Shelf Preview */}
      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Indexed College Documents Shelf</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Currently ingested regulations, policies, and manuals available in the vector store
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            onClick={() => setActiveTab('documents')}
          >
            <span>View All ({documents.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {documents.slice(0, 6).map((doc) => (
            <div key={doc.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--primary)'
                  }}
                >
                  {doc.category}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {doc.chunkCount} Chunks
                </span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                {doc.title}
              </h4>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {doc.summary || 'Official campus policy document.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <span>Dept: {doc.department}</span>
                <span>Pages: {doc.pageCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
