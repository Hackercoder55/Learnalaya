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
    
    const { data: profileData, error: profileError } = await supabase
      .from('teachers')
      .select('subjects, classes, avatar_url, name') 
      .eq('user_id', user.id)
      .single();
      
    if (profileError) {
      setError("Could not load your teacher profile.");
      console.error(profileError);
    } else {
      setTeacherProfile(profileData);
    }
    
    const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .contains('assigned_teacher_ids', [user.id]);
        
    if (studentsError) {
      setError(studentsError.message);
    } else {
      setMyStudents(studentsData || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
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
                <div style={styles.empty}>
                    Chat system backend is ready. Create the ChatApp.jsx component to proceed!
                </div>
            </div>
        );
    }

    // Default Dashboard View
    return (
        <>
            <div style={styles.card}>
            <h3 style={styles.cardTitle}>Filter Students</h3>
            <div style={{marginBottom: 16}}>
                <label style={styles.filterLabel}>Select Class</label>
                <div style={styles.filterRow}>
                {teacherClasses.map((cls) => (
                    <button
                    key={cls}
                    style={selectedClass === cls ? styles.filterBtnActive : styles.filterBtn}
                    onClick={() => setSelectedClass(cls)}
                    >
                    Class {cls}
                    </button>
                ))}
                <button
                    style={selectedClass === null ? styles.filterBtnActive : styles.filterBtn}
                    onClick={() => setSelectedClass(null)}
                >
                    All Classes
                </button>
                </div>
            </div>
            
            <div>
                <label style={styles.filterLabel}>Select Subject</label>
                <div style={styles.filterRow}>
                {teacherSubjects.map((sub) => (
                    <button
                    key={sub}
                    style={selectedSubject === sub ? styles.filterBtnActive : styles.filterBtn}
                    onClick={() => setSelectedSubject(sub)}
                    >
                    {sub}
                    </button>
                ))}
                <button
                    style={selectedSubject === null ? styles.filterBtnActive : styles.filterBtn}
                    onClick={() => setSelectedSubject(null)}
                >
                    All Subjects
                </button>
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
                                <Link to={`/report/student/${student.id}`} style={styles.linkStyle}>
                                {student.name}
                                </Link>
                            </td>
                            <td style={styles.td}>{student.grade}</td>
                            <td style={styles.td}>{student.subjects?.join(', ') || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        </>
    );
  };

  return (
    <div style={styles.bg}>
      
      {isAttendanceModalOpen && (
        <MarkAttendanceModal myStudents={myStudents} onClose={() => setIsAttendanceModalOpen(false)} onSuccess={() => setIsAttendanceModalOpen(false)} />
      )}
      
      {isMarksModalOpen && (
        <UploadMarksModal myStudents={myStudents} onClose={() => setIsMarksModalOpen(false)} onSuccess={() => setIsMarksModalOpen(false)} />
      )}


      <div style={styles.container}>
        <div style={styles.profileHeader}>
          <img 
            src={teacherProfile?.avatar_url || 'https://via.placeholder.com/80/007bff/fff?text=T'} 
            alt="Profile" 
            style={styles.avatar}
          />
          <div>
            <h2 style={styles.title}>👨‍🏫 Teacher Dashboard</h2>
            <p style={styles.subtitle}>Welcome, <b style={styles.email}>{teacherProfile?.name || user?.email}!</b></p>
          </div>
        </div>

        <div style={styles.actionsRow}>
          {/* Dashboard Tab */}
          <button 
            style={contentView === 'dashboard' ? styles.actionButtonActive : styles.actionButton}
            onClick={() => setContentView('dashboard')}
          >
            Dashboard
          </button>
          
          {/* --- THIS IS THE FIX --- */}
          {/* These are now styled as normal buttons, not active tabs */}
          <button 
            style={styles.actionButton} 
            onClick={() => setIsAttendanceModalOpen(true)}
          >
            Mark Attendance
          </button>
          <button 
            style={styles.actionButton} 
            onClick={() => setIsMarksModalOpen(true)}
          >
            Upload Marks
          </button>
          {/* --- END OF FIX --- */}
          
          {/* Group Chat Tab */}
          <button 
            style={contentView === 'chat' ? styles.actionButtonActive : styles.actionButton}
            onClick={() => setContentView('chat')}
          >
            💬 Group Chat
          </button>
        </div>

        {renderContent()}
        
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  bg: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe 0%, #f0fdfa 100%)', paddingTop: '36px',
  },
  container: {
    maxWidth: '800px', margin: '0 auto', padding: '36px 24px',
  },
  profileHeader: {
    display: 'flex', alignItems: 'center', marginBottom: '32px', padding: '16px 24px', 
    backgroundColor: '#fff', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  avatar: {
    width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #007bff', marginRight: '24px',
  },
  title: {
    fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '4px', color: '#17254d',
  },
  subtitle: {
    fontSize: '1rem', color: '#3b82f6',
  },
  email: { color: '#0ea5e9' },
  actionsRow: {
    display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24,
    backgroundColor: '#fff', padding: '10px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
  },
  actionButton: { // Default Tab/Action Style (Not Selected)
    background: '#f1f5f9', color: '#17254d', fontWeight: 600,
    borderRadius: 8, padding: '12px 18px', border: 'none',
    cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
  },
  actionButtonActive: { // Active Tab Style
    background: '#2563eb', color: '#fff', fontWeight: 600,
    borderRadius: 8, padding: '12px 18px', border: 'none',
    cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
  },
  // REMOVED the 'actionButtonPrimary' as it was causing confusion
  filterLabel: {
    fontWeight: 600, fontSize: 14, color: '#4b5563', display: 'block', marginBottom: 8
  },
  filterRow: {
    display: 'flex', gap: 12, justifyContent: 'flex-start', flexWrap: 'wrap'
  },
  filterBtn: {
    background: "#f1f5f9", color: "#2563eb", fontWeight: 600, borderRadius: 8, padding: "8px 18px", border: "none", cursor: 'pointer'
  },
  filterBtnActive: {
    background: "#2563eb", color: "#fff", fontWeight: 600, borderRadius: 8, padding: "8px 18px", border: "none", cursor: 'pointer'
  },
  card: {
    background: '#fff', borderRadius: '18px',
    boxShadow: '0 2px 13px rgba(0,0,0,.09), 0 4px 20px 0 rgba(59, 130, 246, 0.05)',
    padding: '24px 22px 10px 22px', marginTop: '16px',
    minHeight: '210px'
  },
  cardTitle: {
    fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: '20px', letterSpacing: '-0.5px'
  },
  loading: {
    color: '#6366f1', padding: '28px 0', textAlign: 'center'
  },
  error: {
    background: '#ffecdb', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px', textAlign: 'center'
  },
  empty: {
    color: '#64748b', fontSize: '1rem', padding: '28px 0', textAlign: 'center'
  },
  table: {
    width: '100%', borderCollapse: 'collapse', marginBottom: '16px'
  },
  th: {
    backgroundColor: '#f1f5f9', fontWeight: 700, padding: '11px 14px', color: '#22223b', borderBottom: '2px solid #ccc', fontSize: '14px', textAlign: 'left'
  },
  td: {
    fontSize: '15px', color: '#27272a', padding: '10px 14px', borderBottom: '1px solid #e5e7eb'
  },
  linkStyle: { 
    color: '#2563eb', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: 'inherit',
  }
};