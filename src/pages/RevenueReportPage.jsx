// src/pages/RevenueReportPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

// Helper to format the date like "November 2025"
function formatMonthYear(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function RevenueReportPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      
      // 1. Get Revenue Data
      const { data: revenueData, error: revenueError } = await supabase.rpc('get_historical_stats', {
        stat_type: 'monthly_revenue' 
      });
      if (revenueError) {
        setError(revenueError.message);
        setLoading(false);
        return;
      }
      
      // 2. Get Expense Data
      const { data: expenseData, error: expenseError } = await supabase.rpc('get_historical_stats', {
        stat_type: 'monthly_expense' // We need to add this to our SQL function
      });
      if (expenseError) {
        // If it fails, we add the SQL to the error message
        setError(`SQL Function 'get_historical_stats' is missing 'monthly_expense'. Please run the updated SQL query.`);
        setLoading(false);
        return;
      }
      
      // 3. Combine the data
      const combined = {};
      (revenueData || []).forEach(row => {
        combined[row.month_start] = { ...combined[row.month_start], revenue: row.count };
      });
      (expenseData || []).forEach(row => {
        combined[row.month_start] = { ...combined[row.month_start], expense: row.count };
      });
      
      const finalData = Object.keys(combined).map(month => ({
        month: month,
        revenue: combined[month].revenue || 0,
        expense: combined[month].expense || 0,
        profit: (combined[month].revenue || 0) - (combined[month].expense || 0),
      })).sort((a, b) => new Date(b.month) - new Date(a.month)); // Sort descending

      setReportData(finalData);
      setLoading(false);
    }

    fetchReport();
  }, []);

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.backButton}>&larr; Back to Dashboard</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Profit & Loss Report (Month-wise)</h1>
      </div>

      <div style={styles.section}>
        {loading && <div style={styles.loading}>Loading report...</div>}
        {error && <div style={styles.error}>{error}</div>}
        
        {!loading && reportData.length === 0 && (
          <p style={styles.emptyTable}>No financial data found.</p>
        )}
        
        {!loading && reportData.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Total Revenue</th>
                <th style={styles.th}>Total Expense</th>
                <th style={styles.th}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.month}>
                  <td style={styles.td}>{formatMonthYear(row.month)}</td>
                  <td style={styles.tdRevenue}>+ ₹{row.revenue}</td>
                  <td style={styles.tdExpense}>- ₹{row.expense}</td>
                  <td style={{
                    ...styles.tdProfit,
                    color: row.profit >= 0 ? '#16a34a' : '#dc2626'
                  }}>
                    {row.profit >= 0 ? `₹${row.profit}` : `(₹${Math.abs(row.profit)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- STYLES ---
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
  section: {
    marginBottom: '30px',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    background: '#f8f9fa', fontWeight: 700, padding: '10px 15px',
    color: '#22223b', fontSize: '14px', textAlign: 'left',
  },
  td: {
    fontSize: '14px', color: '#27272a',
    padding: '10px 15px', borderBottom: '1px solid #e5e7eb',
  },
  tdRevenue: {
    fontSize: '15px', color: '#16a34a', fontWeight: '600',
    padding: '10px 15px', borderBottom: '1px solid #e5e7eb',
  },
  tdExpense: {
    fontSize: '15px', color: '#dc2626', fontWeight: '600',
    padding: '10px 15px', borderBottom: '1px solid #e5e7eb',
  },
  tdProfit: {
    fontSize: '15px', fontWeight: '700',
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