'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PositionCategory } from '@/types/game';
import { StatBadge } from '@/components/ui/StatBadge';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
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
  } = useGame();

  const [activeTab, setActiveTab] = useState<
    'MARKET' | 'INCOMING' | 'OUTGOING' | 'SHORTLIST' | 'FREE_AGENTS' | 'HISTORY'
  >('MARKET');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [minOverall, setMinOverall] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(40);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  // Negotiation Modal Target
  const [negotiationTargetPlayer, setNegotiationTargetPlayer] = useState<Player | null>(null);

  const getClub = (id: string) => allClubs.find((c) => c.id === id);
  const getPlayer = (id: string) => allPlayers.find((p) => p.id === id);

  const windowStatus = getTransferWindowStatus(currentDate);

  // Transfer Deadline Days Calculation
  const getDeadlineText = () => {
    if (windowStatus === 'CLOSED') {
      return 'Transfer Dönemi Kapalı';
    }
    const d = new Date(currentDate);
    const month = d.getMonth() + 1;
    let deadlineStr = `${d.getFullYear()}-09-01`;
    if (month === 1) {
      deadlineStr = `${d.getFullYear()}-01-31`;
    }
    const daysLeft = daysBetween(currentDate, deadlineStr);
    if (daysLeft === 0) return 'SON GÜN! (Transferler Bu Gece Kapanıyor)';
    return `Kapanışa ${daysLeft} Gün Kaldı`;
  };

  // 1. Market Players
  const marketPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId !== userClub.id && p.clubId !== 'FREE_AGENT' && p.clubId !== 'free-agent')
      .filter((p) => {
        if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;
        if (p.overall < minOverall) return false;
        if (p.age > maxAge) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const name = `${p.firstName} ${p.lastName}`.toLowerCase();
          if (!name.includes(q) && !p.position.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [allPlayers, userClub.id, selectedPosition, minOverall, maxAge, searchQuery]);

  // 2. Free Agents
  const freeAgents = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId === 'FREE_AGENT' || p.clubId === 'free-agent')
      .filter((p) => {
        if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const name = `${p.firstName} ${p.lastName}`.toLowerCase();
          if (!name.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [allPlayers, selectedPosition, searchQuery]);

  // 3. Shortlisted Players
  const shortlistedPlayers = allPlayers.filter((p) => shortlistIds.includes(p.id));

  // 4. Incoming Offers
  const incomingOffers = transferOffers.filter((o) => o.toClubId === userClub.id);

  // 5. Active Outgoing Negotiations
  const activeOutgoingNegs = activeNegotiations.filter(
    (n) => n.buyerClubId === userClub.id && n.stage !== 'COMPLETED' && n.stage !== 'FAILED'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
              // TRANSFER HEADQUARTERS
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase border ${
                windowStatus === 'OPEN'
                  ? 'bg-emerald-500/20 text-[#00F5A0] border-[#00F5A0]/40'
                  : 'bg-zinc-850 text-zinc-400 border-zinc-700'
              }`}
            >
              {getDeadlineText()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-[#00F5A0]" />
            Transfer & Pazarlık Masası
          </h1>
        </div>

        {/* Transfer & Wage Budget Badges */}
        <div className="flex items-center gap-3 bg-[#080D1A] p-2.5 border border-zinc-800 text-xs font-mono">
          <div className="px-3 text-center">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Transfer Bütçesi</span>
            <span className="text-base font-black text-[#00F5A0]">
              €{(finances.transferBudget / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="px-3 text-center border-l border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Kalan Maaş Limiti</span>
            <span className="text-base font-black text-[#00D4FF]">
              €{((finances.wageBudget - finances.weeklyWages) / 1000).toFixed(0)}K/hf
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'MARKET'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Transfer Pazarı ({marketPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FREE_AGENTS')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'FREE_AGENTS'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Serbest Oyuncular ({freeAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTGOING')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 relative ${
            activeTab === 'OUTGOING'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Görüşmeler ({activeOutgoingNegs.length})</span>
          {activeOutgoingNegs.length > 0 && (
            <span className="w-2 h-2 bg-[#00F5A0] animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('INCOMING')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 relative ${
            activeTab === 'INCOMING'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Gelen Teklifler ({incomingOffers.length})</span>
          {incomingOffers.some((o) => o.status === 'PENDING') && (
            <span className="w-2 h-2 bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('SHORTLIST')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'SHORTLIST'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Gözlem Listesi ({shortlistedPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-[#00F5A0] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Transfer Geçmişi ({transferHistory.length})</span>
        </button>
      </div>

      {/* 1. TRANSFER MARKET TAB */}
      {activeTab === 'MARKET' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#080D1A] border border-zinc-800">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Futbolcu veya mevki ara..."
                className="w-full pl-9 pr-3 py-2 bg-[#040711] border border-zinc-800 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F5A0]"
              />
            </div>

            <div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 bg-[#040711] border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="ALL">Tüm Mevkiler</option>
                <option value="GK">Kaleci (GK)</option>
                <option value="DC">Stoper (DC)</option>
                <option value="DR">Sağ Bek (DR)</option>
                <option value="DL">Sol Bek (DL)</option>
                <option value="DMC">Ön Libero (DMC)</option>
                <option value="MC">Merkez Orta Saha (MC)</option>
                <option value="AMC">Ofansif Orta Saha (AMC)</option>
                <option value="AMR">Sağ Kanat (AMR)</option>
                <option value="AML">Sol Kanat (AML)</option>
                <option value="ST">Santrfor (ST)</option>
              </select>
            </div>

            <div>
              <select
                value={minOverall}
                onChange={(e) => setMinOverall(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#040711] border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="0">Min Genel Güç: Tümü</option>
                <option value="70">Min 70+</option>
                <option value="75">Min 75+</option>
                <option value="80">Min 80+</option>
              </select>
            </div>
          </div>

          {/* Market Player Table */}
          <div className="overflow-x-auto border border-zinc-850 bg-[#080D1A] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                  <th className="py-3 px-4">OYUNCU</th>
                  <th className="py-3 px-3">KULÜP</th>
                  <th className="py-3 px-3 text-center">MEVKİ</th>
                  <th className="py-3 px-3 text-center">YAŞ</th>
                  <th className="py-3 px-3 text-center">GENEL</th>
                  <th className="py-3 px-3 text-center">POT</th>
                  <th className="py-3 px-3 text-right">PİYASA DEĞERİ</th>
                  <th className="py-3 px-3 text-right">MAAŞ</th>
                  <th className="py-3 px-4 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
                {marketPlayers.slice(0, 40).map((player) => {
                  const club = getClub(player.clubId);
                  const isShortlisted = shortlistIds.includes(player.id);
                  const masked = getMaskedPlayer(player);

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-zinc-900/60 transition-colors group"
                    >
                      <td
                        onClick={() => setInspectedPlayer(player)}
                        className="py-3 px-4 cursor-pointer"
                      >
                        <div className="font-bold text-white uppercase tracking-tight group-hover:text-[#00F5A0] transition-colors">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {player.nationality}
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
                          <span className="text-zinc-300 text-xs truncate max-w-[120px]">
                            {club?.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-zinc-900 border border-zinc-700 text-[#00F5A0]">
                          {player.position}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {player.age}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatBadge value={masked.overallDisplay} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatBadge value={masked.potentialDisplay} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-white">
                        {masked.marketValueDisplay}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[#00F5A0]">
                        {masked.wageDisplay}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleShortlist(player.id)}
                            title={isShortlisted ? 'Gözlemden Çıkar' : 'Gözlem Listesine Ekle'}
                            className={`p-1.5 border transition-colors ${
                              isShortlisted
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setNegotiationTargetPlayer(player)}
                            className="px-2.5 py-1 bg-[#00F5A0] text-black font-mono font-bold text-xs uppercase hover:bg-[#00D68B] transition-all border border-white"
                          >
                            Pazarlık
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FREE AGENTS TAB */}
      {activeTab === 'FREE_AGENTS' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#080D1A] border border-zinc-800 text-xs text-zinc-300 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-[#00F5A0] shrink-0" />
            <div>
              <strong className="text-white uppercase font-mono tracking-wider">Serbest Oyuncu Statüsü:</strong> Kulübüyle sözleşmesi sona eren veya feshedilen futbolcular bedelsiz transfer edilebilir. Yalnızca haftalık maaş ve imza primi görüşülür.
            </div>
          </div>

          {freeAgents.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-400 font-mono text-sm">
              Şu an serbest statüde kayıtlı futbolcu bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeAgents.map((player) => (
                <div
                  key={player.id}
                  className="p-4 bg-[#080D1A] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
                        {player.position}
                      </span>
                      <h3
                        onClick={() => setInspectedPlayer(player)}
                        className="font-bold text-white text-sm uppercase tracking-tight mt-1 hover:text-[#00F5A0] cursor-pointer"
                      >
                        {player.firstName} {player.lastName}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {player.nationality} • {player.age} YAŞ
                      </span>
                    </div>
                    <div className="text-right">
                      <StatBadge value={player.overall} size="md" />
                      <span className="text-[10px] font-mono text-zinc-500 block mt-1">POT: {player.potential}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">Maaş Beklentisi</span>
                      <span className="font-mono font-bold text-[#00F5A0]">€{player.wage.toLocaleString('tr-TR')}/hf</span>
                    </div>
                    <button
                      onClick={() => setNegotiationTargetPlayer(player)}
                      className="px-3 py-1.5 bg-[#00F5A0] text-black font-mono font-bold text-xs uppercase hover:bg-[#00D68B] border border-white"
                    >
                      Teklif Yap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ACTIVE NEGOTIATIONS TAB */}
      {activeTab === 'OUTGOING' && (
        <div className="space-y-4">
          {activeOutgoingNegs.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-400 font-mono text-sm">
              Şu an devam eden herhangi bir aktif transfer görüşmeniz bulunmamaktadır.
            </div>
          ) : (
            activeOutgoingNegs.map((neg) => {
              const player = getPlayer(neg.playerId);
              const club = getClub(neg.sellerClubId);

              return (
                <div
                  key={neg.id}
                  className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {club && (
                      <ClubBadge
                        code={club.code}
                        primaryColor={club.primaryColor}
                        secondaryColor={club.secondaryColor}
                        size="md"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
                          {neg.stage === 'CLUB_NEGOTIATION' ? 'Kulüp Pazarlığı' : 'Oyuncu Sözleşmesi'}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">TARİH: {neg.lastUpdatedDate}</span>
                      </div>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight mt-1">
                        {player?.firstName} {player?.lastName} ({player?.position})
                      </h3>
                      <p className="text-xs font-mono text-zinc-400">
                        {club ? club.name : 'Serbest Oyuncu'} • GENEL GÜÇ: {player?.overall}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {player && (
                      <button
                        onClick={() => setNegotiationTargetPlayer(player)}
                        className="px-4 py-2 bg-[#00F5A0] text-black font-mono font-bold text-xs uppercase hover:bg-[#00D68B] flex items-center gap-1.5 border border-white"
                      >
                        <Briefcase className="w-4 h-4" />
                        Masaya Dön
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. INCOMING OFFERS TAB */}
      {activeTab === 'INCOMING' && (
        <div className="space-y-4">
          {incomingOffers.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-400 font-mono text-sm">
              Şu an kulübünüze gelen herhangi bir resmi transfer teklifi bulunmamaktadır.
            </div>
          ) : (
            incomingOffers.map((offer) => {
              const player = getPlayer(offer.playerId);
              const buyer = getClub(offer.fromClubId);

              return (
                <div
                  key={offer.id}
                  className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                      <div className="text-xs text-zinc-400">
                        <strong className="text-white uppercase">{buyer?.name}</strong> kulübünden resmi teklif:
                      </div>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight mt-0.5">
                        {player?.firstName} {player?.lastName} ({player?.position})
                      </h3>
                      <div className="text-xs font-mono text-zinc-400 mt-1">
                        Piyasa Değeri: €{player?.marketValue.toLocaleString('tr-TR')} • Maaş: €{player?.wage.toLocaleString('tr-TR')}/hf
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">Önerilen Bonservis</span>
                      <span className="text-xl font-mono font-black text-[#00F5A0]">
                        €{offer.fee.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {offer.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondToTransferOffer(offer.id, true)}
                          className="px-3 py-1.5 bg-[#00F5A0] text-black font-mono font-bold text-xs uppercase hover:bg-[#00D68B] transition-all flex items-center gap-1 border border-white"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Kabul
                        </button>
                        <button
                          onClick={() => respondToTransferOffer(offer.id, false)}
                          className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold text-xs uppercase hover:bg-rose-500/30 transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reddet
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 font-mono text-xs font-bold uppercase ${
                          offer.status === 'ACCEPTED'
                            ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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

      {/* 5. SHORTLIST TAB */}
      {activeTab === 'SHORTLIST' && (
        <div className="space-y-4">
          {shortlistedPlayers.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-400 font-mono text-sm">
              Gözlem listenizde henüz oyuncu bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shortlistedPlayers.map((player) => {
                const club = getClub(player.clubId);

                return (
                  <div
                    key={player.id}
                    className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {club && (
                          <ClubBadge
                            code={club.code}
                            primaryColor={club.primaryColor}
                            secondaryColor={club.secondaryColor}
                            size="sm"
                          />
                        )}
                        <div>
                          <h3
                            onClick={() => setInspectedPlayer(player)}
                            className="font-bold text-white uppercase tracking-tight hover:text-[#00F5A0] cursor-pointer transition-colors"
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
                          className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          title="Gözlemden Çıkar"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Değer</span>
                        <span className="font-mono font-bold text-white">€{(player.marketValue / 1000000).toFixed(2)}M</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Maaş</span>
                        <span className="font-mono font-bold text-[#00F5A0]">€{player.wage.toLocaleString('tr-TR')}/hf</span>
                      </div>
                      <button
                        onClick={() => setNegotiationTargetPlayer(player)}
                        className="px-3 py-1.5 bg-[#00F5A0] text-black font-mono font-bold text-xs uppercase hover:bg-[#00D68B] border border-white"
                      >
                        Pazarlık Başlat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TRANSFER HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {transferHistory.length === 0 ? (
            <div className="p-8 bg-[#080D1A] border border-zinc-800 text-center text-zinc-400 font-mono text-sm">
              Bu sezonda henüz kaydedilmiş bir transfer geçmişi bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-850 bg-[#080D1A] shadow-2xl">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                    <th className="py-3 px-4">TARİH</th>
                    <th className="py-3 px-3">FUTBOLCU</th>
                    <th className="py-3 px-3">AYRILAN</th>
                    <th className="py-3 px-3">GELEN</th>
                    <th className="py-3 px-3 text-right">BONSERVİS</th>
                    <th className="py-3 px-3 text-right">MAAŞ</th>
                    <th className="py-3 px-4 text-center">DURUM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
                  {transferHistory.map((tr) => (
                    <tr key={tr.id} className="hover:bg-zinc-900/60">
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{tr.date}</td>
                      <td className="py-3 px-3 font-bold text-white uppercase">
                        {tr.playerName} ({tr.playerPosition})
                      </td>
                      <td className="py-3 px-3 text-zinc-300">{tr.fromClubName}</td>
                      <td className="py-3 px-3 text-[#00F5A0] font-bold">{tr.toClubName}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-white">
                        {tr.fee === 0 ? 'Bedelsiz' : `€${tr.fee.toLocaleString('tr-TR')}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#00F5A0]">
                        €{tr.wage.toLocaleString('tr-TR')}/hf
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
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
