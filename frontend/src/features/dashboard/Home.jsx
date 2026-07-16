import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { useSocket, useSocketEvent } from "../../hooks/useSocket";
import { selectActiveUsers } from "../users/usersSlice";
import { getSocket } from "../../lib/socket";
import ActiveUsersList from "./ActiveUsersList";
import Matchmaking from "./Matchmaking";
import { Bot, Phone, PhoneOff } from "lucide-react";

export default function Home() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const activeUsers = useSelector(selectActiveUsers);
  const [isSearching, setIsSearching] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  useSocket(user);

  const handleMatchFound = useCallback((data) => {
    setIsSearching(false);
    navigate(`/call/${data.roomId}`, { state: { callData: data, isRandomMatch: true } });
  }, [navigate]);

  const handleVoiceOffer = useCallback((data) => {
    const callerInfo = activeUsers.find((u) => u.socketId === data.userId);
    setIncomingCall({
      socketId: data.userId,
      name: callerInfo?.name || callerInfo?.username || "Unknown User",
      offer: data.offer,
    });
  }, [activeUsers]);

  useSocketEvent("random_match_found", handleMatchFound);
  useSocketEvent("voice_offer", handleVoiceOffer);

  const joinMatchmaking = () => {
    const socket = getSocket();
    if (socket) { socket.emit("join_random_matchmaking"); setIsSearching(true); }
  };
  const leaveMatchmaking = () => {
    const socket = getSocket();
    if (socket) { socket.emit("leave_random_matchmaking"); setIsSearching(false); }
  };
  const handleDirectCall = (targetUser) => {
    const roomId = `direct_${Date.now()}`;
    navigate(`/call/${roomId}`, { state: { targetUser, isInitiator: true } });
  };
  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    navigate(`/call/incoming_${Date.now()}`, {
      state: { targetUser: { socketId: incomingCall.socketId, name: incomingCall.name }, isInitiator: false, incomingOffer: incomingCall.offer },
    });
    setIncomingCall(null);
  };
  const declineIncomingCall = () => setIncomingCall(null);

  if (!user) return null;
  const initials = (user.name || "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-fade-up">

      {/* ── Incoming Call Modal ───────────────────────────────────────── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="glass p-6 md:p-10 text-center max-w-sm w-full mx-4 md:mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
              {incomingCall.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl mb-1">{incomingCall.name}</h3>
            <p className="text-slate-400 mb-8 text-sm">Incoming Call…</p>
            <div className="flex gap-4 justify-center">
              <button onClick={declineIncomingCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center transition-all hover:scale-105">
                <PhoneOff size={24} />
              </button>
              <button onClick={acceptIncomingCall} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all hover:scale-105">
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 md:mb-12 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TalkFusion
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            title="Profile"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white no-underline shadow-lg hover:scale-110 transition-transform"
          >
            {initials}
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm font-medium transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <Matchmaking isSearching={isSearching} onJoin={joinMatchmaking} onLeave={leaveMatchmaking} />

        {/* AI Call Card */}
        <div className="glass p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.4)]">
              <Bot size={32} color="white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Talk with Aria AI</h3>
              <p className="text-slate-400 text-sm">Have a real voice conversation with your AI assistant. Ask anything, anytime.</p>
            </div>
          </div>
          <Link to="/ai-call" className="no-underline shrink-0 w-full md:w-auto">
            <button className="w-full md:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-all shadow-[0_4px_16px_rgba(139,92,246,0.4)] whitespace-nowrap hover:scale-105">
              📞 Call Aria
            </button>
          </Link>
        </div>

        <ActiveUsersList users={activeUsers.filter((u) => u.userId !== user.id)} currentUser={user} onCallUser={handleDirectCall} />
      </div>
    </div>
  );
}
