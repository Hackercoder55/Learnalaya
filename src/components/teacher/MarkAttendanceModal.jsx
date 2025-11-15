// src/components/teacher/MarkAttendanceModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function MarkAttendanceModal({ myStudents, onClose, onSuccess }) {
  const { user } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState(null);
  
  const today = new Date().toISOString().split('T')[0]; // Current day for checking
  
  // State for date and mode
  const [selectedDate, setSelectedDate] = useState(today);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingAttendanceData, setExistingAttendanceData] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // --- NEW SECURITY CHECK ---
  const isFutureDate = selectedDate > today;
  const isPastDate = selectedDate < today;
  const canEdit = !isFutureDate; // Allow edit/update for today, but restrict submission for past days if not in update mode.
  // The submit button handles the full logic below.
  // --- END SECURITY CHECK ---

  // 1. Fetch Teacher Profile
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

  // 2. Fetch Existing Attendance (Core logic for history)
  const fetchExistingAttendance = useCallback(async (studentList) => {
    if (!selectedClass || !selectedSubject || studentList.length === 0) {
      setIsUpdateMode(false);
      setExistingAttendanceData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data: existingRecords, error: fetchError } = await supabase
      .from('attendance')
      .select('id, student_id, status')
      .eq('date', selectedDate)
      .eq('subject_name', selectedSubject)
      .eq('class_number', parseInt(selectedClass))
      .eq('marked_by_teacher_id', user.id);
      
    if (fetchError) {
      setError(fetchError.message);
    } else if (existingRecords && existingRecords.length > 0) {
      // Data FOUND: Switch to Update Mode
      setIsUpdateMode(true);
      setExistingAttendanceData(existingRecords);

      const existingAttendanceState = {};
      for (const record of existingRecords) {
        existingAttendanceState[record.student_id] = record.status;
      }
      setAttendance(existingAttendanceState);
      
    } else {
      // Data NOT FOUND: Switch to Insert Mode
      setIsUpdateMode(false);
      setExistingAttendanceData([]);
      
      // Default all to 'absent'
      const defaultAttendance = {};
      for (const student of studentList) {
        defaultAttendance[student.id] = 'absent';
      }
      setAttendance(defaultAttendance);
    }
    setLoading(false);
  }, [selectedDate, selectedClass, selectedSubject, user.id]);

  // 3. Filter Students and Trigger Fetch
  useEffect(() => {
    if (selectedClass && selectedSubject && teacherProfile) {
      const classNum = parseInt(selectedClass);
      const newFilteredStudents = myStudents.filter(s => 
        s.classes?.includes(classNum) &&
        s.subjects?.includes(selectedSubject)
      );
      
      setFilteredStudents(newFilteredStudents);
      fetchExistingAttendance(newFilteredStudents); 
    } else {
      setFilteredStudents([]);
      setLoading(false);
      setIsUpdateMode(false);
    }
  }, [selectedClass, selectedSubject, selectedDate, teacherProfile, myStudents, fetchExistingAttendance]);
  
  // 4. Handle toggling a student's status
  const toggleStatus = (studentId, status) => {
    // Only allow toggling if it's the current date
    if (selectedDate === today) {
      setAttendance(prev => ({
        ...prev,
        [studentId]: status,
      }));
    }
  };

  // 5. On submit, use INSERT or UPDATE based on mode
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // --- FINAL SECURITY CHECK ---
    if (isFutureDate) {
      setError("Cannot submit/update attendance for a future date.");
      setSubmitting(false);
      return;
    }
    
    if (isPastDate && isUpdateMode) {
        setError("ERROR: Cannot modify attendance for past dates. View only.");
        setSubmitting(false);
        return;
    }
    // --- END FINAL SECURITY CHECK ---

    const recordsToSave = filteredStudents.map(student => {
        const baseRecord = {
            student_id: student.id,
            date: selectedDate,
            status: attendance[student.id],
            subject_name: selectedSubject,
            class_number: parseInt(selectedClass),
            marked_by_teacher_id: user.id,
        };
        
        if (isUpdateMode) {
            const existing = existingAttendanceData.find(r => r.student_id === student.id);
            return { ...baseRecord, id: existing?.id }; 
        }
        return baseRecord;
    });

    if (recordsToSave.length === 0) {
      setError('No students to submit.');
      setSubmitting(false);
      return;
    }

    try {
        if (isUpdateMode) {
            // Update mode requires one UPDATE query per student record
            const updatePromises = recordsToSave.map(record => 
                supabase.from('attendance').update({ status: record.status }).eq('id', record.id)
            );
            const updateResults = await Promise.all(updatePromises);
            
            if (updateResults.some(res => res.error)) {
                throw new Error("One or more updates failed.");
            }

        } else {
            // Insert mode uses one bulk INSERT query (Only runs if date is TODAY)
            const { error: insertError } = await supabase.from('attendance').insert(recordsToSave);
            if (insertError) throw insertError;
        }
        
        onSuccess(); 
    } catch (err) {
        setError(err.message || "An unknown submission error occurred.");
    } finally {
        setSubmitting(false);
    }
  };


  return (
    <div style={styles.backdrop}>
      <form onSubmit={handleSubmit} style={styles.modal}>
        <h2 style={styles.title}>
            {isUpdateMode ? 'Review & Update Attendance' : 'Mark Attendance'}
        </h2>
        <div style={styles.dateRow}>
            <label style={styles.dateLabel}>For: </label>
            <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={styles.dateInput}
                max={today} 
            />
        </div>

        {/* --- Step 1: Select Class & Subject --- */}
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Select Class</label>
            <select 
              style={styles.input}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Choose a class --</option>
              {teacherProfile?.classes?.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Select Subject</label>
            <select 
              style={styles.input}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">-- Choose a subject --</option>
              {teacherProfile?.subjects?.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Step 2: Mark Students (shown after selection) --- */}
        {selectedClass && selectedSubject && (
          <div style={styles.studentList}>
            {loading ? (
                <p style={styles.loading}>Loading data...</p>
            ) : filteredStudents.length === 0 ? (
              <p style={styles.empty}>No students found for this group.</p>
            ) : isFutureDate ? (
              <p style={{...styles.empty, color: '#dc2626'}}>Cannot mark attendance for future dates.</p>
            ) : (
              filteredStudents.map(student => (
                <div key={student.id} style={styles.studentRow}>
                  <span style={styles.studentName}>{student.name}</span>
                  <div style={styles.toggleButtons}>
                    <button
                      type="button"
                      onClick={() => toggleStatus(student.id, 'present')}
                      style={attendance[student.id] === 'present' ? styles.presentBtnActive : styles.toggleBtn}
                      disabled={isPastDate} // <-- FIX: Disabled for past dates
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(student.id, 'absent')}
                      style={attendance[student.id] === 'absent' ? styles.absentBtnActive : styles.toggleBtn}
                      disabled={isPastDate} // <-- FIX: Disabled for past dates
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.buttonRed}>Cancel</button>
          <button 
            type="submit" 
            // Button is disabled if it's a past date OR if it's a future date
            disabled={submitting || filteredStudents.length === 0 || !selectedClass || !selectedSubject || isFutureDate || isPastDate} 
            style={styles.button}
          >
            {/* Show view only if in the past */}
            {isPastDate ? 'View Only' : submitting ? 'Saving...' : isUpdateMode ? 'Update Attendance' : 'Submit Attendance'}
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
  title: { fontWeight: 700, fontSize: '1.5rem', marginBottom: 5, color: '#1d3554', textAlign: 'center', letterSpacing: '-1px' },
  dateRow: { textAlign: 'center', marginBottom: 20 },
  dateLabel: { fontWeight: 500, color: '#4b5563', marginRight: 8, fontSize: '1rem' },
  dateInput: { 
    padding: '6px 10px', 
    fontSize: '1rem', 
    borderRadius: 7, 
    border: '1px solid #bdd7fa', 
    color: '#1d3554', 
    background: '#fff' 
  },
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
  studentRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', borderBottom: '1px solid #e3ebfa',
  },
  studentName: {
    fontSize: '16px', color: '#1d3554', fontWeight: 500,
  },
  toggleButtons: {
    display: 'flex', borderRadius: 7, overflow: 'hidden', border: '1px solid #bdd7fa',
  },
  toggleBtn: {
    background: '#fff', color: '#4b5563', border: 'none',
    padding: '6px 12px', cursor: 'pointer', fontSize: '14px',
  },
  presentBtnActive: {
    background: '#16a34a', color: '#fff', border: 'none',
    padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
  },
  absentBtnActive: {
    background: '#dc2626', color: '#fff', border: 'none',
    padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
  },
  empty: { color: '#7a8194', textAlign: 'center', padding: '30px 10px', fontSize: 15 },
  error: { color: '#d32f2f', background: '#fff9f9', borderRadius: 7, padding: '7px', margin: '12px 0', textAlign: 'center' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 11, marginTop: 24 },
  button: { background: '#2563eb', color: '#fff', fontWeight: 600, border: 0, borderRadius: 8, padding: '10px 23px', fontSize: 16, cursor: 'pointer' },
  buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 23px', cursor: 'pointer' }
};