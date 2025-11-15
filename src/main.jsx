// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 1. Import the AuthProvider
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your App component */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)