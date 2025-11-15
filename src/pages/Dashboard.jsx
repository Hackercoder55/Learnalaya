// src/pages/Dashboard.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth.js'; 

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
        return <div style={styles.comingSoon}>Loading your dashboard...</div>;
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
    backgroundColor: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    overflowX: 'hidden', // prevent accidental horizontal overflow
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    gap: 12,
    flexWrap: 'wrap', // allow wrapping on very narrow screens
    boxSizing: 'border-box',
  },
  logo: {
    fontSize: 'clamp(18px, 3.5vw, 24px)', // responsive sizing
    fontWeight: 'bold',
    color: '#007bff',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: '0 0 auto',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  emailText: {
    color: '#374151',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '220px',
  },
  logoutButton: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Responsive main content container
  mainContent: {
    width: '95%',            // fill most of the viewport on small screens
    maxWidth: '1200px',     // but keep a comfortable max on large screens
    margin: '28px auto',
    padding: '0 12px 42px 12px',
    boxSizing: 'border-box',
    display: 'block',
  },
  comingSoon: { 
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#4b5563',
  }
};
