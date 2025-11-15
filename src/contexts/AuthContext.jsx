import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../api/supabaseClient';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for changes in auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) throw error;

    // Only check for teacher role!
    const role = data.user?.user_metadata?.role;
    if (role === 'teacher') {
      // Check in DB if archived
      const { data: teacherRecord, error: teacherError } = await supabase
        .from('teachers')
        .select('archived')
        .eq('user_id', data.user.id)
        .single();

      if (teacherRecord && teacherRecord.archived) {
        throw new Error('Your account is not active. Please contact management.');
      }
    }
    return data;
  };

  // Logout function
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // The value to be passed to consuming components
  const value = {
    session,
    user,
    login,
    logout,
    role: user?.user_metadata?.role || null,
  };

  // 3. Return the provider
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Create and export the custom hook to use the context (this resolves your "useAuth" error!)
export function useAuth() {
  return useContext(AuthContext);
}
