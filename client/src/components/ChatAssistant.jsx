import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2,
  GitFork,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitRagQuery } from '../services/api';

export default function ChatAssistant({
  initialPrompt = '',
  onClearInitialPrompt,
  onViewSource,
  documents = []
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am **CampusIQ**, your official college knowledge assistant.

I can help you navigate academic regulations, hostel guidelines, placement eligibility, scholarships, exam revaluations, and OD policies.

**Important Note**: All my answers are strictly grounded in official college documents with exact page numbers and sections cited.`,
      isGrounded: true,
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedTraceId, setExpandedTraceId] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [topK, setTopK] = useState(3);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      handleSendPrompt(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendPrompt = async (queryText) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await submitRagQuery({
        query: text,
        topK: parseInt(topK, 10),
        category: selectedCategory || undefined,
        department: selectedDepartment || undefined
      });

      const assistantMessage = {
        id: 'assistant_' + Date.now(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        isGrounded: response.isGrounded,
        retrievalLatencyMs: response.retrievalLatencyMs,
        generatorUsed: response.generatorUsed,
        pipelineTrace: response.pipelineTrace
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.isGrounded && response.sources?.length > 0) {
        // Subtle confetti for successful grounded citation
        try {
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.85 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });
        } catch (e) {
          // ignore if canvas not ready
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          role: 'assistant',
          content: "I couldn't find enough information in the provided college documents to answer this question.",
          isGrounded: false,
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current chat conversation?')) {
      setMessages([
        {
          id: 'welcome_reset',
          role: 'assistant',
          content: 'Chat cleared. Ask me any question about college regulations or campus policies!',
          isGrounded: true,
          sources: []
        }
      ]);
    }
  };

  // Distinct categories and departments from loaded documents
  const categories = Array.from(new Set(documents.map(d => d.category))).filter(Boolean);
  const departments = Array.from(new Set(documents.map(d => d.department))).filter(Boolean);

  return (
    <div className="chat-layout animate-fade-in">
      {/* Sidebar Controls */}
      <aside className="chat-sidebar">
        <div>
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: '1rem', padding: '0.65rem' }}
            onClick={handleClearChat}
          >
            <RotateCcw size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Retrieval Filters */}
        <div>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} />
            <span>Targeted Document Scope</span>
          </h4>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Category Filter</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories ({documents.length} docs)</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Department Filter</label>
            <select
              className="form-select"
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Retrieval Depth: {topK} Chunks</label>
            <input
              type="range"
              min="1"
              max="6"
              value={topK}
              onChange={e => setTopK(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        {/* Suggested Queries */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            Suggested Questions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              'What are the attendance requirements?',
              'Hostel curfew and pass procedure?',
              'What is One-Student-One-Job policy?',
              'Sports excellence fee concession?'
            ].map((q, idx) => (
              <button
                key={idx}
                className="question-chip-btn"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem', borderRadius: '8px' }}
                onClick={() => handleSendPrompt(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Panel */}
      <main className="chat-main-panel">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>CampusIQ Knowledge Assistant</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {selectedCategory ? `Scoped to ${selectedCategory}` : 'Searching all indexed college documents'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Top-K: {topK}
            </span>
          </div>
        </div>

        {/* Chat Messages Scroll */}
        <div className="chat-messages-container">
          {messages.map(msg => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className={`message-avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="message-content">
                {/* Verification Badge */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div>
                    {msg.isGrounded ? (
                      <span className="grounded-badge verified">
                        <ShieldCheck size={12} />
                        <span>Verified from College Documents</span>
                        {msg.retrievalLatencyMs !== undefined && (
                          <span style={{ opacity: 0.8, marginLeft: '4px' }}>• {msg.retrievalLatencyMs}ms</span>
                        )}
                      </span>
                    ) : (
                      <span className="grounded-badge unverified">
                        <AlertCircle size={12} />
                        <span>Not in College Records</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Body Text */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-citation-block">
                    <div className="sources-label">
                      <FileText size={13} color="var(--primary)" />
                      <span>Retrieved Source Citations ({msg.sources.length}):</span>
                    </div>

                    <div className="citations-grid">
                      {msg.sources.map((src, i) => (
                        <button
                          key={i}
                          className="citation-pill-btn"
                          onClick={() => onViewSource(src)}
                          title="Click to view full document excerpt and page verification"
                        >
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>[{src.citationIndex}]</span>
                          <span>{src.documentTitle}</span>
                          <span style={{ color: 'var(--accent-gold)' }}>p.{src.pageNumber}</span>
                          <span className="citation-score-tag">
                            {src.relevancePercent || Math.round(src.similarityScore * 100)}%
                          </span>
                          <ExternalLink size={12} style={{ opacity: 0.6 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Actions (Copy & RAG Trace) */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem' }}
                        onClick={() => handleCopy(msg.id, msg.content)}
                      >
                        {copiedId === msg.id ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {msg.pipelineTrace && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem' }}
                          onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                        >
                          <GitFork size={12} />
                          <span>{expandedTraceId === msg.id ? 'Hide Pipeline Trace' : 'Inspect RAG Pipeline'}</span>
                          {expandedTraceId === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                      {msg.generatorUsed || 'CampusIQ Engine'}
                    </span>
                  </div>
                )}

                {/* Inline RAG Pipeline Trace Inspector */}
                {expandedTraceId === msg.id && msg.pipelineTrace && (
                  <div
                    className="animate-fade-in"
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.85rem',
                      background: 'var(--bg-input)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-active)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GitFork size={14} />
                      <span>RAG Execution Pipeline Step-by-Step Trace</span>
                    </div>

                    {msg.pipelineTrace.steps?.map((step, sIdx) => (
                      <div key={sIdx} style={{ marginBottom: '0.45rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--primary)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          Step {sIdx + 1}: {step.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {step.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-avatar assistant">
                <Bot size={18} />
              </div>
              <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sparkles size={16} color="var(--primary)" className="animate-spin" />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Searching vector database & grounding response from college documents...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-container">
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask any question about academic rules, hostel curfew, placements, scholarships, leave..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!input.trim() || loading}
              title="Submit query"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
