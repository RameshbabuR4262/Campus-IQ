import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Shield,
  ArrowRight,
  School,
  Building,
  Calendar
} from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year (Semester 6)');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const departments = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics Engineering',
    'Academic Affairs',
    'Student Welfare',
    'Hostel Administration',
    'Training & Placement Cell',
    'Controller of Examinations'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim() || !password.trim()) return;

    // Calculate initials for avatar
    const nameParts = name.trim().split(' ');
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : name.trim().substring(0, 2).toUpperCase();

    const userAccount = {
      name: name.trim(),
      email: `${identifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@campusiq.edu`,
      rollNumber: identifier.trim(),
      role: role,
      department: department,
      year: role === 'student' ? year : 'Faculty / Staff',
      cgpa: role === 'student' ? 8.25 : null,
      attendanceRate: role === 'student' ? 79.5 : 98.0,
      totalClasses: role === 'student' ? 200 : 0,
      attendedClasses: role === 'student' ? 159 : 0,
      hostelResident: role === 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-204',
      avatar: initials
    };

    onLoginSuccess(userAccount);
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-crest">
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            CampusIQ Portal
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Official University Knowledge & Regulation Hub
          </p>
        </div>

        {/* Role Switcher */}
        <div className="role-switcher-tabs">
          <button
            type="button"
            className={`role-switcher-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            <User size={15} />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            className={`role-switcher-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <Shield size={15} />
            <span>Admin / Faculty</span>
          </button>
        </div>

        {/* Real Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }}>
                <User size={16} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {role === 'student' ? 'Student Roll Number / University ID' : 'Faculty / Staff Employee ID'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={role === 'student' ? 'e.g. 23CS104' : 'e.g. FAC-204'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }}>
                <School size={16} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: role === 'student' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {role === 'student' && (
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <select
                  className="form-select"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                >
                  <option value="1st Year (Semester 1 & 2)">1st Year</option>
                  <option value="2nd Year (Semester 3 & 4)">2nd Year</option>
                  <option value="3rd Year (Semester 5 & 6)">3rd Year</option>
                  <option value="4th Year (Semester 7 & 8)">4th Year</option>
                  <option value="Postgraduate (M.Tech / Ph.D)">Postgraduate</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }}>
                <Lock size={16} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Remember this session</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            <span>Sign In to CampusIQ</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
