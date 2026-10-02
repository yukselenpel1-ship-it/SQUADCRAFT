'use client';

import React, { useState, useEffect } from 'react';
import { DraftClub, DraftFixture, LiveMatchweekState, RoomMember } from '@/lib/draft/types';
import { BadgePreview } from './BadgePreview';
import {
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Zap,
  Users,
  Shield,
  Activity,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface MatchweekReadyBannerProps {
  matchweek: number;
  totalMatchweeks: number;
  liveMatchweek?: LiveMatchweekState;
  members: RoomMember[];
  clubs: DraftClub[];
  currentMemberId?: string;
  isHost: boolean;
  onToggleReady: (isReady: boolean) => void;
  onLaunchMatchweek: () => void;
  onOpenLiveMatch: () => void;
}

export function MatchweekReadyBanner({
  matchweek,
  totalMatchweeks,
  liveMatchweek,
  members,
  clubs,
  currentMemberId,
  isHost,
  onToggleReady,
  onLaunchMatchweek,
  onOpenLiveMatch,
}: MatchweekReadyBannerProps) {
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Filter active human & bot members
  const activeMembers = members.filter((m) => !m.isSpectator && !m.sessionId?.startsWith('removed-'));
  const humanMembers = activeMembers.filter((m) => !m.isBot);

  const readyMemberIds = new Set(liveMatchweek?.readyMemberIds || []);
  const isCurrentMemberReady = currentMemberId ? readyMemberIds.has(currentMemberId) : false;

  const allHumansReady =
    humanMembers.length > 0 && humanMembers.every((m) => readyMemberIds.has(m.id));

  const status = liveMatchweek?.status || 'PREPARING';

  // Handle countdown effect
  useEffect(() => {
    if (status === 'COUNTDOWN' && liveMatchweek?.countdownStartedAt) {
      const startMs = new Date(liveMatchweek.countdownStartedAt).getTime();
      const updateCd = () => {
        const elapsed = Math.floor((Date.now() - startMs) / 1000);
        const remaining = Math.max(0, 3 - elapsed);
        setCountdownSeconds(remaining);
        if (remaining === 0) {
          // Trigger launch if host or timeout
          onLaunchMatchweek();
        }
      };
      updateCd();
      const interval = setInterval(updateCd, 250);
      return () => clearInterval(interval);
    } else {
      setCountdownSeconds(null);
    }
  }, [status, liveMatchweek?.countdownStartedAt, onLaunchMatchweek]);

  return (
    <div className="bg-[#070D14]/95 border-2 border-zinc-800 p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Top Accent Gradient Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${
          status === 'LIVE'
            ? 'bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 animate-pulse'
            : status === 'COUNTDOWN'
            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-ping'
            : 'bg-gradient-to-r from-[#C7FF38] via-[#4FE4FF] to-[#C7FF38]'
        }`}
      />

      {/* Main Header & Stage Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-black px-2.5 py-0.5 bg-[#C7FF38]/10 border border-[#C7FF38]/40 text-[#C7FF38] uppercase tracking-wider">
              HAFTA {matchweek} / {totalMatchweeks}
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#4FE4FF]" />
              ÇOK OYUNCULU HAZIRLIK SİSTEMİ
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-wider font-display mt-1">
            {status === 'LIVE'
              ? '🔴 TÜM SAHALARDA CANLI MAÇLAR OYNANIYOR'
              : status === 'COUNTDOWN'
              ? '⏳ GERİ SAYIM BAŞLADI — DÜDÜK ÇALMAK ÜZERE!'
              : 'HAFTANIN MAÇLARI İÇİN HAZIRLIK MERKEZİ'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {status === 'LIVE'
              ? 'Maçlar tüm cihazlarda eşzamanlı devam ediyor. Yayına katılabilirsiniz.'
              : status === 'COUNTDOWN'
              ? 'Tüm menajerler hazır verdi! Maçlar başlamadan önce hazır durumunuzu geri çekebilirsiniz.'
              : 'Tüm menajerler HAZIR butonuna bastığında haftanın tüm maçları aynı anda senkronize başlar.'}
          </p>
        </div>

        {/* Big Action Button (FM Style Thumb-Friendly) */}
        <div className="flex items-center gap-3">
          {status === 'PREPARING' && (
            <button
              onClick={() => onToggleReady(!isCurrentMemberReady)}
              className={`w-full sm:w-auto px-8 py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl active:scale-95 ${
                isCurrentMemberReady
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-2 border-amber-500/50 shadow-amber-500/10'
                  : 'bg-gradient-to-r from-[#C7FF38] to-[#00D485] hover:from-[#00E590] text-black border-2 border-[#C7FF38] shadow-[0_0_20px_rgba(0,245,160,0.35)]'
              }`}
            >
              {isCurrentMemberReady ? (
                <>
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>HAZIR VERİLDİ (İPTAL ET)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 fill-current" />
                  <span>HAZIR</span>
                </>
              )}
            </button>
          )}

          {status === 'COUNTDOWN' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-base sm:text-lg font-mono tracking-widest flex items-center justify-center gap-2 animate-bounce shadow-xl">
                <span>BAŞLIYOR:</span>
                <span className="text-xl sm:text-2xl font-black">{countdownSeconds ?? 3}s</span>
              </div>
              <button
                onClick={() => onToggleReady(false)}
                className="px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-rose-500/40 text-xs font-black uppercase tracking-wider transition"
                title="Geri sayımı durdur ve hazırlanmaya geri dön"
              >
                İPTAL
              </button>
            </div>
          )}

          {status === 'LIVE' && (
            <button
              onClick={onOpenLiveMatch}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2.5 animate-pulse"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>CANLI MAÇ YAYININA GEÇ</span>
            </button>
          )}
        </div>
      </div>

      {/* Managers Ready Status Badges Grid */}
      <div className="mt-4 pt-2">
        <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Menajer Durumları ({readyMemberIds.size + activeMembers.filter((m) => m.isBot).length}/{activeMembers.length})</span>
          <span className="text-zinc-500">
            {allHumansReady ? '✅ Herkes Hazır' : '⏳ Hazır Bekleniyor'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {activeMembers.map((member) => {
            const club = clubs.find((c) => c.memberId === member.id);
            const isBot = !!member.isBot;
            const isReady = isBot || readyMemberIds.has(member.id);
            const isMe = member.id === currentMemberId;

            return (
              <div
                key={member.id}
                className={`p-2.5 border transition-all flex items-center justify-between gap-3 ${
                  isReady
                    ? 'bg-[#C7FF38]/5 border-[#C7FF38]/40'
                    : 'bg-zinc-950/70 border-zinc-800/80'
                } ${isMe ? 'ring-1 ring-[#C7FF38]/30' : ''}`}
              >
                {/* Member / Club Info */}
                <div className="flex items-center gap-2.5 truncate flex-1">
                  {club && <BadgePreview badge={club.badge} clubCode={club.code} size={28} />}
                  <div className="truncate">
                    <div className="text-xs font-black text-white uppercase italic tracking-wide truncate flex items-center gap-1.5">
                      <span>{member.username}</span>
                      {isMe && (
                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 bg-[#C7FF38] text-black">
                          SEN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {club?.name || 'Takım'}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isBot ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/50 border border-[#4FE4FF]/40 text-[#4FE4FF]">
                      <span>🤖 Bot</span>
                      <CheckCircle2 className="w-3 h-3 text-[#C7FF38]" />
                    </span>
                  ) : isReady ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-black bg-emerald-950/50 border border-emerald-500/50 text-[#C7FF38]">
                      <CheckCircle2 className="w-3 h-3 text-[#C7FF38]" />
                      <span>HAZIR</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-400">
                      <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>BEKLENİYOR</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
