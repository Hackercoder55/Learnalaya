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
      
      {/* --- THIS IS THE FIX --- */}
      {/* The <main> tag now controls the layout */}
      <main style={styles.mainContent}>
        {renderDashboard()}
      </main>
    </div>
  );
}

// --- FULLY CORRECTED STYLES ---
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  emailText: {
    color: '#374151',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  // --- THIS IS THE NEW STYLE THAT FIXES THE LAYOUT ---
  mainContent: {
    maxWidth: 1200, 
    margin: '28px auto', 
    padding: '0 20px 42px 20px',
  },
  comingSoon: { 
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#4b5563',
  }
};