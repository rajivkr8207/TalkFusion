import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/store';
import { getSocket } from '../../lib/socket';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Send, Bot } from 'lucide-react';

// Detect browser speech support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function AiCallScreen() {
  const navigate = useNavigate();
  const user = useAppStore(state => state.user);
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

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

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

  // Speak AI text out loud
  const speakText = useCallback((text) => {
    if (!speakerOn || !synthRef.current) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.1;
    // Prefer a natural-sounding female voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Aria') || v.name.includes('Female')
    );
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => {
      setIsSpeaking(false);
      // Auto-restart listening after AI finishes speaking
      if (micOn && callStarted) startListening();
    };
    synthRef.current.speak(utter);
  }, [speakerOn, micOn, callStarted]);

  // Socket listeners
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

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!SpeechRecognition || !micOn || isThinking || isSpeaking) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); setTranscript(''); };

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map(r => r[0].transcript).join('');
      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        const finalText = current.trim();
        if (finalText) {
          sendMessageToAi(finalText);
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('Speech error:', e.error);
      setIsListening(false);
    };

    recognition.start();
  }, [micOn, isThinking, isSpeaking]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  };

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

  const handleTextSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) sendMessageToAi(inputText.trim());
  };

  const startCall = () => {
    if (!socket) { alert('Not connected to server. Please refresh.'); return; }
    setCallStarted(true);
    setMessages([]);
    socket.emit('ai_call_start');
    // Start listening after a short delay to let greeting arrive
    setTimeout(() => startListening(), 3000);
  };

  const endCall = () => {
    stopListening();
    synthRef.current?.cancel();
    socket?.emit('ai_call_end');
    setCallStarted(false);
    navigate('/');
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
    setMicOn(prev => !prev);
  };

  const toggleSpeaker = () => {
    if (isSpeaking) synthRef.current?.cancel();
    setSpeakerOn(prev => !prev);
  };

  // Waveform bars for visual feedback
  const WaveBar = ({ delay }) => (
    <div style={{
      width: '4px', borderRadius: '2px',
      background: 'var(--primary)',
      animation: `wave 1s ${delay}s infinite ease-in-out`,
    }} />
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'var(--bg-dark)', overflow: 'hidden',
      backgroundImage: 'radial-gradient(at 10% 20%, rgba(59,130,246,0.12) 0, transparent 50%), radial-gradient(at 90% 80%, rgba(139,92,246,0.12) 0, transparent 50%)'
    }}>
      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 50px rgba(59,130,246,0.7); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
      `}</style>

      {/* Header */}
      <div className="glass-panel" style={{
        margin: '1.5rem 1.5rem 0', borderRadius: '16px',
        padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={22} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Aria AI</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success)' }}>
              {callStarted ? `● ${isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Connected'}` : '● Ready'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {callStarted && (
            <div style={{
              background: 'rgba(0,0,0,0.4)', padding: '4px 12px',
              borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600'
            }}>
              {formatTime(callDuration)}
            </div>
          )}
          <button onClick={() => navigate('/')} className="btn" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.85rem' }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: '1.5rem', padding: '1.5rem', overflow: 'hidden' }}>

        {/* AI Avatar & Controls */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* AI Avatar */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: callStarted ? 'glow-pulse 2s infinite' : 'none',
                transition: 'all 0.3s'
              }}>
                <Bot size={60} color="white" />
              </div>
              {/* Orbiting dot when thinking */}
              {isThinking && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: 'var(--warning)', marginTop: '-6px', marginLeft: '-6px',
                  animation: 'orbit 1s linear infinite'
                }} />
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 0.25rem' }}>Aria AI</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Your AI Call Assistant</p>
            </div>

            {/* Waveform — visible when listening/speaking */}
            {callStarted && (isListening || isSpeaking) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}>
                {[0, 0.1, 0.2, 0.15, 0.05, 0.1, 0.2].map((d, i) => <WaveBar key={i} delay={d} />)}
              </div>
            )}

            {/* Transcript bubble */}
            {transcript && (
              <div style={{
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '12px', padding: '0.75rem 1rem',
                fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center',
                maxWidth: '220px', fontStyle: 'italic'
              }}>
                "{transcript}"
              </div>
            )}
          </div>

          {/* Call Controls */}
          {callStarted && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={toggleMic}
                    className="btn-icon"
                    style={{
                      width: '56px', height: '56px',
                      background: micOn ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.7)',
                      border: micOn ? '2px solid var(--primary)' : 'none'
                    }}
                  >
                    {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{micOn ? 'Mic On' : 'Muted'}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={toggleSpeaker}
                    className="btn-icon"
                    style={{
                      width: '56px', height: '56px',
                      background: speakerOn ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.7)',
                      border: speakerOn ? '2px solid var(--primary)' : 'none'
                    }}
                  >
                    {speakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                  </button>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{speakerOn ? 'Speaker' : 'Muted'}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={endCall}
                    className="btn-icon"
                    style={{ width: '56px', height: '56px', background: 'var(--danger)' }}
                  >
                    <PhoneOff size={24} />
                  </button>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>End</div>
                </div>
              </div>

              {/* Manual mic push-to-talk button */}
              {!SpeechRecognition && (
                <p style={{ textAlign: 'center', color: 'var(--warning)', fontSize: '0.8rem', marginTop: '1rem' }}>
                  Voice not supported in this browser. Use text chat instead.
                </p>
              )}
              {SpeechRecognition && micOn && (
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  style={{
                    width: '100%', marginTop: '1rem', padding: '0.75rem',
                    borderRadius: '8px', border: `2px solid ${isListening ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    background: isListening ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                  }}
                >
                  {isListening ? '🎙 Release to Send' : '🎙 Hold to Speak'}
                </button>
              )}
            </div>
          )}

          {/* Start Call button */}
          {!callStarted && (
            <button onClick={startCall} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }}>
              📞 Start AI Call
            </button>
          )}
        </div>

        {/* Conversation Panel */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border-glass)', padding: '1rem 1.25rem' }}>
            <h3 style={{ margin: 0 }}>Conversation</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {callStarted ? 'Live transcript of your AI call' : 'Start a call to begin chatting with Aria'}
            </p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!callStarted && messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                <Bot size={48} opacity={0.3} />
                <p style={{ textAlign: 'center' }}>Press "Start AI Call" to begin a voice conversation with Aria.<br />You can also type messages during the call.</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: '16px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary), #2563eb)'
                    : 'rgba(255,255,255,0.08)',
                  border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  {m.role === 'ai' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <Bot size={14} color="var(--primary)" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Aria</span>
                    </div>
                  )}
                  <p style={{ margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '4px' }}>{m.time}</div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={16} color="var(--primary)" />
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} style={{
                      width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)',
                      animation: `pulse 1s ${d}s infinite`
                    }} />
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Aria is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input (always available as fallback) */}
          {callStarted && (
            <div style={{ borderTop: '1px solid var(--border-glass)', padding: '1rem 1.25rem' }}>
              <form onSubmit={handleTextSend} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type a message to Aria..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={isThinking}
                  style={{ borderRadius: '24px', padding: '10px 16px' }}
                />
                <button type="submit" className="btn btn-primary" disabled={!inputText.trim() || isThinking}
                  style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, flexShrink: 0 }}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
