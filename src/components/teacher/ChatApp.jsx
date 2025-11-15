// src/components/teacher/ChatApp.jsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient'; 
import { useAuth } from '../../hooks/useAuth';

const CHAT_CHANNEL = 'class_chats'; // Supabase channel name

export default function ChatApp({ teacherProfile, students }) {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  
  const teacherClasses = teacherProfile?.classes || [];
  const teacherSubjects = teacherProfile?.subjects || [];

  // 1. --- Group Creation and Fetching Logic ---
  const fetchOrCreateGroup = async (classNum, subjectName) => {
    setLoading(true);
    setError(null);
    setMessages([]); // Clear old messages

    try {
      // 1a. Check if group exists
      let { data: group, error: fetchError } = await supabase
        .from('chat_groups')
        .select('*')
        .eq('class_number', classNum)
        .eq('subject_name', subjectName)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // 1b. Group does not exist (PGRST116 = 0 rows), so create it
        const { data: newGroup, error: createError } = await supabase
          .from('chat_groups')
          .insert([{ class_number: classNum, subject_name: subjectName }])
          .select()
          .single();
        
        if (createError) throw createError;
        group = newGroup;
      } else if (fetchError) {
        throw fetchError;
      }

      setSelectedGroup(group);
      fetchMessages(group.id); // Go fetch messages for the new/existing group

    } catch (err) {
      setError(err.message || 'Failed to initialize chat group.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. --- Message Fetching and Realtime Subscription ---
  const fetchMessages = async (groupId) => {
    const { data: initialMessages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setMessages(initialMessages);
    }
  };

  useEffect(() => {
    if (!selectedGroup) return;

    // Set up Realtime Subscription
    const subscription = supabase
      .channel(CHAT_CHANNEL)
      .on('postgres_changes', 
          { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages', 
              filter: `group_id=eq.${selectedGroup.id}` // Only listen to messages for the current group
          },
          (payload) => {
              setMessages((prev) => [...prev, payload.new]);
          })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription); // Clean up the subscription on unmount
    };
  }, [selectedGroup]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. --- Message Submission ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedGroup) return;

    try {
      const { error } = await supabase.from('messages').insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        sender_name: teacherProfile.name, // Use the teacher's name
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    }
  };
  
  // --- Component Rendering ---
  return (
    <div style={styles.chatWrapper}>
      <div style={styles.groupSelector}>
        <h3 style={styles.selectorTitle}>Select Chat Group</h3>
        <div style={styles.filterRow}>
          {teacherClasses.map((cls) => (
            <div key={cls}>
              <h4 style={styles.classTitle}>Class {cls}</h4>
              <div style={styles.subjectGrid}>
                {teacherSubjects.map((sub) => (
                  <button
                    key={`${cls}-${sub}`}
                    style={
                        selectedGroup?.class_number === cls && selectedGroup?.subject_name === sub
                        ? styles.groupBtnActive : styles.groupBtn
                    }
                    onClick={() => fetchOrCreateGroup(cls, sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.chatBox}>
        {selectedGroup ? (
          <>
            <div style={styles.chatHeader}>
              Chat: Class {selectedGroup.class_number} - {selectedGroup.subject_name}
            </div>
            {loading ? (
              <div style={styles.loading}>Loading messages...</div>
            ) : error ? (
              <div style={styles.error}>{error}</div>
            ) : (
              <div style={styles.messageList}>
                {messages.length === 0 ? (
                  <p style={styles.empty}>Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        style={msg.user_id === user.id ? styles.messageSent : styles.messageReceived}
                    >
                        <strong style={styles.senderName}>{msg.sender_name}</strong>
                        <p>{msg.content}</p>
                        <span style={styles.timestamp}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={styles.messageInput}
              />
              <button type="submit" style={styles.sendButton}>Send</button>
            </form>
          </>
        ) : (
          <div style={styles.noGroupSelected}>
            Select a class and subject to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

// Styles (using a slightly different style prefix here to avoid conflicts)
const styles = {
    chatWrapper: { display: 'flex', gap: '20px', minHeight: '600px', padding: '16px' },
    groupSelector: { flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    chatBox: { flex: 2, backgroundColor: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    selectorTitle: { fontSize: '1.2rem', fontWeight: 600, color: '#1d3557', marginBottom: '15px' },
    classTitle: { fontSize: '1rem', fontWeight: 600, color: '#4b5563', marginTop: '10px' },
    subjectGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', marginBottom: '15px' },
    groupBtn: { padding: '8px 12px', fontSize: '14px', background: '#f1f5f9', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    groupBtnActive: { padding: '8px 12px', fontSize: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'default' },

    chatHeader: { padding: '15px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, color: '#1d3557' },
    messageList: { flexGrow: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#fdfdfd' },
    inputForm: { padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' },
    messageInput: { flexGrow: 1, padding: '10px', borderRadius: '20px', border: '1px solid #d1d5db', outline: 'none' },
    sendButton: { padding: '10px 15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' },

    messageSent: { 
        alignSelf: 'flex-end', maxWidth: '80%', padding: '8px 12px', borderRadius: '10px 10px 0 10px', 
        background: '#2563eb', color: '#fff', marginBottom: '10px', lineHeight: '1.4', 
    },
    messageReceived: { 
        alignSelf: 'flex-start', maxWidth: '80%', padding: '8px 12px', borderRadius: '10px 10px 10px 0', 
        background: '#e0f2fe', color: '#111827', marginBottom: '10px', lineHeight: '1.4',
    },
    senderName: { fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '3px' },
    timestamp: { fontSize: '10px', color: 'inherit', display: 'block', textAlign: 'right', opacity: 0.8 },

    loading: { textAlign: 'center', padding: '50px', color: '#6366f1' },
    error: { color: '#dc2626', background: '#fff8f8', padding: '15px', margin: '15px', borderRadius: '8px' },
    empty: { textAlign: 'center', color: '#6b7280', padding: '50px' },
    noGroupSelected: { flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }
};