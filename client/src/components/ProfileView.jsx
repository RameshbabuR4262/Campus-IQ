import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Award,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Briefcase,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  Edit3,
  X,
  Save
} from 'lucide-react';

export default function ProfileView({ user, onLogout, onUpdateUser, setActiveTab, onSelectPrompt }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user || {});

  if (!user) return null;

  const isStudent = user.role === 'student';

  const handleStartEdit = () => {
    setEditForm({ ...user });
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const total = Math.max(1, parseInt(editForm.totalClasses, 10) || 1);
    const attended = Math.min(total, Math.max(0, parseInt(editForm.attendedClasses, 10) || 0));
    const rate = parseFloat(((attended / total) * 100).toFixed(1));

    const updated = {
      ...editForm,
      totalClasses: total,
      attendedClasses: attended,
      attendanceRate: isStudent ? rate : user.attendanceRate,
      cgpa: editForm.cgpa ? parseFloat(parseFloat(editForm.cgpa).toFixed(2)) : null
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditing(false);
  };

  const bookmarkedRules = [
    {
      title: 'Mandatory Minimum Attendance (75%)',
      doc: 'Academic Regulations 2025–26',
      page: 42,
      section: 'Attendance Requirements',
      query: 'What are the attendance requirements for semester examination eligibility?'
    },
    {
      title: 'Hostel Curfew & Biometric Gate Rules',
      doc: 'Hostel Rules & Code of Conduct 2025–26',
      page: 8,
      section: 'Timings and Night Passes',
      query: 'What is the hostel gate curfew time and night out pass procedure?'
    },
    {
      title: 'One-Student-One-Job & Dream Upgrades',
      doc: 'Training & Placement Policy 2025–26',
      page: 14,
      section: 'Job Offer Policies',
      query: 'What is the One-Student-One-Job policy and dream offer criteria?'
    },
    {
      title: 'Event On-Duty (OD) 10-Day Limit',
      doc: 'Leave & On-Duty (OD) Regulations',
      page: 6,
      section: 'On-Duty Leave Quota',
      query: 'What is the maximum allowable On-Duty (OD) limit for hackathons?'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Student ID Card Banner */}
      <div className="profile-hero-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="profile-avatar-big">
            {user.avatar || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
                {user.name}
              </h2>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: isStudent ? 'var(--primary-glow)' : 'var(--accent-purple-bg)',
                  color: isStudent ? 'var(--primary)' : 'var(--accent-purple)',
                  border: '1px solid currentColor'
                }}
              >
                {isStudent ? 'Enrolled Student' : 'Faculty Administrator'}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {user.department} • {user.year}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <span>ID: <strong style={{ color: 'var(--text-main)' }}>{user.rollNumber}</strong></span>
              <span>•</span>
              <span>Email: <strong style={{ color: 'var(--text-main)' }}>{user.email}</strong></span>
              {user.hostelResident && (
                <>
                  <span>•</span>
                  <span>Hostel: <strong style={{ color: 'var(--text-main)' }}>{user.roomNumber} ({user.hostelBlock})</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={handleStartEdit}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.84rem' }}
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onLogout}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.84rem' }}
          >
            <LogOut size={15} color="#ef4444" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Academic Standing Metrics (for Students) */}
      {isStudent && (
        <>
          <div className="profile-metrics-grid">
            {/* Attendance Tracker */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Semester Attendance (Clause 5.1)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: user.attendanceRate >= 75 ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>
                      {user.attendanceRate}%
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      ({user.attendedClasses} / {user.totalClasses} classes)
                    </span>
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="attendance-progress-bar">
                <div
                  className="attendance-progress-fill"
                  style={{
                    width: `${Math.min(100, user.attendanceRate)}%`,
                    background: user.attendanceRate >= 75 ? 'var(--accent-emerald)' : 'var(--accent-gold)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                <span>Required: <strong>75.0%</strong></span>
                <span style={{ color: user.attendanceRate >= 75 ? 'var(--accent-emerald)' : 'var(--accent-gold)', fontWeight: 600 }}>
                  {user.attendanceRate >= 75 ? '✓ Safe for End-Semester Exam' : '⚠ In Condonation Zone'}
                </span>
              </div>
            </div>

            {/* CGPA & Academic Standing */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Cumulative GPA (10-Point Scale)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {user.cgpa || 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      / 10.00
                    </span>
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} />
                </div>
              </div>

              <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginTop: '0.75rem', fontWeight: 600 }}>
                Grade Evaluation: <strong style={{ color: 'var(--primary)' }}>
                  {user.cgpa >= 8.5 ? 'A+ (Excellent)' : user.cgpa >= 7.5 ? 'A (Very Good)' : 'B+ (Good)'}
                </strong>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Academic Regulations 2025–26 (Page 43)
              </div>
            </div>

            {/* Placement & Internship Readiness */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Campus Placement Status
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: (user.cgpa || 0) >= 6.5 ? 'var(--accent-gold)' : 'var(--text-dim)', marginTop: '0.35rem' }}>
                    {(user.cgpa || 0) >= 6.5 ? 'Tier-1 Dream Eligible' : 'Standard Placement Track'}
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {(user.cgpa || 0) >= 6.5
                  ? 'Meets 6.50 CGPA cutoff. Eligible for dream company recruitment drives.'
                  : 'Maintain above 6.50 CGPA to qualify for Tier-1 dream company drives.'}
              </div>
            </div>

            {/* Hostel Status */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                    Hostel Gate & Curfew
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.35rem' }}>
                    Curfew 8:30 PM
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                {user.hostelResident ? `Room ${user.roomNumber} (${user.hostelBlock})` : 'Day Scholar'} • Biometric gate check enforced.
              </div>
            </div>
          </div>

          {/* Bookmarked College Regulations Section */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bookmark size={18} color="var(--primary)" />
                  <span>Bookmarked College Policies & Quick Inquiries</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Frequently referenced regulations and official clauses
                </p>
              </div>

              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setActiveTab('snap')}
              >
                <span>View Campus Snap Cards</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {bookmarkedRules.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.doc} • p.{item.page}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.35rem 0', color: 'var(--text-main)' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Section: {item.section}
                    </p>
                  </div>

                  <button
                    className="question-chip-btn"
                    style={{ marginTop: '0.85rem', width: '100%', justifyContent: 'space-between', fontSize: '0.78rem' }}
                    onClick={() => {
                      onSelectPrompt(item.query);
                      setActiveTab('chat');
                    }}
                  >
                    <span>Ask CampusIQ Assistant</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Administrator View */}
      {!isStudent && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Faculty & Administrator Controls
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Manage university regulations, upload newly approved circulars, and monitor student queries.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setActiveTab('documents')}>
              <FileText size={16} />
              <span>Upload New Circular / Policy</span>
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab('analytics')}>
              <Building size={16} />
              <span>View Query Audit Analytics</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Edit Profile & Academic Details</h3>
              <button className="icon-btn" onClick={() => setIsEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">ID / Roll Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.rollNumber || ''}
                    onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.year || ''}
                    onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                  />
                </div>
              </div>

              {isStudent && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Total Classes</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={editForm.totalClasses || ''}
                        onChange={e => setEditForm({ ...editForm, totalClasses: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Classes Attended</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editForm.attendedClasses || ''}
                        onChange={e => setEditForm({ ...editForm, attendedClasses: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Cumulative GPA (CGPA)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="form-input"
                        value={editForm.cgpa || ''}
                        onChange={e => setEditForm({ ...editForm, cgpa: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hostel Room</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.roomNumber || ''}
                        onChange={e => setEditForm({ ...editForm, roomNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={15} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
