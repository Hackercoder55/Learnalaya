// src/components/management/AddTeacher.jsx
import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer'];
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const SALARY_TYPES = ['Monthly', 'Hourly'];

/**
 * AddTeacher
 * - Creates an Auth user (email/password) and a teacher profile via Edge Function.
 * - Uses VITE_CREATE_TEACHER_URL (preferred). If not present, falls back to supabase.functions.invoke.
 *
 * Ensure env:
 *  VITE_CREATE_TEACHER_URL=https://<project>.supabase.co/functions/v1/create_teacher
 *  VITE_SUPABASE_ANON_KEY=<anon key>  // used only for fetch headers if calling directly
 */
export default function AddTeacher({ onClose, onSuccess }) {
  // profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Monthly');
  const [joinedDate, setJoinedDate] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckbox = (arr, setArr, value) => {
    if (arr.includes(value)) setArr(arr.filter((v) => v !== value));
    else setArr([...arr, value]);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // basic validation
    if (
      !firstName ||
      !lastName ||
      !mobile ||
      !address ||
      !salary ||
      !joinedDate ||
      subjects.length === 0 ||
      classes.length === 0 ||
      !email ||
      !password
    ) {
      setError('Please fill out all required fields (including login email & password).');
      setLoading(false);
      return;
    }

    // prepare payload
    const authData = { email, password };
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

    // prefer direct function URL if available (explicit control & debug)
    const FUNCTION_URL = import.meta.env.VITE_CREATE_TEACHER_URL || '';
    const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    try {
      let response;
      let responseText = null;
      let responseJson = null;

      if (FUNCTION_URL) {
        // Direct fetch to Edge Function (recommended for debugging)
        response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Supabase requires apikey header for function calls from client-side:
            apikey: ANON_KEY || '',
            // Authorization header optional, usually Bearer <anon> is not required for public function but ok to include
            // Authorization: `Bearer ${ANON_KEY || ''}`,
          },
          body: JSON.stringify({ teacherData, authData }),
        });

        responseText = await response.text();
        try { responseJson = JSON.parse(responseText); } catch (err) { /* not json */ }

        console.group('create_teacher direct fetch response');
        console.log('status:', response.status);
        console.log('ok:', response.ok);
        console.log('raw:', responseText);
        if (responseJson) console.log('json:', responseJson);
        console.groupEnd();

        if (!response.ok) {
          const serverMsg = (responseJson && (responseJson.error || responseJson.message)) ? (responseJson.error || responseJson.message) : responseText || `HTTP ${response.status}`;
          throw new Error(serverMsg);
        }
      } else if (supabase?.functions?.invoke) {
        // Fallback: use supabase client functions invoke
        const { data, error: fnErr } = await supabase.functions.invoke('create_teacher', {
          body: { teacherData, authData },
        });

        console.group('create_teacher supabase.functions.invoke response');
        console.log('data:', data);
        console.log('error:', fnErr);
        console.groupEnd();

        if (fnErr) throw fnErr;
        if (data && data.error) throw new Error(data.error || 'Edge function returned error');
      } else {
        throw new Error('No function URL configured and supabase.functions.invoke not available.');
      }

      // success
      setLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error('AddTeacher error:', err);
      setError(err.message || 'Edge Function returned a non-2xx status code');
      setLoading(false);
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <form onSubmit={handleSubmit} style={modalStyles.modal}>
        <h2 style={modalStyles.title}>Add Teacher</h2>

        {/* Login fields */}
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Login Email *</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={modalStyles.input}
              required
              placeholder="teacher@school.com"
            />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Login Password *</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={modalStyles.input}
              required
              placeholder="Min 6 characters"
            />
          </div>
        </div>

        <hr style={modalStyles.hr} />

        {/* Name */}
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>First Name *</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Last Name *</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={modalStyles.input} required />
          </div>
        </div>

        {/* Contact & Address */}
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Mobile Number *</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} style={modalStyles.input} required />
        </div>
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Address *</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={modalStyles.input} required />
        </div>

        {/* Salary & Type */}
        <div style={modalStyles.row}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Salary *</label>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} min={0} style={modalStyles.input} required />
          </div>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Salary Type *</label>
            <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} style={modalStyles.input}>
              {SALARY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Joined Date */}
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Joined Date *</label>
          <input type="date" value={joinedDate} onChange={(e) => setJoinedDate(e.target.value)} style={modalStyles.input} required />
        </div>

        {/* Classes */}
        <div style={modalStyles.checkGroup}>
          <label style={modalStyles.label}>Classes *</label>
          <div style={modalStyles.checkboxWrap}>
            {CLASSES.map((c) => (
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

        {/* Subjects */}
        <div style={modalStyles.checkGroup}>
          <label style={modalStyles.label}>Subjects *</label>
          <div style={modalStyles.checkboxWrap}>
            {SUBJECTS.map((sub) => (
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

        {/* Error & buttons */}
        {error && <div style={modalStyles.error}>{error}</div>}

        <div style={modalStyles.footer}>
          <button type="button" onClick={onClose} style={modalStyles.buttonRed} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={modalStyles.button}>
            {loading ? 'Saving...' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Styles (kept consistent with your app) */
const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,.10)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#f8fbff',
    padding: '26px 26px 20px 26px',
    borderRadius: 14,
    boxShadow: '0 8px 28px rgba(38, 92, 181, 0.08)',
    width: '520px',
    maxWidth: '98vw',
    fontFamily: 'inherit',
    border: '1px solid #e3ebfa',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: { fontWeight: 700, fontSize: '1.3rem', marginBottom: 18, color: '#1d3557', textAlign: 'center' },
  label: { fontWeight: 600, color: '#246bfd', fontSize: 14, marginBottom: 8, display: 'block' },
  row: { display: 'flex', gap: 12, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 12 },
  input: {
    padding: '10px 12px',
    fontSize: 15,
    borderRadius: 8,
    border: '1px solid #ddeffd',
    marginTop: 4,
    background: '#fff',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  },
  hr: { border: 'none', borderTop: '1px dashed #e6f0ff', margin: '12px 0 18px' },
  checkGroup: { marginBottom: 16 },
  checkboxWrap: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    fontSize: 14,
    color: '#25304b',
    background: '#f2f8ff',
    padding: '9px 12px',
    borderRadius: 10,
  },
  checkbox: { width: 14, height: 14, marginRight: 6 },
  error: {
    color: '#b91c1c',
    background: '#fff5f5',
    borderRadius: 8,
    padding: '10px 12px',
    margin: '10px 0',
    textAlign: 'center',
  },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 700, border: 0, borderRadius: 8, padding: '10px 20px', cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 18px', cursor: 'pointer' },
};
