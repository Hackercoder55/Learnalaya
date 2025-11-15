// src/components/management/PaymentModal.jsx

import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function PaymentModal({ student, month, totalDue, totalPaid, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const remainingDue = totalDue - totalPaid;
  
  // Form state
  const [amount, setAmount] = useState(remainingDue);
  const [method, setMethod] = useState('Online');
  const [receivedBy, setReceivedBy] = useState(user?.email || 'Management');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      setLoading(false);
      return;
    }

    try {
      // 1. Insert the new payment transaction
      const { error: insertError } = await supabase
        .from('fee_transactions')
        .insert({
          student_id: student.id,
          amount_paid: parseFloat(amount),
          payment_date: paymentDate,
          payment_month: month,
          method: method,
          received_by: receivedBy
        });
        
      if (insertError) throw insertError;
      
      // 2. Success
      onSuccess(); // This will refresh the FeesPanel
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <form onSubmit={handleSubmit} style={modalStyles.modal}>
        <h2 style={modalStyles.title}>Log Payment for {student.name}</h2>
        <h3 style={modalStyles.subtitle}>For: {month}</h3>
        
        <div style={modalStyles.dueInfo}>
          Total Fee: <b>₹{totalDue}</b> | 
          Already Paid: <b>₹{totalPaid}</b> | 
          Remaining: <b>₹{remainingDue}</b>
        </div>

        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Amount Paid *</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Payment Date *</label>
            <input value={paymentDate} onChange={e => setPaymentDate(e.target.value)} type="date" style={modalStyles.input} required />
          </div>
        </div>
        
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Method *</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={modalStyles.input}>
              <option value="Online">Online</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Received By *</label>
            <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} type="text" style={modalStyles.input} required />
          </div>
        </div>
        
        {error && <div style={modalStyles.error}>{error}</div>}
        
        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.buttonRed}>Cancel</button>
          <button type="submit" disabled={loading} style={modalStyles.button}>
            {loading ? 'Saving...' : 'Log Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Styles from your existing modals
const modalStyles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '36px 30px 24px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '440px', maxWidth: '97vw', fontFamily: 'inherit', border: '1px solid #e3ebfa' },
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 5, color: '#1d3557', textAlign: 'center', letterSpacing: '-1px' },
  subtitle: { fontWeight: 600, fontSize: '1.1rem', marginBottom: 15, color: '#2563eb', textAlign: 'center' },
  dueInfo: { fontWeight: 500, fontSize: 14, color: '#4b5563', textAlign: 'center', background: '#fff', border: '1px solid #e3ebfa', padding: '10px', borderRadius: 7, marginBottom: 20 },
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 2 },
  row: { display: 'flex', gap: 16, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 13 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', marginTop: 1, background: '#fff', color: '#22223b', outline: 'none', boxSizing: 'border-box' },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 16 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 23px', cursor: 'pointer' }
};