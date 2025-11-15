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

  async function getAssignedTeachers(selectedSubjects, selectedClasses) {
    if (!selectedSubjects.length || !selectedClasses.length) return [];
    let { data: teachers, error } = await supabase
      .from('teachers')
      .select('user_id, subjects, classes') // Changed id to user_id
      .eq('archived', false);
    if (error) throw new Error('Could not fetch teachers for assignment!');
    let eligible = teachers.filter(t =>
      t.subjects?.some(subject => selectedSubjects.includes(subject)) &&
      t.classes?.some(cls => selectedClasses.includes(cls))
    );
    return eligible.map(t => t.user_id); // Changed t.id to t.user_id
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!firstName || !lastName || !parentName || !parentPhone || !address || !fee || classes.length === 0 || subjects.length === 0 || !joinedDate) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }
    let assigned_teacher_ids = [];
    try {
      assigned_teacher_ids = await getAssignedTeachers(subjects, classes);
    } catch (err) {
      setError('Auto-assign error: ' + err.message);
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('students').insert({
      name: `${firstName} ${lastName}`,
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
    setLoading(false);
    if (error) setError(error.message);
    else { onSuccess && onSuccess(); onClose && onClose(); }
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
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Fee (per month) *</label>
          <input type="number" value={fee} onChange={e => setFee(e.target.value)} style={modalStyles.input} required />
        </div>
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Joined Date *</label>
          <input type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} style={modalStyles.input} required />
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
          <button type="button" onClick={onClose} style={modalStyles.buttonRed}>Cancel</button>
          <button type="submit" disabled={loading} style={modalStyles.button}>
            {loading ? 'Saving...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

const modalStyles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  // --- THIS IS THE FIX ---
  modal: { 
    background: '#f8fbff', 
    padding: '36px 30px 24px 30px', 
    borderRadius: 15, 
    boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', 
    width: '440px', 
    maxWidth: '97vw', 
    fontFamily: 'inherit', 
    border: '1px solid #e3ebfa',
    maxHeight: '90vh', // Added: ensures modal is never taller than 90% of the screen
    overflowY: 'auto' // Added: makes the modal content scrollable
  },
  // --- END OF FIX ---
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 23, color: '#1d3557', textAlign: 'center', letterSpacing: '-1px' },
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 2 },
  row: { display: 'flex', gap: 16, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 13 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', marginTop: 1, background: '#fff', color: '#22223b', outline: 'none', boxSizing: 'border-box' },
  checkGroup: { marginBottom: 17 },
  checkboxWrap: { display: 'flex', flexWrap: 'wrap', gap: 15, marginTop: 6 },
  checkboxLabel: { fontWeight: 500, fontSize: 15, color: '#234', background: '#f2f6fc', padding: '6px 13px 6px 5px', borderRadius: 6, marginBottom: 4 },
  checkbox: { marginRight: 7, accentColor: '#2563eb', verticalAlign: 'middle' },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 16 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 23px', cursor: 'pointer' }
};