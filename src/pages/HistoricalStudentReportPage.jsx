// src/pages/HistoricalStudentReportPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

function formatMonthYear(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoricalStudentReportPage() {
  const [newStudentData, setNewStudentData] = useState([]);
  const [leftStudentData, setLeftStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      
      // 1. Get New Students Data
      const { data: newData, error: newError } = await supabase.rpc('get_historical_stats', {
        stat_type: 'new_students' 
      });
      if (newError) setError(newError.message);
      else setNewStudentData(newData || []);
      
      // 2. Get Students Left Data
      const { data: leftData, error: leftError } = await supabase.rpc('get_historical_stats', {
        stat_type: 'left_students' 
      });
      if (leftError) setError(leftError.message);
      else setLeftStudentData(leftData || []);

      setLoading(false);
    }
    fetchReport();
  }, []);

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backButton}>&larr; Back to Dashboard</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Historical Student Report</h1>
      </div>

      <div style={styles.grid}>
        {/* --- New Students Card --- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>New Students per Month</h2>
          {loading ? <div style={styles.loading}>Loading...</div> :
           error ? <div style={styles.error}>{error}</div> :
           newStudentData.length === 0 ? <p style={styles.emptyTable}>No new student data.</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Month</th>
                  <th style={styles.th}>Students Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {newStudentData.map((row) => (
                  <tr key={row.month_start}>
                    <td style={styles.td}>{formatMonthYear(row.month_start)}</td>
                    <td style={styles.tdCount}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* --- Students Left Card --- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Students Left per Month</h2>
          {loading ? <div style={styles.loading}>Loading...</div> :
           error ? <div style={styles.error}>{error}</div> :
           leftStudentData.length === 0 ? <p style={styles.emptyTable}>No archived student data.</p> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Month</th>
                  <th style={styles.th}>Students Left</th>
                </tr>
              </thead>
              <tbody>
                {leftStudentData.map((row) => (
                  <tr key={row.month_start}>
                    <td style={styles.td}>{formatMonthYear(row.month_start)}</td>
                    <td style={styles.tdCount}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  page: { maxWidth: '1000px', margin: '20px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'system-ui, sans-serif' },
  backButton: { display: 'inline-block', marginBottom: '20px', textDecoration: 'none', color: '#007bff', fontWeight: '600' },
  header: { borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px' },
  title: { fontSize: '2rem', color: '#172554', marginBottom: '5px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.5rem', color: '#1d3557', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '10px 15px', color: '#22223b', fontSize: '14px', textAlign: 'left' },
  td: { fontSize: '14px', color: '#27272a', padding: '10px 15px', borderBottom: '1px solid #e5e7eb' },
  tdCount: { fontSize: '15px', color: '#1d3557', fontWeight: '600', padding: '10px 15px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' },
  emptyTable: { color: '#7a8194', padding: '20px', textAlign: 'center' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#2563eb' },
  error: { backgroundColor: '#fff8f8', color: '#d32f2f', padding: '15px', borderRadius: '8px', textAlign: 'center' },
};