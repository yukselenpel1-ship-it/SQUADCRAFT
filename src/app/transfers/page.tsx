'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { Player, Club } from '@/types/game';
import { StatBadge } from '@/components/ui/StatBadge';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { EXTERNAL_CLUBS } from '@/lib/career/careerUniverse';
import {
  getTransferWindowStatus,
  formatDateTurkish,
  daysBetween,
} from '@/lib/career';
import {
  ArrowLeftRight,
  Search,
  Bookmark,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Users,
  AlertCircle,
  Briefcase,
  History,
  Sparkles,
  Flame,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  X,
  Zap,
  TrendingUp,
  Award,
  ExternalLink,
} from 'lucide-react';

export default function TransfersPage() {
  const {
    allPlayers,
    allClubs,
    userClub,
    transferOffers,
    shortlistIds,
    finances,
    currentDate,
    activeNegotiations,
    transferHistory,
    toggleShortlist,
    respondToTransferOffer,
    getMaskedPlayer,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [activeTab, setActiveTab] = useState<
    'MARKET' | 'LISTED' | 'FREE_AGENTS' | 'SHORTLIST' | 'OUTGOING' | 'INCOMING' | 'HISTORY'
  >('MARKET');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [minOverall, setMinOverall] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(40);
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'LISTED' | 'EXPIRING' | 'SCOUTED'>('ALL');
  const [marketPage, setMarketPage] = useState<number>(1);
  const [freeAgentPage, setFreeAgentPage] = useState<number>(1);
  
  // Selected player for right-side drawer
  const [drawerPlayer, setDrawerPlayer] = useState<Player | null>(null);

  // Full inspect modal target
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  // Negotiation Modal Target
  const [negotiationTargetPlayer, setNegotiationTargetPlayer] = useState<Player | null>(null);

  const getClub = (id: string): Club | undefined => {
    const found = allClubs.find((c) => c.id === id);
    if (found) return found;
    const ext = EXTERNAL_CLUBS.find((c) => c.id === id);
    if (ext) {
      return {
        id: ext.id,
        name: ext.name,
        shortName: ext.name,
        code: ext.code,
        city: ext.region,
        stadium: `${ext.name} Arena`,
        stadiumCapacity: 25000,
        reputation: ext.reputation,
        balance: 15000000,
        transferBudget: 8000000,
        wageBudget: 250000,
        weeklyWageExpense: 180000,
        primaryColor: '#2563EB',
        secondaryColor: '#1E3A8A',
        managerName: 'Teknik Direktör',
        foundedYear: 1960,
      };
    }
    return undefined;
  };

  const getPlayer = (id: string) => allPlayers.find((p) => p.id === id);

  const windowStatus = getTransferWindowStatus(currentDate);

  // Transfer Deadline Days Calculation
  const deadlineInfo = useMemo(() => {
    if (windowStatus === 'CLOSED') {
      return { text: 'Transfer Dönemi Kapalı', daysLeft: -1, isUrgent: false };
    }
    const d = new Date(currentDate);
    const month = d.getMonth() + 1;
    let deadlineStr = `${d.getFullYear()}-09-01`;
    if (month === 1) {
      deadlineStr = `${d.getFullYear()}-01-31`;
    }
    const daysLeft = daysBetween(currentDate, deadlineStr);
    if (daysLeft === 0) {
      return { text: 'DEADLINE DAY // SON GÜN!', daysLeft: 0, isUrgent: true };
    }
    if (daysLeft <= 3) {
      return { text: `SON ${daysLeft} GÜN!`, daysLeft, isUrgent: true };
    }
    return { text: `Kapanışa ${daysLeft} Gün`, daysLeft, isUrgent: false };
  }, [windowStatus, currentDate]);

  // Helper to determine transfer status label & style
  const getTransferStatusInfo = (player: Player) => {
    const isFreeAgent = player.clubId === 'FREE_AGENT' || player.clubId === 'free-agent';
    if (isFreeAgent) {
      return { text: 'Serbest', color: 'text-[#21dfbd] bg-[#21dfbd]/10 border-[#21dfbd]/30' };
    }
    if (player.isTransferListedByRequest) {
      return { text: 'Satış Talebi', color: 'text-[#ffd34f] bg-[#ffd34f]/10 border-[#ffd34f]/30' };
    }
    if (player.isTransferListed) {
      return { text: 'Satılık', color: 'text-[#4FE4FF] bg-[#4FE4FF]/10 border-[#4FE4FF]/30' };
    }
    const contractEnd = player.contractEnd || '2028-06-30';
    const daysLeft = daysBetween(currentDate, contractEnd);
    if (daysLeft <= 180) {
      return { text: 'Son 6 Ay', color: 'text-[#ff5365] bg-[#ff5365]/10 border-[#ff5365]/30' };
    }
    if (player.overall >= 82) {
      return { text: 'Kilit İsim', color: 'text-zinc-400 bg-zinc-900 border-white/10' };
    }
    return { text: 'Kadroda', color: 'text-zinc-500 bg-black/40 border-white/5' };
  };

  // Helper to calculate Scout Grade badge
  const getScoutGrade = (player: Player) => {
    const score = player.overall * 0.6 + player.potential * 0.4;
    if (score >= 84) return { grade: 'A+', color: 'text-[#b8ff3d] bg-[#b8ff3d]/15 border-[#b8ff3d]/40' };
    if (score >= 80) return { grade: 'A', color: 'text-[#21dfbd] bg-[#21dfbd]/15 border-[#21dfbd]/40' };
    if (score >= 76) return { grade: 'B+', color: 'text-[#4FE4FF] bg-[#4FE4FF]/15 border-[#4FE4FF]/40' };
    if (score >= 72) return { grade: 'B', color: 'text-[#ffd34f] bg-[#ffd34f]/15 border-[#ffd34f]/40' };
    if (score >= 68) return { grade: 'C+', color: 'text-zinc-300 bg-zinc-800 border-white/10' };
    return { grade: 'C', color: 'text-zinc-500 bg-black/50 border-white/10' };
  };

  // Helper for negotiation status
  const getNegotiationStatusDisplay = (neg: any) => {
    if (neg.stage === 'COMPLETED' || neg.playerStatus === 'ACCEPTED') {
      return {
        status: 'COMPLETED',
        badgeText: 'KABUL EDİLDİ',
        badgeClass: 'bg-[#b8ff3d]/15 text-[#b8ff3d] border-[#b8ff3d]/40',
        stageTitle: neg.isFreeAgent ? 'Serbest Oyuncu Sözleşmesi' : neg.isContractRenewal ? 'Sözleşme Yenileme' : 'Transfer Tamamlandı',
      };
    }
    if (neg.clubStatus === 'WITHDRAWN' || neg.playerStatus === 'WITHDRAWN') {
      return {
        status: 'WITHDRAWN',
        badgeText: 'MASADAN ÇEKİLİNDİ',
        badgeClass: 'bg-zinc-900 text-zinc-400 border-white/10',
        stageTitle: 'Görüşme İptal Edildi',
      };
    }
    if (neg.clubStatus === 'REJECTED' || neg.playerStatus === 'REJECTED' || neg.stage === 'FAILED') {
      return {
        status: 'REJECTED',
        badgeText: 'REDDEDİLDİ',
        badgeClass: 'bg-[#ff5365]/20 text-[#ff5365] border-[#ff5365]/40',
        stageTitle: neg.playerStatus === 'REJECTED' ? 'Oyuncu Talebi Reddetti' : 'Kulüp Bonservisi Reddetti',
      };
    }
    if (neg.stage === 'PLAYER_NEGOTIATION') {
      if (neg.clubStatus === 'ACCEPTED' && !neg.isFreeAgent && !neg.isContractRenewal) {
        return {
          status: 'CLUB_ACCEPTED',
          badgeText: 'KULÜP ANLAŞTI',
          badgeClass: 'bg-[#4FE4FF]/20 text-[#4FE4FF] border-[#4FE4FF]/40',
          stageTitle: 'Kulüp Anlaştı // Oyuncu Sözleşmesi Görüşülüyor',
        };
      }
      return {
        status: 'PLAYER_NEGOTIATION',
        badgeText: 'SÖZLEŞME GÖRÜŞMESİ',
        badgeClass: 'bg-[#21dfbd]/20 text-[#21dfbd] border-[#21dfbd]/40',
        stageTitle: neg.isFreeAgent ? 'Serbest Oyuncu Sözleşmesi' : 'Kişisel Şartlar Görüşmesi',
      };
    }
    return {
      status: 'ACTIVE',
      badgeText: 'KULÜP PAZARLIĞI',
      badgeClass: 'bg-[#ffd34f]/20 text-[#ffd34f] border-[#ffd34f]/40',
      stageTitle: 'Bonservis Pazarlığı Devam Ediyor',
    };
  };

  // 1. Market Players Filtered
  const marketPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId !== userClub.id && p.clubId !== 'FREE_AGENT' && p.clubId !== 'free-agent')
      .filter((p) => {
        if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;
        if (p.overall < minOverall) return false;
        if (p.age > maxAge) return false;

        if (quickFilter === 'LISTED' && !p.isTransferListed && !p.isTransferListedByRequest) return false;
        if (quickFilter === 'EXPIRING') {
          const daysLeft = daysBetween(currentDate, p.contractEnd || '2028-06-30');
          if (daysLeft > 180) return false;
        }
        if (quickFilter === 'SCOUTED') {
          const scouted = (p.scoutingReport?.scoutedLevel ?? 0) >= 80;
          if (!scouted) return false;
        }

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const name = `${p.firstName} ${p.lastName}`.toLowerCase();
          const club = getClub(p.clubId);
          const clubName = club ? club.name.toLowerCase() : '';
          if (!name.includes(q) && !p.position.toLowerCase().includes(q) && !clubName.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [allPlayers, userClub.id, selectedPosition, minOverall, maxAge, quickFilter, searchQuery, currentDate]);

  // Listed Players
  const listedPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId !== userClub.id && (p.isTransferListed || p.isTransferListedByRequest))
      .sort((a, b) => b.overall - a.overall);
  }, [allPlayers, userClub.id]);

  // 2. Free Agents Filtered
  const freeAgents = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId === 'FREE_AGENT' || p.clubId === 'free-agent')
      .filter((p) => {
        if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const name = `${p.firstName} ${p.lastName}`.toLowerCase();
          if (!name.includes(q) && !p.position.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [allPlayers, selectedPosition, searchQuery]);

  // Pagination constants
  const PAGE_SIZE = 30;
  const marketTotalPages = Math.ceil(marketPlayers.length / PAGE_SIZE) || 1;
  const paginatedMarketPlayers = useMemo(() => {
    const start = (marketPage - 1) * PAGE_SIZE;
    return marketPlayers.slice(start, start + PAGE_SIZE);
  }, [marketPlayers, marketPage]);

  const freeAgentTotalPages = Math.ceil(freeAgents.length / PAGE_SIZE) || 1;
  const paginatedFreeAgents = useMemo(() => {
    const start = (freeAgentPage - 1) * PAGE_SIZE;
    return freeAgents.slice(start, start + PAGE_SIZE);
  }, [freeAgents, freeAgentPage]);

  // 3. Shortlisted Players
  const shortlistedPlayers = allPlayers.filter((p) => shortlistIds.includes(p.id));

  // 4. Incoming Offers
  const incomingOffers = transferOffers.filter((o) => o.toClubId === userClub.id);

  // 5. User Negotiations
  const userNegotiations = useMemo(() => {
    return activeNegotiations.filter((n) => n.buyerClubId === userClub.id);
  }, [activeNegotiations, userClub.id]);

  const activeNegsCount = useMemo(() => {
    return userNegotiations.filter(
      (n) =>
        n.stage !== 'COMPLETED' &&
        n.stage !== 'FAILED' &&
        n.clubStatus !== 'WITHDRAWN' &&
        n.playerStatus !== 'WITHDRAWN'
    ).length;
  }, [userNegotiations]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="TRANSFER MERKEZİ YÜKLENİYOR"
        message="Piyasa değerleri, aktif müzakereler ve transfer bütçesi senkronize ediliyor..."
      />
    );
  }

  const remainingWageBudget = finances.wageBudget - finances.weeklyWages;
  const wageCapPercent = Math.min(100, Math.round((finances.weeklyWages / (finances.wageBudget || 1)) * 100));

  return (
    <div className="space-y-6 pb-28 lg:pb-12 animate-in fade-in duration-300">
      {/* 1. BROADCAST TRANSFER COMMAND HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-white/10 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8ff3d]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-40 bg-[#21dfbd]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Window Status */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30">
                // TRANSFER COMMAND & NEGOTIATION
              </span>
              
              <div
                className={`flex items-center gap-2 px-3 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  windowStatus === 'OPEN'
                    ? deadlineInfo.isUrgent
                      ? 'bg-[#ff5365]/20 text-[#ff5365] border-[#ff5365]/40 animate-pulse'
                      : 'bg-[#21dfbd]/15 text-[#21dfbd] border-[#21dfbd]/30'
                    : 'bg-zinc-800 text-zinc-400 border-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${windowStatus === 'OPEN' ? (deadlineInfo.isUrgent ? 'bg-[#ff5365]' : 'bg-[#21dfbd]') : 'bg-zinc-500'}`} />
                <span>{deadlineInfo.text}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b8ff3d]/10 border border-[#b8ff3d]/20 flex items-center justify-center text-[#b8ff3d]">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sport">
                  TRANSFER MASASI
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  {userClub.name.toUpperCase()} • KÜRESEL OYUNCU PAZARI & RESMİ GÖRÜŞMELER
                </p>
              </div>
            </div>
          </div>

          {/* Right Financial Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0">
            {/* Transfer Budget */}
            <div className="bg-[#050706]/80 rounded-xl border border-white/10 p-3 min-w-[170px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">TRANSFER BÜTÇESİ</span>
                <DollarSign className="w-3.5 h-3.5 text-[#b8ff3d]" />
              </div>
              <div className="text-xl font-black text-[#b8ff3d] font-mono">
                €{(finances.transferBudget / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Kullanılabilir net bonservis
              </div>
            </div>

            {/* Wage Room */}
            <div className="bg-[#050706]/80 rounded-xl border border-white/10 p-3 min-w-[170px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">KALAN MAAŞ ALANI</span>
                <span className={`text-[10px] font-mono font-bold ${wageCapPercent > 90 ? 'text-[#ff5365]' : 'text-[#21dfbd]'}`}>
                  %{100 - wageCapPercent}
                </span>
              </div>
              <div className="text-xl font-black text-[#4FE4FF] font-mono">
                €{(remainingWageBudget / 1_000).toFixed(0)}K
                <span className="text-xs text-zinc-400 font-normal"> /hf</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full ${wageCapPercent > 90 ? 'bg-[#ff5365]' : 'bg-[#4FE4FF]'}`}
                  style={{ width: `${wageCapPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMMAND NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'MARKET'
              ? 'bg-[#b8ff3d] text-[#050706] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>TÜM PAZAR ({marketPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LISTED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'LISTED'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Flame className="w-4 h-4 text-[#ffd34f]" />
          <span>SATILIK LİSTESİ ({listedPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FREE_AGENTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'FREE_AGENTS'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <UserCheck className="w-4 h-4 text-[#21dfbd]" />
          <span>SERBEST OYUNCULAR ({freeAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SHORTLIST')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'SHORTLIST'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#ffd34f]" />
          <span>GÖZLEM LİSTESİ ({shortlistedPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTGOING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 relative ${
            activeTab === 'OUTGOING'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>GÖRÜŞMELERİMİZ ({userNegotiations.length})</span>
          {activeNegsCount > 0 && (
            <span className="w-2 h-2 bg-[#b8ff3d] rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('INCOMING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 relative ${
            activeTab === 'INCOMING'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>GELEN TEKLİFLER ({incomingOffers.length})</span>
          {incomingOffers.some((o) => o.status === 'PENDING') && (
            <span className="w-2 h-2 bg-[#ff5365] rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'HISTORY'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <History className="w-4 h-4" />
          <span>GEÇMİŞ ({transferHistory.length})</span>
        </button>
      </div>

      {/* 3. MAIN CONTENT SPLIT (TABLE + QUICK DRAWER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className={`space-y-5 ${drawerPlayer ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* CONTROLS TOOLBAR (MARKET & LISTED TABS) */}
          {(activeTab === 'MARKET' || activeTab === 'LISTED') && (
            <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-4 space-y-3 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Oyuncu adı, kulüp veya uyruk ara..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setMarketPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#b8ff3d] font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Position */}
                <div className="sm:col-span-3">
                  <select
                    value={selectedPosition}
                    onChange={(e) => {
                      setSelectedPosition(e.target.value);
                      setMarketPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b8ff3d] font-mono"
                  >
                    <option value="ALL">Tüm Mevkiler</option>
                    <option value="GK">Kaleci (GK)</option>
                    <option value="DC">Stoper (DC)</option>
                    <option value="DR">Sağ Bek (DR)</option>
                    <option value="DL">Sol Bek (DL)</option>
                    <option value="DMC">Ön Libero (DMC)</option>
                    <option value="MC">Merkez Orta Saha (MC)</option>
                    <option value="AMC">Ofansif Orta Saha (AMC)</option>
                    <option value="MR">Sağ Kanat (MR)</option>
                    <option value="ML">Sol Kanat (ML)</option>
                    <option value="AMR">Sağ Açık (AMR)</option>
                    <option value="AML">Sol Açık (AML)</option>
                    <option value="ST">Santrfor (ST)</option>
                  </select>
                </div>

                {/* Min OVR */}
                <div className="sm:col-span-2">
                  <select
                    value={minOverall}
                    onChange={(e) => {
                      setMinOverall(Number(e.target.value));
                      setMarketPage(1);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b8ff3d] font-mono"
                  >
                    <option value="0">OVR: Tümü</option>
                    <option value="70">70+ OVR</option>
                    <option value="75">75+ OVR</option>
                    <option value="80">80+ Yıldız</option>
                    <option value="85">85+ Elit</option>
                  </select>
                </div>

                {/* Max Age */}
                <div className="sm:col-span-2">
                  <select
                    value={maxAge}
                    onChange={(e) => {
                      setMaxAge(Number(e.target.value));
                      setMarketPage(1);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b8ff3d] font-mono"
                  >
                    <option value="40">Yaş: 40</option>
                    <option value="21">21 ve Altı (Genç)</option>
                    <option value="24">24 ve Altı</option>
                    <option value="28">28 ve Altı</option>
                  </select>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px] font-mono">
                <span className="text-zinc-500 uppercase">Hızlı Filtre:</span>
                {[
                  { key: 'ALL', label: 'Tümü' },
                  { key: 'LISTED', label: 'Satılık Listesi' },
                  { key: 'EXPIRING', label: 'Sözleşmesi Bitenler (<6 Ay)' },
                  { key: 'SCOUTED', label: 'Gözlenmiş Oyuncular (%80+)' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setQuickFilter(item.key as any);
                      setMarketPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg border transition-all ${
                      quickFilter === item.key
                        ? 'bg-[#b8ff3d]/20 text-[#b8ff3d] border-[#b8ff3d]/50 font-bold'
                        : 'bg-[#050706] text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: ALL MARKET */}
          {activeTab === 'MARKET' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4">OYUNCU</th>
                      <th className="py-3 px-3">KULÜP</th>
                      <th className="py-3 px-2 text-center">MEVKİ</th>
                      <th className="py-3 px-2 text-center">YAŞ</th>
                      <th className="py-3 px-3 text-center">OVR / POT</th>
                      <th className="py-3 px-3 text-right">DEĞER</th>
                      <th className="py-3 px-3 text-right">MAAŞ</th>
                      <th className="py-3 px-3 text-center">DURUM</th>
                      <th className="py-3 px-3 text-center">GÖZLEM NOTU</th>
                      <th className="py-3 px-4 text-center">AKSİYON</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {paginatedMarketPlayers.map((player) => {
                      const club = getClub(player.clubId);
                      const isShortlisted = shortlistIds.includes(player.id);
                      const masked = getMaskedPlayer(player);
                      const statusInfo = getTransferStatusInfo(player);
                      const grade = getScoutGrade(player);
                      const isSelected = drawerPlayer?.id === player.id;

                      return (
                        <tr
                          key={player.id}
                          onClick={() => setDrawerPlayer(player)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#b8ff3d]/10 border-l-4 border-l-[#b8ff3d]'
                              : 'hover:bg-[#0d130f]'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <PlayerPortrait player={player} size="sm" />
                              <div>
                                <div className="font-bold text-white tracking-tight uppercase hover:text-[#b8ff3d] transition-colors">
                                  {player.firstName} {player.lastName}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500">
                                  {player.nationality} {player.archetype ? `• ${player.archetype}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {club && (
                                <ClubBadge
                                  code={club.code}
                                  primaryColor={club.primaryColor}
                                  secondaryColor={club.secondaryColor}
                                  size="xs"
                                />
                              )}
                              <span className="text-zinc-300 text-xs truncate max-w-[120px]" title={club?.name}>
                                {club?.name || 'Harici Kulüp'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#050706] border border-white/10 text-[#b8ff3d] rounded">
                              {player.position}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {player.age}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                              <span className="font-bold text-white">{masked.overallDisplay}</span>
                              <span className="text-zinc-600">/</span>
                              <span className="text-[#4FE4FF] font-bold">{masked.potentialDisplay}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {masked.marketValueDisplay}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-[#b8ff3d]">
                            {masked.wageDisplay}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded uppercase ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-black border rounded ${grade.color}`}>
                              {grade.grade}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => toggleShortlist(player.id)}
                                title={isShortlisted ? 'Gözlemden Çıkar' : 'Gözlem Listesine Ekle'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isShortlisted
                                    ? 'bg-[#ffd34f]/20 text-[#ffd34f] border-[#ffd34f]/50'
                                    : 'bg-[#050706] text-zinc-400 border-white/10 hover:text-white'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setNegotiationTargetPlayer(player)}
                                className="px-2.5 py-1 bg-[#b8ff3d] hover:bg-[#a6ec31] text-[#050806] font-mono font-black text-xs uppercase rounded-lg transition-all"
                              >
                                Teklif
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 bg-[#090d0a] rounded-xl border border-white/10 text-xs font-mono">
                <span className="text-zinc-400">
                  Toplam {marketPlayers.length} futbolcu • Sayfa {marketPage} / {marketTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={marketPage <= 1}
                    onClick={() => setMarketPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-[#050706] border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 flex items-center gap-1 text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Önceki
                  </button>
                  <button
                    disabled={marketPage >= marketTotalPages}
                    onClick={() => setMarketPage((prev) => Math.min(marketTotalPages, prev + 1))}
                    className="px-3 py-1.5 bg-[#050706] border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 flex items-center gap-1 text-white"
                  >
                    Sonraki <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSFER LISTED */}
          {activeTab === 'LISTED' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4">OYUNCU</th>
                      <th className="py-3 px-3">KULÜBÜ</th>
                      <th className="py-3 px-2 text-center">MEVKİ</th>
                      <th className="py-3 px-2 text-center">YAŞ</th>
                      <th className="py-3 px-3 text-center">OVR</th>
                      <th className="py-3 px-3 text-right">PİYASA DEĞERİ</th>
                      <th className="py-3 px-3 text-right">MAAŞ</th>
                      <th className="py-3 px-3 text-center">LİSTELEME NEDENİ</th>
                      <th className="py-3 px-4 text-center">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {listedPlayers.map((player) => {
                      const club = getClub(player.clubId);
                      const isShortlisted = shortlistIds.includes(player.id);
                      const isSelected = drawerPlayer?.id === player.id;

                      return (
                        <tr
                          key={player.id}
                          onClick={() => setDrawerPlayer(player)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#b8ff3d]/10 border-l-4 border-l-[#b8ff3d]' : 'hover:bg-[#0d130f]'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <PlayerPortrait player={player} size="sm" />
                              <div>
                                <div className="font-bold text-white uppercase">{player.firstName} {player.lastName}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{player.nationality}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-zinc-300 font-mono text-xs">{club?.name || 'Harici'}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#050706] border border-white/10 text-[#b8ff3d] rounded">
                              {player.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">{player.age}</td>
                          <td className="py-3 px-3 text-center"><StatBadge value={player.overall} size="sm" /></td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            €{(player.marketValue / 1_000_000).toFixed(2)}M
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#b8ff3d]">
                            €{player.wage.toLocaleString('tr-TR')}/hf
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase bg-[#ffd34f]/10 text-[#ffd34f] border border-[#ffd34f]/30">
                              {player.isTransferListedByRequest ? 'Talebi Üzerine' : 'Kulüp Kararı'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setNegotiationTargetPlayer(player)}
                              className="px-3 py-1 bg-[#b8ff3d] hover:bg-[#a6ec31] text-[#050806] font-mono font-black text-xs uppercase rounded-lg"
                            >
                              Teklif Yap
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FREE AGENTS */}
          {activeTab === 'FREE_AGENTS' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#090d0a] rounded-2xl border border-white/10 text-xs text-zinc-300 flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#21dfbd] shrink-0" />
                <div>
                  <strong className="text-white uppercase font-mono">Bonservissiz Serbest Oyuncular Masası:</strong> Toplam {freeAgents.length} kulüpsüz profesyonel futbolcu. Kulüplere bonservis ödenmez; doğrudan sözleşme ve imza primi üzerinden anlaşılır.
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[920px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4">OYUNCU</th>
                      <th className="py-3 px-3">ÖNCEKİ KULÜBÜ</th>
                      <th className="py-3 px-2 text-center">MEVKİ</th>
                      <th className="py-3 px-2 text-center">YAŞ</th>
                      <th className="py-3 px-3 text-center">OVR</th>
                      <th className="py-3 px-3 text-right">MAAŞ BEKLENTİSİ</th>
                      <th className="py-3 px-3 text-right">İMZA PRİMİ</th>
                      <th className="py-3 px-4 text-center">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {paginatedFreeAgents.map((player) => {
                      const signingBonusEstimate = Math.round((player.wage * 6) / 5000) * 5000;
                      const isSelected = drawerPlayer?.id === player.id;

                      return (
                        <tr
                          key={player.id}
                          onClick={() => setDrawerPlayer(player)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#b8ff3d]/10 border-l-4 border-l-[#b8ff3d]' : 'hover:bg-[#0d130f]'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <PlayerPortrait player={player} size="sm" />
                              <div>
                                <div className="font-bold text-white uppercase">{player.firstName} {player.lastName}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{player.nationality}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-400 text-xs">
                            {player.previousClubName || 'Serbest'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#050806] border border-white/10 text-[#21dfbd] rounded">
                              {player.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">{player.age}</td>
                          <td className="py-3 px-3 text-center"><StatBadge value={player.overall} size="sm" /></td>
                          <td className="py-3 px-3 text-right font-mono text-[#b8ff3d] font-bold">
                            €{player.wage.toLocaleString('tr-TR')}/hf
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-300">
                            €{signingBonusEstimate.toLocaleString('tr-TR')}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setNegotiationTargetPlayer(player)}
                              className="px-3 py-1.5 bg-[#21dfbd] hover:bg-[#1bc4a5] text-[#050806] font-mono font-black text-xs uppercase rounded-lg transition-all"
                            >
                              Sözleşme Masası
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Free agent pagination */}
              <div className="flex items-center justify-between p-4 bg-[#090d0a] rounded-xl border border-white/10 text-xs font-mono">
                <span className="text-zinc-400">
                  Toplam {freeAgents.length} serbest oyuncu • Sayfa {freeAgentPage} / {freeAgentTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={freeAgentPage <= 1}
                    onClick={() => setFreeAgentPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-[#050706] border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 text-white"
                  >
                    Önceki
                  </button>
                  <button
                    disabled={freeAgentPage >= freeAgentTotalPages}
                    onClick={() => setFreeAgentPage((prev) => Math.min(freeAgentTotalPages, prev + 1))}
                    className="px-3 py-1.5 bg-[#050706] border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/30 text-white"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHORTLIST */}
          {activeTab === 'SHORTLIST' && (
            <div className="space-y-4">
              {shortlistedPlayers.length === 0 ? (
                <div className="p-12 bg-[#090d0a] rounded-2xl border border-white/10 text-center text-zinc-400 font-mono text-sm">
                  Gözlem listenizde henüz kayıtlı futbolcu bulunmuyor. Pazardan oyuncuları listenize ekleyebilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shortlistedPlayers.map((player) => {
                    const club = getClub(player.clubId);

                    return (
                      <div
                        key={player.id}
                        className="p-5 bg-[#090d0a] rounded-2xl border border-white/10 flex flex-col justify-between gap-4 hover:border-white/20 transition-all shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PlayerPortrait player={player} size="md" />
                            <div>
                              <h3
                                onClick={() => setDrawerPlayer(player)}
                                className="font-bold text-white uppercase tracking-tight hover:text-[#b8ff3d] cursor-pointer transition-colors"
                              >
                                {player.firstName} {player.lastName}
                              </h3>
                              <div className="text-[11px] font-mono text-zinc-400">
                                {club ? club.name : 'Serbest'} • {player.position} ({player.age} YAŞ)
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatBadge value={player.overall} size="sm" />
                            <button
                              onClick={() => toggleShortlist(player.id)}
                              className="p-1.5 bg-[#ffd34f]/20 text-[#ffd34f] border border-[#ffd34f]/40 rounded-lg"
                              title="Gözlemden Çıkar"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Değer</span>
                            <span className="font-bold text-white">€{(player.marketValue / 1_000_000).toFixed(2)}M</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Maaş</span>
                            <span className="font-bold text-[#b8ff3d]">€{player.wage.toLocaleString('tr-TR')}/hf</span>
                          </div>
                          <button
                            onClick={() => setNegotiationTargetPlayer(player)}
                            className="px-3.5 py-1.5 bg-[#b8ff3d] text-[#050806] font-black text-xs uppercase rounded-lg hover:bg-[#a6ec31] transition-all"
                          >
                            Pazarlık
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: OUTGOING NEGOTIATIONS */}
          {activeTab === 'OUTGOING' && (
            <div className="space-y-4">
              {userNegotiations.length === 0 ? (
                <div className="p-12 bg-[#090d0a] rounded-2xl border border-white/10 text-center text-zinc-400 font-mono text-sm">
                  Şu an masada aktif veya arşivlenmiş bir transfer görüşmeniz bulunmuyor.
                </div>
              ) : (
                userNegotiations.map((neg) => {
                  const player = getPlayer(neg.playerId);
                  const club = getClub(neg.sellerClubId);
                  const statusInfo = getNegotiationStatusDisplay(neg);
                  const isCompleted = statusInfo.status === 'COMPLETED';
                  const contractData = neg.latestContractOffer || neg.latestContractDemand;
                  const clubFeeData = neg.latestClubOffer || neg.latestClubDemand;

                  return (
                    <div
                      key={neg.id}
                      className="p-5 bg-[#090d0a] rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/20 shadow-xl"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        {player ? (
                          <PlayerPortrait player={player} size="lg" />
                        ) : club ? (
                          <ClubBadge
                            code={club.code}
                            primaryColor={club.primaryColor}
                            secondaryColor={club.secondaryColor}
                            size="md"
                          />
                        ) : null}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#4FE4FF]/10 text-[#4FE4FF] border border-[#4FE4FF]/30 rounded">
                              {statusInfo.stageTitle}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase rounded border ${statusInfo.badgeClass}`}>
                              {statusInfo.badgeText}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500">GÜNCELLENDİ: {neg.lastUpdatedDate}</span>
                          </div>

                          <h3 className="text-base font-bold text-white uppercase tracking-tight">
                            {player?.firstName} {player?.lastName} ({player?.position})
                          </h3>

                          <p className="text-xs font-mono text-zinc-400">
                            {club ? club.name : 'Serbest Oyuncu'} • OVR: {player?.overall} • YAŞ: {player?.age}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                            {contractData && (
                              <span className="px-2.5 py-0.5 bg-[#050706] border border-white/10 text-[#b8ff3d] font-bold rounded">
                                €{contractData.wage.toLocaleString('tr-TR')} / hf • {contractData.durationYears} Yıl
                              </span>
                            )}
                            {!neg.isFreeAgent && clubFeeData && (
                              <span className="px-2.5 py-0.5 bg-[#050706] border border-white/10 text-[#ffd34f] font-bold rounded">
                                Bonservis: €{((clubFeeData.upfrontFee + (clubFeeData.installmentsFee || 0)) / 1_000_000).toFixed(2)}M
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted ? (
                          <Link
                            href="/squad"
                            className="px-4 py-2 bg-[#b8ff3d] text-[#050806] font-mono font-black text-xs uppercase rounded-xl hover:bg-[#a6ec31] transition-all flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            Kadroda Gör
                          </Link>
                        ) : player ? (
                          <button
                            onClick={() => setNegotiationTargetPlayer(player)}
                            className="px-4 py-2 bg-[#b8ff3d] text-[#050806] font-mono font-black text-xs uppercase rounded-xl hover:bg-[#a6ec31] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(184,255,61,0.3)]"
                          >
                            <Briefcase className="w-4 h-4" />
                            Masaya Dön
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 6: INCOMING OFFERS */}
          {activeTab === 'INCOMING' && (
            <div className="space-y-4">
              {incomingOffers.length === 0 ? (
                <div className="p-12 bg-[#090d0a] rounded-2xl border border-white/10 text-center text-zinc-400 font-mono text-sm">
                  Kulübünüze gelen herhangi bir transfer teklifi bulunmuyor.
                </div>
              ) : (
                incomingOffers.map((offer) => {
                  const player = getPlayer(offer.playerId);
                  const buyer = getClub(offer.fromClubId);

                  return (
                    <div
                      key={offer.id}
                      className="p-5 bg-[#090d0a] rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        {buyer && (
                          <ClubBadge
                            code={buyer.code}
                            primaryColor={buyer.primaryColor}
                            secondaryColor={buyer.secondaryColor}
                            size="md"
                          />
                        )}
                        <div>
                          <div className="text-xs text-zinc-400 font-mono">
                            <strong className="text-white uppercase">{buyer?.name}</strong> kulübünden resmi bonservis teklifi:
                          </div>
                          <h3 className="text-base font-bold text-white uppercase tracking-tight mt-0.5">
                            {player?.firstName} {player?.lastName} ({player?.position})
                          </h3>
                          <div className="text-xs font-mono text-zinc-500 mt-0.5">
                            Piyasa Değeri: €{player?.marketValue.toLocaleString('tr-TR')} • Maaş: €{player?.wage.toLocaleString('tr-TR')}/hf
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-zinc-500 block uppercase">Teklif Edilen Bonservis</span>
                          <span className="text-xl font-black text-[#b8ff3d]">
                            €{offer.fee.toLocaleString('tr-TR')}
                          </span>
                        </div>

                        {offer.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => respondToTransferOffer(offer.id, true)}
                              className="px-3.5 py-2 bg-[#b8ff3d] text-[#050806] font-mono font-black text-xs uppercase rounded-xl hover:bg-[#a6ec31] transition-all flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Kabul
                            </button>
                            <button
                              onClick={() => respondToTransferOffer(offer.id, false)}
                              className="px-3.5 py-2 bg-[#ff5365]/20 text-[#ff5365] border border-[#ff5365]/40 font-mono font-bold text-xs uppercase rounded-xl hover:bg-[#ff5365]/30 transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 font-mono text-xs font-bold uppercase rounded ${
                              offer.status === 'ACCEPTED'
                                ? 'bg-[#b8ff3d]/20 text-[#b8ff3d] border border-[#b8ff3d]/30'
                                : 'bg-[#ff5365]/20 text-[#ff5365] border border-[#ff5365]/30'
                            }`}
                          >
                            {offer.status === 'ACCEPTED' ? 'Kabul Edildi' : 'Reddedildi'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 7: TRANSFER HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              {transferHistory.length === 0 ? (
                <div className="p-12 bg-[#090d0a] rounded-2xl border border-white/10 text-center text-zinc-400 font-mono text-sm">
                  Bu sezonda henüz resmileşmiş bir transfer kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        <th className="py-3 px-4">TARİH</th>
                        <th className="py-3 px-3">FUTBOLCU</th>
                        <th className="py-3 px-3">AYRILAN</th>
                        <th className="py-3 px-3">GELEN</th>
                        <th className="py-3 px-3 text-right">BONSERVİS</th>
                        <th className="py-3 px-3 text-right">MAAŞ</th>
                        <th className="py-3 px-4 text-center">DURUM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-medium">
                      {transferHistory.map((tr) => (
                        <tr key={tr.id} className="hover:bg-[#0d130f]">
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{tr.date}</td>
                          <td className="py-3 px-3 font-bold text-white uppercase font-mono">
                            {tr.playerName} ({tr.playerPosition})
                          </td>
                          <td className="py-3 px-3 text-zinc-400">{tr.fromClubName}</td>
                          <td className="py-3 px-3 text-[#b8ff3d] font-bold">{tr.toClubName}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-white">
                            {tr.fee === 0 ? 'Bedelsiz' : `€${tr.fee.toLocaleString('tr-TR')}`}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#b8ff3d]">
                            €{tr.wage.toLocaleString('tr-TR')}/hf
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30">
                              {tr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. SELECTED PLAYER QUICK DRAWER (RIGHT COLUMN) */}
        {drawerPlayer && (
          <div className="lg:col-span-4 sticky top-6 bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-5 shadow-2xl animate-in slide-in-from-right-4 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono font-bold uppercase text-[#b8ff3d] tracking-widest">
                // OYUNCU İNCELEME DOSYASI
              </span>
              <button
                onClick={() => setDrawerPlayer(null)}
                className="w-7 h-7 rounded-lg bg-[#050706] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3D-styled Holographic Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d130f] via-[#050706] to-[#090d0a] border border-[#b8ff3d]/30 p-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <PlayerPortrait player={drawerPlayer} size="xl" />
                <div className="text-right">
                  <span className="text-3xl font-black text-[#b8ff3d] font-sport block leading-none">
                    {drawerPlayer.overall}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">GENEL GÜÇ</span>
                  <span className="text-xs font-mono font-bold text-[#4FE4FF] block mt-1">
                    POT {drawerPlayer.potential}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight font-sport">
                  {drawerPlayer.firstName} {drawerPlayer.lastName}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                  <span className="px-2 py-0.5 rounded bg-[#b8ff3d]/15 text-[#b8ff3d] font-bold">
                    {drawerPlayer.position}
                  </span>
                  <span>{drawerPlayer.age} YAŞ</span>
                  <span>•</span>
                  <span>{drawerPlayer.nationality}</span>
                </div>
              </div>
            </div>

            {/* Core Attributes Bars */}
            <div className="space-y-2.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                FİZİKSEL & TEKNİK PROFİL
              </span>
              {[
                { label: 'HIZ (PAC)', val: drawerPlayer.attributes?.pace ?? 70 },
                { label: 'ŞUT (SHO)', val: drawerPlayer.attributes?.finishing ?? 70 },
                { label: 'PAS (PAS)', val: drawerPlayer.attributes?.passing ?? 70 },
                { label: 'DRİBLİNG (DRI)', val: drawerPlayer.attributes?.dribbling ?? 70 },
                { label: 'DEFANS (DEF)', val: drawerPlayer.attributes?.tackling ?? 70 },
                { label: 'FİZİK (PHY)', val: drawerPlayer.attributes?.strength ?? 70 },
              ].map((attr) => (
                <div key={attr.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">{attr.label}</span>
                    <span className="font-bold text-white">{attr.val}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        attr.val >= 80 ? 'bg-[#b8ff3d]' : attr.val >= 70 ? 'bg-[#21dfbd]' : 'bg-[#ffd34f]'
                      }`}
                      style={{ width: `${attr.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Financial & Contract Specs */}
            <div className="bg-[#050706] rounded-xl border border-white/10 p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Piyasa Değeri:</span>
                <span className="font-bold text-white">€{(drawerPlayer.marketValue / 1_000_000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Mevcut Maaşı:</span>
                <span className="font-bold text-[#b8ff3d]">€{drawerPlayer.wage.toLocaleString('tr-TR')}/hf</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Kalan Sözleşme:</span>
                <span className="text-zinc-300">{drawerPlayer.contractYearsLeft ? `${drawerPlayer.contractYearsLeft} Yıl` : '1 Yıl'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setNegotiationTargetPlayer(drawerPlayer);
                }}
                className="w-full py-3 bg-[#b8ff3d] hover:bg-[#a6ec31] text-[#050806] font-mono font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(184,255,61,0.3)] flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                BONSERVİS & SÖZLEŞME PAZARLIĞI
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleShortlist(drawerPlayer.id)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold uppercase border transition-all flex items-center justify-center gap-1.5 ${
                    shortlistIds.includes(drawerPlayer.id)
                      ? 'bg-[#ffd34f]/20 text-[#ffd34f] border-[#ffd34f]/40'
                      : 'bg-[#050706] text-zinc-300 border-white/10 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {shortlistIds.includes(drawerPlayer.id) ? 'Gözlemde' : 'Listeye Ekle'}
                </button>

                <button
                  onClick={() => setInspectedPlayer(drawerPlayer)}
                  className="py-2 bg-[#050706] hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Tam Profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Player Modal */}
      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          club={getClub(inspectedPlayer.clubId)}
          onClose={() => setInspectedPlayer(null)}
          isShortlisted={shortlistIds.includes(inspectedPlayer.id)}
          onToggleShortlist={toggleShortlist}
          onMakeBid={() => {
            setNegotiationTargetPlayer(inspectedPlayer);
            setInspectedPlayer(null);
          }}
        />
      )}

      {/* Negotiation Modal */}
      {negotiationTargetPlayer && (
        <NegotiationModal
          player={negotiationTargetPlayer}
          isContractRenewal={negotiationTargetPlayer.clubId === userClub.id}
          onClose={() => setNegotiationTargetPlayer(null)}
        />
      )}
    </div>
  );
}
