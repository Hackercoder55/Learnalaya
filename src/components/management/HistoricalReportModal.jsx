// src/components/management/HistoricalReportModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';

// Helper to format the date like "November 2025"
function formatMonthYear(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function HistoricalReportModal({ reportType, title, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');

      // Call the new SQL function we created
      const { data, error } = await supabase.rpc('get_historical_stats', {
        stat_type: reportType 
      });

      if (error) {
        setError(error.message);
        console.error(error);
      } else {
        setData(data);
      }
      setLoading(false);
    }

    fetchReport();
  }, [reportType]);

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>{title}</h2>
        <div style={modalStyles.listContainer}>
          {loading && <div style={modalStyles.loading}>Loading report...</div>}
          {error && <div style={modalStyles.error}>{error}</div>}
          {!loading && data.length === 0 && (
            <div style={modalStyles.empty}>No historical data found.</div>
          )}
          {!loading && data.length > 0 && (
            <table style={modalStyles.table}>
              <thead>
                <tr>
                  <th style={modalStyles.th}>Month</th>
                  <th style={modalStyles.th}>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.month_start}>
                    <td style={modalStyles.td}>{formatMonthYear(row.month_start)}</td>
                    <td style={modalStyles.tdCount}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.button}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '36px 30px 24px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '400px', maxWidth: '97vw', fontFamily: 'inherit', border: '1px solid #e3ebfa' },
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 23, color: '#1d3557', textAlign: 'center', letterSpacing: '-1px' },
  listContainer: {
    minHeight: '200px',
    maxHeight: '400px',
    overflowY: 'auto',
    border: '1px solid #e3ebfa',
    borderRadius: 8,
    background: '#fff',
  },
  loading: { color: '#2563eb', textAlign: 'center', margin: '36px 0' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb' },
  tdCount: { fontSize: '16px', color: '#1d3557', fontWeight: 700, padding: '9px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 24 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
};