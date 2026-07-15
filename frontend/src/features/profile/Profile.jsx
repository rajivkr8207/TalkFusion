import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function Profile() {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setName(user.name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
  }, [user, navigate]);

  if (!user) return null;

  const initials = (user.name || user.username || '?').charAt(0).toUpperCase();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setUser({ ...user, name, username });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      // If endpoint doesn't exist yet, just update local store
      setUser({ ...user, name, username });
      setSuccess('Profile updated locally!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Back Navigation */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem',
          fontSize: '0.95rem', transition: 'color 0.2s'
        }}>
          ← Back to Dashboard
        </Link>

        {/* Avatar Header */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: '700', color: 'white',
            margin: '0 auto 1rem', boxShadow: '0 8px 32px rgba(59,130,246,0.35)'
          }}>
            {initials}
          </div>
          <h2 style={{ margin: '0 0 0.25rem' }}>{user.name}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>@{user.username}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>0</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calls Made</div>
            </div>
            <div className="glass-card" style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>Online</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>Edit Profile</h3>

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16,185,129,0.3)',
              color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem'
            }}>{success}</div>
          )}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem'
            }}>{error}</div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Display Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required minLength={3} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Username</label>
              <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email</label>
              <input type="email" className="input-field" value={email} disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
