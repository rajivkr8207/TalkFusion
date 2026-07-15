import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';

export default function Controls({ 
  micOn, toggleMic, 
  videoOn, toggleVideo, 
  speakerOn, toggleSpeaker, 
  onEndCall 
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
      <button 
        className={`btn-icon ${micOn ? 'active' : ''}`} 
        onClick={toggleMic}
        style={{ background: micOn ? 'var(--bg-glass)' : 'rgba(239, 68, 68, 0.8)' }}
      >
        {micOn ? <Mic size={24} /> : <MicOff size={24} />}
      </button>

      <button 
        className={`btn-icon ${videoOn ? 'active' : ''}`} 
        onClick={toggleVideo}
        style={{ background: videoOn ? 'var(--bg-glass)' : 'rgba(239, 68, 68, 0.8)' }}
      >
        {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
      </button>

      <button 
        className={`btn-icon ${speakerOn ? 'active' : ''}`} 
        onClick={toggleSpeaker}
        style={{ background: speakerOn ? 'var(--bg-glass)' : 'rgba(239, 68, 68, 0.8)' }}
      >
        {speakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <button 
        className="btn-icon" 
        onClick={onEndCall} 
        style={{ background: 'var(--danger)', color: 'white' }}
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
}
