// src/pages/StudentReportPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../hooks/useAuth';

// Helper to get an array of month strings (e.g., "November 2025")
function getMonthList(startDate) {
  if (!startDate) return [new Date().toLocaleString('default', { month: 'long', year: 'numeric' })];
  
  const months = [];
  const start = new Date(startDate);
  const today = new Date();
  
  let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDateMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  
  while (currentDate >= startDateMonth) {
    months.push(currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    currentDate.setMonth(currentDate.getMonth() - 1);
  }
  return months;
}

export default function StudentReportPage() {
  const { studentId } = useParams();
  const { role } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [monthList, setMonthList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    async function fetchStudentReport() {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          fee_transactions (*), 
          marks (*),
          attendance (id, status, date, subject_name)
        `)
        .eq('id', studentId)
        .single();
        
      if (error) {
        setError("Error fetching student details: " + error.message);
      } else {
        setStudent(data);
        const months = getMonthList(data.joined_date);
        setMonthList(months);
        setSelectedMonth(months[0]);
      }
      setLoading(false);
    }
    fetchStudentReport();
  }, [studentId]);

  // --- THIS IS THE FIX: All stats are now calculated based on selectedMonth ---
  const monthlyData = useMemo(() => {
    if (!student || !selectedMonth) {
      return {
        marks: [],
        attendance: [],
        feeStatus: {},
        performance: '0',
        attendancePercent: '0',
        totalClasses: 0,
        totalPresent: 0,
        totalAbsent: 0
      };
    }
    
    const [monthStr, yearStr] = selectedMonth.split(' ');
    const monthIndex = new Date(`${monthStr} 1, ${yearStr}`).getMonth();

    // Filter Marks for the selected month
    const marks = (student.marks || []).filter(m => {
      const markDate = new Date(m.date);
      return markDate.getMonth() === monthIndex && markDate.getFullYear() == yearStr;
    });

    // Filter Attendance for the selected month
    const attendance = (student.attendance || []).filter(a => {
      const attDate = new Date(a.date);
      return attDate.getMonth() === monthIndex && attDate.getFullYear() == yearStr;
    });

    // Calculate Performance for the month
    const totalMarks = marks.reduce((sum, m) => sum + (m.marks || 0), 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + (m.max_marks || 0), 0);
    const performance = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : '0';
    
    // Calculate Attendance for the month
    const totalClasses = attendance.length;
    const totalPresent = attendance.filter(a => a.status === 'present').length;
    const attendancePercent = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : '0';

    // Calculate Fee Status for the month
    const totalBilled = Number(student.fee) || 0;
    const totalPaid = (student.fee_transactions || [])
      .filter(t => t.payment_month === selectedMonth)
      .reduce((sum, t) => sum + Number(t.amount_paid), 0);
    const balanceDue = totalBilled - totalPaid;
    
    const feeStatus = { totalBilled, totalPaid, balanceDue };

    return { 
      marks, 
      attendance, 
      feeStatus, 
      performance, 
      attendancePercent, 
      totalClasses, 
      totalPresent, 
      totalAbsent: totalClasses - totalPresent 
    };
  }, [student, selectedMonth]);

  if (loading) return <div style={styles.loading}>Loading Student Report...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!student) return <div style={styles.empty}>Student not found.</div>;

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backButton}>&larr; Back to Dashboard</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Detailed Report for {student.name}</h1>
        <p style={styles.enrollmentInfo}>
            Grade: {student.grade} | Subjects: {(student.subjects || []).join(', ')} | Enrolled: {student.joined_date || 'N/A'}
        </p>
      </div>
      
      {/* --- MONTH SELECTOR (MOVED TO TOP) --- */}
      <div style={styles.monthSelector}>
        <label style={styles.filterLabel}>Showing Report For:</label>
        <select style={styles.monthInput} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {monthList.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      {/* --- STATS ROW (NOW SHOWS MONTHLY DATA) --- */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Performance ({selectedMonth})</div>
          <div style={styles.statValue}>{monthlyData.performance}%</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Attendance ({selectedMonth})</div>
          <div style={styles.statValue}>{monthlyData.attendancePercent}%</div>
          <div style={styles.statBreakdown}>
             Total: {monthlyData.totalClasses} • Present: {monthlyData.totalPresent} • Absent: {monthlyData.totalAbsent}
          </div>
        </div>
        
        {role === 'management' && (
          <div style={{...styles.statCard, ...styles.financeCard}}>
            <div style={styles.statLabel}>Fee Status ({selectedMonth})</div>
            <div style={styles.financeRow}>
              <span>Billed:</span>
              <span>₹{monthlyData.feeStatus.totalBilled}</span>
            </div>
            <div style={styles.financeRow}>
              <span>Paid:</span>
              <span style={{color: '#16a34a'}}>₹{monthlyData.feeStatus.totalPaid}</span>
            </div>
            <div style={{...styles.financeRow, ...styles.financeBalance}}>
              <span>Balance:</span>
              <span style={{color: monthlyData.feeStatus.balanceDue > 0 ? '#dc2626' : '#111827'}}>
                ₹{monthlyData.feeStatus.balanceDue}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- Marks History (Filtered by Month) --- */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📚 Marks History ({selectedMonth})</h2>
        <div style={styles.tableWrapper}>
          {monthlyData.marks.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Test Name</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.marks.map((mark) => (
                  <tr key={mark.id}>
                    <td style={styles.td}>{mark.test_name}</td>
                    <td style={styles.td}>{mark.subject_name}</td>
                    <td style={styles.td}>{mark.date}</td>
                    <td style={styles.td}>{mark.marks}/{mark.max_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={styles.emptyTable}>No test results recorded for this month.</p>}
        </div>
      </div>
      
      {/* --- Attendance History (Filtered by Month) --- */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📅 Recent Attendance ({selectedMonth})</h2>
        <div style={styles.tableWrapper}>
          {monthlyData.attendance.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.attendance.map((a) => (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.date}</td>
                    <td style={styles.td}>{a.subject_name}</td>
                    <td style={{...styles.td, color: a.status === 'absent' ? '#dc2626' : '#16a34a', fontWeight: 'bold'}}>
                      {a.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={styles.emptyTable}>No attendance recorded for this month.</p>}
        </div>
      </div>

    </div>
  );
}

// --- FULLY UPDATED STYLES ---
const styles = {
  page: {
    maxWidth: '900px', margin: '20px auto', padding: '30px',
    backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'system-ui, sans-serif',
  },
  backButton: {
    display: 'inline-block', marginBottom: '20px', textDecoration: 'none',
    color: '#007bff', fontWeight: '600',
  },
  header: {
    borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px',
  },
  title: {
    fontSize: '2rem', color: '#172554', marginBottom: '5px',
  },
  enrollmentInfo: {
    fontSize: '0.9rem', color: '#6b7280', marginTop: '10px',
    paddingTop: '5px', borderTop: '1px dotted #e5e7eb',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '25px',
  },
  statCard: {
    padding: '20px', borderRadius: '10px',
    backgroundColor: '#f8faff', border: '1px solid #e3ebfa',
  },
  statLabel: {
    fontSize: '14px', color: '#4b5563', marginBottom: '8px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px', fontWeight: '700', color: '#2563eb',
    textAlign: 'center',
  },
  statBreakdown: { 
    fontSize: '12px', color: '#4b5563', marginTop: '10px',
    borderTop: '1px dashed #e5e7eb', paddingTop: '8px', textAlign: 'center',
  },
  financeCard: {
    backgroundColor: '#fdfdfd',
  },
  financeRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '14px', color: '#374151',
    padding: '6px 0',
  },
  financeBalance: {
    fontWeight: '700',
    borderTop: '1px solid #e5e7eb',
    marginTop: '4px',
    paddingTop: '6px',
  },
  // --- UPDATED MONTH SELECTOR STYLES ---
  monthSelector: {
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    backgroundColor: '#f8faff', // Light background
    borderRadius: '12px',
    border: '1px solid #e3ebfa',
  },
  filterLabel: {
    fontWeight: 600, fontSize: 16, color: '#1d3557', // Darker text
  },
  monthInput: {
    padding: '8px 12px', // More padding
    fontSize: 16, // Larger font
    borderRadius: 7, 
    border: '1px solid #bdd7fa', 
    color: '#22223b',
    background: '#fff', // White background
  },
  // --- END UPDATED STYLES ---
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '1.5rem', color: '#1d3557', borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px', marginBottom: '15px',
  },
  tableWrapper: {
    width: '1D00%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
  },
  th: {
    background: '#f8f9fa', fontWeight: 700, padding: '10px 15px',
    color: '#22223b', fontSize: '14px', textAlign: 'left',
  },
  td: {
    fontSize: '14px', color: '#27272a',
    padding: '10px 15px', borderBottom: '1px solid #e5e7eb',
  },
  emptyTable: {
    color: '#7a8194', padding: '20px', textAlign: 'center',
  },
  loading: {
    textAlign: 'center', padding: '50px',
    fontSize: '18px', color: '#2563eb',
  },
  error: {
    backgroundColor: '#fff8f8', color: '#d32f2f',
    padding: '15px', borderRadius: '8px', textAlign: 'center',
  },
};