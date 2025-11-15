// src/components/management/TeachersPanel.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import AddTeacher from './AddTeacher';
import ProfileUploadModal from './ProfileUploadModal';
import SalaryPaymentModal from './SalaryPaymentModal'; 

export default function TeachersPanel({ onUpdate }) {
  const [teachers, setTeachers] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [uploadTarget, setUploadTarget] = useState(null);
  const [paymentModalTeacher, setPaymentModalTeacher] = useState(null); 
  
  const [paidSalaryThisMonth, setPaidSalaryThisMonth] = useState(0);

  async function fetchTeachers() {
    setLoading(true);
    setError('');
    
    let { data: active, error: err1 } = await supabase
      .from('teachers')
      .select('*')
      .eq('archived', false)
      .order('name');
    if (err1) setError(err1.message);

    let { data: arch, error: err2 } = await supabase
      .from('teachers')
      .select('*')
      .eq('archived', true)
      .order('name');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    
    let { data: payments, error: err3 } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category', 'Salary')
      .gte('date', firstDayOfMonth);
      
    if (err3) setError(err3.message);
      
    const totalPaid = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    setPaidSalaryThisMonth(totalPaid);
    
    setTeachers(active || []);
    setArchived(arch || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function archiveTeacher(id) {
    const { error } = await supabase
      .from('teachers')
      .update({ 
        archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) setError(error.message);
    await fetchTeachers();
    onUpdate();
  }
  
  const handlePhotoUpdate = (updatedUrl) => {
    setTeachers(prev => prev.map(t => t.id === uploadTarget.id ? {...t, avatar_url: updatedUrl} : t));
    setUploadTarget(null);
  };
  
  const handlePaymentUpdate = () => {
    fetchTeachers(); 
    onUpdate(); 
  };

  return (
    <div>
      {isAddOpen &&
        <AddTeacher
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            fetchTeachers();
            onUpdate();
          }}
        />
      }
      {uploadTarget && 
        <ProfileUploadModal
          profile={`Teacher: ${uploadTarget.name}`}
          table="teachers"
          profileId={uploadTarget.id}
          onClose={() => setUploadTarget(null)}
          onUpdate={handlePhotoUpdate}
        />
      }
      {paymentModalTeacher &&
        <SalaryPaymentModal
          teacher={paymentModalTeacher}
          onClose={() => setPaymentModalTeacher(null)}
          onUpdate={handlePaymentUpdate}
        />
      }
      
      <div style={summaryStyles.row}>
        <SummaryCard label="Total Teachers" value={teachers.length} icon="👩‍🏫" />
        <SummaryCard label="Archived/Removed" value={archived.length} icon="🗃️" />
        <SummaryCard
          label="Salary Paid (This Month)"
          value={`₹${paidSalaryThisMonth}`}
          icon="💸"
        />
      </div>

      <div style={styles.topRow}>
        <h3 style={styles.heading}>All Teachers</h3>
        <button style={styles.addBtn} onClick={() => setIsAddOpen(true)}>
          + Add New Teacher
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.listWrap}>
        {loading ? <div style={styles.loading}>Loading...</div>
          : teachers.length === 0 ? <div style={styles.empty}>No active teachers. Try adding one!</div>
          : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Photo</th> 
                  <th style={styles.th}>Name (Click to Pay)</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Classes</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td style={styles.td}>
                      <button 
                        onClick={() => setUploadTarget(t)} 
                        style={styles.uploadLink}
                      >
                        {t.avatar_url ? 'View' : 'Upload'}
                      </button>
                    </td> 
                    <td style={styles.td}>
                      <button style={styles.linkBtn} onClick={() => setPaymentModalTeacher(t)}>
                        {t.name}
                      </button>
                    </td>
                    <td style={styles.td}>{t.contact}</td>
                    <td style={styles.td}>{(t.subjects || []).join(', ')}</td>
                    <td style={styles.td}>{
                      (t.classes || []).length ? t.classes.map(c => `Class ${c}`).join(', ') : ''
                    }</td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn} onClick={() => archiveTeacher(t.id)}>Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
      <h4 style={{ ...styles.heading, marginTop: 32 }}>Archived Teachers</h4>
      <div style={styles.listWrap}>
        {archived.length === 0
          ? <div style={styles.empty}>No archived teachers.</div>
          : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Subjects</th>
                  <th style={styles.th}>Classes</th>
                </tr>
              </thead>
              <tbody>
                {archived.map(t => (
                  <tr key={t.id}>
                    <td style={styles.td}>{t.name}</td>
                    <td style={styles.td}>{t.contact}</td>
                    <td style={styles.td}>{(t.subjects || []).join(', ')}</td>
                    <td style={styles.td}>{
                      (t.classes || []).length ? t.classes.map(c => `Class ${c}`).join(', ') : ''
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div style={summaryStyles.card}>
      <div style={summaryStyles.icon}>{icon}</div>
      <div style={summaryStyles.label}>{label}</div>
      <div style={summaryStyles.value}>{value}</div>
    </div>
  );
}

const summaryStyles = {
  row: { display: 'flex', gap: 22, justifyContent: 'flex-start', marginBottom: 32, flexWrap: 'wrap' },
  card: { background: '#f5f8ff', borderRadius: 14, padding: '15px 32px', boxShadow: '0 1px 8px rgba(20,50,98,0.08)', minWidth: 126, flex: 1, textAlign: 'center' },
  label: { color: '#2563eb', fontWeight: 600, fontSize: 15, marginBottom: 4 },
  value: { color: '#1d3557', fontWeight: 700, fontSize: 22, marginTop: 4, letterSpacing: '-1px' },
  icon: { fontSize: 22, marginBottom: 8 }
};

// --- STYLES (FIXED) ---
const styles = {
  topRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '24px', // <-- FIX: Increased margin
    flexWrap: 'wrap', 
    gap: '10px' 
  },
  heading: { fontWeight: 700, fontSize: '1.14rem', color: '#1d3557', marginBottom: 0, marginRight: 'auto' },
  addBtn: { background: '#2563eb', color: '#fff', borderRadius: 9, fontWeight: 600, border: 0, padding: '10px 24px', cursor: 'pointer', fontSize: 15 },
  listWrap: { 
    background: '#fff', 
    borderRadius: 12, 
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)', 
    margin: '0 0 1.5rem 0', 
    minHeight: 50, 
    padding: '0.5rem',
    overflowX: 'auto' // <-- FIX: Makes table scroll on mobile
  },
  loading: { color: '#2563eb', textAlign: 'center', margin: '36px 0' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    marginBottom: 10, 
    minWidth: '700px' // <-- FIX: Forces table to be wide
  },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb', lineHeight: 1.3 },
  actionBtn: { background: '#fef2f2', color: '#dc2626', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14 },
  error: { color: '#d32f2f', background: '#fff8f8', padding: 8, borderRadius: 6, textAlign: 'center', margin: '10px 0' },
  uploadLink: { color: '#16a34a', background: 'none', border: 0, fontWeight: 500, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' },
  linkBtn: { color: '#2563eb', background: 'none', border: 0, fontWeight: 600, fontSize: 15, textDecoration: 'underline', cursor: 'pointer', padding: 0 },
};