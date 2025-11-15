// src/components/teacher/UploadMarksModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function UploadMarksModal({ myStudents, onClose, onSuccess }) {
  const { user } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState(null);
  
  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [testName, setTestName] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  
  // --- NEW: Added Test Date ---
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch the teacher's own profile
  useEffect(() => {
    async function fetchTeacherProfile() {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('subjects, classes')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        setError('Could not find your teacher profile.');
      } else {
        setTeacherProfile(data);
      }
      setLoading(false);
    }
    fetchTeacherProfile();
  }, [user.id]);

  // 2. When class or subject changes, filter the student list
  useEffect(() => {
    if (selectedClass && selectedSubject && teacherProfile) {
      const classNum = parseInt(selectedClass);
      const newFilteredStudents = myStudents.filter(s => 
        s.classes?.includes(classNum) &&
        s.subjects?.includes(selectedSubject)
      );
      setFilteredStudents(newFilteredStudents);

      const newMarks = {};
      for (const student of newFilteredStudents) {
        newMarks[student.id] = '';
      }
      setStudentMarks(newMarks);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClass, selectedSubject, myStudents, teacherProfile]);

  // 3. Handle changing a student's mark
  const handleMarkChange = (studentId, value) => {
    if (/^\d*$/.test(value)) {
      setStudentMarks(prev => ({
        ...prev,
        [studentId]: value,
      }));
    }
  };

  // 4. On submit, save all records
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!testName || maxMarks <= 0 || !testDate) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const recordsToInsert = filteredStudents
        .map(student => ({
            student_id: student.id,
            test_name: testName,
            marks: Math.min(parseInt(studentMarks[student.id] || 0), parseInt(maxMarks)), 
            max_marks: parseInt(maxMarks),
            date: testDate, // --- USE THE NEW TEST DATE ---
            subject_name: selectedSubject,
            class_number: parseInt(selectedClass),
            graded_by_teacher_id: user.id,
        }));

    if (recordsToInsert.length === 0) {
      setError('No students to mark.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('marks')
      .insert(recordsToInsert);

    if (insertError) {
      setError(insertError.message);
    } else {
      onSuccess(); // Close modal
    }
    setSubmitting(false);
  };

  if (loading) {
      return (
        <div style={styles.backdrop}>
            <div style={styles.modal}><p style={styles.loading}>Loading profile data...</p></div>
        </div>
      );
  }
  
  return (
    <div style={styles.backdrop}>
      <form onSubmit={handleSubmit} style={styles.modal}>
        <h2 style={styles.title}>Upload Marks</h2>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Test Name *</label>
            <input 
              style={styles.input}
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Unit Test 1"
              required
            />
          </div>
          {/* --- NEW TEST DATE FIELD --- */}
          <div style={{...styles.field, maxWidth: '150px'}}>
            <label style={styles.label}>Test Date *</label>
            <input 
              style={styles.input}
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Select Class</label>
            <select 
              style={styles.input}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">-- Choose a class --</option>
              {teacherProfile?.classes?.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          {/* --- FIX: "Select Subject" is now a <select> --- */}
          <div style={styles.field}>
            <label style={styles.label}>Select Subject</label>
            <select 
              style={styles.input}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
              required
            >
              <option value="">-- Choose a subject --</option>
              {teacherProfile?.subjects?.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Step 2: Enter Marks --- */}
        {selectedClass && selectedSubject && (
          <div style={styles.studentList}>
            <div style={styles.row}>
                <div style={styles.field}>
                    <label style={styles.label}>Enter Marks *</label>
                </div>
                <div style={{...styles.field, maxWidth: '120px'}}>
                    <label style={styles.label}>Max Marks *</label>
                    <input 
                        style={styles.input}
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                        min={1}
                        required
                    />
                </div>
            </div>

            {loading ? (
                <p style={styles.empty}>Loading...</p>
            ) : filteredStudents.length === 0 ? (
              <p style={styles.empty}>No students found for this group.</p>
            ) : (
                <>
                {filteredStudents.map(student => (
                    <div key={student.id} style={styles.studentRow}>
                    <span style={styles.studentName}>{student.name}</span>
                    <div style={styles.marksInputWrapper}>
                        <input
                        type="text"
                        style={styles.marksInput}
                        value={studentMarks[student.id] || ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        placeholder="Score"
                        />
                        <span style={styles.maxMarksText}> / {maxMarks}</span>
                    </div>
                    </div>
                ))}
                </>
            )}
          </div>
        )}
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.buttonRed}>Cancel</button>
          <button 
            type="submit" 
            disabled={submitting || filteredStudents.length === 0} 
            style={styles.button}
          >
            {submitting ? 'Saving...' : 'Submit Marks'}
          </button>
        </div>
      </form>
    </div>
  );
}

// These styles are based on your new modal styles
const styles = {
  backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.10)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#f8fbff', padding: '36px 30px 24px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '500px', maxWidth: '97vw', fontFamily: 'inherit', border: '1px solid #e3ebfa' },
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 20, color: '#1d3557', textAlign: 'center', letterSpacing: '-1px' },
  row: { display: 'flex', gap: 16, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 13 },
  label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 2 },
  input: { padding: '10px 11px', fontSize: 16, borderRadius: 7, border: '1px solid #bdd7fa', marginTop: 1, background: '#fff', color: '#22223b', outline: 'none', boxSizing: 'border-box' },
  studentList: {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #e3ebfa',
    borderRadius: 8,
    background: '#fff',
    marginTop: 15,
  },
  marksHeader: {
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    fontWeight: 600,
    color: '#4b5563',
    borderBottom: '1px solid #e3ebfa',
  },
  studentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #e3ebfa',
  },
  studentName: {
    fontSize: '16px',
    color: '#1d3557',
    fontWeight: 500,
  },
  marksInputWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  marksInput: {
    width: '60px',
    padding: '8px 10px',
    fontSize: 16,
    borderRadius: 7,
    border: '1px solid #bdd7fa',
    textAlign: 'center',
    color: '#22223b',
  },
  maxMarksText: {
    fontSize: '16px',
    color: '#4b5563',
    marginLeft: '8px',
  },
  empty: { color: '#7a8194', textAlign: 'center', padding: '30px 10px', fontSize: 15 },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 24 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 23px', cursor: 'pointer' },
  loading: { color: '#2563eb', textAlign: 'center', margin: '20px 0' },
};