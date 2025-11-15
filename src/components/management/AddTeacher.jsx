// src/components/management/AddTeacher.jsx

import React, { useState } from 'react';
// Using relative path to match your other files
import { supabase } from '../../api/supabaseClient'; 

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer'];
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const SALARY_TYPES = ['Monthly', 'Hourly'];

export default function AddTeacher({ onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Monthly');
  const [joinedDate, setJoinedDate] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // --- NEW FIELDS FOR LOGIN ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckbox = (arr, setArr, value) => {
    if (arr.includes(value)) setArr(arr.filter(v => v !== value));
    else setArr([...arr, value]);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check for all fields, including new email/password
    if (!firstName || !lastName || !mobile || !address || !salary || !joinedDate || subjects.length === 0 || classes.length === 0 || !email || !password) {
      setError('Please fill out all required fields.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create the Auth User (the login)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'teacher', // Set their role in the metadata
            full_name: `${firstName} ${lastName}`
          }
        }
      });

      if (authError) throw authError;
      
      const newUserId = authData.user.id;

      // 2. Create the Teacher Profile in the 'teachers' table
      const { error: profileError } = await supabase.from('teachers').insert({
        user_id: newUserId, // Link to the auth user
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        contact: mobile,
        address,
        salary: Number(salary),
        salary_type: salaryType,
        joined_date: joinedDate,
        subjects,
        classes,
        archived: false
      });

      if (profileError) throw profileError;

      // 3. Success
      setLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();

    } catch (err) {
      // Handle errors
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <form onSubmit={handleSubmit} style={modalStyles.modal}>
        <h2 style={modalStyles.title}>Add Teacher</h2>
        
        {/* --- TEACHER'S LOGIN INFO --- */}
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Login Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Login Password *</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" style={modalStyles.input} required />
          </div>
        </div>
        {/* --- END LOGIN INFO --- */}

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
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Mobile Number *</label>
          <input value={mobile} onChange={e => setMobile(e.target.value)} style={modalStyles.input} required />
        </div>
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Address *</label>
          <input value={address} onChange={e => setAddress(e.target.value)} style={modalStyles.input} required />
        </div>
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Salary *</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} min={0} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Salary Type *</label>
            <select value={salaryType} onChange={e => setSalaryType(e.target.value)} style={modalStyles.input}>
              {SALARY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
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
                <input
                  type="checkbox"
                  checked={classes.includes(c)}
                  onChange={() => handleCheckbox(classes, setClasses, c)}
                  style={modalStyles.checkbox}
                />
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
                <input
                  type="checkbox"
                  checked={subjects.includes(sub)}
                  onChange={() => handleCheckbox(subjects, setSubjects, sub)}
                  style={modalStyles.checkbox}
                />
                {sub}
              </label>
            ))}
          </div>
        </div>
        {error && <div style={modalStyles.error}>{error}</div>}
        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.buttonRed}>Cancel</button>
          <button type="submit" disabled={loading} style={modalStyles.button}>
            {loading ? 'Saving...' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}

// These are the styles you provided
const modalStyles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '36px 30px 24px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '440px', maxWidth: '97vw', fontFamily: 'inherit', border: '1px solid #e3ebfa', maxHeight: '90vh', overflowY: 'auto' }, // Added scroll
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