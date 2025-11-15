// src/components/management/AssignTeacherModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';

export default function AssignTeacherModal({ student, onClose, onSuccess }) {
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 1. Initialize state with the student's *currently* assigned teachers
  const [selectedTeacherIds, setSelectedTeacherIds] = useState(student.assigned_teacher_ids || []);

  // 2. Fetch all teachers from the 'teachers' table
  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true);
      // We only need the teacher's name and their AUTH user_id
      const { data, error } = await supabase.from('teachers').select('name, user_id');
      if (error) {
        setError(error.message);
      } else {
        setAllTeachers(data);
      }
      setLoading(false);
    }
    fetchTeachers();
  }, []);

  // 3. Handle clicking a teacher's checkbox
  const handleToggleTeacher = (teacherUserId) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherUserId)
        ? prev.filter((id) => id !== teacherUserId) // Remove ID
        : [...prev, teacherUserId] // Add ID
    );
  };

  // 4. On submit, update the 'students' table
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('students')
        .update({ assigned_teacher_ids: selectedTeacherIds }) // Set the new array of IDs
        .eq('id', student.id); // For this specific student

      if (error) throw error;

      onSuccess(); // Refresh the main dashboard (optional)
      onClose();   // Close the modal

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2 style={styles.title}>Assign Teachers for</h2>
        <h3 style={styles.subtitle}>{student.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.teacherList}>
            {loading && <p style={styles.loadingText}>Loading teachers...</p>}
            {error && <p style={styles.error}>{error}</p>}
            
            {allTeachers.map((teacher) => (
              <label 
                key={teacher.user_id} 
                style={
                  selectedTeacherIds.includes(teacher.user_id)
                    ? { ...styles.checkboxLabel, ...styles.checkboxLabelSelected }
                    : styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  style={styles.hiddenCheckbox}
                  checked={selectedTeacherIds.includes(teacher.user_id)}
                  onChange={() => handleToggleTeacher(teacher.user_id)}
                />
                {teacher.name}
              </label>
            ))}
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.buttonSecondary} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- STYLES (WITH TEXT COLORS) ---
// src/components/management/AssignTeacherModal.jsx

// ... (keep all the component code at the top)

// --- STYLES (WITH TEXT COLORS) ---
const styles = {
    modalOverlay: {
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white', padding: '24px 32px', borderRadius: '8px',
      width: '500px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    title: {
      fontSize: '22px', fontWeight: '600', marginBottom: '4px',
      textAlign: 'center', color: '#111827',
    },
    subtitle: {
      fontSize: '18px', fontWeight: '500', marginBottom: '24px',
      textAlign: 'center', color: '#007bff',
    },
    teacherList: {
      display: 'flex', flexDirection: 'column', gap: '10px',
      maxHeight: '300px', overflowY: 'auto', padding: '8px',
      border: '1px solid #e5e7eb', borderRadius: '6px',
    },
    loadingText: { color: '#4b5563', textAlign: 'center' },
    hiddenCheckbox: {
      opacity: 0, position: 'absolute', width: 0, height: 0,
    },
    checkboxLabel: {
      display: 'block', fontSize: '14px', padding: '12px 16px',
      border: '1px solid #d1d5db', borderRadius: '6px',
      cursor: 'pointer', transition: 'all 0.2s ease',
      textAlign: 'left', color: '#374151',
    },
    checkboxLabelSelected: {
      borderColor: '#007bff', backgroundColor: '#f0f7ff',
      fontWeight: '600', color: '#0056b3',
    },
    buttonGroup: {
      display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px',
    },
    buttonPrimary: {
      padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#fff',
      backgroundColor: '#007bff', border: 'none', borderRadius: '6px', cursor: 'pointer',
    },
    buttonSecondary: {
      padding: '10px 16px', fontSize: '14px', fontWeight: '600',
      color: '#374151', // <--- THIS IS THE FIX
      backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer',
    },
    error: { color: '#dc2626', fontSize: '14px', textAlign: 'center' },
  };