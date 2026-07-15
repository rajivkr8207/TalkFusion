import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../auth/authSlice';
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
  const user = useSelector(selectUser);
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
    <div className="flex gap-4 h-screen p-4 bg-slate-950 overflow-hidden">

      {/* ── Video Section ─────────────────────────────────────────── */}
      <div className="flex-[2] flex flex-col gap-3 min-w-0">
        {/* Remote Video */}
        <div className="glass relative flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl">
          <video
            ref={remoteVideoRef} autoPlay playsInline
            className={`w-full h-full object-cover transition-opacity duration-500 ${callActive ? 'opacity-100' : 'opacity-0'}`}
          />
          {!callActive && (
            <div className="absolute flex flex-col items-center gap-4 text-slate-400">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-white text-xl">{callerName}</h3>
              <p className="text-sm">{isInitiator ? 'Calling…' : 'Connecting…'}</p>
              <div className="flex gap-2">
                {[0, 0.3, 0.6].map((d, i) => (
                  <span key={i} className="pulse-dot w-2 h-2 rounded-full bg-blue-500 inline-block" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          {/* Timer */}
          <div className="absolute top-4 left-4">
            <Timer isActive={callActive} />
          </div>
          {/* Local PiP */}
          <div className="absolute bottom-4 right-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-slate-950 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
        </div>

        {/* Controls Bar */}
        <div className="glass px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              {callActive ? `In call with ${callerName}` : 'Connecting…'}
            </span>
            <Controls
              micOn={micOn} toggleMic={toggleMic}
              videoOn={videoOn} toggleVideo={toggleVideo}
              speakerOn={speakerOn} toggleSpeaker={toggleSpeaker}
              onEndCall={() => endCall(true)}
            />
            <span className="w-32" />
          </div>
        </div>
      </div>

      {/* ── Chat Sidebar ──────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col">
        <Chat socket={socket} roomId={roomId} currentUser={user} />
      </div>
    </div>
  );
}

