// src/components/teacher/TeacherDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import MarkAttendanceModal from './MarkAttendanceModal';
import UploadMarksModal from './UploadMarksModal';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [teacherProfile, setTeacherProfile] = useState(null);
  const [myStudents, setMyStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);

  const [contentView, setContentView] = useState('dashboard');

  const fetchTeacherProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // use maybeSingle() so it doesn't throw when no profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('teachers')
        .select('subjects, classes, avatar_url, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile load error', profileError);
        setError('Could not load your teacher profile.');
        setTeacherProfile(null);
      } else if (!profileData) {
        // no profile found yet
        setTeacherProfile(null);
        setError('No teacher profile found for your account. Please ask management to create it.');
      } else {
        setTeacherProfile(profileData);
      }

      // load students assigned to this teacher (if any)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .contains('assigned_teacher_ids', [user.id]);

      if (studentsError) {
        console.error('Students load error', studentsError);
        setError(studentsError.message || 'Could not load students.');
        setMyStudents([]);
      } else {
        setMyStudents(studentsData || []);
      }
    } catch (err) {
      console.error('Unexpected fetch error', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeacherProfile();
  }, [user, fetchTeacherProfile]);

  const filteredStudents = myStudents.filter(student => {
    const classMatch = selectedClass ? (student.classes || []).includes(selectedClass) : true;
    const subjectMatch = selectedSubject ? (student.subjects || []).includes(selectedSubject) : true;
    return classMatch && subjectMatch;
  });

  const teacherClasses = teacherProfile?.classes || [];
  const teacherSubjects = teacherProfile?.subjects || [];

  const renderContent = () => {
    if (contentView === 'chat') {
      return (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💬 Group Chat</h3>
          <div style={styles.empty}>Chat system backend is ready. Create ChatApp.jsx to enable it.</div>
        </div>
      );
    }

    return (
      <>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Filter Students</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={styles.filterLabel}>Select Class</label>
            <div style={styles.filterRow}>
              {teacherClasses.length === 0 ? (
                <div style={{ color: '#64748b' }}>No classes assigned</div>
              ) : (
                teacherClasses.map((cls) => (
                  <button key={cls} style={selectedClass === cls ? styles.filterBtnActive : styles.filterBtn} onClick={() => setSelectedClass(cls)}>
                    Class {cls}
                  </button>
                ))
              )}
              <button style={selectedClass === null ? styles.filterBtnActive : styles.filterBtn} onClick={() => setSelectedClass(null)}>All Classes</button>
            </div>
          </div>

          <div>
            <label style={styles.filterLabel}>Select Subject</label>
            <div style={styles.filterRow}>
              {teacherSubjects.length === 0 ? (
                <div style={{ color: '#64748b' }}>No subjects assigned</div>
              ) : (
                teacherSubjects.map((sub) => (
                  <button key={sub} style={selectedSubject === sub ? styles.filterBtnActive : styles.filterBtn} onClick={() => setSelectedSubject(sub)}>{sub}</button>
                ))
              )}
              <button style={selectedSubject === null ? styles.filterBtnActive : styles.filterBtn} onClick={() => setSelectedSubject(null)}>All Subjects</button>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>My Students ({filteredStudents.length} Visible)</h3>

          {loading ? (
            <div style={styles.loading}>Loading students...</div>
          ) : error ? (
            <div style={styles.error}>Error: {error}</div>
          ) : filteredStudents.length === 0 ? (
            <div style={styles.empty}>No students match your selected filters.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>All Subjects</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td style={styles.td}>
                        <Link to={`/report/student/${student.id}`} style={styles.linkStyle}>{student.name}</Link>
                      </td>
                      <td style={styles.td}>{student.grade}</td>
                      <td style={styles.td}>{student.subjects?.join(', ') || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={styles.bg}>
      {isAttendanceModalOpen && <MarkAttendanceModal myStudents={myStudents} onClose={() => { setIsAttendanceModalOpen(false); fetchTeacherProfile(); }} onSuccess={() => { setIsAttendanceModalOpen(false); fetchTeacherProfile(); }} />}
      {isMarksModalOpen && <UploadMarksModal myStudents={myStudents} onClose={() => { setIsMarksModalOpen(false); fetchTeacherProfile(); }} onSuccess={() => { setIsMarksModalOpen(false); fetchTeacherProfile(); }} />}

      <div style={styles.container}>
        <div style={styles.profileHeader}>
          <img
            src={teacherProfile?.avatar_url || 'https://via.placeholder.com/120/007bff/ffffff?text=T'}
            alt="Profile"
            style={styles.avatar}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
          />
          <div>
            <h2 style={styles.title}>👨‍🏫 Teacher Dashboard</h2>
            <p style={styles.subtitle}>Welcome, <b style={styles.email}>{teacherProfile?.name || user?.email}!</b></p>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <button style={contentView === 'dashboard' ? styles.actionButtonActive : styles.actionButton} onClick={() => setContentView('dashboard')}>Dashboard</button>
          <button style={styles.actionButton} onClick={() => setIsAttendanceModalOpen(true)}>Mark Attendance</button>
          <button style={styles.actionButton} onClick={() => setIsMarksModalOpen(true)}>Upload Marks</button>
          <button style={contentView === 'chat' ? styles.actionButtonActive : styles.actionButton} onClick={() => setContentView('chat')}>💬 Group Chat</button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

// STYLES (kept consistent and responsive)
// STYLES (kept consistent and responsive)
const styles = {
  bg: { minHeight: '100%', background: 'transparent' }, // Handled by variable.css global body
  container: {
    width: '100%',
    padding: '0',
    boxSizing: 'border-box'
  },

  profileHeader: {
    display: 'flex', alignItems: 'center', gap: 20, padding: '24px',
    backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)',
    flexWrap: 'wrap'
  },
  avatar: {
    width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
    border: '4px solid var(--primary-100)', marginRight: 16
  },
  title: { fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' },
  subtitle: { margin: '4px 0 0', color: 'var(--primary-600)', fontSize: 15, fontWeight: 500 },
  email: { color: 'var(--primary-500)' },

  actionsRow: {
    display: 'flex', gap: 12, marginTop: 24,
    background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-lg)',
    justifyContent: 'flex-start', flexWrap: 'wrap',
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)'
  },
  actionButton: {
    background: 'var(--gray-50)', color: 'var(--gray-700)', fontWeight: 600,
    borderRadius: 'var(--radius-md)', padding: '10px 20px', border: '1px solid var(--gray-200)',
    cursor: 'pointer', transition: 'all var(--transition-fast)'
  },
  actionButtonActive: {
    background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 600,
    borderRadius: 'var(--radius-md)', padding: '10px 20px', border: '1px solid var(--primary-200)',
    cursor: 'pointer', transition: 'all var(--transition-fast)'
  },

  filterLabel: { fontWeight: 600, fontSize: 14, color: 'var(--gray-700)', marginBottom: 8 },
  filterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  filterBtn: {
    background: 'var(--gray-50)', color: 'var(--gray-600)', fontWeight: 600,
    borderRadius: 'var(--radius-md)', padding: '8px 16px', border: '1px solid transparent',
    cursor: 'pointer'
  },
  filterBtnActive: {
    background: 'var(--primary-600)', color: '#fff', fontWeight: 600,
    borderRadius: 'var(--radius-md)', padding: '8px 16px', border: '1px solid transparent',
    cursor: 'pointer'
  },

  card: {
    background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24, marginTop: 24,
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)'
  },
  cardTitle: { margin: '0 0 16px 0', fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' },
  loading: { color: 'var(--primary-600)', padding: '24px 0', textAlign: 'center', fontWeight: 500 },
  error: {
    background: '#fef2f2', color: 'var(--error)', padding: 16, borderRadius: 'var(--radius-md)',
    textAlign: 'center', border: '1px solid #fee2e2'
  },
  empty: { color: 'var(--gray-500)', fontSize: 15, padding: 24, textAlign: 'center' },

  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginTop: 8 },
  th: {
    textAlign: 'left', padding: '16px', borderBottom: '2px solid var(--gray-100)',
    fontWeight: 600, color: 'var(--gray-600)', fontSize: 14
  },
  td: { padding: '16px', borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-700)' },
  linkStyle: { color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }
};
