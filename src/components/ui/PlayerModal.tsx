'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Flame,
  Star,
  Trophy,
  Wind,
  Crosshair,
  Dumbbell,
  ShieldCheck,
  User,
  Layers,
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

type ModalTab = 'bio' | 'attributes' | 'playstyles' | 'stats' | 'contract';

// FIFA / EA FC Color Tier System
// 90+: Emerald Neon (#00F5A0)
// 80-89: Vivid Green (#22C55E)
// 70-79: Gold/Amber (#FBBF24)
// 60-69: Orange (#F97316)
// <60: Slate/Red (#71717A / #EF4444)
export const getFifaColorTier = (val: number | string) => {
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

  if (num >= 90) {
    return {
      text: 'text-[#00F5A0]',
      bg: 'bg-[#00F5A0]/15',
      border: 'border-[#00F5A0]/50',
      bar: '#00F5A0',
      glow: 'shadow-[0_0_12px_rgba(0,245,160,0.4)]',
    };
  }
  if (num >= 80) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      bar: '#22C55E',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    };
  }
  if (num >= 70) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-400/15',
      border: 'border-amber-400/40',
      bar: '#FBBF24',
      glow: 'shadow-[0_0_8px_rgba(251,191,36,0.25)]',
    };
  }
  if (num >= 60) {
    return {
      text: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/40',
      bar: '#F97316',
      glow: '',
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

// Compute FIFA Card Face Stats (PAC, SHO, PAS, DRI, DEF, PHY) or GK (DIV, HAN, KIC, REF, SPD, POS)
const calculateFifaCardFaceStats = (p: Player, masked: any) => {
  const isGK = p.position === 'GK';
  const getVal = (exact: number, maskedRange?: any) => {
    if (masked && maskedRange) {
      if (maskedRange.isUnknown) return '?';
      if (maskedRange.exact !== undefined) return maskedRange.exact;
      if (maskedRange.min !== undefined && maskedRange.max !== undefined) {
        return Math.round((maskedRange.min + maskedRange.max) / 2);
      }
    }
    return exact;
  };

  const a = p.attributes;
  const m = masked?.attributes || {};

  const v = {
    finishing: getVal(a.finishing, m.finishing),
    longShots: getVal(a.longShots, m.longShots),
    passing: getVal(a.passing, m.passing),
    vision: getVal(a.vision, m.vision),
    crossing: getVal(a.crossing, m.crossing),
    dribbling: getVal(a.dribbling, m.dribbling),
    technique: getVal(a.technique, m.technique),
    heading: getVal(a.heading, m.heading),
    pace: getVal(a.pace, m.pace),
    acceleration: getVal(a.acceleration, m.acceleration),
    strength: getVal(a.strength, m.strength),
    stamina: getVal(a.stamina, m.stamina),
    tackling: getVal(a.tackling, m.tackling),
    marking: getVal(a.marking, m.marking),
    positioning: getVal(a.positioning, m.positioning),
    composure: getVal(a.composure, m.composure),
    decisions: getVal(a.decisions, m.decisions),
    handling: getVal(a.handling || 65, m.handling),
    reflexes: getVal(a.reflexes || 65, m.reflexes),
    positioningGK: getVal(a.positioningGK || 65, m.positioningGK),
  };

  const safeNum = (val: any, fallback = 70) => (typeof val === 'number' ? val : fallback);

  if (isGK) {
    return [
      { key: 'DIV', label: 'UÇUŞ', value: safeNum(v.reflexes) },
      { key: 'HAN', label: 'TUTUŞ', value: safeNum(v.handling) },
      { key: 'KIC', label: 'DEGAJ', value: Math.round(safeNum(v.passing) * 0.75 + safeNum(v.technique) * 0.25) },
      { key: 'REF', label: 'REFLEKS', value: safeNum(v.reflexes) },
      { key: 'SPD', label: 'HIZ', value: Math.round((safeNum(v.pace) + safeNum(v.acceleration)) / 2) },
      { key: 'POS', label: 'POZİSYON', value: safeNum(v.positioningGK) },
    ];
  }

  const pac = Math.round((safeNum(v.pace) + safeNum(v.acceleration)) / 2);
  const sho = Math.round(safeNum(v.finishing) * 0.45 + safeNum(v.longShots) * 0.35 + safeNum(v.heading) * 0.2);
  const pas = Math.round(safeNum(v.passing) * 0.45 + safeNum(v.vision) * 0.35 + safeNum(v.crossing) * 0.2);
  const dri = Math.round(safeNum(v.dribbling) * 0.45 + safeNum(v.technique) * 0.35 + safeNum(v.composure) * 0.2);
  const def = Math.round(safeNum(v.tackling) * 0.4 + safeNum(v.marking) * 0.35 + safeNum(v.positioning) * 0.25);
  const phy = Math.round(safeNum(v.strength) * 0.45 + safeNum(v.stamina) * 0.4 + safeNum(v.decisions) * 0.15);

  return [
    { key: 'PAC', label: 'HIZ', value: pac },
    { key: 'SHO', label: 'ŞUT', value: sho },
    { key: 'PAS', label: 'PAS', value: pas },
    { key: 'DRI', label: 'DRİBLİNG', value: dri },
    { key: 'DEF', label: 'DEFANS', value: def },
    { key: 'PHY', label: 'FİZİK', value: phy },
  ];
};

// Compute EA FC PlayStyles derived from player attributes & position
interface PlayStyle {
  id: string;
  name: string;
  category: 'Şut' | 'Pas' | 'Top Kontrolü' | 'Defans' | 'Fizik' | 'Kaleci';
  description: string;
  isPlus?: boolean;
}

const archetypePlayStyleMap: Record<string, PlayStyle> = {
  'Hızlı Kanat': {
    id: 'rapid-plus',
    name: 'Roket Hızlanma',
    category: 'Top Kontrolü',
    description: 'Topla depar atarken maksimum sprint hızına rekor sürede ulaşır.',
    isPlus: true,
  },
  'Oyun Kurucu Kanat': {
    id: 'whipped-cross-plus',
    name: 'Kavisli Orta',
    category: 'Pas',
    description: 'Kanatlardan ceza sahasına adrese teslim kavisli ortalar keser.',
    isPlus: true,
  },
  'Oyun Kurucu': {
    id: 'tiki-taka-plus',
    name: 'Tiki-Taka & Vizyon',
    category: 'Pas',
    description: 'Baskı altında ilk dokunuşla tek pas yaparak hücumu yönlendirir.',
    isPlus: true,
  },
  'Bitirici Forvet': {
    id: 'finesse-plus',
    name: 'Bitirici Plase',
    category: 'Şut',
    description: 'Ceza sahası köşelerinden falsolu plase vuruşlarda cerrahi isabet sağlar.',
    isPlus: true,
  },
  'Pres Forvet': {
    id: 'relentless-plus',
    name: 'Tükenmez Baskı',
    category: 'Fizik',
    description: '90 dakika boyunca rakip stoperlere pres uygular ve hataya zorlar.',
    isPlus: true,
  },
  'Hedef Santrfor': {
    id: 'aerial-plus',
    name: 'Hava Hakimiyeti',
    category: 'Fizik',
    description: 'Hava toplarında daha yükseğe sıçrar ve kafa şutlarına kuvvet katar.',
    isPlus: true,
  },
  'Box-to-Box': {
    id: 'engine-plus',
    name: 'İki Yönlü Dinamo',
    category: 'Fizik',
    description: 'Her iki ceza sahası arasında mekik dokur; hücumu destekler, savunmayı kapatır.',
    isPlus: true,
  },
  'Defansif Orta Saha': {
    id: 'anticipate-plus',
    name: 'Kilit Müdahale',
    category: 'Defans',
    description: 'Ayak koyma müdahalelerinde faul yapmadan topu doğrudan takımına kazandırır.',
    isPlus: true,
  },
  'Pasör Stoper': {
    id: 'long-ball-plus',
    name: 'Uzun Top Mimarı',
    category: 'Pas',
    description: 'Geriden oyun kurarken forvet koşularına kusursuz uzun paslar indirir.',
    isPlus: true,
  },
  'Fiziksel Stoper': {
    id: 'bruiser-plus',
    name: 'Kaya Savunma',
    category: 'Fizik',
    description: 'Omuz omuza ikili mücadelelerde ve hava toplarında rakiplerini etkisiz kılar.',
    isPlus: true,
  },
  'Hücumcu Bek': {
    id: 'quick-step-plus',
    name: 'Hızlı Bindirme',
    category: 'Top Kontrolü',
    description: 'Çizgiye inerek hızlı driplingle hücum genişliği kazandırır.',
    isPlus: true,
  },
  'Savunmacı Bek': {
    id: 'block-plus',
    name: 'Geçit Vermez',
    category: 'Defans',
    description: 'Bire bir pozisyonlarda kanat forvetlerinin içeri kat etmesini engeller.',
    isPlus: true,
  },
  'Süpürücü Kaleci': {
    id: 'sweeper-plus',
    name: 'Süpürücü Refleks',
    category: 'Kaleci',
    description: 'Ceza sahası dışına açılarak savunma arkasına atılan topları süpürür.',
    isPlus: true,
  },
  'Çizgi Kalecisi': {
    id: 'acrobatic-plus',
    name: 'Uçan Refleks',
    category: 'Kaleci',
    description: 'Çizgi üzerinde köşelere giden şutlarda akrobatik kurtarışlar yapar.',
    isPlus: true,
  },
};

const derivePlayStyles = (p: Player): PlayStyle[] => {
  const styles: PlayStyle[] = [];
  const a = p.attributes;

  // Add signature archetype PlayStyle+ if available
  if (p.archetype && archetypePlayStyleMap[p.archetype]) {
    styles.push(archetypePlayStyleMap[p.archetype]);
  }

  if (p.position === 'GK') {
    if ((a.reflexes || 0) >= 72 && !styles.some((s) => s.id.includes('reflex'))) {
      styles.push({
        id: 'gk-reflex',
        name: 'Kedi Refleks',
        category: 'Kaleci',
        description: 'Yakın mesafe şutlarda akrobatik kurtarış başarısı ve reaksiyon hızını artırır.',
        isPlus: (a.reflexes || 0) >= 82,
      });
    }
    if ((a.handling || 0) >= 72 && !styles.some((s) => s.id.includes('cross'))) {
      styles.push({
        id: 'gk-cross',
        name: 'Hava Hakimi',
        category: 'Kaleci',
        description: 'Yan toplarda ve kornerlerde güvenle topu çift elle kontrol eder.',
        isPlus: (a.handling || 0) >= 82,
      });
    }
    return styles;
  }

  // Shooting PlayStyles
  if (a.finishing >= 74 && !styles.some((s) => s.category === 'Şut')) {
    styles.push({
      id: 'finesse-shot',
      name: 'Bitirici Plase',
      category: 'Şut',
      description: 'Ceza sahası köşelerinden falsolu plase vuruşlarda cerrahi isabet sağlar.',
      isPlus: a.finishing >= 84,
    });
  }
  if (a.longShots >= 75 && !styles.some((s) => s.id.includes('power'))) {
    styles.push({
      id: 'power-shot',
      name: 'Roket Şut',
      category: 'Şut',
      description: 'Ceza sahası dışından sert şutlarda topun hızını ve menzilini maksimize eder.',
      isPlus: a.longShots >= 84,
    });
  }

  // Passing PlayStyles
  if ((a.passing >= 74 || a.vision >= 74) && !styles.some((s) => s.category === 'Pas')) {
    styles.push({
      id: 'incisive-pass',
      name: 'Ara Pası Mimarı',
      category: 'Pas',
      description: 'Defans arkasına atılan öldürücü ara paslarda kavis ve hassasiyet kazandırır.',
      isPlus: a.passing >= 84 || a.vision >= 84,
    });
  }
  if (a.crossing >= 74 && !styles.some((s) => s.id.includes('cross'))) {
    styles.push({
      id: 'whipped-cross',
      name: 'Kavisli Orta',
      category: 'Pas',
      description: 'Kanatlardan ceza sahasına adrese teslim kavisli ortalar keser.',
      isPlus: a.crossing >= 84,
    });
  }

  // Ball Control / Dribbling PlayStyles
  if ((a.dribbling >= 74 || a.technique >= 74) && !styles.some((s) => s.id.includes('tech') || s.id.includes('tiki'))) {
    styles.push({
      id: 'technical',
      name: 'Teknik Dribbling',
      category: 'Top Kontrolü',
      description: 'Dar alanda baskı altındayken topu ayağına yapıştırarak yön değiştirir.',
      isPlus: a.dribbling >= 84,
    });
  }
  if (a.pace >= 76 && !styles.some((s) => s.id.includes('rapid') || s.id.includes('quick'))) {
    styles.push({
      id: 'rapid',
      name: 'Roket Hızlanma',
      category: 'Top Kontrolü',
      description: 'Topla depar atarken maksimum sprint hızına rekor sürede ulaşır.',
      isPlus: a.pace >= 85,
    });
  }

  // Defending PlayStyles
  if (a.tackling >= 74 && !styles.some((s) => s.id.includes('anticipate') || s.id.includes('block'))) {
    styles.push({
      id: 'anticipate',
      name: 'Kilit Müdahale',
      category: 'Defans',
      description: 'Ayak koyma müdahalelerinde faul yapmadan topu doğrudan takımına kazandırır.',
      isPlus: a.tackling >= 84,
    });
  }
  if (a.heading >= 74 && !styles.some((s) => s.id.includes('aerial'))) {
    styles.push({
      id: 'aerial',
      name: 'Hava Hakimiyeti',
      category: 'Fizik',
      description: 'Hava toplarında daha yükseğe sıçrar ve kafa şutlarına kuvvet katar.',
      isPlus: a.heading >= 82,
    });
  }

  // Physical PlayStyles
  if (a.strength >= 74 && !styles.some((s) => s.id.includes('bruiser'))) {
    styles.push({
      id: 'bruiser',
      name: 'Kaya Fizik',
      category: 'Fizik',
      description: 'Omuz omuza ikili mücadelelerde rakipleri dengesiz bırakır.',
      isPlus: a.strength >= 84,
    });
  }
  if (a.stamina >= 76 && !styles.some((s) => s.id.includes('relentless') || s.id.includes('engine'))) {
    styles.push({
      id: 'relentless',
      name: 'Tükenmez Ciğer',
      category: 'Fizik',
      description: '90 dakika boyunca pres yapabilir ve maç sonunda kondisyon kaybını azaltır.',
      isPlus: a.stamina >= 85,
    });
  }

  return styles.slice(0, 4); // Max 4 playstyles per player
};

// Modern FIFA Attribute Row with Glowing Slider
const FifaAttributeRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  const theme = getFifaColorTier(value);
  const percent = getNumericPercent(value);

  return (
    <div className="group py-1.5 px-2.5 rounded-lg hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{label}</span>
        <span
          className={`font-mono font-black text-xs px-2 py-0.5 rounded border transition-all ${theme.text} ${theme.bg} ${theme.border} ${theme.glow}`}
        >
          {value}
        </span>
      </div>
      <div className="w-full bg-zinc-900/90 h-2 rounded-full overflow-hidden border border-zinc-800 p-0.5">
        <div
          className="h-full rounded-full transition-all duration-300 relative"
          style={{ width: `${percent}%`, backgroundColor: theme.bar }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full blur-[1px]" />
        </div>
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
  const [activeTab, setActiveTab] = useState<ModalTab>('bio');
  const [showScoutModal, setShowScoutModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!player || !mounted) return null;

  const isOwnPlayer = player.clubId === userClub.id;
  const masked = getMaskedPlayer(player);

  const ovrTheme = getFifaColorTier(masked.overallDisplay);
  const potTheme = getFifaColorTier(masked.potentialDisplay);
  const cardFaceStats = calculateFifaCardFaceStats(player, masked);
  const playStyles = derivePlayStyles(player);

  // Skill moves & Weak foot calculation
  const skillMoves = Math.min(5, Math.max(2, Math.round((player.attributes.dribbling + player.attributes.technique) / 36)));
  const weakFoot = player.preferredFoot === 'Her İkisi' ? 5 : Math.min(5, Math.max(2, Math.round(player.attributes.technique / 20)));

  // Work rates calculation
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const isDefender = ['CB', 'LB', 'RB', 'GK'].includes(player.position);
  const workRates = isAttacker ? 'Yüksek / Orta' : isDefender ? 'Orta / Yüksek' : 'Yüksek / Yüksek';

  const isEliteCard = player.overall >= 85;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
        {/* Modal Shell with EA FC / FIFA Ultimate Team Stadium Aesthetic */}
        <div className="relative w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-[#070B14] sm:border sm:border-zinc-800 sm:rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden text-zinc-200">
          {/* Subtle top neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

          {/* Top Bar for Mobile Close / Back */}
          <div className="flex sm:hidden items-center justify-between p-3.5 bg-[#090E1D] border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40">
                {player.position}
              </span>
              <span className="text-sm font-black text-white uppercase italic">
                {player.firstName} {player.lastName}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area: Left FUT Card + Right FIFA Management HUD */}
          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
            {/* ================================================================= */}
            {/* LEFT COLUMN: THE ICONIC FIFA ULTIMATE TEAM (FUT) CARD             */}
            {/* ================================================================= */}
            <div className="w-full lg:w-[320px] shrink-0 p-4 sm:p-6 bg-gradient-to-b from-[#0B1020] via-[#080D1A] to-[#050810] border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col items-center justify-center relative">
              {/* FIFA Ultimate Team Card Container */}
              <div
                className={`relative w-[250px] sm:w-[270px] rounded-2xl overflow-hidden p-3.5 transition-transform duration-300 hover:scale-[1.02] ${
                  isEliteCard
                    ? 'bg-gradient-to-b from-[#08281E] via-[#051812] to-[#030A08] border-2 border-[#00F5A0]/60 shadow-[0_0_35px_rgba(0,245,160,0.25)]'
                    : 'bg-gradient-to-b from-[#221808] via-[#140F04] to-[#080A12] border-2 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                }`}
              >
                {/* Holographic angled texture lines */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                {/* Card Top Row: Rating, Position, Flag, Club */}
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex flex-col items-center leading-none">
                    <span
                      className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter drop-shadow-lg ${
                        isEliteCard ? 'text-[#00F5A0]' : 'text-amber-300'
                      }`}
                    >
                      {masked.overallDisplay}
                    </span>
                    <span className="text-base font-black tracking-wider uppercase mt-1 text-white">
                      {player.position}
                    </span>
                    <div className="w-6 h-[2px] bg-white/30 my-1.5" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                      {player.nationality.slice(0, 3).toUpperCase()}
                    </span>
                    {club && (
                      <div className="mt-2 p-1 bg-black/40 rounded-full border border-white/10">
                        <ClubBadge
                          code={club.code}
                          primaryColor={club.primaryColor}
                          secondaryColor={club.secondaryColor}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Player Visual Silhouette / Avatar with Stadium Flare */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div
                      className={`absolute inset-2 rounded-full blur-xl opacity-40 ${
                        isEliteCard ? 'bg-[#00F5A0]' : 'bg-amber-400'
                      }`}
                    />
                    <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-t from-black/80 to-zinc-800/40 border border-white/20 flex flex-col items-center justify-center overflow-hidden">
                      <User className="w-16 h-16 text-zinc-300/80 stroke-[1.2]" />
                    </div>
                  </div>
                </div>

                {/* Card Player Name Banner */}
                <div className="relative z-10 mt-2 py-1.5 border-y border-white/15 bg-black/30 backdrop-blur-sm text-center">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    {player.firstName}
                  </span>
                  <h3 className="text-xl font-black italic tracking-wider text-white uppercase leading-none drop-shadow">
                    {player.lastName}
                  </h3>
                </div>

                {/* The 6 Iconic FIFA Face Stats */}
                <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-1.5 py-3 px-2 border-b border-white/10 font-mono">
                  {cardFaceStats.map((stat) => (
                    <div key={stat.key} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-bold tracking-wider">{stat.key}</span>
                      <span className="text-sm font-black text-white flex items-center gap-1">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Bottom Traits & Badges */}
                <div className="relative z-10 pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">AYAK:</span>
                    <span className="font-bold text-white">{player.preferredFoot}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <span>{skillMoves}★ SM</span>
                    <span className="text-zinc-600">•</span>
                    <span>{weakFoot}★ WF</span>
                  </div>
                </div>
              </div>

              {/* Fog of War / Scouting Knowledge Level on Card */}
              <div className="w-full max-w-[270px] mt-4 pt-3 border-t border-zinc-800 text-xs font-mono">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#00D4FF]" />
                    Gözlem
                  </span>
                  <span className="font-bold text-white">
                    {isOwnPlayer ? '%100 (Kulüp)' : `%${masked.knowledgePercentage}`}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00F5A0] rounded-full transition-all duration-300"
                    style={{ width: `${isOwnPlayer ? 100 : masked.knowledgePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* RIGHT COLUMN: EA FC MODERN TABS & MANAGEMENT HUD                  */}
            {/* ================================================================= */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#070B14]">
              {/* Desktop Header Banner */}
              <div className="hidden sm:flex items-center justify-between p-5 border-b border-zinc-800/80 bg-gradient-to-r from-[#090E1D] to-[#070B14]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-black uppercase tracking-wider bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40">
                      {player.position}
                    </span>
                    {player.secondaryPositions?.map((sec) => (
                      <span
                        key={sec}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        {sec}
                      </span>
                    ))}
                    {player.archetype && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        {player.archetype}
                      </span>
                    )}
                    {player.isRisingTalent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        ★ YÜKSELEN YETENEK
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white">
                    {player.firstName} {player.lastName}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Potential Badge */}
                  <div
                    className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl border backdrop-blur-md ${potTheme.bg} ${potTheme.border} ${potTheme.glow}`}
                  >
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
                      POTANSİYEL
                    </span>
                    <span className={`text-xl font-black font-mono tracking-tight ${potTheme.text}`}>
                      {masked.potentialDisplay}
                    </span>
                  </div>

                  {/* Close X Button */}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/70 transition-all shadow-md"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Segmented EA FC Tab Bar */}
              <div className="flex items-center gap-1 px-4 sm:px-6 bg-[#080D1A] border-b border-zinc-800 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('bio')}
                  className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === 'bio'
                      ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  BİLGİ & KÜNYE
                </button>

                <button
                  onClick={() => setActiveTab('attributes')}
                  className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === 'attributes'
                  ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  DETAYLI NİTELİKLER
                </button>

                <button
                  onClick={() => setActiveTab('playstyles')}
                  className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === 'playstyles'
                      ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  PLAYSTYLES ({playStyles.length})
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
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
                  className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === 'contract'
                      ? 'border-[#00F5A0] text-[#00F5A0] bg-[#00F5A0]/5'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  SÖZLEŞME & KULÜP
                </button>
              </div>

              {/* Scrollable Tab Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Status Alerts (Injury / Suspension) */}
                {(player.isInjured || player.isSuspended) && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300 font-mono">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div className="space-y-0.5">
                      {player.isInjured && (
                        <p>
                          <strong>SAKATLIK DURUMU:</strong> {player.injuryDetails?.type} ({player.injuryDetails?.daysRemaining} gün)
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

                {/* TAB 1: BİLGİ & KÜNYE (BIO & QUICK HUD) */}
                {activeTab === 'bio' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* 6 Horizontal Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Piyasa Değeri</span>
                        <span className="text-sm font-black text-white">{masked.marketValueDisplay}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Haftalık Maaş</span>
                        <span className="text-sm font-black text-[#00F5A0]">{masked.wageDisplay}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Sözleşme Bitiş</span>
                        <span className="text-sm font-black text-amber-300">
                          {player.contractUntil || player.contractEnd?.split('-')[0] || '2028'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Kondisyon</span>
                        <div className="flex items-center gap-2">
                          <FitnessIndicator value={player.fitness} isInjured={player.isInjured} />
                          <span className="text-xs font-bold text-zinc-300">%{player.fitness}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Maç Keskinliği</span>
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                          <span className="text-sm font-black text-[#00D4FF]">%{player.matchSharpness ?? 85}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Moral</span>
                        <MoraleIndicator value={player.morale} showText={true} />
                      </div>
                    </div>

                    {/* FIFA Player Biological & Technical Specs */}
                    <div className="p-4 rounded-xl bg-[#0C1222] border border-zinc-800 space-y-3 font-mono text-xs">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4FF]">
                        // TEKNİK & FİZİKSEL BİYOGRAFİ
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Boy & Kilo</span>
                          <span className="text-sm font-bold text-white">{player.height} cm / {player.weight} kg</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Tercih Edilen Ayak</span>
                          <span className="text-sm font-bold text-white">{player.preferredFoot}</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Beceri Hareketleri</span>
                          <span className="text-sm font-bold text-amber-400">{skillMoves} Yıldız (★)</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Zayıf Ayak Gücü</span>
                          <span className="text-sm font-bold text-amber-400">{weakFoot} Yıldız (★)</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Çalışma Oranı (Hüc/Sav)</span>
                          <span className="text-sm font-bold text-[#00F5A0]">{workRates}</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Yaş & Doğum</span>
                          <span className="text-sm font-bold text-white">{player.age} Yaş ({player.birthDate})</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Mevcut Kulüp</span>
                          <span className="text-sm font-bold text-white">{club ? club.name : 'Kulüpsüz'}</span>
                        </div>
                        <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                          <span className="text-zinc-500 text-[10px] block uppercase">Kadro Rolü</span>
                          <span className="text-sm font-bold text-[#00D4FF]">{player.squadRole || 'İlk 11 Oyuncusu'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scouting Intelligence / Fog of War */}
                    {masked.latestReport ? (
                      <div className="p-4 rounded-xl bg-[#091526] border border-[#00D4FF]/30 space-y-3 font-mono text-xs shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-[#00D4FF]" />
                            <h4 className="text-xs font-black text-[#00D4FF] uppercase tracking-wider">
                              Gözlemci Raporu ({masked.latestReport.scoutName} • {masked.latestReport.date})
                            </h4>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#00D4FF]/20 text-cyan-200 border border-[#00D4FF]/40 w-fit">
                            Öneri: {masked.latestReport.recommendation} (Güven: %{masked.latestReport.confidence})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
                            <strong className="text-[#00F5A0] block mb-1 uppercase">Güçlü Yönler:</strong>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                              {masked.latestReport.strengths.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
                            <strong className="text-rose-400 block mb-1 uppercase">Zayıf Yönler:</strong>
                            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                              {masked.latestReport.weaknesses.map((w, idx) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      !isOwnPlayer && (
                        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
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
                            className="px-4 py-2 rounded-xl text-xs font-black bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90 transition-all uppercase shrink-0"
                          >
                            Gözlemci Gönder
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* TAB 2: DETAYLI NİTELİKLER (FIFA TEAM MANAGEMENT DETAILED SLIDERS) */}
                {activeTab === 'attributes' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00F5A0]" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                          FIFA OYUN İÇİ AYRINTILI NİTELİKLER
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#00F5A0]" /> 90+ Elit
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> 80-89 Çok İyi
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> 70-79 İyi
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500" /> 60-69 Orta
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-zinc-500" /> &lt;60 Zayıf
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1. HIZ (PAC) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#00D4FF] pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>HIZ (PAC)</span>
                          <Wind className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Depar Hızı (Pace)" value={masked.attributes.pace.displayString} />
                        <FifaAttributeRow label="Hızlanma (Acceleration)" value={masked.attributes.acceleration.displayString} />
                      </div>

                      {/* 2. ŞUT (SHO) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>ŞUT (SHO)</span>
                          <Target className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Bitiricilik (Finishing)" value={masked.attributes.finishing.displayString} />
                        <FifaAttributeRow label="Uzaktan Şut (Long Shots)" value={masked.attributes.longShots.displayString} />
                        <FifaAttributeRow label="Kafa Vuruşu (Heading)" value={masked.attributes.heading.displayString} />
                      </div>

                      {/* 3. PAS (PAS) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#00F5A0] pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>PAS (PAS)</span>
                          <Crosshair className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Kısa/Uzun Pas" value={masked.attributes.passing.displayString} />
                        <FifaAttributeRow label="Oyun Görüşü (Vision)" value={masked.attributes.vision.displayString} />
                        <FifaAttributeRow label="Orta Açma (Crossing)" value={masked.attributes.crossing.displayString} />
                      </div>

                      {/* 4. DRİBLİNG (DRI) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>DRİBLİNG (DRI)</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Top Sürme (Dribbling)" value={masked.attributes.dribbling.displayString} />
                        <FifaAttributeRow label="Top Kontrolü & Teknik" value={masked.attributes.technique.displayString} />
                        <FifaAttributeRow label="Soğukkanlılık (Composure)" value={masked.attributes.composure.displayString} />
                      </div>

                      {/* 5. DEFANS (DEF) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-sky-400 pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>DEFANS (DEF)</span>
                          <Shield className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Top Çalma (Tackling)" value={masked.attributes.tackling.displayString} />
                        <FifaAttributeRow label="Adam Markajı (Marking)" value={masked.attributes.marking.displayString} />
                        <FifaAttributeRow label="Pozisyon Alma (Awareness)" value={masked.attributes.positioning.displayString} />
                      </div>

                      {/* 6. FİZİK (PHY) */}
                      <div className="p-4 rounded-xl bg-[#0D1220] border border-zinc-800 space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 pb-2 border-b border-zinc-800 flex items-center justify-between font-mono">
                          <span>FİZİK (PHY)</span>
                          <Dumbbell className="w-3.5 h-3.5" />
                        </h4>
                        <FifaAttributeRow label="Güç (Strength)" value={masked.attributes.strength.displayString} />
                        <FifaAttributeRow label="Dayanıklılık (Stamina)" value={masked.attributes.stamina.displayString} />
                        <FifaAttributeRow label="Agresiflik (Aggression)" value={masked.attributes.aggression.displayString} />
                        <FifaAttributeRow label="Karar Verme (Decisions)" value={masked.attributes.decisions.displayString} />
                      </div>
                    </div>

                    {/* KALECİLİK BÖLÜMÜ (IF GK) */}
                    {player.position === 'GK' && (
                      <div className="p-4 rounded-xl bg-[#120F1F] border border-purple-500/30 space-y-2 mt-4 font-mono">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 pb-2 border-b border-zinc-800">
                          // KALECİLİK ÖZEL NİTELİKLERİ
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <FifaAttributeRow label="Elle Kontrol (Handling)" value={masked.attributes.handling.displayString} />
                          <FifaAttributeRow label="Refleksler (Reflexes)" value={masked.attributes.reflexes.displayString} />
                          <FifaAttributeRow label="Kaleci Pozisyonu (Positioning)" value={masked.attributes.positioningGK.displayString} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PLAYSTYLES & OYUN TARZLARI (EA FC 24/25 PLAYSTYLES) */}
                {activeTab === 'playstyles' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                          EA SPORTS FC OYUN TARZLARI (PLAYSTYLES)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Maç simülasyonunda aktifleşen imza yetenekler
                      </span>
                    </div>

                    {playStyles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {playStyles.map((ps, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border transition-all ${
                              ps.isPlus
                                ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                                : 'bg-[#0D1220] border-zinc-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${
                                    ps.isPlus
                                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/30'
                                      : 'bg-zinc-800 text-[#00D4FF] border border-zinc-700'
                                  }`}
                                >
                                  {ps.isPlus ? <Star className="w-5 h-5 fill-current" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                                    <span>{ps.name}</span>
                                    {ps.isPlus && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-mono font-black">
                                        PLUS+
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                                    {ps.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                              {ps.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-500 font-mono text-xs">
                        Bu futbolcunun henüz belirgin bir imza oyun tarzı bulunmuyor. Gelişim antrenmanlarıyla yeni PlayStyle'lar eklenebilir.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SEZON İSTATİSTİKLERİ & FORM */}
                {activeTab === 'stats' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-[#00F5A0]" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                          2026/27 RESMİ SEZON PERFORMANSI
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

                {/* TAB 5: SÖZLEŞME & KULÜP */}
                {activeTab === 'contract' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00F5A0]" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
                          KULÜP SÖZLEŞMESİ VE GİZLİ KARAKTER ANALİZİ
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

              {/* FIFA Controller Action Footer */}
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
    </>,
    document.body
  );
};
