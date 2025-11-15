// src/components/management/FeesPanel.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabaseClient';
import PaymentModal from './PaymentModal';

// Helper to get an array of month strings (e.g., "November 2025")
function getMonthList() {
  const months = [];
  const date = new Date();
  for (let i = 0; i < 6; i++) { // Get last 6 months
    months.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    date.setMonth(date.getMonth() - 1);
  }
  return months;
}
const MONTH_LIST = getMonthList();

export default function FeesPanel({ onUpdate }) {
  const [allStudents, setAllStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LIST[0]);
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid', 'partial', 'paid'
  
  const [paymentStudent, setPaymentStudent] = useState(null); 

  async function fetchData() {
    setLoading(true);
    setError('');
    
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, grade, fee')
      .eq('archived', false);
      
    if (studentsError) {
      setError(studentsError.message);
      setAllStudents([]);
    } else {
      setAllStudents(studentsData || []);
    }

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('fee_transactions')
      .select('*')
      .eq('payment_month', selectedMonth);
      
    if (transactionsError) {
      setError(transactionsError.message);
      setTransactions([]);
    } else {
      setTransactions(transactionsData || []);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [selectedMonth]); // Refetch when month changes

  const studentPaymentStatus = useMemo(() => {
    const paid = [];
    const partial = [];
    const unpaid = [];

    const paymentMap = {};
    for (const trans of transactions) {
      paymentMap[trans.student_id] = (paymentMap[trans.student_id] || 0) + Number(trans.amount_paid);
    }
    
    for (const student of allStudents) {
      const totalPaid = paymentMap[student.id] || 0;
      const totalDue = Number(student.fee) || 0;
      
      const studentWithPayment = { ...student, totalPaid, totalDue };
      
      if (totalPaid === 0) {
        unpaid.push(studentWithPayment);
      } else if (totalPaid < totalDue) {
        partial.push(studentWithPayment);
      } else {
        paid.push(studentWithPayment);
      }
    }
    return { paid, partial, unpaid };
  }, [allStudents, transactions]);
  
  const currentList = studentPaymentStatus[activeTab] || [];
  
  const handlePaymentSuccess = () => {
    fetchData(); 
    onUpdate(); 
  };

  return (
    <div>
      {paymentStudent && (
        <PaymentModal
          student={paymentStudent}
          month={selectedMonth}
          totalDue={paymentStudent.totalDue}
          totalPaid={paymentStudent.totalPaid}
          onClose={() => setPaymentStudent(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    
      <div style={styles.filterRow}>
        <label style={styles.label}>Select Month:</label>
        <select style={styles.input} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {MONTH_LIST.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      
      <div style={styles.tabRow}>
        <button onClick={() => setActiveTab('unpaid')} style={activeTab === 'unpaid' ? styles.activeTab : styles.tab}>
          Unpaid ({studentPaymentStatus.unpaid.length})
        </button>
        <button onClick={() => setActiveTab('partial')} style={activeTab === 'partial' ? styles.activeTab : styles.tab}>
          Partial ({studentPaymentStatus.partial.length})
        </button>
        <button onClick={() => setActiveTab('paid')} style={activeTab === 'paid' ? styles.activeTab : styles.tab}>
          Paid ({studentPaymentStatus.paid.length})
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      
      {/* --- THIS IS THE FIX --- */}
      <div style={styles.responsiveTableWrapper}>
        <div style={styles.listWrap}>
          {loading ? <div style={styles.loading}>Loading...</div>
            : currentList.length === 0 ? <div style={styles.empty}>No students in this category.</div>
            : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Monthly Fee</th>
                    <th style={styles.th}>Amount Paid</th>
                    <th style={styles.th}>Amount Due</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map(student => {
                    const remaining = student.totalDue - student.totalPaid;
                    return (
                      <tr key={student.id}>
                        <td style={styles.td}>{student.name}</td>
                        <td style={styles.td}>{student.grade}</td>
                        <td style={styles.td}>₹{student.totalDue}</td>
                        <td style={{...styles.td, color: '#16a34a', fontWeight: 600}}>₹{student.totalPaid}</td>
                        <td style={{...styles.td, color: remaining > 0 ? '#dc2626' : '#16a34a', fontWeight: 600}}>
                          ₹{remaining}
                        </td>
                        <td style={styles.td}>
                          {remaining > 0 && (
                            <button 
                              style={styles.payBtn}
                              onClick={() => setPaymentStudent(student)}
                            >
                              Log Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  );
}

// --- STYLES (FIXED) ---
const styles = {
  responsiveTableWrapper: { // <-- NEW
    width: '100%',
    overflowX: 'auto',
  },
  filterRow: { display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }, // Added wrap
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginRight: 10 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', background: '#fff', color: '#22223b', outline: 'none' },
  tabRow: { display: 'flex', gap: 10, marginBottom: 22, borderBottom: '1px solid #e1e8f3', paddingBottom: 10, flexWrap: 'wrap' }, // Added wrap
  tab: { background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 16, cursor: 'pointer' },
  activeTab: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 16, cursor: 'pointer' },
  listWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: 50, padding: '0.5rem', marginBottom: '1.5rem' },
  loading: { color: '#2563eb', textAlign: 'center', margin: '36px 0' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 10, minWidth: '600px' }, // Added minWidth
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb', lineHeight: 1.3 },
  payBtn: { background: '#dcfce7', color: '#16a34a', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14 },
  error: { color: '#d32f2f', background: '#fff8f8', padding: 8, borderRadius: 6, textAlign: 'center', margin: '10px 0' }
};