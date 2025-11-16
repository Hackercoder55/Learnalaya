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
const styles = {
  bg: { minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe 0%, #f0fdfa 100%)', paddingTop: 28, paddingBottom: 40 },
  container: {
    width: '100%',
    maxWidth: 1000,   // allow a bit wider on desktop
    margin: '0 auto',
    padding: '36px 18px',
    boxSizing: 'border-box'
  },

  profileHeader: { display: 'flex', alignItems: 'center', gap: 20, padding: '18px', backgroundColor: '#fff', borderRadius: 14, boxShadow: '0 4px 14px rgba(16,24,40,0.04)' },
  avatar: { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0ea5e9', marginRight: 16 },
  title: { fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#0f172a' },
  subtitle: { margin: '6px 0 0', color: '#2563eb', fontSize: 15 },
  email: { color: '#0ea5e9' },

  actionsRow: { display: 'flex', gap: 12, marginTop: 18, background: '#fff', padding: 12, borderRadius: 12, justifyContent: 'center', flexWrap: 'wrap', boxShadow: '0 6px 24px rgba(16,24,40,0.03)' },
  actionButton: { background: '#f8fafc', color: '#0f172a', fontWeight: 700, borderRadius: 8, padding: '10px 16px', border: 'none', cursor: 'pointer' },
  actionButtonActive: { background: '#2563eb', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '10px 16px', border: 'none', cursor: 'pointer' },

  filterLabel: { fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 8 },
  filterRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  filterBtn: { background: '#f1f5f9', color: '#2563eb', fontWeight: 700, borderRadius: 8, padding: '8px 14px', border: 'none', cursor: 'pointer' },
  filterBtnActive: { background: '#2563eb', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 14px', border: 'none', cursor: 'pointer' },

  card: { background: '#fff', borderRadius: 12, padding: 20, marginTop: 18, boxShadow: '0 6px 24px rgba(16,24,40,0.03)' },
  cardTitle: { margin: 0, marginBottom: 14, fontWeight: 800, fontSize: 18 },
  loading: { color: '#6366f1', padding: '18px 0', textAlign: 'center' },
  error: { background: '#fff6f6', color: '#b91c1c', padding: 12, borderRadius: 8, textAlign: 'center' },
  empty: { color: '#64748b', fontSize: 15, padding: 18, textAlign: 'center' },

  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
  th: { textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #eef2ff', fontWeight: 700 },
  td: { padding: '12px 14px', borderBottom: '1px solid #f1f5f9' },
  linkStyle: { color: '#2563eb', fontWeight: 700, textDecoration: 'none' }
};
