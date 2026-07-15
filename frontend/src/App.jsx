import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from './features/auth/authSlice';

// ── Pages
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/dashboard/Home';
import CallScreen from './features/call/CallScreen';
import AiCallScreen from './features/call/AiCallScreen';
import Profile from './features/profile/Profile';

import './index.css';

/**
 * ProtectedRoute — redirects to /login if the Redux auth.user is null.
 * Uses the Redux selector directly (no prop drilling needed).
 */
const ProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/"        element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/call/:id" element={<ProtectedRoute><CallScreen /></ProtectedRoute>} />
        <Route path="/ai-call"  element={<ProtectedRoute><AiCallScreen /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
