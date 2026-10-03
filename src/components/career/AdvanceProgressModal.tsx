import React from 'react';
import Link from 'next/link';
import { DailyProcessingResult } from '@/lib/career/types';
import { formatDateTurkish } from '@/lib/career/calendar';
import {
  Calendar,
  Swords,
  DollarSign,
  HeartPulse,
  Award,
  CheckCircle2,
  ArrowRight,
  Flame,
  AlertTriangle,
  X,
} from 'lucide-react';

interface AdvanceProgressModalProps {
  result: DailyProcessingResult | null;
  onClose: () => void;
}

export const AdvanceProgressModal: React.FC<AdvanceProgressModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  const isMatchDay = result.hasUserMatch || result.stoppedReason === 'MATCH_DAY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#07101C]/95 border border-[#14233A] rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl space-y-5 text-zinc-200 overflow-hidden">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#081325] hover:bg-[#121D33] border border-[#14233A] text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isMatchDay
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-[#00F5A0] border border-emerald-500/30'
              }`}
            >
              {isMatchDay ? '🔴 MAÇ GÜNÜNE ULAŞILDI' : 'ZAMAN İLERLETİLDİ'}
            </span>
            <span className="text-xs text-zinc-400 font-bold">
              {result.daysProcessed} gün işlendi
            </span>
          </div>

          <h2 className="text-xl font-black text-white">
            {formatDateTurkish(result.currentDate)}
          </h2>
        </div>

        {/* Highlighted Events Box */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {result.eventsTriggered.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
              Bu süre zarfında rutin antrenman ve dinlenme programı uygulandı.
            </div>
          ) : (
            result.eventsTriggered.map((ev, i) => {
              const isMatch = ev.includes('MAÇ GÜNÜ');
              const isTransfer = ev.includes('transfer');
              const isInjury = ev.includes('sakatlık');

              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                    isMatch
                      ? 'bg-rose-950/30 border-rose-500/40 text-white font-bold'
                      : isTransfer
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                  }`}
                >
                  {isMatch ? (
                    <Swords className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : isTransfer ? (
                    <DollarSign className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  ) : isInjury ? (
                    <HeartPulse className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <span>{ev}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          {isMatchDay && result.userMatchFixtureId ? (
            <Link
              href={`/match/${result.userMatchFixtureId}`}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-[#00F5A0] to-[#00E590] text-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Swords className="w-4 h-4" />
              <span>Maç Merkezine Git</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-[#00F5A0] text-black hover:bg-[#00E590] transition-colors"
            >
              Tamam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
