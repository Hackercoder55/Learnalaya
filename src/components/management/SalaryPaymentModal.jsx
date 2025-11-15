// src/components/management/SalaryPaymentModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function SalaryPaymentModal({ teacher, onClose, onUpdate }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get current month as string (e.g., "November 2025")
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [isPaid, setIsPaid] = useState(false);
  
  // Get the teacher's default salary from their profile
  const [amount, setAmount] = useState(teacher.salary || '');

  async function fetchHistory() {
    setLoading(true);
    setError('');
    
    // Get past 12 payments for this teacher
    const { data, error } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('teacher_id', teacher.id)
      .order('paid_at', { ascending: false })
      .limit(12);
      
    if (error) {
      setError(error.message);
    } else {
      setHistory(data || []);
      // Check if the current month is in the payment history
      if (data.some(p => p.payment_month === currentMonth)) {
        setIsPaid(true);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHistory();
  }, [teacher.id]);

  async function handlePaySalary() {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const paymentAmount = parseFloat(amount);
      
      // 1. Add record to teacher_payments
      const { error: paymentError } = await supabase
        .from('teacher_payments')
        .insert({
          teacher_id: teacher.id,
          amount_paid: paymentAmount,
          payment_month: currentMonth,
          marked_by: user.id
        });
      if (paymentError) throw paymentError;

      // 2. Add record to expenses
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          amount: paymentAmount,
          category: 'Salary',
          description: `Salary for ${teacher.name} (${currentMonth})`,
          created_by: user.id
        });
      if (expenseError) throw expenseError;

      // 3. Success
      await fetchHistory(); // Refresh the list
      onUpdate(); // Refresh the main dashboard
      
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>Salary for {teacher.name}</h2>
        
        {/* --- Pay Current Month --- */}
        <div style={modalStyles.paySection}>
          <label style={modalStyles.label}>Pay for {currentMonth}</label>
          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={modalStyles.input} 
                placeholder="Enter amount"
              />
            </div>
            <button 
              onClick={handlePaySalary} 
              disabled={loading || isPaid}
              style={isPaid ? modalStyles.buttonPaid : modalStyles.button}
            >
              {isPaid ? 'Paid' : 'Mark as Paid'}
            </button>
          </div>
        </div>
        
        {error && <div style={modalStyles.error}>{error}</div>}

        {/* --- Payment History --- */}
        <h3 style={modalStyles.subTitle}>Payment History</h3>
        <div style={modalStyles.listWrap}>
          {loading ? <div style={modalStyles.empty}>Loading...</div>
            : history.length === 0 ? <div style={modalStyles.empty}>No payment history.</div>
            : (
              <table style={modalStyles.table}>
                <thead>
                  <tr>
                    <th style={modalStyles.th}>Month</th>
                    <th style={modalStyles.th}>Amount Paid</th>
                    <th style={modalStyles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id}>
                      <td style={modalStyles.td}>{p.payment_month}</td>
                      <td style={modalStyles.tdAmount}>₹{p.amount_paid}</td>
                      <td style={modalStyles.td}>{new Date(p.paid_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.buttonRed}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Styles from your existing modals
const modalStyles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '36px 30px 24px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '440px', maxWidth: '97vw', fontFamily: 'inherit', border: '1px solid #e3ebfa' },
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 23, color: '#1d3557', textAlign: 'center', letterSpacing: '-1px' },
  subTitle: { fontWeight: 700, fontSize: '1.1rem', marginTop: 30, marginBottom: 15, color: '#1d3557' },
  paySection: { background: '#fff', border: '1px solid #bdd7fa', borderRadius: 8, padding: 15 },
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 2 },
  row: { display: 'flex', gap: 16, marginTop: 8 },
  field: { display: 'flex', flexDirection: 'column', flex: 1 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', background: '#fff', color: '#22223b', outline: 'none', boxSizing: 'border-box' },
  listWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e3ebfa', minHeight: 50, maxHeight: 200, overflowY: 'auto' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb' },
  tdAmount: { fontSize: '15px', color: '#16a34a', fontWeight: 600, padding: '9px 14px', borderBottom: '1px solid #e5e7eb' },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 24 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
  buttonPaid: { background: '#16a34a', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'not-allowed' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 23px', cursor: 'pointer' }
};