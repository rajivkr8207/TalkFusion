import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function Chat({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('typing_indicator', (data) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('chat_message');
      socket.off('typing_indicator');
    };
  }, [socket, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    
    if (socket) {
      socket.emit('typing', { roomId, userId: currentUser.id, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId, userId: currentUser.id, isTyping: false });
      }, 2000);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    const msgData = {
      roomId,
      userId: currentUser.id,
      name: currentUser.name,
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('send_room_message', msgData);
    setMessages(prev => [...prev, msgData]);
    setInput('');
    socket.emit('typing', { roomId, userId: currentUser.id, isTyping: false });
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Chat</h3>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ 
            alignSelf: m.userId === currentUser.id ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: m.userId === currentUser.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            padding: '8px 12px',
            borderRadius: '12px'
          }}>
            {m.userId !== currentUser.id && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.name}</div>}
            <div style={{ fontSize: '0.9rem' }}>{m.text}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: '4px' }}>{m.time}</div>
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Type a message..." 
          value={input}
          onChange={handleTyping}
          style={{ padding: '8px 12px', borderRadius: '20px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
