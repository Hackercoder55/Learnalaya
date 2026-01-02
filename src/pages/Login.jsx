// src/pages/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext will update and App.jsx will show Dashboard automatically.
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logo}>Learnalaya</div>
        <form style={styles.form} onSubmit={handleLogin}>
          <h2 style={styles.heading}>Sign in to your account</h2>
          <input
            type="email"
            id="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@learnalaya.com"
            required
            autoFocus
          />
          <input
            type="password"
            id="password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: 'var(--bg-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: 'var(--bg-surface)',
    padding: '48px 40px',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid var(--gray-200)',
    position: 'relative',
    overflow: 'hidden'
  },
  logo: {
    fontWeight: 800,
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
    fontFamily: 'Montserrat, system-ui, sans-serif',
    letterSpacing: '-1px'
  },
  subtitle: {
    color: 'var(--gray-500)',
    fontSize: '0.95rem',
    marginBottom: '32px',
    textAlign: 'center'
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heading: {
    color: 'var(--gray-900)',
    fontSize: '1.5rem',
    textAlign: 'center',
    marginBottom: '8px',
    fontWeight: 700
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-300)',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    backgroundColor: 'var(--gray-50)',
    color: 'var(--gray-900)',
    boxSizing: 'border-box'
  },
  button: {
    background: 'var(--primary-600)',
    color: '#fff',
    fontWeight: 600,
    border: 0,
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
    boxShadow: 'var(--shadow-md)'
  },
  error: {
    color: 'var(--error)',
    background: '#fef2f2',
    border: '1px solid #fee2e2',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    marginBottom: '16px',
    fontSize: '0.9rem'
  }
};
