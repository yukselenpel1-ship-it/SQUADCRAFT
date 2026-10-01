'use client';

import React, { useState } from 'react';
import { Player, Club, PlayerPosition } from '@/types/game';
import { FitnessIndicator } from './FitnessIndicator';
import { MoraleIndicator } from './MoraleIndicator';
import { ClubBadge } from './ClubBadge';
import { useGame } from '@/lib/context/GameContext';
import { AssignScoutModal } from './AssignScoutModal';
import { LoanOfferModal } from './LoanOfferModal';
import {
  X,
  Activity,
  Award,
  DollarSign,
  Bookmark,
  AlertTriangle,
  FileSignature,
  Compass,
  Handshake,
  Eye,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Shield,
  BarChart2,
  Calendar,
  FileText,
  Zap,
  Target,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface PlayerModalProps {
  player: Player | null;
  club?: Club;
  onClose: () => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (id: string) => void;
  onMakeBid?: (id: string) => void;
  onRenewContract?: (player: Player) => void;
}

type ModalTab = 'overview' | 'attributes' | 'stats' | 'contract';

// Helper for color-coding attributes
// <65: slate (#71717A), 65-74: amber (#FBBF24), 75-84: cyan (#00D4FF), 85+: emerald neon (#00F5A0)
const getAttributeTheme = (val: number | string) => {
  let num = 70;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    if (val === '?') {
      return {
        text: 'text-zinc-400',
        bg: 'bg-zinc-800/80',
        border: 'border-zinc-700',
        bar: '#52525B',
        glow: '',
      };
    }
    const parts = val.split(/[–-]/).map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      num = parts.reduce((a, b) => a + b, 0) / parts.length;
    }
  }

  if (num >= 85) {
    return {
      text: 'text-[#00F5A0]',
      bg: 'bg-[#00F5A0]/15',
      border: 'border-[#00F5A0]/50',
      bar: '#00F5A0',
      glow: 'shadow-[0_0_8px_rgba(0,245,160,0.35)]',
    };
  }
  if (num >= 75) {
    return {
      text: 'text-[#00D4FF]',
      bg: 'bg-[#00D4FF]/15',
      border: 'border-[#00D4FF]/50',
      bar: '#00D4FF',
      glow: 'shadow-[0_0_8px_rgba(0,212,255,0.35)]',
    };
  }
  if (num >= 65) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-400/15',
      border: 'border-amber-400/50',
      bar: '#FBBF24',
      glow: 'shadow-[0_0_8px_rgba(251,191,36,0.25)]',
    };
  }
  return {
    text: 'text-zinc-400',
    bg: 'bg-zinc-800/60',
    border: 'border-zinc-700/80',
    bar: '#71717A',
    glow: '',
  };
};

const getNumericPercent = (val: number | string): number => {
  if (typeof val === 'number') return Math.min(100, Math.max(0, val));
  if (typeof val === 'string') {
    if (val === '?') return 50;
    const parts = val.split(/[–-]/).map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
    if (parts.length > 0) {
      return Math.min(100, Math.max(0, parts.reduce((a, b) => a + b, 0) / parts.length));
    }
  }
  return 50;
};

// Modern Attribute Row with mini gauge bar
const ModernAttributeRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  const theme = getAttributeTheme(value);
  const percent = getNumericPercent(value);

  return (
    <div className="group py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{label}</span>
        <span
          className={`font-mono font-black text-xs px-2 py-0.5 rounded border transition-all ${theme.text} ${theme.bg} ${theme.border} ${theme.glow}`}
        >
          {value}
        </span>
      </div>
      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/80">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: theme.bar }}
        />
      </div>
    </div>
  );
};

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  club,
  onClose,
  isShortlisted = false,
  onToggleShortlist,
  onMakeBid,
  onRenewContract,
}) => {
  const { userClub, getMaskedPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [showScoutModal, setShowScoutModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);

  if (!player) return null;

  const isOwnPlayer = player.clubId === userClub.id;
  const masked = getMaskedPlayer(player);

  const ovrTheme = getAttributeTheme(masked.overallDisplay);
  const potTheme = getAttributeTheme(masked.potentialDisplay);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        {/* Modal Shell with EA FC / FUT dark neon aesthetic */}
        <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-[#070B14] sm:border sm:border-zinc-800 sm:rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden text-zinc-200">
          {/* Subtle neon top glow stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

          {/* =================================================================== */}
          {/* HERO HEADER (EA FC / FUT PRO AESTHETIC)                             */}
          {/* =================================================================== */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-b from-[#0B1224] via-[#080D1A] to-[#070B14] border-b border-zinc-800/80">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/70 transition-all shadow-md z-10"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Player identity & Club */}
              <div className="flex items-start sm:items-center gap-4">
                {club && (
                  <div className="shrink-0 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <ClubBadge
                      code={club.code}
                      primaryColor={club.primaryColor}
                      secondaryColor={club.secondaryColor}
                      size="lg"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {/* Archetype & Position Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                      {player.position}
                    </span>

                    {player.secondaryPositions?.map((sec) => (
                      <span
                        key={sec}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-800/80 text-zinc-300 border border-zinc-700"
                      >
                        {sec}
                      </span>
                    ))}

                    {player.archetype && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        {player.archetype}
                      </span>
                    )}

                    {player.isRisingTalent && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        ★ YÜKSELEN YETENEK
                      </span>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="pt-0.5">
                    <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400 block">
                      {player.firstName}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white uppercase leading-none">
                      {player.lastName}
                    </h2>
                  </div>

                  {/* Quick Physical & Bio bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 pt-1 font-mono">
                    <span className="text-zinc-200 font-bold">{club ? club.name : 'Kulüpsüz'}</span>
                    <span>•</span>
                    <span>{player.nationality}</span>
                    <span>•</span>
                    <span>{player.age} Yaş ({player.birthDate})</span>
                    <span>•</span>
                    <span>{player.height} cm / {player.weight} kg</span>
                    <span>•</span>
                    <span>
                      Ayak: <strong className="text-zinc-200">{player.preferredFoot}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Dual OVR & POT FUT-style Glow Badges */}
              <div className="flex items-center gap-3 shrink-0">
                {/* OVR BADGE */}
                <div
                  className={`flex flex-col items-center justify-center min-w-[74px] p-2.5 rounded-xl border backdrop-blur-md ${ovrTheme.bg} ${ovrTheme.border} ${ovrTheme.glow} transition-all`}
                >
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                    GENEL
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${ovrTheme.text}`}>
                    {masked.overallDisplay}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-zinc-500">OVR</span>
                </div>

                {/* POT BADGE */}
                <div
                  className={`flex flex-col items-center justify-center min-w-[74px] p-2.5 rounded-xl border backdrop-blur-md ${potTheme.bg} ${potTheme.border} ${potTheme.glow} transition-all`}
                >
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                    POTANSİYEL
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${potTheme.text}`}>
                    {masked.potentialDisplay}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-zinc-500">POT</span>
                </div>

                {/* FORM BADGE */}
                <div className="flex flex-col items-center justify-center min-w-[64px] p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                    FORM
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400 flex items-center">
                    {player.form}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-zinc-500">/ 10</span>
                </div>
              </div>
            </div>

            {/* Scouting Knowledge Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-zinc-300 font-bold font-mono">
                  {isOwnPlayer
                    ? 'Kendi Oyuncumuz (Tam Bilgi / Seviye 5)'
                    : `Gözlem Düzeyi: %${masked.knowledgePercentage} (Seviye ${masked.knowledgeLevel}/5)`}
                </span>
              </div>

              {!isOwnPlayer && (
                <div className="flex items-center gap-3">
                  <div className="w-28 sm:w-36 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00F5A0] rounded-full transition-all duration-300"
                      style={{ width: `${masked.knowledgePercentage}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setShowScoutModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 hover:bg-[#00D4FF]/30 transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Gözlemci Gönder
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* =================================================================== */}
          {/* 6 HORIZONTAL METRIC CARDS                                           */}
          {/* =================================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 p-4 bg-[#0A0F1D] border-b border-zinc-800 text-xs font-mono">
            {/* 1. Market Value */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Piyasa Değeri</span>
              <span className="text-sm font-black text-white">{masked.marketValueDisplay}</span>
            </div>

            {/* 2. Wage */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Haftalık Maaş</span>
              <span className="text-sm font-black text-[#00F5A0]">{masked.wageDisplay}</span>
            </div>

            {/* 3. Contract */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Sözleşme Bitiş</span>
              <span className="text-sm font-black text-amber-300">
                {player.contractUntil || player.contractEnd?.split('-')[0] || '2028'}
              </span>
            </div>

            {/* 4. Fitness */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Kondisyon</span>
              <div className="flex items-center gap-2">
                <FitnessIndicator value={player.fitness} isInjured={player.isInjured} />
                <span className="text-xs font-bold text-zinc-300">%{player.fitness}</span>
              </div>
            </div>

            {/* 5. Sharpness */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Maç Keskinliği</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-sm font-black text-[#00D4FF]">%{player.matchSharpness ?? 85}</span>
              </div>
            </div>

            {/* 6. Morale */}
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Moral</span>
              <MoraleIndicator value={player.morale} showText={true} />
            </div>
          </div>

          {/* =================================================================== */}
          {/* TABS NAVIGATION                                                     */}
          {/* =================================================================== */}
          <div className="flex items-center gap-1 px-4 sm:px-6 bg-[#080D1A] border-b border-zinc-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === 'overview'
                  ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              GENEL BAKIŞ
            </button>

            <button
              onClick={() => setActiveTab('attributes')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === 'attributes'
                  ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              NİTELİKLER
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === 'stats'
                  ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              SEZON İSTATİSTİKLERİ
            </button>

            <button
              onClick={() => setActiveTab('contract')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                activeTab === 'contract'
                  ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              SÖZLEŞME & KULÜP
            </button>
          </div>

          {/* =================================================================== */}
          {/* TAB CONTENTS (SCROLLABLE BODY)                                      */}
          {/* =================================================================== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Status alerts (Injuries / Suspensions) */}
            {(player.isInjured || player.isSuspended) && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300 font-mono">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="space-y-0.5">
                  {player.isInjured && (
                    <p>
                      <strong>SAKATLIK RAPORU:</strong> {player.injuryDetails?.type} ({player.injuryDetails?.daysRemaining} gün sahalardan uzak)
                    </p>
                  )}
                  {player.isSuspended && (
                    <p>
                      <strong>DİSİPLİN CEZASI:</strong> {player.suspensionDetails?.reason} ({player.suspensionDetails?.matchesRemaining} maç men)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: GENEL BAKIŞ */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Scout Report Summary Card (if scouted) */}
                {masked.latestReport ? (
                  <div className="p-4 rounded-xl bg-[#0B1528] border border-[#00D4FF]/30 space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#00D4FF]" />
                        <h4 className="text-xs font-black text-[#00D4FF] uppercase tracking-wider font-mono">
                          Gözlemci Raporu ({masked.latestReport.scoutName} • {masked.latestReport.date})
                        </h4>
                      </div>
                      <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-[#00D4FF]/20 text-cyan-200 border border-[#00D4FF]/40 w-fit">
                        Öneri: {masked.latestReport.recommendation} (Güven: %{masked.latestReport.confidence})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                        <strong className="text-[#00F5A0] block mb-1 font-mono uppercase">Güçlü Yönler:</strong>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300">
                          {masked.latestReport.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                        <strong className="text-rose-400 block mb-1 font-mono uppercase">Zayıf Yönler:</strong>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300">
                          {masked.latestReport.weaknesses.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-300 flex flex-wrap gap-4 font-mono">
                      {masked.personalityHint && <span><strong>Karakter:</strong> {masked.personalityHint}</span>}
                      {masked.consistencyHint && <span><strong>İstikrar:</strong> {masked.consistencyHint}</span>}
                      {masked.injuryHint && <span><strong>Sakatlık Eğilimi:</strong> {masked.injuryHint}</span>}
                    </div>
                  </div>
                ) : (
                  !isOwnPlayer && (
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-zinc-500 shrink-0" />
                        <div>
                          <p className="font-bold text-zinc-300">Detaylı Gözlem Raporu Bulunmuyor</p>
                          <p className="text-zinc-500">
                            Sis perdesini kaldırmak ve net nitelikleri görmek için bir gözlemci atayın.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowScoutModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90 transition-all font-mono uppercase shrink-0"
                      >
                        Gözlemci Gönder
                      </button>
                    </div>
                  )
                )}

                {/* Key Attributes Radar / Highlights */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2 font-mono">
                    <Flame className="w-4 h-4 text-[#00F5A0]" />
                    ÖNE ÇIKAN NİTELİKLER
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <ModernAttributeRow label="Hız (Pace)" value={masked.attributes.pace.displayString} />
                    <ModernAttributeRow label="Bitiricilik" value={masked.attributes.finishing.displayString} />
                    <ModernAttributeRow label="Pas Dağıtımı" value={masked.attributes.passing.displayString} />
                    <ModernAttributeRow label="Dribbling" value={masked.attributes.dribbling.displayString} />
                    <ModernAttributeRow label="Dayanıklılık" value={masked.attributes.stamina.displayString} />
                    <ModernAttributeRow label="Karar Verme" value={masked.attributes.decisions.displayString} />
                  </div>
                </div>

                {/* Player Archetype / Style Card */}
                <div className="p-4 rounded-xl bg-[#0F1424] border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#00D4FF]">
                    // OYUNCU PROFİLİ VE TAKTİKSEL UYUM
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase">Oyun Tarzı</span>
                      <span className="text-sm font-bold text-white">{player.archetype || 'Çok Yönlü Futbolcu'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase">Kadro Rolü</span>
                      <span className="text-sm font-bold text-white">{player.squadRole || 'İlk 11 Oyuncusu'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px] uppercase">Gelişim Eğrisi</span>
                      <span className="text-sm font-bold text-[#00F5A0]">
                        {player.hiddenAttributes?.developmentCurve === 'EARLY_PEAK'
                          ? 'Erken Zirve'
                          : player.hiddenAttributes?.developmentCurve === 'LATE_BLOOMER'
                          ? 'Geç Açılan'
                          : 'Dengeli Gelişim'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NİTELİKLER (3-COLUMN EA FC STYLE) */}
            {activeTab === 'attributes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00F5A0]" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                      FUTBOLCU NİTELİK TABLOSU
                    </span>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00F5A0]" /> 85+ Elit
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00D4FF]" /> 75-84 İyi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> 65-74 Orta
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-500" /> &lt;65 Zayıf
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Kolon 1: Teknik & Hücum */}
                  <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800/90 space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#00F5A0] pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                      <span>Teknik & Hücum</span>
                      <Target className="w-3.5 h-3.5" />
                    </h4>
                    <ModernAttributeRow label="Bitiricilik" value={masked.attributes.finishing.displayString} />
                    <ModernAttributeRow label="Uzaktan Şut" value={masked.attributes.longShots.displayString} />
                    <ModernAttributeRow label="Pas Dağıtımı" value={masked.attributes.passing.displayString} />
                    <ModernAttributeRow label="Vizyon (Oyun Görüşü)" value={masked.attributes.vision.displayString} />
                    <ModernAttributeRow label="Orta Açma" value={masked.attributes.crossing.displayString} />
                    <ModernAttributeRow label="Dribbling (Top Sürme)" value={masked.attributes.dribbling.displayString} />
                    <ModernAttributeRow label="Teknik" value={masked.attributes.technique.displayString} />
                    <ModernAttributeRow label="Kafa Vuruşu" value={masked.attributes.heading.displayString} />
                  </div>

                  {/* Kolon 2: Fizik & Savunma */}
                  <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800/90 space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#00D4FF] pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                      <span>Fizik & Savunma</span>
                      <Shield className="w-3.5 h-3.5" />
                    </h4>
                    <ModernAttributeRow label="Hız (Pace)" value={masked.attributes.pace.displayString} />
                    <ModernAttributeRow label="Hızlanma" value={masked.attributes.acceleration.displayString} />
                    <ModernAttributeRow label="Güç" value={masked.attributes.strength.displayString} />
                    <ModernAttributeRow label="Dayanıklılık" value={masked.attributes.stamina.displayString} />
                    <ModernAttributeRow label="Top Çalma (Tackling)" value={masked.attributes.tackling.displayString} />
                    <ModernAttributeRow label="Markaj" value={masked.attributes.marking.displayString} />
                    <ModernAttributeRow label="Pozisyon Alma" value={masked.attributes.positioning.displayString} />
                  </div>

                  {/* Kolon 3: Zihinsel & Kaleci */}
                  <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800/90 space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                      <span>Zihinsel & Özel</span>
                      <Award className="w-3.5 h-3.5" />
                    </h4>
                    <ModernAttributeRow label="Soğukkanlılık" value={masked.attributes.composure.displayString} />
                    <ModernAttributeRow label="Karar Verme" value={masked.attributes.decisions.displayString} />
                    <ModernAttributeRow label="Takım Oyunu" value={masked.attributes.teamwork.displayString} />
                    <ModernAttributeRow label="Liderlik" value={masked.attributes.leadership.displayString} />
                    <ModernAttributeRow label="Agresiflik" value={masked.attributes.aggression.displayString} />

                    {player.position === 'GK' && (
                      <div className="pt-2 mt-2 border-t border-zinc-800 space-y-1">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300 block">
                          // KALECİLİK
                        </span>
                        <ModernAttributeRow
                          label="Elle Kontrol"
                          value={masked.attributes.handling.displayString}
                        />
                        <ModernAttributeRow
                          label="Refleksler"
                          value={masked.attributes.reflexes.displayString}
                        />
                        <ModernAttributeRow
                          label="Pozisyon (GK)"
                          value={masked.attributes.positioningGK.displayString}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEZON İSTATİSTİKLERİ */}
            {activeTab === 'stats' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#00F5A0]" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                      2026/27 SEZON İSTATİSTİK DÖKÜMÜ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Toplam Maç</span>
                    <span className="text-2xl font-black text-white">
                      {player.seasonStats?.appearances ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Goller</span>
                    <span className="text-2xl font-black text-[#00F5A0]">
                      {player.seasonStats?.goals ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Asistler</span>
                    <span className="text-2xl font-black text-[#00D4FF]">
                      {player.seasonStats?.assists ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Ortalama Puan</span>
                    <span className="text-2xl font-black text-amber-300">
                      {player.seasonStats?.averageRating ? player.seasonStats.averageRating.toFixed(2) : '-'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Golsüz Maç</span>
                    <span className="text-2xl font-black text-white">
                      {player.seasonStats?.cleanSheets ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Sarı Kartlar</span>
                    <span className="text-2xl font-black text-amber-400">
                      {player.seasonStats?.yellowCards ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Kırmızı Kartlar</span>
                    <span className="text-2xl font-black text-rose-500">
                      {player.seasonStats?.redCards ?? 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Maç Formu</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {player.form} / 10
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SÖZLEŞME & KULÜP */}
            {activeTab === 'contract' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00F5A0]" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                      SÖZLEŞME, KULÜP VE GİZLİ KARAKTER PROFİLİ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  {/* Sol: Sözleşme Şartları */}
                  <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#00F5A0] pb-2 border-b border-zinc-800">
                      Finansal Sözleşme Detayları
                    </h4>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Mevcut Kulüp:</span>
                      <span className="font-bold text-white">{club ? club.name : 'Kulüpsüz'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Haftalık Maaş:</span>
                      <span className="font-bold text-[#00F5A0]">{masked.wageDisplay}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Yıllık Maliyet:</span>
                      <span className="font-bold text-zinc-200">
                        €{(player.wage * 52).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Sözleşme Bitişi:</span>
                      <span className="font-bold text-amber-400">
                        {player.contractUntil || player.contractEnd || '30.06.2028'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400">Serbest Kalma Bedeli:</span>
                      <span className="font-bold text-zinc-300">
                        {player.releaseClause ? `€${player.releaseClause.toLocaleString('tr-TR')}` : 'Yok'}
                      </span>
                    </div>
                  </div>

                  {/* Sağ: Transfer & Karakter Durumu */}
                  <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#00D4FF] pb-2 border-b border-zinc-800">
                      Transfer ve Karakter Analizi
                    </h4>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Transfer Listesi:</span>
                      <span className="font-bold text-white">
                        {player.isTransferListed ? 'Satılık Listesinde' : 'Kulüpte Mutlu'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Kiralık Durumu:</span>
                      <span className="font-bold text-zinc-300">
                        {player.isLoaned ? `Kiralık (${player.parentClubName || 'Başka Kulüp'})` : 'Bonservisli'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Profesyonellik:</span>
                      <span className="font-bold text-zinc-200">
                        {isOwnPlayer || masked.knowledgeLevel >= 4
                          ? player.hiddenAttributes?.professionalism ? `%${player.hiddenAttributes.professionalism}` : 'Standart'
                          : '? (Bilinmiyor)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Büyük Maç Performansı:</span>
                      <span className="font-bold text-zinc-200">
                        {isOwnPlayer || masked.knowledgeLevel >= 4
                          ? player.hiddenAttributes?.bigMatchPerformance ? `%${player.hiddenAttributes.bigMatchPerformance}` : 'Normal'
                          : '? (Bilinmiyor)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400">İstikrar Düzeyi:</span>
                      <span className="font-bold text-zinc-200">
                        {isOwnPlayer || masked.knowledgeLevel >= 4
                          ? player.hiddenAttributes?.consistency ? `%${player.hiddenAttributes.consistency}` : 'Güvenilir'
                          : '? (Bilinmiyor)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* CONTEXT-SENSITIVE STICKY ACTION FOOTER                              */}
          {/* =================================================================== */}
          <div className="p-3 sm:p-4 bg-[#080D1A] border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {onToggleShortlist && (
                <button
                  onClick={() => onToggleShortlist(player.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all ${
                    isShortlisted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isShortlisted ? 'Gözlem Listesinden Çıkar' : 'Gözlem Listesine Ekle'}
                  </span>
                  <span className="sm:hidden">{isShortlisted ? 'Listeden Çıkar' : 'Listeye Ekle'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Kirala Button */}
              {!isOwnPlayer && player.clubId !== 'FREE_AGENT' && (
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold font-mono text-xs bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40 hover:bg-[#00D4FF]/30 transition-all"
                >
                  <Handshake className="w-3.5 h-3.5" />
                  Kirala
                </button>
              )}

              {/* Sözleşme Yenile (Own Player) */}
              {onRenewContract && isOwnPlayer && (
                <button
                  onClick={() => onRenewContract(player)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black font-mono text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  Sözleşme Yenile
                </button>
              )}

              {/* Bonservis Pazarlığı (Market Player) */}
              {onMakeBid && !isOwnPlayer && (
                <button
                  onClick={() => onMakeBid(player.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black font-mono text-xs bg-[#00F5A0] text-black hover:bg-[#00D68B] transition-all shadow-lg shadow-emerald-500/20"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Bonservis Pazarlığı
                </button>
              )}

              {/* Kapat */}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-bold font-mono text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scout Modal */}
      {showScoutModal && (
        <AssignScoutModal
          player={player}
          onClose={() => setShowScoutModal(false)}
        />
      )}

      {/* Loan Offer Modal */}
      {showLoanModal && (
        <LoanOfferModal
          player={player}
          onClose={() => setShowLoanModal(false)}
        />
      )}
    </>
  );
};
