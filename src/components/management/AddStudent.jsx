// src/components/management/AddStudent.jsx

import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer'];
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function AddStudent({ onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().substr(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckbox = (arr, setArr, value) => arr.includes(value)
    ? setArr(arr.filter(v => v !== value))
    : setArr([...arr, value]);

  // finds teachers whose subjects/classes overlap with selection and returns their user_ids
  async function getAssignedTeachers(selectedSubjects, selectedClasses) {
    if (!selectedSubjects.length || !selectedClasses.length) return [];
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('user_id, subjects, classes')
      .eq('archived', false);

    if (error) {
      throw new Error('Could not fetch teachers for assignment: ' + error.message);
    }

    const eligible = (teachers || []).filter(t =>
      (t.subjects || []).some(subject => selectedSubjects.includes(subject)) &&
      (t.classes || []).some(cls => selectedClasses.includes(cls))
    );

    return eligible.map(t => t.user_id).filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!firstName || !lastName || !parentName || !parentPhone || !address || !fee || classes.length === 0 || subjects.length === 0 || !joinedDate) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }

    let assigned_teacher_ids = [];
    try {
      assigned_teacher_ids = await getAssignedTeachers(subjects, classes);
    } catch (err) {
      setError('Auto-assign error: ' + (err.message || err));
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from('students').insert({
        name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        parent_name: parentName,
        parent_whatsapp: parentPhone,
        address,
        fee: Number(fee),
        classes,
        grade: classes.length > 0 ? `Class ${classes[0]}` : null,
        subjects,
        assigned_teacher_ids,
        joined_date: joinedDate,
        archived: false
      });

      if (insertError) {
        throw insertError;
      }

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <form onSubmit={handleSubmit} style={modalStyles.modal}>
        <h2 style={modalStyles.title}>Add Student</h2>

        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>First Name *</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Last Name *</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} style={modalStyles.input} required />
          </div>
        </div>

        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Parent Name *</label>
            <input value={parentName} onChange={e => setParentName(e.target.value)} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Parent Phone *</label>
            <input value={parentPhone} onChange={e => setParentPhone(e.target.value)} style={modalStyles.input} required />
          </div>
        </div>

        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Address *</label>
          <input value={address} onChange={e => setAddress(e.target.value)} style={modalStyles.input} required />
        </div>

        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Fee (per month) *</label>
            <input type="number" value={fee} onChange={e => setFee(e.target.value)} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Joined Date *</label>
            <input type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} style={modalStyles.input} required />
          </div>
        </div>

        <div style={modalStyles.checkGroup}>
          <label style={modalStyles.label}>Classes *</label>
          <div style={modalStyles.checkboxWrap}>
            {CLASSES.map(c => (
              <label key={c} style={modalStyles.checkboxLabel}>
                <input type="checkbox" checked={classes.includes(c)} onChange={() => handleCheckbox(classes, setClasses, c)} style={modalStyles.checkbox} />
                Class {c}
              </label>
            ))}
          </div>
        </div>

        <div style={modalStyles.checkGroup}>
          <label style={modalStyles.label}>Subjects *</label>
          <div style={modalStyles.checkboxWrap}>
            {SUBJECTS.map(sub => (
              <label key={sub} style={modalStyles.checkboxLabel}>
                <input type="checkbox" checked={subjects.includes(sub)} onChange={() => handleCheckbox(subjects, setSubjects, sub)} style={modalStyles.checkbox} />
                {sub}
              </label>
            ))}
          </div>
        </div>

        {error && <div style={modalStyles.error}>{error}</div>}

        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.buttonRed} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading} style={modalStyles.button}>{loading ? 'Saving...' : 'Add Student'}</button>
        </div>
      </form>
    </div>
  );
}

const modalStyles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: {
    background: '#f8fbff',
    padding: '28px 22px',
    borderRadius: 12,
    boxShadow: '0 8px 28px rgba(38, 92, 181, 0.08)',
    width: 'min(720px, 95vw)',
    maxWidth: '95vw',
    fontFamily: 'inherit',
    border: '1px solid #e3ebfa',
    maxHeight: '88vh',
    overflowY: 'auto'
  },
  title: { fontWeight: 700, fontSize: '1.3rem', marginBottom: 16, color: '#1d3557', textAlign: 'center' },
  label: { fontWeight: 600, color: '#246bfd', fontSize: 14, marginBottom: 6, display: 'block' },
  row: { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 8, minWidth: 120 },
  input: { padding: '10px 11px', fontSize: 15, borderRadius: 8, border: '1px solid #bdd7fa', marginTop: 4, background: '#fff', color: '#222', outline: 'none', boxSizing: 'border-box' },
  checkGroup: { marginBottom: 12 },
  checkboxWrap: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  checkboxLabel: { fontWeight: 500, fontSize: 14, color: '#234', background: '#f2f6fc', padding: '6px 10px', borderRadius: 8, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 },
  checkbox: { marginRight: 6, accentColor: '#2563eb', verticalAlign: 'middle' },
  error: { color: '#b91c1c', background: '#fff5f5', borderRadius: 8, padding: 10, margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 700, border: 0, borderRadius: 8, padding: '10px 18px', fontSize: 15, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }
};
