// src/components/management/ManagementDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import StudentsPanel from './StudentsPanel';
import TeachersPanel from './TeachersPanel';
import FeesPanel from './FeesPanel';
import ExpensesPanel from './ExpensesPanel';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom'; 

export default function ManagementDashboard() {
  const [summaryStats, setSummaryStats] = useState({
    students: 0,
    teachers: 0,
    newStudentsMonthly: 0,
    revenueMonthly: 0, 
  });
  
  const [tab, setTab] = useState('students');
  const { logout } = useAuth(); 

  async function fetchData() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];

    const { data: students } = await supabase.from('students').select('fee').eq('archived', false);
    const { data: teachers } = await supabase.from('teachers').select('salary').eq('archived', false);
    
    const { data: newStudents } = await supabase
      .from('students')
      .select('id')
      .eq('archived', false)
      .gte('joined_date', firstDayOfMonth);
      
    const { data: paidFees } = await supabase
      .from('fee_transactions')
      .select('amount_paid')
      .gte('payment_date', firstDayOfMonth);
    
    const monthlyRevenue = (paidFees || []).reduce((sum, fee) => sum + (Number(fee.amount_paid) || 0), 0);

    setSummaryStats({
      students: students?.length || 0,
      teachers: teachers?.length || 0,
      newStudentsMonthly: newStudents?.length || 0,
      revenueMonthly: monthlyRevenue,
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const onDataUpdate = () => {
    fetchData();
  };
  
  return (
    <div style={styles.outer}> 
      
      <div style={styles.summaryRow}>
        
        <Link to="/report/students" style={summaryStyles.cardLink}>
          <div style={summaryStyles.card}>
            <div style={summaryStyles.label}>🧑‍🎓 Total Students</div>
            <div style={summaryStyles.value}>{summaryStats.students}</div>
            <div style={summaryStyles.note}>Click to see new students per month</div>
          </div>
        </Link>
        
        <div style={summaryStyles.card}>
          <div style={summaryStyles.label}>👩‍🏫 Total Teachers</div>
          <div style={summaryStyles.value}>{summaryStats.teachers}</div>
        </div>

        <Link to="/report/students" style={summaryStyles.cardLink}>
          <div style={summaryStyles.card}>
            <div style={summaryStyles.label}>📈 Students Left</div>
            <div style={summaryStyles.note}>Click to see students left per month</div>
          </div>
        </Link>
        
        <Link to="/report/revenue" style={summaryStyles.cardLink}>
          <div style={summaryStyles.card}>
            <div style={summaryStyles.label}>💵 Revenue (This Month)</div>
            <div style={summaryStyles.value}>₹{summaryStats.revenueMonthly}</div>
            <div style={summaryStyles.note}>Click to see monthly trend</div>
          </div>
        </Link>
        
      </div>

      <div style={styles.tabRow}>
        <button onClick={() => setTab('students')} style={tab === 'students' ? styles.activeTab : styles.tab}>🧑‍🎓 Students</button>
        <button onClick={() => setTab('teachers')} style={tab === 'teachers' ? styles.activeTab : styles.tab}>👩‍🏫 Teachers</button>
        <button onClick={() => setTab('fees')} style={tab === 'fees' ? styles.activeTab : styles.tab}>💳 Fees</button>
        <button onClick={() => setTab('expenses')} style={tab === 'expenses' ? styles.activeTab : styles.tab}>💸 Expenses</button>
      </div>

      <div>
        {tab === 'students' && <StudentsPanel onUpdate={onDataUpdate} />}
        {tab === 'teachers' && <TeachersPanel onUpdate={onDataUpdate} />}
        {tab === 'fees' && <FeesPanel onUpdate={onDataUpdate} />}
        {tab === 'expenses' && <ExpensesPanel onUpdate={onDataUpdate} />}
      </div>
    </div>
  );
}

// --- STYLES (FIXED) ---
const styles = {
  outer: { fontFamily: 'inherit' }, 
  summaryRow: { 
    display: 'grid',
    // This is the responsive grid, it's valid JS
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px', 
    margin: '1rem 0 2.2rem 0',
  },
  tabRow: { 
    display: 'flex', 
    gap: '10px',
    marginBottom: 18, 
    borderBottom: '1px solid #e1e8f3', 
    paddingBottom: '10px',
    flexWrap: 'wrap'
  },
  tab: { 
    background: 'none', color: '#475569', fontWeight: 700, 
    border: 0, borderBottom: '3px solid transparent', 
    borderRadius: '9px 9px 0 0', padding: '12px 20px', fontSize: 16, 
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
  },
  activeTab: { 
    background: '#fff', color: '#2563eb', fontWeight: 700, 
    border: 0, borderBottom: '3px solid #2563eb', 
    borderRadius: '9px 9px 0 0', padding: '12px 20px', fontSize: 16, 
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
    boxShadow: '0 -2px 10px rgba(38,92,181,.05)' 
  }
};

const summaryStyles = {
  cardLink: { textDecoration: 'none' },
  card: { 
    background: '#fff', padding: '24px', borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  label: {
    fontSize: 15, fontWeight: 600, color: '#4b5563',
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
  },
  value: { 
    fontSize: 32, fontWeight: 700, color: '#111827', textAlign: 'left',
  },
  note: {
    fontSize: 12, color: '#9ca3af', marginTop: '4px',
  }
};