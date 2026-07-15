import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/dashboard/Home';
import CallScreen from './features/call/CallScreen';
import AiCallScreen from './features/call/AiCallScreen';
import Profile from './features/profile/Profile';
import { useAppStore } from './store/store';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const user = useAppStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/call/:id" element={<ProtectedRoute><CallScreen /></ProtectedRoute>} />
        <Route path="/ai-call" element={<ProtectedRoute><AiCallScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
