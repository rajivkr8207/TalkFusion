import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../../store/store';
import { getSocket } from '../../lib/socket';
import { WebRTCManager } from '../../lib/webrtc';
import Controls from './Controls';
import Timer from './Timer';
import Chat from './Chat';
import { User, PhoneIncoming } from 'lucide-react';

export default function CallScreen() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
  const socket = getSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcRef = useRef(null);
  // Store targetUser in a ref so it's always current inside callbacks
  const targetUserRef = useRef(null);

  const [callActive, setCallActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // Resolve call state from router
  const isRandomMatch = location.state?.isRandomMatch;
  const isInitiator = location.state?.isInitiator || location.state?.callData?.role === 'caller';
  const targetUserFromState = location.state?.targetUser || location.state?.callData?.matchedUserData;

  useEffect(() => {
    targetUserRef.current = targetUserFromState;
  }, [targetUserFromState]);

  const endCall = useCallback((emitEvent = true) => {
    if (webrtcRef.current) {
      webrtcRef.current.close();
      webrtcRef.current = null;
    }
    if (emitEvent && socket && targetUserRef.current) {
      socket.emit('end_call', { targetUserId: targetUserRef.current.socketId });
    }
    setCallActive(false);
    navigate('/');
  }, [socket, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!socket) {
      navigate('/');
      return;
    }

    const initCall = async () => {
      try {
        const rtc = new WebRTCManager(
          socket,
          (stream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
            setCallActive(true);
          },
          (candidate) => {
            if (targetUserRef.current?.socketId) {
              socket.emit('voice_ice_candidate', { targetUserId: targetUserRef.current.socketId, candidate });
            }
          }
        );
        webrtcRef.current = rtc;

        // Request audio + video
        const localStream = await rtc.initLocalStream(true, true);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        if (isInitiator && targetUserRef.current?.socketId) {
          const offer = await rtc.createOffer();
          // Join the signaling room first
          socket.emit('join_voice_room', roomId);
          socket.emit('voice_offer', { targetUserId: targetUserRef.current.socketId, offer });
        } else if (!isInitiator) {
          // Receiver: join room to receive signals
          socket.emit('join_voice_room', roomId);
        }
      } catch (err) {
        console.error('Error initializing call:', err);
        alert('Could not access camera/microphone. Please allow permissions.');
        navigate('/');
      }
    };

    initCall();

    // --- WebRTC signaling listeners ---
    const handleVoiceOffer = async (data) => {
      // Handle both incoming direct calls (from dashboard) and random match offers
      if (!targetUserRef.current) {
        // Incoming direct call while on call screen (receiver)
        targetUserRef.current = { socketId: data.userId };
      }
      if (webrtcRef.current && !isInitiator) {
        const answer = await webrtcRef.current.handleOffer(data.offer);
        socket.emit('voice_answer', { targetUserId: data.userId, answer });
        setCallActive(true);
      }
    };

    const handleVoiceAnswer = async (data) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleAnswer(data.answer);
      }
    };

    const handleIceCandidate = async (data) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleIceCandidate(data.candidate);
      }
    };

    const handleCallEnded = () => {
      endCall(false);
    };

    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('voice_ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('voice_ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
      if (webrtcRef.current) {
        webrtcRef.current.close();
        webrtcRef.current = null;
      }
    };
  }, [user, socket, navigate, isInitiator, roomId, endCall]);

  const toggleMic = () => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleAudio(!micOn);
      setMicOn(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleVideo(!videoOn);
      setVideoOn(prev => !prev);
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = speakerOn;
      setSpeakerOn(prev => !prev);
    }
  };

  if (!user) return null;

  const callerName = targetUserFromState?.name || targetUserFromState?.username || 'User';

  return (
    <div style={{
      display: 'flex', gap: '1.5rem', height: '100vh',
      padding: '1.5rem', background: 'var(--bg-dark)', overflow: 'hidden'
    }}>
      {/* Video Section */}
      <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

        {/* Remote Video */}
        <div className="glass-panel" style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '20px'
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: callActive ? 1 : 0, transition: 'opacity 0.5s' }}
          />
          {!callActive && (
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: 700, color: 'white',
                boxShadow: '0 0 40px rgba(59,130,246,0.4)'
              }}>
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ color: 'white', margin: 0 }}>{callerName}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {isInitiator ? 'Calling...' : 'Connecting...'}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s 0s infinite' }}></span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s 0.3s infinite' }}></span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s 0.6s infinite' }}></span>
              </div>
            </div>
          )}

          {/* Timer — top right */}
          <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
            <Timer isActive={callActive} />
          </div>

          {/* Local Video PiP — bottom right */}
          <div style={{
            position: 'absolute', bottom: '20px', right: '20px',
            width: '160px', height: '120px', borderRadius: '12px',
            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
            background: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
        </div>

        {/* Controls Bar */}
        <div className="glass-panel" style={{ padding: '1rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {callActive ? `In call with ${callerName}` : 'Connecting...'}
            </span>
            <Controls
              micOn={micOn} toggleMic={toggleMic}
              videoOn={videoOn} toggleVideo={toggleVideo}
              speakerOn={speakerOn} toggleSpeaker={toggleSpeaker}
              onEndCall={() => endCall(true)}
            />
            <span style={{ width: '120px' }}></span>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <Chat socket={socket} roomId={roomId} currentUser={user} />
      </div>
    </div>
  );
}
