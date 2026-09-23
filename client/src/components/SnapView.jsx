import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  Zap,
  Calculator,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Briefcase,
  Clock,
  BookOpen,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search
} from 'lucide-react';
import { submitRagQuery } from '../services/api';

export default function SnapView({ onSelectPrompt, setActiveTab, onViewSource }) {
  const [activeTabSub, setActiveTabSub] = useState('policy-snaps'); // 'policy-snaps' | 'calculator' | 'circular-scan'

  // Attendance Calculator State
  const [totalClasses, setTotalClasses] = useState(60);
  const [attendedClasses, setAttendedClasses] = useState(48);

  // Circular Snap State
  const [circularText, setCircularText] = useState('');
  const [snapResult, setSnapResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Calculate Attendance Stats
  const total = Math.max(1, parseInt(totalClasses, 10) || 1);
  const attended = Math.min(total, Math.max(0, parseInt(attendedClasses, 10) || 0));
  const attendancePercent = parseFloat(((attended / total) * 100).toFixed(1));

  // Safe miss or recovery count
  // If > 75%, how many more can be missed? (attended) / (total + x) >= 0.75 => x <= (attended / 0.75) - total
  const safeMisses = attendancePercent >= 75 ? Math.floor((attended / 0.75) - total) : 0;
  // If < 75%, how many consecutive to reach 75%? (attended + y) / (total + y) >= 0.75 => 0.25y >= 0.75*total - attended
  const needToAttend = attendancePercent < 75 ? Math.ceil((0.75 * total - attended) / 0.25) : 0;

  const policySnaps = [
    {
      id: 'attendance',
      badge: 'Academics • Clause 5.1',
      badgeColor: 'var(--primary)',
      title: 'Attendance & Detention Rules',
      docName: 'Academic Regulations 2025–26',
      page: 42,
      statNumber: '75%',
      statLabel: 'Mandatory Minimum Attendance',
      points: [
        'Must secure minimum 75% aggregate to write End Semester Exams.',
        '65%–74% attendance shortage condonable with Medical Cert + ₹1,500 fee.',
        'Below 65% results in strict detention with NO condonation.'
      ],
      prompt: 'What are the attendance requirements for semester examination eligibility?'
    },
    {
      id: 'hostel',
      badge: 'Hostel • Clause 3.1',
      badgeColor: 'var(--accent-purple)',
      title: 'Curfew & Night-Out Passes',
      docName: 'Hostel Rules & Code of Conduct',
      page: 8,
      statNumber: '8:30 PM',
      statLabel: 'Strict Campus Gate Lock',
      points: [
        'Biometric RFID scanning mandatory before 8:30 PM.',
        'Night-out passes require 24-hr advance portal submission & parental consent.',
        'Mess timings: Breakfast 7:30–9:00 AM | Dinner 7:30–9:15 PM.'
      ],
      prompt: 'What is the hostel gate curfew time and night out pass procedure?'
    },
    {
      id: 'placement',
      badge: 'Placements • Clause 4.1',
      badgeColor: 'var(--accent-gold)',
      title: 'One-Student-One-Job & Upgrades',
      docName: 'Training & Placement Policy 2025–26',
      page: 14,
      statNumber: '6.50',
      statLabel: 'Minimum CGPA (0 Active Backlogs)',
      points: [
        'Once placed, student is de-registered to ensure batch-wide opportunities.',
        'Dream upgrade allowed for CTC ≥ 12.0 LPA if current offer is < 7.0 LPA.',
        'Super Dream drives available for CTC > 20.0 LPA.'
      ],
      prompt: 'What is the One-Student-One-Job policy and dream offer criteria?'
    },
    {
      id: 'onduty',
      badge: 'Student Affairs • Clause 3.1',
      badgeColor: '#06b6d4',
      title: 'On-Duty (OD) Attendance Credit',
      docName: 'Leave & On-Duty (OD) Regulations',
      page: 6,
      statNumber: '10 Days',
      statLabel: 'Maximum OD per Semester',
      points: [
        'Granted for approved national hackathons, symposiums, and sports.',
        'Must apply 3 days prior with invitation brochure and HOD countersign.',
        'OD days count as present toward the 75% attendance threshold.'
      ],
      prompt: 'What is the maximum allowable On-Duty (OD) limit for hackathons?'
    },
    {
      id: 'scholarship',
      badge: 'Scholarships • Clause 2.1',
      badgeColor: 'var(--accent-emerald)',
      title: 'Merit & MCM Tuition Fee Waivers',
      docName: 'Scholarship Guidelines 2025–26',
      page: 5,
      statNumber: '50%',
      statLabel: 'Top Branch Rank Waiver',
      points: [
        'Branch Top 3 Ranks receive 50%, 35%, and 20% tuition concession.',
        'Merit-cum-Means: Family income < ₹2.5 LPA gets 40% fee waiver.',
        'Application deadline for academic year: August 31, 2025.'
      ],
      prompt: 'What are the eligibility criteria and deadline for Merit scholarships?'
    },
    {
      id: 'exams',
      badge: 'Examinations • Clause 7.1',
      badgeColor: '#ec4899',
      title: 'Revaluation & Assessment Schema',
      docName: 'Examination & Evaluation Handbook',
      page: 18,
      statNumber: '40 / 60',
      statLabel: 'Continuous Assessment vs End-Sem',
      points: [
        'CIA carries 40 marks, End Semester Exam carries 60 marks.',
        'Script Photocopy: ₹500 per subject within 10 days of results.',
        'Challenge Revaluation: ₹1,200 per subject with 3rd evaluator if delta ≥ 15.'
      ],
      prompt: 'What are the rules and fees for revaluation of exam answer scripts?'
    }
  ];

  const handleCopyQuote = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleAnalyzeNotice = async () => {
    if (!circularText.trim()) return;
    try {
      setLoadingAnalysis(true);
      const res = await submitRagQuery({ query: circularText.substring(0, 300), topK: 2 });
      if (res.sources && res.sources.length > 0) {
        const topSrc = res.sources[0];
        setSnapResult({
          title: 'Official Circular Analysis',
          urgency: 'POLICY MATCH FOUND',
          applicableRegulation: `${topSrc.documentTitle} (Section: ${topSrc.section}, Page ${topSrc.pageNumber})`,
          keyClauses: [
            `Governed by: ${topSrc.documentTitle}, Page ${topSrc.pageNumber}`,
            `Department: ${topSrc.department} (${topSrc.category})`,
            `Relevant Section: ${topSrc.section}`,
            `Match Confidence: ${topSrc.relevancePercent || Math.round(topSrc.similarityScore * 100)}%`
          ],
          suggestedQuery: `What are the rules regarding ${topSrc.section}?`
        });
      } else {
        setSnapResult({
          title: 'Notice Processed',
          urgency: 'GENERAL NOTICE',
          applicableRegulation: 'No specific restrictive college policy identified.',
          keyClauses: [
            'Processed through 384-dimensional vector retrieval',
            'No academic restrictions or penalties found in active handbooks'
          ],
          suggestedQuery: circularText.substring(0, 80)
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };


  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Banner */}
      <div className="snap-header-banner">
        <div>
          <div className="hero-pill" style={{ background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Zap size={14} />
            <span>Campus Snap • Instant Policy Digest</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
            Instant Regulations & Attendance Calculator
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '650px', marginTop: '0.35rem' }}>
            Get snapshot summaries of official college regulations without digging through lengthy handbooks, or calculate your attendance standing against the 75% rule.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            style={{ padding: '0.75rem 1.25rem' }}
            onClick={() => {
              onSelectPrompt('What are the attendance requirements for semester examination eligibility?');
              setActiveTab('chat');
            }}
          >
            <Sparkles size={16} />
            <span>Ask CampusIQ Assistant</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="snap-tabs-bar">
        <button
          className={`snap-tab-btn ${activeTabSub === 'policy-snaps' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('policy-snaps')}
        >
          <Layers size={16} />
          <span>Policy Cheat-Sheet Snaps ({policySnaps.length})</span>
        </button>

        <button
          className={`snap-tab-btn ${activeTabSub === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('calculator')}
        >
          <Calculator size={16} />
          <span>75% Attendance & Condonation Calculator</span>
        </button>

        <button
          className={`snap-tab-btn ${activeTabSub === 'circular-scan' ? 'active' : ''}`}
          onClick={() => setActiveTabSub('circular-scan')}
        >
          <Camera size={16} />
          <span>Notice / Circular Quick-Snap Scanner</span>
        </button>
      </div>

      {/* Tab 1: Policy Cheat-Sheet Snaps */}
      {activeTabSub === 'policy-snaps' && (
        <div className="snap-cards-grid animate-fade-in">
          {policySnaps.map((snap, idx) => (
            <div key={snap.id} className="snap-policy-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-elevated)',
                      color: snap.badgeColor,
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {snap.badge}
                  </span>

                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Page {snap.page}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  {snap.title}
                </h3>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                  {snap.docName}
                </p>

                {/* Big Stat Callout */}
                <div className="snap-stat-callout">
                  <span className="snap-stat-number" style={{ color: snap.badgeColor }}>
                    {snap.statNumber}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {snap.statLabel}
                  </span>
                </div>

                {/* Bullet Highlights */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.85rem 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {snap.points.map((pt, pIdx) => (
                    <li key={pIdx} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.45rem', lineHeight: 1.5 }}>
                      <span style={{ color: snap.badgeColor, fontWeight: 700, marginTop: '2px' }}>•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  onClick={() => {
                    onSelectPrompt(snap.prompt);
                    setActiveTab('chat');
                  }}
                >
                  <span>Ask Assistant</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={() => handleCopyQuote(idx, `${snap.title} (${snap.docName}, p.${snap.page}): ${snap.points.join(' ')}`)}
                  title="Copy policy summary"
                >
                  {copiedIndex === idx ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Attendance & Condonation Calculator */}
      {activeTabSub === 'calculator' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 450px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Input Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={20} color="var(--primary)" />
              <span>Attendance Condonation Calculator</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Directly grounded in <strong>Academic Regulations 2025–26 (Clause 5.1–5.3, Page 42)</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">Total Classes Conducted</label>
              <input
                type="number"
                min="1"
                max="500"
                className="form-input"
                value={totalClasses}
                onChange={e => setTotalClasses(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Classes Attended by You</label>
              <input
                type="number"
                min="0"
                max={totalClasses}
                className="form-input"
                value={attendedClasses}
                onChange={e => setAttendedClasses(e.target.value)}
              />
            </div>
          </div>


          {/* Results Analysis Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Official Regulation Status
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: attendancePercent >= 75
                    ? 'var(--accent-emerald-bg)'
                    : attendancePercent >= 65
                      ? 'var(--accent-gold-bg)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color: attendancePercent >= 75
                    ? 'var(--accent-emerald)'
                    : attendancePercent >= 65
                      ? 'var(--accent-gold)'
                      : '#ef4444'
                }}
              >
                {attendancePercent >= 75
                  ? '✓ ELIGIBLE FOR EXAMS'
                  : attendancePercent >= 65
                    ? '⚠ CONDONATION REQUIRED'
                    : '✕ DETAINED / SHORT OF ATTENDANCE'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: attendancePercent >= 75
                    ? 'var(--accent-emerald)'
                    : attendancePercent >= 65
                      ? 'var(--accent-gold)'
                      : '#ef4444'
                }}
              >
                {attendancePercent}%
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                ({attended} of {total} classes attended)
              </span>
            </div>

            {/* Visual Bar with Threshold Marks */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div className="attendance-progress-bar" style={{ height: '14px' }}>
                <div
                  className="attendance-progress-fill"
                  style={{
                    width: `${Math.min(100, attendancePercent)}%`,
                    background: attendancePercent >= 75
                      ? 'var(--accent-emerald)'
                      : attendancePercent >= 65
                        ? 'var(--accent-gold)'
                        : '#ef4444'
                  }}
                />
              </div>

              {/* Threshold Indicators */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                <span>0%</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>65% (Condonation Threshold)</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>75% (Mandatory Minimum)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Advice Breakdown */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attendancePercent >= 75 ? (
                <div>
                  <h4 style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Safe Zone: Full Examination Eligibility</span>
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    According to <strong>Clause 5.1</strong>, you meet the aggregate requirement.
                    {safeMisses > 0 ? (
                      <> You can safely miss up to <strong style={{ color: 'var(--text-main)' }}>{safeMisses} more class{safeMisses > 1 ? 'es' : ''}</strong> without dropping below the 75.0% threshold.</>
                    ) : (
                      <> You are right on the 75% boundary. Do not miss upcoming lectures.</>
                    )}
                  </p>
                </div>
              ) : attendancePercent >= 65 ? (
                <div>
                  <h4 style={{ color: 'var(--accent-gold)', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={16} />
                    <span>Warning: Condonation Application Needed</span>
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    According to <strong>Clause 5.2 (Page 42)</strong>, you are in the 65%–74% shortage bracket.
                    To be eligible for examinations, you must obtain a valid medical certificate from a Registered Medical Practitioner and pay the prescribed condonation fee of <strong>INR 1,500 per subject</strong>.
                  </p>
                  {needToAttend > 0 && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                      Tip: You must attend the next <strong>{needToAttend} consecutive classes</strong> to restore your attendance to 75.0%.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 style={{ color: '#ef4444', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={16} />
                    <span>Detention Notice: Below 65% Floor</span>
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    According to <strong>Clause 5.3 (Page 42)</strong>, candidates securing less than 65% aggregate are NOT eligible for condonation under any circumstances. You will be declared detained and must repeat the semester courses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Circular / Notice Quick-Snap Scanner */}
      {activeTabSub === 'circular-scan' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Input Box */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={20} color="var(--primary)" />
              <span>Circular & Notice Quick-Snap</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Paste circular text or notification from the notice board to instantly identify which college regulations apply.
            </p>

            <textarea
              className="form-textarea"
              rows={8}
              placeholder="Paste official notice or circular text here to analyze governing policies..."
              value={circularText}
              onChange={e => setCircularText(e.target.value)}
              style={{ fontSize: '0.86rem', lineHeight: 1.6 }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleAnalyzeNotice}
                disabled={!circularText.trim() || loadingAnalysis}
              >
                <Zap size={16} />
                <span>{loadingAnalysis ? 'Analyzing Regulations...' : 'Analyze Notice & Find Governing Policies'}</span>
              </button>
            </div>
          </div>

          {/* Analysis Snapshot Output */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <span>Policy Quick-Snap Breakdown</span>
            </h3>

            {snapResult ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {snapResult.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {snapResult.urgency}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--accent-gold)', fontWeight: 600, marginTop: '0.35rem' }}>
                    Governed by: {snapResult.applicableRegulation}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Key Extracted Clauses & Deadlines:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {snapResult.keyClauses.map((clause, cIdx) => (
                      <li key={cIdx} style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <CheckCircle2 size={14} color="var(--accent-emerald)" />
                        <span>{clause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', fontSize: '0.84rem' }}
                    onClick={() => {
                      onSelectPrompt(snapResult.suggestedQuery);
                      setActiveTab('chat');
                    }}
                  >
                    <span>Verify Full Academic Clause in Chat</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-dim)' }}>
                <Camera size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.88rem' }}>
                  Click "Load Sample College Circular" to view an instant AI regulation breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
