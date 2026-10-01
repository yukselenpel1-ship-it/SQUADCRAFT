'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { Player, PositionCategory, Formation } from '@/types/game';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { StatCard } from '@/components/ui/StatCard';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import {
  Users,
  Search,
  Sliders,
  Award,
  AlertCircle,
  TrendingUp,
  Shield,
  Star,
  Activity,
  Heart,
  ChevronRight,
  Flame,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function SquadPage() {
  const {
    userClub,
    userPlayers,
    finances,
    standings,
    tactics,
    isCareerHydrated,
    isInitialized,
    seasonYear,
  } = useGame();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | PositionCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [renewingPlayer, setRenewingPlayer] = useState<Player | null>(null);

  // Position Category Helper
  const getCategory = (pos: string): PositionCategory => {
    if (pos === 'GK') return 'GK';
    if (['DR', 'DC', 'DL', 'CB', 'LB', 'RB'].includes(pos)) return 'DEF';
    if (['DMC', 'MC', 'MR', 'ML', 'AMC', 'DM', 'CM', 'CAM'].includes(pos)) return 'MID';
    return 'ATT';
  };

  // KPIs
  const totalSquadValue = useMemo(() => {
    return userPlayers.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  }, [userPlayers]);

  const avgAge = useMemo(() => {
    if (userPlayers.length === 0) return 25;
    return (userPlayers.reduce((sum, p) => sum + p.age, 0) / userPlayers.length).toFixed(1);
  }, [userPlayers]);

  const wageUsagePercent = useMemo(() => {
    const weekly = finances?.weeklyWages || 100000;
    const budget = finances?.wageBudget || 200000;
    return Math.min(100, Math.round((weekly / budget) * 100));
  }, [finances]);

  const foreignersCount = useMemo(() => {
    return userPlayers.filter((p) => p.nationality && p.nationality !== 'TUR' && p.nationality !== 'Türkiye').length;
  }, [userPlayers]);

  const userStanding = standings.find((s) => s.clubId === userClub.id);

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return userPlayers
      .filter((p) => {
        if (selectedCategory !== 'ALL' && getCategory(p.position) !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = `${p.firstName} ${p.lastName}`.toLowerCase();
          const pos = p.position.toLowerCase();
          if (!name.includes(q) && !pos.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [userPlayers, selectedCategory, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    return {
      ALL: userPlayers.length,
      GK: userPlayers.filter((p) => getCategory(p.position) === 'GK').length,
      DEF: userPlayers.filter((p) => getCategory(p.position) === 'DEF').length,
      MID: userPlayers.filter((p) => getCategory(p.position) === 'MID').length,
      ATT: userPlayers.filter((p) => getCategory(p.position) === 'ATT').length,
    };
  }, [userPlayers]);

  // Starting 11 vs Bench
  const currentFormation = (tactics?.formation || '4-3-3') as Formation;
  const slots = FORMATION_COORDINATES[currentFormation] || FORMATION_COORDINATES['4-3-3'];
  const lineup = tactics?.lineup || [];

  const starting11 = useMemo(() => {
    return slots.slice(0, 11).map((slot, idx) => {
      const assigned = lineup[idx];
      const player = assigned ? userPlayers.find((p) => p.id === assigned.playerId) : userPlayers[idx];
      return { slot, player };
    });
  }, [slots, lineup, userPlayers]);

  const startingPlayerIds = useMemo(() => {
    return starting11.map((item) => item.player?.id).filter(Boolean);
  }, [starting11]);

  const benchPlayers = useMemo(() => {
    return userPlayers.filter((p) => !startingPlayerIds.includes(p.id)).slice(0, 7);
  }, [userPlayers, startingPlayerIds]);

  // Injured & Suspended
  const injuredOrSuspended = useMemo(() => {
    return userPlayers.filter((p) => p.isInjured || p.isSuspended);
  }, [userPlayers]);

  if (!isInitialized || !isCareerHydrated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Kadro verileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Daha Büyük Hedeflere"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* 2. TOP KPI CARDS (7 CARDS AS IN REFERENCE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Kadro Değeri"
          value={`€${(totalSquadValue / 1000000).toFixed(1)}M`}
          change="+8%"
          changeType="positive"
          subtext={`Lig'de ${userStanding?.rank || 6}. sırada`}
          icon={TrendingUp}
        />

        <StatCard
          label="Maaş Bütçesi"
          value={`€${((finances?.weeklyWages || 120000) / 1000).toFixed(0)}K / hf`}
          progressPercent={wageUsagePercent}
          subtext={`%${wageUsagePercent} kullanım`}
          icon={Activity}
        />

        <StatCard
          label="Kadro Büyüklüğü"
          value={`${userPlayers.length} Oyuncu`}
          subtext={`${starting11.filter(s => s.player).length} As / ${benchPlayers.length} Yedek`}
          icon={Users}
        />

        <StatCard
          label="Ortalama Yaş"
          value={avgAge}
          subtext="Lig'de 4. sırada"
          icon={Award}
        />

        <StatCard
          label="Yabancı Oyuncu"
          value={`${foreignersCount} / 14`}
          subtext="Limit içerisinde"
          icon={Shield}
        />

        <StatCard
          label="Takım Uyumu"
          value="%57"
          change="+6%"
          changeType="positive"
          subtext="Artış eğiliminde"
          icon={Heart}
        />

        <StatCard
          label="Forma Derecesi"
          value="8.2 / 10"
          subtext="Mükemmel kondisyon"
          icon={Star}
        />
      </div>

      {/* 3. MAIN SQUAD SECTION: LEFT MINI PITCH + RIGHT SQUAD TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: İLK 11 VE DİZİLİŞ (4 COLS) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)]">
            <h3 className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#65F56B]" />
              İlk 11 ve Diziliş
            </h3>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#0D1C26] border border-zinc-800 text-[10px] font-mono font-bold text-white">
                {currentFormation}
              </span>

              <Link
                href="/tactics"
                className="px-2.5 py-1 rounded-lg bg-[#65F56B]/20 hover:bg-[#65F56B]/30 text-[#65F56B] border border-[#65F56B]/40 text-[10px] font-black uppercase tracking-wider transition font-mono"
              >
                Diziliş Düzenle
              </Link>
            </div>
          </div>

          {/* Tactical Pitch with Starting 11 */}
          <div className="relative w-full h-[430px] rounded-xl bg-gradient-to-b from-[#0c2415] via-[#091a10] to-[#05100a] border border-[#65F56B]/30 overflow-hidden my-3">
            {/* Pitch Markings */}
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <div className="absolute inset-2 border border-white" />
              <div className="absolute top-1/2 left-2 right-2 h-px bg-white" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-14 border-b border-l border-r border-white" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-14 border-t border-l border-r border-white" />
            </div>

            {/* Starting 11 Players */}
            {starting11.map((item, idx) => {
              if (!item.player) return null;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPlayer(item.player!)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform z-10"
                  style={{ left: `${item.slot.x}%`, top: `${item.slot.y}%` }}
                >
                  <div className="relative">
                    <PlayerPortrait player={item.player} size="xs" shape="circle" />
                    <span className="absolute -top-1 -right-1.5 px-1 rounded bg-black/90 text-[8px] font-mono font-black text-[#65F56B] border border-[#65F56B]/50">
                      {item.player.overall}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-white group-hover:text-[#65F56B] truncate max-w-[48px] drop-shadow-md mt-0.5">
                    {item.player.lastName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] font-mono text-zinc-500 text-center">
            Oyuncu detayını görmek için üzerine tıklayın
          </div>
        </div>

        {/* RIGHT COLUMN: KADRO LİSTESİ (8 COLS) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#65F56B]" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-white font-sans">
                  Kadro Listesi ({userPlayers.length})
                </h3>
              </div>

              {/* Pills: Tümü, Kaleciler, Defans, Orta Saha, Forvetler */}
              <div className="flex items-center gap-1 overflow-x-auto select-none">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as const).map((cat) => {
                  const label =
                    cat === 'ALL'
                      ? `Tümü (${categoryCounts.ALL})`
                      : cat === 'GK'
                      ? `Kaleciler (${categoryCounts.GK})`
                      : cat === 'DEF'
                      ? `Defans (${categoryCounts.DEF})`
                      : cat === 'MID'
                      ? `Orta Saha (${categoryCounts.MID})`
                      : `Forvetler (${categoryCounts.ATT})`;

                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition whitespace-nowrap ${
                        isActive
                          ? 'bg-[#65F56B] text-black shadow-[0_0_10px_rgba(101,245,107,0.3)] font-black'
                          : 'bg-[#0D1C26] text-zinc-400 hover:text-white border border-[rgba(125,160,175,0.1)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Filter */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İsim veya mevkide ara..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070D14] border border-[rgba(125,160,175,0.14)] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#65F56B]/60 font-sans"
                />
              </div>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                    <th className="py-2 pl-2 w-7">#</th>
                    <th className="py-2">Oyuncu</th>
                    <th className="py-2 text-center w-12">Mevki</th>
                    <th className="py-2 text-center w-12">GEN</th>
                    <th className="py-2 text-center w-14">Durum</th>
                    <th className="py-2 text-center w-16">Moral</th>
                    <th className="py-2 text-center w-10">Yaş</th>
                    <th className="py-2 text-center w-16">Sözleşme</th>
                    <th className="py-2 text-right pr-2 w-24">Piyasa Değeri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {filteredPlayers.map((player, idx) => (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="hover:bg-[#0D1C26]/80 cursor-pointer transition text-zinc-300"
                    >
                      <td className="py-2 pl-2 text-zinc-500 text-[10px] font-bold">
                        {idx + 1}
                      </td>

                      {/* Player Portrait + Name */}
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <PlayerPortrait player={player} size="xs" shape="circle" />
                          <div className="truncate">
                            <span className="text-white font-bold hover:text-[#65F56B] transition-colors truncate block">
                              {player.firstName} {player.lastName}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {player.nationality || 'TUR'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0D1C26] border border-zinc-800 text-zinc-300">
                          {player.position}
                        </span>
                      </td>

                      {/* Overall Rating */}
                      <td className="py-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40">
                          {player.overall}
                        </span>
                      </td>

                      {/* Fitness / Condition Bar */}
                      <td className="py-2 text-center">
                        <div className="w-10 mx-auto bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#65F56B] rounded-full"
                            style={{ width: `${player.fitness || 90}%` }}
                          />
                        </div>
                      </td>

                      {/* Morale */}
                      <td className="py-2 text-center text-[10px]">
                        <span className="text-emerald-400 font-bold">
                          😊 {player.morale || 'İyi'}
                        </span>
                      </td>

                      {/* Age */}
                      <td className="py-2 text-center text-zinc-400">
                        {player.age}
                      </td>

                      {/* Contract */}
                      <td className="py-2 text-center text-zinc-400 text-[11px]">
                        {player.contractYearsLeft ? `${player.contractYearsLeft} Yıl` : '1 Yıl'}
                      </td>

                      {/* Market Value */}
                      <td className="py-2 text-right pr-2 font-black text-white">
                        €{(player.marketValue / 1000000).toFixed(1)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM PANELS: YEDEK KULÜBESİ, ROLLER, POZİSYON DERİNLİĞİ, SAKATLIKLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PANEL 1: YEDEK KULÜBESİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Yedek Kulübesi
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {benchPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="p-2 rounded-xl bg-[#0D1C26] border border-zinc-800 hover:border-[#65F56B]/40 cursor-pointer flex flex-col items-center gap-1 shrink-0 w-16 text-center transition"
              >
                <span className="text-[10px] font-black font-mono text-[#65F56B]">
                  {player.overall}
                </span>
                <PlayerPortrait player={player} size="xs" shape="circle" />
                <span className="text-[9px] font-mono font-bold text-white truncate max-w-full">
                  {player.lastName}
                </span>
                <span className="text-[8px] font-mono text-zinc-500">{player.position}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2: KADRO ROLLERİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Kadro Rolleri
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            {userPlayers.slice(0, 4).map((player, i) => {
              const roles = ['Kaptan', 'Penaltı Atıcısı', 'Serbest Vuruş', 'Korner'];
              return (
                <div key={player.id} className="flex items-center justify-between p-1.5 rounded-lg bg-[#0D1C26]/60">
                  <span className="text-zinc-400 text-[10px]">{roles[i]}</span>
                  <div className="flex items-center gap-1.5">
                    <PlayerPortrait player={player} size="xs" shape="circle" />
                    <span className="text-white font-bold text-[11px]">{player.lastName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 3: POZİSYON DERİNLİĞİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Pozisyon Derinliği
          </h4>
          <div className="space-y-1.5 text-[10px] font-mono">
            {['KL', 'STP', 'OS', 'SF'].map((pos) => {
              const matched = userPlayers.filter((p) => p.position === pos || p.secondaryPositions.includes(pos as any));
              return (
                <div key={pos} className="flex items-center justify-between p-1.5 rounded bg-[#0D1C26]/60">
                  <span className="font-bold text-[#65F56B] w-8">{pos}</span>
                  <div className="flex items-center gap-2 truncate text-zinc-300">
                    {matched.slice(0, 2).map((p, idx) => (
                      <span key={p.id}>
                        {idx + 1}. {p.lastName} ({p.overall})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 4: SAKATLIKLAR / CEZALILAR */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Sakatlıklar / Cezalılar
          </h4>
          {injuredOrSuspended.length > 0 ? (
            <div className="space-y-2">
              {injuredOrSuspended.slice(0, 2).map((player) => (
                <div key={player.id} className="p-2 rounded-lg bg-[#0D1C26] border border-rose-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayerPortrait player={player} size="xs" shape="circle" />
                    <div>
                      <span className="text-xs font-bold text-white block">{player.lastName}</span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {player.isInjured ? 'Diz Sakatlığı' : 'Kart Cezası'}
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {player.isInjured ? 'Sakat' : 'Cezalı'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500 font-mono">
              Sakat veya cezalı oyuncu yok. Kadro eksiksiz!
            </div>
          )}
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onRenewContract={() => {
            setRenewingPlayer(selectedPlayer);
            setSelectedPlayer(null);
          }}
        />
      )}

      {/* Contract Renewal Negotiation Modal */}
      {renewingPlayer && (
        <NegotiationModal
          player={renewingPlayer}
          isContractRenewal={true}
          onClose={() => setRenewingPlayer(null)}
        />
      )}
    </div>
  );
}
