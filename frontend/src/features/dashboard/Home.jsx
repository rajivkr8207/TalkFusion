import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/store';
import { initSocket, getSocket } from '../../lib/socket';
import ActiveUsersList from './ActiveUsersList';
import Matchmaking from './Matchmaking';
import { Phone, PhoneOff, User, Bot, Sparkles } from 'lucide-react';

export default function Home() {
  const user = useAppStore(state => state.user);
  const activeUsers = useAppStore(state => state.activeUsers);
  const setActiveUsers = useAppStore(state => state.setActiveUsers);
  const clearAuth = useAppStore(state => state.clearAuth);

  const [isSearching, setIsSearching] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { userId, name, offer }
  const navigate = useNavigate();
  const incomingCallRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const socket = initSocket();
    socket.emit('register_user', user);

    socket.on('active_users_list', (users) => {
      setActiveUsers(users);
    });

    socket.on('random_match_found', (data) => {
      setIsSearching(false);
      navigate(`/call/${data.roomId}`, { state: { callData: data, isRandomMatch: true } });
    });

    // Incoming direct call — show a nice modal instead of window.confirm
    socket.on('voice_offer', (data) => {
      incomingCallRef.current = data;
      const callerInfo = Array.from(activeUsers).find
        ? activeUsers.find(u => u.socketId === data.userId)
        : null;
      setIncomingCall({
        socketId: data.userId,
        name: callerInfo?.name || callerInfo?.username || 'Unknown User',
        offer: data.offer
      });
    });

    return () => {
      socket.off('active_users_list');
      socket.off('random_match_found');
      socket.off('voice_offer');
    };
  }, [user, navigate, setActiveUsers]);

  const handleLogout = async () => {
    const socket = getSocket();
    if (socket) socket.disconnect();
    clearAuth();
    navigate('/login');
  };

  const joinMatchmaking = () => {
    const socket = getSocket();
    if (socket) { socket.emit('join_random_matchmaking'); setIsSearching(true); }
  };

  const leaveMatchmaking = () => {
    const socket = getSocket();
    if (socket) { socket.emit('leave_random_matchmaking'); setIsSearching(false); }
  };

  const handleDirectCall = (targetUser) => {
    const roomId = `direct_${Date.now()}`;
    navigate(`/call/${roomId}`, { state: { targetUser, isInitiator: true } });
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    const roomId = `direct_incoming_${Date.now()}`;
    navigate(`/call/${roomId}`, {
      state: {
        targetUser: { socketId: incomingCall.socketId, name: incomingCall.name },
        isInitiator: false,
        incomingOffer: incomingCall.offer
      }
    });
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    setIncomingCall(null);
  };

  if (!user) return null;

  const initials = (user.name || '?').charAt(0).toUpperCase();

  return (
    <div className="container animate-fade-in">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '340px', width: '100%' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 700, color: 'white',
              margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(59,130,246,0.4)'
            }}>
              {incomingCall.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ marginBottom: '0.25rem' }}>{incomingCall.name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Incoming Call...</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={declineIncomingCall} className="btn-icon" style={{ background: 'var(--danger)', width: 60, height: 60 }}>
                <PhoneOff size={24} />
              </button>
              <button onClick={acceptIncomingCall} className="btn-icon" style={{ background: 'var(--success)', width: 60, height: 60 }}>
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>CallingWeb</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Welcome back, {user.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/profile" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '1.1rem', color: 'white', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'transform 0.2s'
          }}>
            {initials}
          </Link>
          <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Matchmaking isSearching={isSearching} onJoin={joinMatchmaking} onLeave={leaveMatchmaking} />

        {/* AI Call Card */}
        <div className="glass-panel" style={{
          padding: '2rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '2rem',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
          border: '1px solid rgba(139,92,246,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(139,92,246,0.4)'
            }}>
              <Bot size={32} color="white" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem' }}>Talk with Aria AI</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Have a real voice conversation with your AI assistant. Ask anything, anytime.
              </p>
            </div>
          </div>
          <Link to="/ai-call" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white', padding: '0.75rem 1.75rem', fontSize: '1rem',
              boxShadow: '0 4px 16px rgba(139,92,246,0.4)', whiteSpace: 'nowrap'
            }}>
              📞 Call Aria
            </button>
          </Link>
        </div>

        <ActiveUsersList
          users={activeUsers.filter(u => u.userId !== user.id)}
          currentUser={user}
          onCallUser={handleDirectCall}
        />
      </div>
    </div>
  );
}
