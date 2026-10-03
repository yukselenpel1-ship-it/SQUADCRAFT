import React, { useState } from 'react';
import { RoomFullState } from '@/lib/draft/multiplayerStore';
import { getRecentActionLogs } from '@/lib/draft/logger';

interface AlphaDebugOverlayProps {
  roomState: RoomFullState;
  sessionId: string;
}

export const AlphaDebugOverlay: React.FC<AlphaDebugOverlayProps> = ({ roomState, sessionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const { room, members, draftState } = roomState;
  const currentMember = members.find((m) => m.sessionId === sessionId);
  const isHost = currentMember?.isHost || false;

  const logs = getRecentActionLogs(10);

  const shortenId = (id: string) => {
    if (!id) return '--';
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  const currentPicker = draftState?.currentTurnMemberId
    ? members.find((m) => m.id === draftState.currentTurnMemberId)?.username || draftState.currentTurnMemberId
    : '--';

  const deadlineRemainingSec = draftState?.pickDeadline
    ? Math.max(0, Math.ceil((draftState.pickDeadline - Date.now()) / 1000))
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 bg-[#0B1323]/95 hover:bg-[#182338] border border-purple-500/50 text-purple-300 text-xs font-mono font-bold rounded-xl shadow-2xl backdrop-blur transition flex items-center gap-1.5"
        >
          <span>🛠️</span>
          <span>Alpha Debug</span>
          <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
        </button>
      )}

      {/* Expanded Debug Panel */}
      {isOpen && (
        <div className="sc-panel border border-purple-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl w-80 sm:w-96 text-xs text-zinc-300 space-y-3 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#182338] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold font-mono">🛠️ ALPHA DEBUG PANEL</span>
              <span className="px-1.5 py-0.2 bg-purple-950 text-purple-200 text-[10px] rounded font-bold border border-purple-800">
                v{room.stateVersion || 1}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">Room Code:</span>
              <span className="font-bold text-[#00F5A0]">{room.roomCode}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">Room ID:</span>
              <span className="text-zinc-300">{shortenId(room.id)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">My Session ID:</span>
              <span className="text-[#00D4FF] font-bold">{shortenId(sessionId)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">Host Member:</span>
              <span className="text-amber-300 font-semibold">
                {members.find((m) => m.id === room.hostMemberId)?.username || 'Host'} ({isHost ? 'SEN' : 'Diğer'})
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">Room Status:</span>
              <span className="font-bold text-white">{room.status}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">State Version:</span>
              <span className="text-purple-300 font-bold">v{room.stateVersion || 1}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#182338]">
              <span className="text-zinc-500">Realtime Engine:</span>
              <span className="text-[#00F5A0] font-semibold">Authoritative State (Sync OK)</span>
            </div>
            {draftState && (
              <>
                <div className="flex justify-between py-0.5 border-b border-[#182338]">
                  <span className="text-zinc-500">Draft Turn:</span>
                  <span className="text-[#00F5A0] font-bold">{currentPicker}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[#182338]">
                  <span className="text-zinc-500">Turn Deadline:</span>
                  <span className="text-amber-400 font-bold">{deadlineRemainingSec}s remaining</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[#182338]">
                  <span className="text-zinc-500">Overall Pick:</span>
                  <span className="text-white font-bold">
                    #{draftState.picks.length + 1} / {room.rules.squadSize * members.filter((m) => !m.isSpectator).length}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-0.5">
              <span className="text-zinc-500">Last Sync:</span>
              <span className="text-zinc-400">{new Date(room.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Members Table */}
          <div className="pt-2 border-t border-[#182338]">
            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Bağlı Menajerler ({members.length})
            </div>
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-1.5 bg-[#070D1A] rounded-lg border border-[#182338] text-[10px] font-mono"
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${m.isConnected ? 'bg-[#00F5A0]' : 'bg-zinc-600'}`} />
                    <span className="text-white font-bold truncate max-w-[90px]">{m.username}</span>
                    {m.isHost && <span className="text-amber-400">[H]</span>}
                  </div>
                  <span className="text-zinc-500">{shortenId(m.sessionId)}</span>
                  <span className={m.isReady ? 'text-[#00F5A0] font-bold' : 'text-zinc-500'}>
                    {m.isReady ? 'READY' : 'WAIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Logs Toggle */}
          <div className="pt-1">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full py-1 text-center text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 bg-purple-950/40 border border-purple-900/60 rounded-lg transition"
            >
              {showLogs ? '▲ Olay Günlüklerini Gizle' : `▼ Son Olayları Göster (${logs.length})`}
            </button>

            {showLogs && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto font-mono text-[9px] bg-[#070D1A] p-2 rounded-lg border border-[#182338]">
                {logs.length === 0 ? (
                  <div className="text-zinc-500 text-center">Kayıt yok.</div>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="border-b border-[#182338] pb-1">
                      <div className="flex justify-between text-zinc-400">
                        <span className={l.success ? 'text-[#00F5A0] font-bold' : 'text-rose-400 font-bold'}>
                          {l.action}
                        </span>
                        <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-zinc-500">
                        v{l.previousStateVersion} → v{l.resultingStateVersion} • Sess: {shortenId(l.sessionId)}
                        {l.errorCode && <span className="text-rose-400 ml-1">[{l.errorCode}]</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
