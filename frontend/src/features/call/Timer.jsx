import React, { useEffect, useState } from 'react';

export default function Timer({ isActive }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: '600'
    }}>
      {formatTime(seconds)}
    </div>
  );
}
