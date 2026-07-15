import React from 'react';
import { Users } from 'lucide-react';

export default function Matchmaking({ isSearching, onJoin, onLeave }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: isSearching ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: isSearching ? 'pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1)' : 'none'
        }}>
          <Users size={40} color={isSearching ? 'var(--primary)' : 'var(--text-muted)'} />
        </div>
      </div>
      
      <h2 style={{ marginBottom: '1rem' }}>Random Matchmaking</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {isSearching 
          ? 'Searching for an available user to connect with...' 
          : 'Connect instantly with a random user online right now.'}
      </p>

      {isSearching ? (
        <button onClick={onLeave} className="btn btn-danger" style={{ width: '200px' }}>
          Cancel Search
        </button>
      ) : (
        <button onClick={onJoin} className="btn btn-primary" style={{ width: '200px' }}>
          Find Random Call
        </button>
      )}
    </div>
  );
}
