// src/pages/Dashboard.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { supabase } from '../api/supabaseClient';

import ManagementDashboard from '../components/management/ManagementDashboard.jsx';
import TeacherDashboard from '../components/teacher/TeacherDashboard.jsx';
// import StudentDashboard from '../components/student/StudentDashboard.jsx';

export default function Dashboard() {
  const { user, logout, role } = useAuth();

  const renderDashboard = () => {
    switch (role) {
      case 'management':
        return <ManagementDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <div style={styles.comingSoon}>Student/Parent Dashboard (Coming Soon)</div>;
      default:
        return (
          <div style={styles.comingSoon}>
            <h3>Dashboard not found</h3>
            <p>Your user role is: <strong>{role || 'Not assigned'}</strong></p>
            <p>User ID: {user?.id}</p>
            <p>Please contact support if you believe this is an error.</p>

            {!role && (
              <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <p style={{ marginBottom: '10px', fontSize: '0.9em' }}><strong>Debug Action:</strong> Your account is missing a role.</p>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.updateUser({
                        data: { role: 'management' }
                      });
                      if (error) throw error;
                      window.location.reload();
                    } catch (e) {
                      alert('Error updating role: ' + e.message);
                    }
                  }}
                  style={{ ...styles.logoutButton, backgroundColor: 'var(--primary-600)', color: 'white', border: 'none' }}
                >
                  Assign "Management" Role & Reload
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Learnalaya</h1>
        <div style={styles.userInfo}>
          <span style={styles.emailText}>{user?.email} ({role})</span>
          <button onClick={logout} style={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        {renderDashboard()}
      </main>
    </div>
  );
}

// --- STYLES ---
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--gray-200)',
    gap: 12,
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  logo: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    fontWeight: 800,
    color: 'var(--primary-600)',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: '0 0 auto',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  emailText: {
    color: 'var(--gray-600)',
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '220px',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'var(--gray-700)',
    backgroundColor: 'var(--gray-50)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--transition-fast)',
    fontWeight: 600
  },
  // Responsive main content container
  mainContent: {
    width: '95%',
    maxWidth: '1280px',
    margin: '32px auto',
    padding: '0 16px 48px 16px',
    boxSizing: 'border-box',
    display: 'block',
  },
  comingSoon: {
    padding: '60px 20px',
    textAlign: 'center',
    fontSize: '1.2rem',
    color: 'var(--gray-500)',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--gray-200)',
    marginTop: '20px'
  }
};
