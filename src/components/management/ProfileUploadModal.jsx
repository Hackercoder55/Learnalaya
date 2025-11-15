// src/components/management/ProfileUploadModal.jsx

import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileUploadModal({ profile, table, profileId, onClose, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth(); // Ensure only management can upload

  async function uploadAvatar(event) {
    if (!user || !event.target.files || event.target.files.length === 0) {
      setError('Please select an image to upload.');
      return;
    }
    if (user.user_metadata.role !== 'management') {
      setError('Only Management can upload photos.');
      return;
    }

    setUploading(true);
    setError('');

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    // Unique path: table/profileId/timestamp.ext
    const filePath = `${table}/${profileId}.${fileExt}`; 

    try {
      // 1. Upload the file to the 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update the target table (teachers or students) with the new URL
      const { error: updateError } = await supabase
        .from(table)
        .update({ avatar_url: publicUrl })
        .eq('id', profileId); // Update the row where ID matches profileId

      if (updateError) throw updateError;

      // 4. Success
      onUpdate(publicUrl); // Re-fetch data in the parent component
      onClose();

    } catch (err) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Upload Photo for {profile}</h2>

        <div style={styles.field}>
          <label style={styles.label}>Select Image:</label>
          <input 
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            style={styles.fileInput}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {uploading && <div style={styles.loading}>Uploading...</div>}

        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.buttonRed} disabled={uploading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.30)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#f8fbff', padding: '36px 30px', borderRadius: 15, boxShadow: '0 8px 28px rgba(38, 92, 181, 0.11)', width: '350px', fontFamily: 'inherit', border: '1px solid #e3ebfa' },
    title: { fontWeight: 700, fontSize: '1.2rem', marginBottom: 20, color: '#1d3557', textAlign: 'center' },
    field: { marginBottom: 15 },
    label: { fontWeight: 500, color: '#246bfd', fontSize: 15, marginBottom: 5, display: 'block' },
    fileInput: { padding: '10px 0', border: '1px solid #bdd7fa', borderRadius: 7, background: '#fff', width: '100%', boxSizing: 'border-box' },
    loading: { color: '#2563eb', textAlign: 'center', margin: '15px 0' },
    error: { color: '#d32f2f', background: '#fff9f9', padding: 8, borderRadius: 6, textAlign: 'center' },
    footer: { display: 'flex', justifyContent: 'flex-end', marginTop: 20 },
    buttonRed: { background: '#f1f5fa', color: '#365175', border: 0, borderRadius: 8, padding: '10px 15px', color: '#365175', cursor: 'pointer' }
};