import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';

export default function Controls({ 
  micOn, toggleMic, 
  videoOn, toggleVideo, 
  speakerOn, toggleSpeaker, 
  onEndCall 
}) {
  return (
    <div className="flex gap-2 sm:gap-4 justify-center">
      <button 
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${micOn ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 ring-1 ring-white/10 hover:ring-blue-500/50' : 'bg-red-500 hover:bg-red-600 text-white ring-1 ring-red-500/50'}`} 
        onClick={toggleMic}
      >
        {micOn ? <Mic size={20} className="sm:w-6 sm:h-6" /> : <MicOff size={20} className="sm:w-6 sm:h-6" />}
      </button>

      <button 
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${videoOn ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 ring-1 ring-white/10 hover:ring-blue-500/50' : 'bg-red-500 hover:bg-red-600 text-white ring-1 ring-red-500/50'}`} 
        onClick={toggleVideo}
      >
        {videoOn ? <Video size={20} className="sm:w-6 sm:h-6" /> : <VideoOff size={20} className="sm:w-6 sm:h-6" />}
      </button>

      <button 
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${speakerOn ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 ring-1 ring-white/10 hover:ring-blue-500/50' : 'bg-red-500 hover:bg-red-600 text-white ring-1 ring-red-500/50'}`} 
        onClick={toggleSpeaker}
      >
        {speakerOn ? <Volume2 size={20} className="sm:w-6 sm:h-6" /> : <VolumeX size={20} className="sm:w-6 sm:h-6" />}
      </button>

      <button 
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 transition-all hover:scale-105" 
        onClick={onEndCall} 
      >
        <PhoneOff size={20} className="sm:w-6 sm:h-6" />
      </button>
    </div>
  );
}
