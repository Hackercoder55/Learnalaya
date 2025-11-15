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
    background: 'linear-gradient(135deg, #e0e7ff, #f2f4fa 60%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    background: '#fff',
    padding: '44px 38px 32px 38px',
    borderRadius: '16px',
    boxShadow: '0 8px 34px rgba(58, 98, 191, 0.11)',
    width: '360px',
    maxWidth: '97vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logo: {
    fontWeight: 800,
    fontSize: '2.2rem',
    color: '#1976d2',
    marginBottom: 18,
    fontFamily: 'Montserrat, Arial, sans-serif',
    letterSpacing: '-2px'
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  heading: {
    color: '#23244c',
    fontSize: '1.06rem',
    textAlign: 'center',
    marginBottom: 26,
    fontWeight: 500
  },
  input: {
    padding: '13px 10px',
    marginBottom: 18,
    borderRadius: 8,
    border: '1px solid #dbe6ea',
    fontSize: '16px',
    outline: 'none'
  },
  button: {
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    border: 0,
    borderRadius: 8,
    padding: '13px 0px',
    fontSize: '17px',
    cursor: 'pointer',
    marginTop: 6
  },
  error: {
    color: '#d32f2f',
    background: '#fff8f8',
    padding: '8px',
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 8
  }
};
