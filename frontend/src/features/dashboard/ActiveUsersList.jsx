import React from 'react';

export default function ActiveUsersList({ users, currentUser, onCallUser }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>Active Users ({users.length})</h3>
      
      {users.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No other users are currently online.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {users.map(u => (
            <div key={u.socketId} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{u.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{u.username}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`status-dot ${u.status === 'in-call' ? 'in-call' : ''}`}></span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.status}</span>
                </div>
                
                {currentUser && currentUser.id !== u.userId && u.status === 'online' && (
                  <button onClick={() => onCallUser(u)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Call
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
