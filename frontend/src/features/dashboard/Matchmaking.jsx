import React from 'react';
import { Users } from 'lucide-react';

export default function Matchmaking({ isSearching, onJoin, onLeave }) {
  return (
    <div className="glass p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isSearching ? 'bg-blue-500/20 animate-pulse' : 'bg-white/5'}`}>
          <Users size={40} color={isSearching ? '#3b82f6' : '#94a3b8'} />
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-3">Random Matchmaking</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
        {isSearching
          ? 'Searching for an available user to connect with…'
          : 'Connect instantly with a random user online right now.'}
      </p>
      {isSearching ? (
        <button
          onClick={onLeave}
          className="w-48 py-3 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold transition-all hover:scale-[1.02]"
        >
          Cancel Search
        </button>
      ) : (
        <button
          onClick={onJoin}
          className="w-48 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-[1.02]"
        >
          Find Random Call
        </button>
      )}
    </div>
  );
}
