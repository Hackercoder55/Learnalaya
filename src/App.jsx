// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentReportPage from './pages/StudentReportPage';
import RevenueReportPage from './pages/RevenueReportPage';
import HistoricalStudentReportPage from './pages/HistoricalStudentReportPage'; // 1. IMPORT NEW PAGE

// Router component to check authentication
const AuthRouter = () => {
  const { session } = useAuth();
  
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/report/student/:studentId" element={<StudentReportPage />} />
      <Route path="/report/revenue" element={<RevenueReportPage />} />
      <Route path="/report/students" element={<HistoricalStudentReportPage />} /> {/* 2. ADD NEW ROUTE */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthRouter />
    </BrowserRouter>
  );
}