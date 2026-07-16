import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../auth/authSlice';
import { getSocket } from '../../lib/socket';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Send, Bot } from 'lucide-react';

// Detect browser speech support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function AiCallScreen() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const socket = getSocket();

  const [callStarted, setCallStarted] = useState(false);
  const [messages, setMessages] = useState([]); // [{role, text, time}]
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [speechLanguage, setSpeechLanguage] = useState('hi-IN');

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const lastActiveTimeRef = useRef(Date.now());
  // Stable ref so speakText can call startListening without a circular dep
  const startListeningRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Timer
  useEffect(() => {
    if (callStarted) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStarted]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // ─── 1. sendMessageToAi (no deps on other custom fns) ─────────────────────
  const sendMessageToAi = useCallback((text) => {
    if (!text.trim() || !socket) return;
    setMessages(prev => [...prev, {
      role: 'user', text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    socket.emit('ai_call_message', { text });
    setInputText('');
    setTranscript('');
  }, [socket]);

  // ─── 2. stopListening ─────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setTranscript('');
  }, []);

  // ─── 3. startListening (depends on sendMessageToAi & stopListening) ───────
  const startListening = useCallback(() => {
    if (!SpeechRecognition || !micOn || isThinking || isSpeaking) return;
    // Don't double-start
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLanguage;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      lastActiveTimeRef.current = Date.now();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      lastActiveTimeRef.current = Date.now(); // reset inactivity timer
      const current = Array.from(event.results)
        .map(r => r[0].transcript).join('');
      setTranscript(current);
      if (event.results[event.results.length - 1].isFinal) {
        const finalText = current.trim();
        if (finalText) sendMessageToAi(finalText);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('Speech error:', e.error);
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.start();
  }, [micOn, isThinking, isSpeaking, speechLanguage, sendMessageToAi]);

  // Keep ref in sync so speakText can always call the latest startListening
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // ─── 4. Inactivity auto-mute after 10s of silence ─────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (micOn && !isThinking && !isSpeaking) {
        if (Date.now() - lastActiveTimeRef.current >= 10000) {
          setMicOn(false);
          stopListening();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [micOn, isThinking, isSpeaking, stopListening]);

  // ─── 5. speakText (calls startListening via ref — no circular dep) ─────────
  const speakText = useCallback((rawText) => {
    if (!speakerOn || !synthRef.current) return;

    // Strip markdown symbols TTS should not read aloud
    const text = rawText.replace(/[*#_`]/g, '');
    synthRef.current.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.1;

    const isHindi = /[\u0900-\u097F]/.test(text);
    const chosenLang = isHindi ? 'hi-IN' : speechLanguage;

    // Wait for voices to load (Chrome loads them async)
    const applyVoiceAndSpeak = () => {
      const voices = synthRef.current.getVoices();
      let preferred = null;

      if (chosenLang.startsWith('hi')) {
        preferred = voices.find(v => v.lang.includes('hi') && (
          v.name.includes('Swara') || v.name.includes('Lekha') ||
          v.name.includes('Kalpana') || v.name.toLowerCase().includes('female')
        ));
        if (!preferred) preferred = voices.find(v => v.lang.includes('hi'));
      }

      if (!preferred && (chosenLang.includes('IN') || chosenLang.includes('in'))) {
        preferred = voices.find(v => v.lang.includes('en-IN') && (
          v.name.includes('Heera') || v.name.includes('Neerja') ||
          v.name.toLowerCase().includes('female') || v.name.includes('Google')
        ));
        if (!preferred) preferred = voices.find(v => v.lang.includes('en-IN'));
      }

      if (!preferred) {
        preferred = voices.find(v =>
          v.name.includes('Google UK English Female') ||
          v.name.includes('Microsoft Aria') ||
          v.name.toLowerCase().includes('female')
        ) || voices[0];
      }

      if (preferred) {
        utter.voice = preferred;
        utter.lang = preferred.lang;
      } else {
        utter.lang = chosenLang;
      }

      const onDone = () => {
        setIsSpeaking(false);
        lastActiveTimeRef.current = Date.now();
        // Use ref to avoid circular dependency
        startListeningRef.current?.();
      };

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = onDone;
      utter.onerror = (e) => {
        console.error('TTS error:', e.error);
        onDone(); // Prevent app from getting stuck
      };

      synthRef.current.speak(utter);
    };

    const voices = synthRef.current.getVoices();
    if (voices.length === 0) {
      // Voices not loaded yet — wait for the event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        applyVoiceAndSpeak();
      };
    } else {
      applyVoiceAndSpeak();
    }
  }, [speakerOn, speechLanguage]);

  // ─── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handleAiThinking = (val) => setIsThinking(val);
    const handleAiResponse = ({ text }) => {
      setMessages(prev => [...prev, {
        role: 'ai', text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      speakText(text);
    };
    socket.on('ai_thinking', handleAiThinking);
    socket.on('ai_response', handleAiResponse);
    return () => {
      socket.off('ai_thinking', handleAiThinking);
      socket.off('ai_response', handleAiResponse);
    };
  }, [socket, speakText]);

  const handleTextSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) sendMessageToAi(inputText.trim());
  };

  const startCall = () => {
    if (!socket) { alert('Not connected to server. Please refresh.'); return; }
    setCallStarted(true);
    setMessages([]);
    lastActiveTimeRef.current = Date.now();
    socket.emit('ai_call_start');
    setTimeout(() => startListeningRef.current?.(), 3000);
  };

  const endCall = () => {
    stopListening();
    synthRef.current?.cancel();
    socket?.emit('ai_call_end');
    setCallStarted(false);
    navigate('/');
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    if (!next) stopListening();
    else {
      lastActiveTimeRef.current = Date.now();
      startListeningRef.current?.();
    }
  };

  const toggleSpeaker = () => {
    if (isSpeaking) synthRef.current?.cancel();
    setSpeakerOn(prev => !prev);
  };


  // Waveform bars for visual feedback
  const WaveBar = ({ delay }) => (
    <div
      className="w-1 md:w-1.5 rounded-full bg-blue-500"
      style={{ animation: `wave 1s ${delay}s infinite ease-in-out` }}
    />
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-100 bg-slate-900" 
         style={{ backgroundImage: 'radial-gradient(at 10% 20%, rgba(59,130,246,0.12) 0, transparent 50%), radial-gradient(at 90% 80%, rgba(139,92,246,0.12) 0, transparent 50%)' }}>
      
      {/* Header */}
      <div className="glass flex justify-between items-center mx-3 md:mx-6 mt-3 md:mt-6 px-4 md:px-6 py-3 md:py-4 rounded-2xl z-10 shrink-0 shadow-lg border border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 relative">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h3 className="m-0 text-base md:text-lg font-semibold text-white tracking-tight">Aria AI</h3>
            <p className="m-0 text-xs md:text-sm text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                {callStarted && (isThinking || isSpeaking || isListening) && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {callStarted ? (isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Connected') : 'Ready'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-slate-400 font-medium">Language:</span>
            <select
              value={speechLanguage}
              onChange={(e) => setSpeechLanguage(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner w-36"
            >
              <option value="hi-IN">Hindi (Indian Girl)</option>
              <option value="en-IN">English (Indian Accent)</option>
              <option value="en-US">English (US Accent)</option>
            </select>
          </div>

          {callStarted && (
            <div className="bg-slate-900/60 border border-slate-700/50 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold text-blue-400 font-mono tracking-wider shadow-inner">
              {formatTime(callDuration)}
            </div>
          )}
          
          <button onClick={() => navigate('/')} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs md:text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 group">
            <span className="hidden md:inline group-hover:-translate-x-1 transition-transform">←</span>
            <span className="hidden md:inline">Dashboard</span>
            <span className="md:hidden">←</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-3 md:p-6 overflow-hidden min-h-0">

        {/* AI Avatar & Controls */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 md:gap-6 h-[40%] md:h-full transition-all duration-300">
          
          {/* AI Avatar */}
          <div className="glass flex-1 flex flex-col items-center justify-center gap-4 md:gap-6 p-6 relative overflow-hidden group">
            {/* Ambient glow behind avatar */}
            {callStarted && <div className="absolute inset-0 bg-blue-500/5 animate-pulse blur-3xl rounded-full scale-150 transition-all duration-700" />}
            
            <div className="relative z-10">
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center transition-all duration-500 ${callStarted ? 'shadow-[0_0_40px_rgba(59,130,246,0.3)] glow-pulse scale-105' : 'shadow-black/20'}`}>
                <Bot className="w-12 h-12 md:w-16 md:h-16 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              {/* Orbiting dot when thinking */}
              {isThinking && (
                <div className="absolute top-1/2 left-1/2 w-3 md:w-4 h-3 md:h-4 rounded-full bg-amber-400 -mt-1.5 md:-mt-2 -ml-1.5 md:-ml-2 shadow-[0_0_15px_rgba(251,191,36,0.8)] orbit" />
              )}
            </div>

            <div className="text-center z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white m-0 tracking-tight">Aria AI</h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium">Your AI Call Assistant</p>
            </div>

            {/* Waveform — visible when listening/speaking */}
            <div className={`flex items-center justify-center gap-1.5 h-10 transition-opacity duration-300 ${callStarted && (isListening || isSpeaking) ? 'opacity-100' : 'opacity-0'}`}>
               {[0, 0.1, 0.2, 0.15, 0.05, 0.1, 0.2].map((d, i) => <WaveBar key={i} delay={d} />)}
            </div>

            {/* Transcript bubble */}
            <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 transform ${transcript ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
              <div className="bg-slate-900/80 border border-blue-500/30 backdrop-blur-md rounded-xl p-3 text-xs md:text-sm text-blue-200 text-center italic shadow-lg">
                "{transcript}"
              </div>
            </div>
          </div>

          {/* Call Controls */}
          {callStarted ? (
            <div className="glass p-4 md:p-5 shrink-0 flex flex-col gap-4">
              <div className="flex justify-center gap-6 md:gap-8">
                <div className="text-center flex flex-col items-center">
                  <button
                    onClick={toggleMic}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${micOn ? 'bg-slate-800 text-blue-400 hover:bg-slate-700 ring-1 ring-white/10 hover:ring-blue-500/50' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
                  >
                    {micOn ? <Mic size={20} className="md:w-6 md:h-6" /> : <MicOff size={20} className="md:w-6 md:h-6" />}
                  </button>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-2.5 font-medium">{micOn ? 'Mic On' : 'Muted'}</div>
                </div>

                <div className="text-center flex flex-col items-center">
                  <button
                    onClick={toggleSpeaker}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${speakerOn ? 'bg-slate-800 text-blue-400 hover:bg-slate-700 ring-1 ring-white/10 hover:ring-blue-500/50' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
                  >
                    {speakerOn ? <Volume2 size={20} className="md:w-6 md:h-6" /> : <VolumeX size={20} className="md:w-6 md:h-6" />}
                  </button>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-2.5 font-medium">{speakerOn ? 'Speaker' : 'Muted'}</div>
                </div>

                <div className="text-center flex flex-col items-center">
                  <button
                    onClick={endCall}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 shadow-lg hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-105"
                  >
                    <PhoneOff size={20} className="md:w-6 md:h-6" />
                  </button>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-2.5 font-medium text-red-400">End Call</div>
                </div>
              </div>

              {/* Manual mic push-to-talk button */}
              {!SpeechRecognition && (
                <div className="text-center text-amber-400/90 text-xs bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  Voice not supported in this browser. Use text chat instead.
                </div>
              )}
              {SpeechRecognition && micOn && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  className={`w-full py-3 md:py-3.5 px-4 rounded-xl border font-semibold text-sm transition-all duration-200 select-none flex items-center justify-center gap-2 ${isListening ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[0.98]' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
                  {isListening ? 'Release to Send' : 'Hold to Speak'}
                </button>
              )}
            </div>
          ) : (
            <button onClick={startCall} className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-base md:text-lg font-semibold rounded-2xl shadow-xl shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 shrink-0 border border-white/10 group">
              <PhoneOff size={22} className="hidden" /> {/* pre-load icon just in case */}
              <Bot className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 group-hover:rotate-3" /> 
              Start AI Call
            </button>
          )}
        </div>

        {/* Conversation Panel */}
        <div className="glass flex-1 flex flex-col overflow-hidden min-h-[50%] md:min-h-0 relative">
          <div className="border-b border-white/5 p-4 md:p-5 bg-slate-900/40 shrink-0 flex justify-between items-center z-10">
            <div>
              <h3 className="m-0 text-base md:text-lg font-semibold text-white tracking-tight">Conversation</h3>
              <p className="m-0 text-[11px] md:text-xs text-slate-400 mt-1 font-medium">
                {callStarted ? 'Live transcript of your AI call' : 'Start a call to begin chatting with Aria'}
              </p>
            </div>
            
            {/* Mobile language select (hidden on desktop) */}
            <div className="md:hidden block">
              <select
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg py-1 px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
              >
                <option value="hi-IN">HI (IN)</option>
                <option value="en-IN">EN (IN)</option>
                <option value="en-US">EN (US)</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-5 scroll-smooth relative z-0">
            {!callStarted && messages.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-slate-500 p-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800/40 flex items-center justify-center mb-2 border border-slate-700/50 shadow-inner">
                   <Bot size={40} className="opacity-30 md:w-12 md:h-12" />
                </div>
                <div className="text-center max-w-xs space-y-2">
                  <p className="text-sm md:text-base font-medium text-slate-400">Press "Start AI Call" to begin a voice conversation with Aria.</p>
                  <p className="text-xs md:text-sm">You can also type messages during the call.</p>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fade-up w-full`} style={{ animationDelay: '50ms' }}>
                <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 shadow-sm relative group ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm border border-blue-500/50'
                    : 'bg-slate-800/90 backdrop-blur-sm border border-slate-700/80 text-slate-100 rounded-2xl rounded-tl-sm'
                }`}>
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                        <Bot size={14} className="text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">Aria</span>
                    </div>
                  )}
                  <p className="m-0 leading-relaxed text-[13px] md:text-[15px] whitespace-pre-wrap">{m.text}</p>
                  <div className={`text-[9px] md:text-[10px] font-medium mt-2 md:mt-2.5 flex items-center gap-1 ${m.role === 'user' ? 'text-blue-200 justify-end' : 'text-slate-500 justify-start'}`}>
                    <span>{m.time}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-start gap-2.5 animate-fade-up mt-2">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot size={16} className="text-blue-400" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3.5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm h-10">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ animation: `pulse-dot 1.2s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>

          {/* Text Input */}
          {callStarted && (
            <div className="p-3 md:p-5 bg-slate-900/70 backdrop-blur-md border-t border-white/5 shrink-0 z-10">
              <form onSubmit={handleTextSend} className="flex gap-2 md:gap-3 items-end relative max-w-4xl mx-auto">
                <div className="flex-1 relative group">
                  <textarea
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500/70 focus:bg-slate-800/90 text-slate-100 px-4 py-3 md:py-3.5 pr-12 rounded-xl outline-none resize-none min-h-[48px] md:min-h-[52px] max-h-[120px] text-sm md:text-base placeholder:text-slate-500 transition-all shadow-inner block"
                    placeholder="Message Aria..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (inputText.trim() && !isThinking) handleTextSend(e);
                      }
                    }}
                    disabled={isThinking}
                    rows={1}
                  />
                  {inputText.trim() && !isThinking && (
                     <div className="absolute right-3.5 bottom-3.5 text-[10px] text-slate-500 hidden md:block font-medium">↵ Send</div>
                  )}
                </div>
                <button type="submit" disabled={!inputText.trim() || isThinking}
                  className={`w-12 h-12 md:w-[52px] md:h-[52px] rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${!inputText.trim() || isThinking ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50' : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 border border-blue-500'}`}>
                  <Send size={18} className={`md:w-5 md:h-5 ${!inputText.trim() || isThinking ? '' : 'translate-x-0.5 -translate-y-0.5'}`} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
