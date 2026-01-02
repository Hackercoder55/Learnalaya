// src/components/management/StudentsPanel.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import AddStudent from './AddStudent';
import ProfileUploadModal from './ProfileUploadModal';
import { Link } from 'react-router-dom';
// 1. IMPORT THE NEW EDIT MODAL
import EditStudentModal from './EditStudentModal';

import { seedDemoStudents } from '../../utils/demoData';

export default function StudentsPanel({ onUpdate }) {
  const [students, setStudents] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. ADD STATE FOR MODALS AND SEARCH
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null); // Will hold the student to edit
  const [uploadTarget, setUploadTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);

  async function fetchStudents() {
    setLoading(true);
    setError('');
    let { data: active, error: err1 } = await supabase
      .from('students')
      .select('*')
      .eq('archived', false)
      .order('name');
    if (err1) setError(err1.message);

    let { data: arch, error: err2 } = await supabase
      .from('students')
      .select('*')
      .eq('archived', true)
      .order('name');
    setStudents(active || []);
    setArchived(arch || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  async function handleSeed() {
    if (!window.confirm('Add 5 demo students?')) return;
    setSeeding(true);
    try {
      await seedDemoStudents();
      await fetchStudents();
      onUpdate();
      alert('Demo students added!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSeeding(false);
    }
  }

  async function archiveStudent(id) {
    const { error } = await supabase
      .from('students')
      .update({
        archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) setError(error.message);
    await fetchStudents();
    onUpdate();
  }

  // 3. NEW FUNCTION TO RE-ENROLL A STUDENT
  async function unarchiveStudent(id) {
    const { error } = await supabase
      .from('students')
      .update({
        archived: false,
        archived_at: null // Clear the archived date
      })
      .eq('id', id);
    if (error) setError(error.message);
    await fetchStudents();
    onUpdate();
  }

  const getFilterStyle = (filterValue) => {
    return {
      background: selectedClass === filterValue ? '#2563eb' : '#f1f5f9',
      color: selectedClass === filterValue ? '#fff' : '#2563eb',
      borderRadius: 7,
      padding: '6px 17px',
      border: 'none',
      fontWeight: 600,
      cursor: 'pointer'
    };
  };

  const handlePhotoUpdate = (updatedUrl) => {
    setStudents(prev => prev.map(s => s.id === uploadTarget.id ? { ...s, avatar_url: updatedUrl } : s));
    setUploadTarget(null);
  };

  // 4. NEW: Filtered list for search and class
  const filteredActiveStudents = students
    .filter(s => selectedClass ? (s.classes || []).includes(selectedClass) : true)
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      {isAddOpen &&
        <AddStudent
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            fetchStudents();
            onUpdate();
          }}
        />
      }
      {/* 5. RENDER THE NEW EDIT MODAL */}
      {editStudent &&
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => {
            fetchStudents();
            setEditStudent(null);
          }}
        />
      }
      {uploadTarget &&
        <ProfileUploadModal
          profile={`Student: ${uploadTarget.name}`}
          table="students"
          profileId={uploadTarget.id}
          onClose={() => setUploadTarget(null)}
          onUpdate={handlePhotoUpdate}
        />
      }

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: 'left', flexWrap: 'wrap' }}>
        {[...Array(12)].map((_, i) =>
          <button style={getFilterStyle(i + 1)} onClick={() => setSelectedClass(i + 1)} key={i + 1}>Class {i + 1}</button>
        )}
        <button style={getFilterStyle(null)} onClick={() => setSelectedClass(null)}>All</button>
        <button style={getFilterStyle('archived')} onClick={() => setSelectedClass('archived')}>Archived</button>
      </div>

      <div style={styles.topRow}>
        <h3 style={styles.heading}>{selectedClass === 'archived' ? 'Archived Students' : 'All Active Students'}</h3>
        {/* 6. ADD THE NEW SEARCH BAR */}
        {selectedClass !== 'archived' && (
          <input
            type="text"
            placeholder="Search student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...styles.addBtn, background: '#6366f1' }} onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Adding...' : '+ Add Demo Students'}
          </button>
          <button style={styles.addBtn} onClick={() => setIsAddOpen(true)}>
            + Add New Student
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.responsiveTableWrapper}>
        {selectedClass !== 'archived' && (
          <div style={styles.listWrap}>
            {loading ? <div style={styles.loading}>Loading...</div>
              : filteredActiveStudents.length === 0 ? <div style={styles.empty}>No students match your search.</div>
                : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Photo</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Subjects</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveStudents.map(stu => (
                        <tr key={stu.id}>
                          <td style={styles.td}>
                            <button
                              onClick={() => setUploadTarget(stu)}
                              style={styles.uploadLink}
                            >
                              {stu.avatar_url ? 'View' : 'Upload'}
                            </button>
                          </td>
                          <td style={styles.td}>
                            <Link to={`/report/student/${stu.id}`} style={styles.linkBtn}>
                              {stu.name}
                            </Link>
                          </td>
                          <td style={styles.td}>{stu.classes?.join(', ') || stu.grade}</td>
                          <td style={styles.td}>{(stu.subjects || []).join(', ')}</td>
                          {/* 7. ADDED EDIT BUTTON */}
                          <td style={styles.td}>
                            <button style={styles.editBtn} onClick={() => setEditStudent(stu)}>Edit</button>
                            <button style={styles.actionBtn} onClick={() => archiveStudent(stu.id)}>Archive</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
            }
          </div>
        )}
      </div>

      <div style={styles.responsiveTableWrapper}>
        {selectedClass === 'archived' && (
          <div style={styles.listWrap}>
            {archived.length === 0
              ? <div style={styles.empty}>No archived students.</div>
              : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Class</th>
                      <th style={styles.th}>Subjects</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archived.map(stu => (
                      <tr key={stu.id}>
                        <td style={styles.td}>{stu.name}</td>
                        <td style={styles.td}>{stu.classes?.join(', ') || stu.grade}</td>
                        <td style={styles.td}>{(stu.subjects || []).join(', ')}</td>
                        {/* 8. ADDED RE-ENROLL BUTTON */}
                        <td style={styles.td}>
                          <button style={styles.reenrollBtn} onClick={() => unarchiveStudent(stu.id)}>Re-enroll</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  responsiveTableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  heading: { fontWeight: 700, fontSize: '1.14rem', color: '#1d3557', marginBottom: 0, marginRight: 'auto' },
  // 9. NEW SEARCH BAR STYLE
  searchInput: {
    padding: '8px 12px',
    fontSize: 15,
    borderRadius: 7,
    border: '1px solid #bdd7fa',
    background: '#fff',
    color: '#22223b',
    outline: 'none',
    boxSizing: 'border-box',
    minWidth: '200px',
  },
  addBtn: { background: '#2563eb', color: '#fff', borderRadius: 9, fontWeight: 600, border: 0, padding: '10px 24px', cursor: 'pointer', fontSize: 15 },
  listWrap: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    minHeight: 50,
    padding: '0.5rem',
    marginBottom: '1.5rem',
    overflowX: 'auto'
  },
  loading: { color: '#2563eb', textAlign: 'center', margin: '36px 0' },
  empty: { color: '#7a8194', textAlign: 'center', padding: '48px 10px', fontSize: 15 },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 10,
    minWidth: '600px'
  },
  th: { background: '#f8f9fa', fontWeight: 700, padding: '11px 14px', borderBottom: '2px solid #e1e8f3', fontSize: '15px', color: '#22223b', textAlign: 'left' },
  td: { fontSize: '15px', color: '#27272a', padding: '9px 14px', borderBottom: '1px solid #e5e7eb', lineHeight: 1.3, whiteSpace: 'nowrap' }, // Added nowrap
  actionBtn: { background: '#fef2f2', color: '#dc2626', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14, marginLeft: '8px' },
  editBtn: { background: '#f0f9ff', color: '#0284c7', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14 },
  reenrollBtn: { background: '#dcfce7', color: '#16a34a', fontWeight: 600, borderRadius: 7, padding: '6px 18px', border: 0, cursor: 'pointer', fontSize: 14 },
  linkBtn: { color: '#2563eb', background: 'none', border: 0, fontWeight: 600, fontSize: 15, textDecoration: 'underline', cursor: 'pointer', padding: 0 },
  error: { color: '#d32f2f', background: '#fff8f8', padding: 8, borderRadius: 6, textAlign: 'center', margin: '10px 0' },
  uploadLink: { color: '#16a34a', background: 'none', border: 0, fontWeight: 500, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }
};