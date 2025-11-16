// src/components/management/AddTeacher.jsx
import React, { useState } from 'react';
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

  // Login fields
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
    setError('');
    setLoading(true);

    // required fields
    if (!firstName || !lastName || !mobile || !address || !salary || !joinedDate || subjects.length === 0 || classes.length === 0 || !email || !password) {
      setError('Please fill all required fields (including email & password).');
      setLoading(false);
      return;
    }

    const teacherData = {
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
      archived: false,
    };

    const authData = {
      email,
      password,
    };

    try {
      // Call Edge Function
      const { data, error: functionError } = await supabase.functions.invoke(
        'create_teacher',
        { body: { teacherData, authData } }
      );

      // On older CLI versions the return structure may differ; check both:
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      // success
      setLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      // better error messages
      const message = err?.message || JSON.stringify(err) || 'Failed to add teacher';
      setError(message);
      setLoading(false);
      console.error('AddTeacher error:', err);
    }
  }

  return (
    <div style={styles.backdrop}>
      <form onSubmit={handleSubmit} style={styles.modal}>
        <h2 style={styles.title}>Add Teacher</h2>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Login Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Login Password *</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" style={styles.input} required placeholder="Min. 6 chars" />
          </div>
        </div>

        <hr style={styles.hr} />

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>First Name *</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Last Name *</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} style={styles.input} required />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Mobile Number *</label>
          <input value={mobile} onChange={e => setMobile(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Address *</label>
          <input value={address} onChange={e => setAddress(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Salary *</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} min={0} style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Salary Type *</label>
            <select value={salaryType} onChange={e => setSalaryType(e.target.value)} style={styles.input}>
              {SALARY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Joined Date *</label>
          <input type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.checkGroup}>
          <label style={styles.label}>Classes *</label>
          <div style={styles.checkboxWrap}>
            {CLASSES.map(c => (
              <label key={c} style={styles.checkboxLabel}>
                <input type="checkbox" checked={classes.includes(c)} onChange={() => handleCheckbox(classes, setClasses, c)} style={styles.checkbox} />
                Class {c}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.checkGroup}>
          <label style={styles.label}>Subjects *</label>
          <div style={styles.checkboxWrap}>
            {SUBJECTS.map(sub => (
              <label key={sub} style={styles.checkboxLabel}>
                <input type="checkbox" checked={subjects.includes(sub)} onChange={() => handleCheckbox(subjects, setSubjects, sub)} style={styles.checkbox} />
                {sub}
              </label>
            ))}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.buttonRed} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading} style={styles.button}>{loading ? 'Saving...' : 'Add Teacher'}</button>
        </div>
      </form>
    </div>
  );
}

/* Styles */
// paste/replace the `const styles = { ... }` block in AddTeacher.jsx with this

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '28px 20px', borderRadius: 12, boxShadow: '0 8px 28px rgba(38,92,181,0.08)', width: 520, maxWidth: '96vw', fontFamily: 'inherit', border: '1px solid #e3ebfa', maxHeight: '90vh', overflowY: 'auto' },
  title: { fontWeight: 700, fontSize: '1.25rem', marginBottom: 14, color: '#1d3557', textAlign: 'center' },
  label: { fontWeight: 600, color: '#246bfd', fontSize: 14, marginBottom: 6, display: 'block' },
  row: { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 140 },
  input: { padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #dbeafe', marginTop: 4, background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#111827' },
  // add color to selects too
  select: { padding: '10px 12px', fontSize: 15, borderRadius: 8, border: '1px solid #dbeafe', marginTop: 4, background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#111827' },
  hr: { border: 'none', borderTop: '1px dashed #e6f0ff', margin: '14px 0' },
  checkGroup: { marginBottom: 12 },
  checkboxWrap: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, background: '#f2f7ff', padding: '8px 10px', borderRadius: 8, fontWeight: 600, color: '#111827' },
  checkbox: { width: 14, height: 14 },
  error: { color: '#b91c1c', background: '#fff1f0', borderRadius: 8, padding: 10, marginTop: 8, textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 700, border: 0, padding: '10px 18px', borderRadius: 8, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', fontWeight: 600, border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }
};

