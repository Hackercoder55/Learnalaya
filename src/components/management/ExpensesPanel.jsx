// src/components/management/ExpensesPanel.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

// Helper to get an array of month strings
function getMonthList() {
  const months = [];
  const date = new Date();
  for (let i = 0; i < 6; i++) {
    months.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    date.setMonth(date.getMonth() - 1);
  }
  return months;
}
const MONTH_LIST = getMonthList();

export default function ExpensesPanel({ onUpdate }) {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LIST[0]);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [description, setDescription] = useState('');

  async function fetchExpenses() {
    setLoading(true);
    setError('');
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .limit(300);

    if (error) setError(error.message);
    else setAllExpenses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);
  
  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return allExpenses;
    
    const [monthStr, yearStr] = selectedMonth.split(' ');
    const monthIndex = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
    
    return allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === monthIndex && expDate.getFullYear() == yearStr;
    });
  }, [allExpenses, selectedMonth]);


  async function handleAddExpense(e) {
    e.preventDefault();
    setError('');
    
    if (!amount || !category) {
      setError('Please fill in at least category and amount.');
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        amount: parseFloat(amount),
        category: category,
        description: description,
        created_by: user.id
      });

    if (error) {
      setError(error.message);
    } else {
      setAmount('');
      setDescription('');
      await fetchExpenses();
      if (onUpdate) onUpdate();
    }
  }
  
  async function deleteExpense(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
      
    if (error) {
      setError(error.message);
    } else {
      await fetchExpenses();
      if (onUpdate) onUpdate();
    }
  }

  return (
    <div>
      <h3 style={styles.heading}>Add New Expense</h3>
      <div style={styles.responsiveWrapper}>
        <form onSubmit={handleAddExpense} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Category *</label>
            <select 
              style={styles.input} 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Salary">Salary</option>
              <option value="Rent">Rent</option>
              <option value="Electricity Bill">Electricity Bill</option>
              <option value="Internet">Internet</option>
              <option value="Supplies">Supplies</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Amount (₹) *</label>
            <input 
              style={styles.input} 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="e.g., 10000"
            />
          </div>
          <div style={{...styles.field, flex: 2}}>
            <label style={styles.label}>Description</label>
            <input 
              style={styles.input} 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g., Paid salary for Anjali Sharma"
            />
          </div>
          <button type="submit" style={styles.addBtn}>Add Expense</button>
        </form>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}

      {/* --- THIS IS THE FIXED MONTH FILTER --- */}
      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>Recent Expenses For:</label>
        <select style={styles.monthInput} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {MONTH_LIST.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <div style={styles.responsiveWrapper}>
        <div style={styles.listWrap}>
          {loading ? <div style={styles.loading}>Loading...</div>
            : filteredExpenses.length === 0 ? <div style={styles.empty}>No expenses logged for {selectedMonth}.</div>
            : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={styles.td}>{exp.date}</td>
                      <td style={styles.td}>{exp.category}</td>
                      <td style={styles.td}>{exp.description}</td>
                      <td style={{...styles.td, color: '#dc2626', fontWeight: 600}}>₹{exp.amount}</td>
                      <td style={styles.td}>
                        <button style={styles.actionBtn} onClick={() => deleteExpense(exp.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
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
  responsiveWrapper: {
    width: '100%',
    overflowX: 'auto',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end',
    background: '#fff',
    padding: '20px',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    minWidth: '700px',
  },
  field: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' },
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 2 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', marginTop: 1, background: '#fff', color: '#22223b', outline: 'none', boxSizing: 'border-box' },
  heading: { fontWeight: 700, fontSize: '1.14rem', color: '#1d3557', marginBottom: '1.2rem' },
  addBtn: { background: '#2563eb', color: '#fff', borderRadius: 9, fontWeight: 600, border: 0, padding: '10px 24px', cursor: 'pointer', fontSize: 15, height: '42px' },
  listWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: 50, padding: '0.5rem' },
  loading: { color: '#2563eb', textAlign: 'center', margin: '36px 0' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 10, minWidth: '600px' },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb', lineHeight: 1.3 },
  actionBtn: { background: '#fef2f2', color: '#dc2626', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14 },
  error: { color: '#d32f2f', background: '#fff8f8', padding: 8, borderRadius: 6, textAlign: 'center', margin: '10px 0' },
  
  // --- STYLES COPIED FROM FEES PANEL ---
  filterRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontWeight: 500, 
    color: '#246bfd', 
    fontSize: 15, 
    marginRight: 10
  },
  monthInput: {
    padding: '10px 11px', 
    fontSize: 16, 
    borderRadius: 7, 
    border: '1px solid #bdd7fa', 
    background: '#fff', 
    color: '#22223b', 
    outline: 'none'
  },
};