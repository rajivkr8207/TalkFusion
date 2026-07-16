import React from 'react';

export default function ActiveUsersList({ users, currentUser, onCallUser }) {
  return (
    <div className="glass p-4 md:p-6 mt-2">
      <h3 className="text-base font-semibold mb-5">
        Active Users <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">{users.length}</span>
      </h3>

      {users.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">No other users are currently online.</p>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const displayName = u.name || u.username || 'User';
            const displayUsername = u.username || '';
            const initial = displayName.charAt(0).toUpperCase();
            const isCurrentUser = currentUser && currentUser.id === u.userId;
            const canCall = !isCurrentUser && u.status === 'online';

            return (
              <div
                key={u.socketId || u.userId}
                className="glass-card flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {initial}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white">{displayName}</div>
                    {displayUsername && (
                      <div className="text-xs text-slate-400">@{displayUsername}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span className={`status-dot ${u.status === 'in-call' ? 'in-call' : ''}`} />
                    <span className="text-xs text-slate-400">{u.status || 'online'}</span>
                  </div>
                  {canCall && (
                    <button
                      onClick={() => onCallUser(u)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
                    >
                      Call
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
