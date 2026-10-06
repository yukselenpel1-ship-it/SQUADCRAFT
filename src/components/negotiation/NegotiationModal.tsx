'use client';

import React, { useState } from 'react';
import { Player } from '@/types/game';
import { useGame } from '@/lib/context/GameContext';
import {
  ActiveNegotiation,
  TransferOfferPackage,
  ContractOfferPackage,
  SquadRole,
  TransferBonus,
  calculatePlayerValuation,
  calculatePlayerContractDemands,
  getSquadRoleInfo,
  getAgentStyleDescription,
  createAppearanceBonus,
  createGoalBonus,
  createChampionshipBonus,
} from '@/lib/negotiation';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

interface NegotiationModalProps {
  player: Player;
  isContractRenewal?: boolean;
  onClose: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  player,
  isContractRenewal = false,
  onClose,
}) => {
  const {
    userClub,
    allClubs,
    finances,
    currentDate,
    startNegotiation,
    submitClubOffer,
    submitContractOffer,
    acceptClubCounterOffer,
    acceptPlayerCounterOffer,
    withdrawNegotiation,
    getNegotiationByPlayerId,
  } = useGame();

  const sellerClub = player.clubId !== 'FREE_AGENT' && player.clubId !== 'free-agent'
    ? allClubs.find((c) => c.id === player.clubId)
    : undefined;

  const isFreeAgent = !sellerClub;

  // 1. Get or initialize active negotiation
  const [activeNeg, setActiveNeg] = useState<ActiveNegotiation>(() => {
    return startNegotiation(player.id, isContractRenewal);
  });

  const valuation = calculatePlayerValuation(player, sellerClub, userClub, currentDate);
  const defaultDemands = calculatePlayerContractDemands(player, userClub, 'İlk 11', isContractRenewal);

  // Transfer Offer Form State
  const [upfrontFee, setUpfrontFee] = useState<number>(() => {
    if (activeNeg.latestClubDemand) return activeNeg.latestClubDemand.upfrontFee;
    return valuation.estimatedMinFee || player.marketValue;
  });
  const [installmentsFee, setInstallmentsFee] = useState<number>(() => {
    if (activeNeg.latestClubDemand) return activeNeg.latestClubDemand.installmentsFee || 0;
    return 0;
  });
  const [installmentsMonths, setInstallmentsMonths] = useState<number>(12);
  const [hasAppearanceBonus, setHasAppearanceBonus] = useState<boolean>(false);
  const [hasGoalBonus, setHasGoalBonus] = useState<boolean>(false);
  const [hasChampBonus, setHasChampBonus] = useState<boolean>(false);
  const [sellOnPercent, setSellOnPercent] = useState<number>(0);

  // Contract Offer Form State
  const [wage, setWage] = useState<number>(() => {
    if (activeNeg.latestContractDemand) return activeNeg.latestContractDemand.wage;
    return defaultDemands.wage;
  });
  const [durationYears, setDurationYears] = useState<number>(() => {
    if (activeNeg.latestContractDemand) return activeNeg.latestContractDemand.durationYears;
    return defaultDemands.durationYears;
  });
  const [squadRole, setSquadRole] = useState<SquadRole>(() => {
    if (activeNeg.latestContractDemand) return activeNeg.latestContractDemand.squadRole;
    return 'İlk 11';
  });
  const [signingBonus, setSigningBonus] = useState<number>(() => {
    if (activeNeg.latestContractDemand) return activeNeg.latestContractDemand.signingBonus || 0;
    return defaultDemands.signingBonus;
  });
  const [appearanceBonus] = useState<number>(defaultDemands.appearanceBonus);
  const [goalBonus] = useState<number>(defaultDemands.goalBonus);
  const [cleanSheetBonus] = useState<number>(defaultDemands.cleanSheetBonus);
  const [releaseClause, setReleaseClause] = useState<number>(defaultDemands.releaseClause || 0);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{ message: string; type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' } | null>(null);

  const squadRoleList: SquadRole[] = [
    'Yıldız Oyuncu',
    'Önemli Oyuncu',
    'İlk 11',
    'Rotasyon',
    'Yedek',
    'Genç Oyuncu',
  ];

  // Submit Club Transfer Fee Offer
  const handleSendClubOffer = () => {
    const bonuses: TransferBonus[] = [];
    if (hasAppearanceBonus) bonuses.push(createAppearanceBonus(20, Math.round(upfrontFee * 0.15)));
    if (hasGoalBonus) bonuses.push(createGoalBonus(15, Math.round(upfrontFee * 0.15)));
    if (hasChampBonus) bonuses.push(createChampionshipBonus(Math.round(upfrontFee * 0.20)));

    const offerPackage: TransferOfferPackage = {
      upfrontFee,
      installmentsFee,
      installmentsMonths,
      sellOnClause: sellOnPercent > 0 ? { percentage: sellOnPercent, isProfitOnly: true } : undefined,
      bonuses,
    };

    const res = submitClubOffer(activeNeg.id, offerPackage);
    const updated = getNegotiationByPlayerId(player.id);
    if (updated) setActiveNeg(updated);

    if (res.status === 'ACCEPTED') {
      setFeedback({ message: res.feedbackMessage, type: 'SUCCESS' });
    } else if (res.status === 'COUNTER_OFFER') {
      setFeedback({ message: res.feedbackMessage, type: 'WARNING' });
      if (res.counterOffer) {
        if (res.counterOffer.upfrontFee !== undefined) setUpfrontFee(res.counterOffer.upfrontFee);
        if (res.counterOffer.installmentsFee !== undefined) setInstallmentsFee(res.counterOffer.installmentsFee);
      }
    } else {
      setFeedback({ message: res.feedbackMessage, type: 'ERROR' });
    }
  };

  // Submit Player Contract Offer
  const handleSendContractOffer = () => {
    const offerPackage: ContractOfferPackage = {
      wage,
      durationYears,
      squadRole,
      signingBonus,
      appearanceBonus,
      goalBonus,
      cleanSheetBonus,
      releaseClause: releaseClause > 0 ? releaseClause : undefined,
    };

    const res = submitContractOffer(activeNeg.id, offerPackage);
    const updated = getNegotiationByPlayerId(player.id);
    if (updated) setActiveNeg(updated);

    if (res.status === 'ACCEPTED') {
      setFeedback({ message: res.feedbackMessage, type: 'SUCCESS' });
    } else if (res.status === 'COUNTER_OFFER') {
      setFeedback({ message: res.feedbackMessage, type: 'WARNING' });
      if (res.counterOffer) {
        if (res.counterOffer.wage !== undefined) setWage(res.counterOffer.wage);
        if (res.counterOffer.durationYears !== undefined) setDurationYears(res.counterOffer.durationYears);
        if (res.counterOffer.squadRole !== undefined) setSquadRole(res.counterOffer.squadRole);
      }
    } else {
      setFeedback({ message: res.feedbackMessage, type: 'ERROR' });
    }
  };

  const handleWithdraw = () => {
    withdrawNegotiation(activeNeg.id);
    onClose();
  };

  const totalTransferCommitment = upfrontFee + installmentsFee;
  const isOverTransferBudget = totalTransferCommitment > finances.transferBudget;
  const remainingBudgetAfterOffer = finances.transferBudget - totalTransferCommitment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 bg-black/85 backdrop-blur-xl select-none animate-in fade-in">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col bg-[#0d120f]/95 sm:border sm:border-white/10 sm:rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-zinc-200 overflow-hidden">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b7ff35] to-[#17e5c2]" />

        {/* 1. Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-[#0d120f] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-6 rounded bg-[#b7ff35] shadow-[0_0_10px_rgba(183, 255, 53,0.5)]" />
            <div>
              <div className="text-[10px] font-ibm font-bold uppercase tracking-widest text-[#b7ff35]">
                {isContractRenewal ? '// SÖZLEŞME YENİLEME MASASI' : '// RESMİ TRANSFER & PAZARLIK MASASI'}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                {player.firstName} {player.lastName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#090d0a] hover:bg-[#121D33] text-zinc-400 hover:text-white border border-white/10 transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Player Overview Strip */}
        <div className="px-4 sm:px-6 py-3 bg-[#05070D] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-ibm">
          <div className="flex items-center gap-3">
            <PlayerPortrait
              player={player}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-zinc-800 text-white font-black text-[10px]">
                  {player.position}
                </span>
                <span className="px-1.5 py-0.5 bg-[#b7ff35] text-black font-black text-[10px]">
                  {player.overall} GEN
                </span>
                <span className="text-zinc-400 font-bold">{player.age} Yaş</span>
              </div>
              <div className="text-zinc-300 font-bold text-[11px] mt-0.5 flex items-center gap-1.5">
                {sellerClub ? (
                  <>
                    <ClubBadge code={sellerClub.code} primaryColor={sellerClub.primaryColor} secondaryColor={sellerClub.secondaryColor} size="sm" />
                    <span>{sellerClub.name}</span>
                  </>
                ) : (
                  <span className="text-emerald-400">Serbest Statüde (Kulüpsüz)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-zinc-500 uppercase text-[9px] block">Piyasa Değeri</span>
              <span className="font-black text-white">€{(player.marketValue / 1000000).toFixed(1)}M</span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 uppercase text-[9px] block">Mevcut Maaşı</span>
              <span className="font-black text-emerald-400">€{(player.wage / 1000).toFixed(0)}K/hf</span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 uppercase text-[9px] block">Temsilci Tarzı</span>
              <span className="font-black text-cyan-300">{valuation.agent.style}</span>
            </div>
            <div className="border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 uppercase text-[9px] block">Oyuncu İlgisi</span>
              <span className="font-black text-[#b7ff35]">{valuation.interest.level}</span>
            </div>
          </div>
        </div>

        {/* 3. Stepper Stage Tabs */}
        <div className="grid grid-cols-2 border-b border-zinc-800 bg-[#090D18] text-xs font-ibm font-bold">
          <div
            className={`py-2.5 px-4 flex items-center justify-center gap-2 border-r border-zinc-800 uppercase ${
              activeNeg.stage === 'CLUB_NEGOTIATION'
                ? 'bg-[#b7ff35] text-black font-black'
                : 'text-zinc-400'
            }`}
          >
            <span>1. Kulüp Bonservis Pazarlığı</span>
            {activeNeg.clubStatus === 'ACCEPTED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>

          <div
            className={`py-2.5 px-4 flex items-center justify-center gap-2 uppercase ${
              activeNeg.stage === 'PLAYER_NEGOTIATION'
                ? 'bg-[#b7ff35] text-black font-black'
                : activeNeg.stage === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-300'
                : 'text-zinc-500'
            }`}
          >
            <span>2. Oyuncu & Sözleşme Şartları</span>
            {activeNeg.stage === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
        </div>

        {/* 4. Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 font-ibm">
          
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 border flex items-start gap-2.5 text-xs ${
                feedback.type === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : feedback.type === 'WARNING'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500 text-rose-300'
              }`}
            >
              {feedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : feedback.type === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="font-bold flex-1">{feedback.message}</div>
            </div>
          )}

          {/* STAGE 1: CLUB NEGOTIATION */}
          {activeNeg.stage === 'CLUB_NEGOTIATION' && !isFreeAgent && !isContractRenewal && (
            <div className="space-y-4">
              {/* Top 3 Status Cards (Equal Height, Nizami) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Kulüp Tutumu</span>
                  <span className="text-sm font-black text-white mt-1">{valuation.clubStance}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 truncate">{valuation.stanceReason}</span>
                </div>

                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Pazarlık Sabrı</span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4].map((dot) => (
                      <div
                        key={dot}
                        className={`h-2 flex-1 rounded-none ${
                          dot <= activeNeg.clubPatience
                            ? activeNeg.clubPatience > 1
                              ? 'bg-[#b7ff35]'
                              : 'bg-rose-500 animate-pulse'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-zinc-300 ml-2">{activeNeg.clubPatience}/4</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">Görüşme toleransı</span>
                </div>

                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Transfer Bütçesi</span>
                  <span className="text-sm font-black text-[#b7ff35] mt-1">
                    €{(finances.transferBudget / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    Kasa: €{(finances.clubBalance / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>

              {/* Symmetrical 2-Column Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Box 1: Peşin Bonservis */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Peşin Bonservis Tutarı
                    </label>
                    <span className="text-[10px] text-zinc-500">Doğrudan transfer anında ödenecek tutar</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">€</span>
                    <input
                      type="number"
                      step="250000"
                      value={upfrontFee}
                      onChange={(e) => setUpfrontFee(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-16 py-2 bg-zinc-950 border border-zinc-700 text-white font-black text-base focus:border-[#b7ff35] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      €{(upfrontFee / 1000000).toFixed(2)}M
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[500000, 1000000, 2000000, 5000000].map((step) => (
                      <button
                        key={step}
                        onClick={() => setUpfrontFee((prev) => prev + step)}
                        className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                      >
                        +€{(step / 1000000).toFixed(1)}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box 2: Taksitli Ödeme & Vade */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black uppercase text-zinc-200 block">
                        Taksitli Ödeme Tutarı
                      </label>
                      <span className="text-[10px] text-zinc-500">Vadeye yayılmış transfer borcu</span>
                    </div>

                    <select
                      value={installmentsMonths}
                      onChange={(e) => setInstallmentsMonths(Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-950 border border-zinc-700 text-[11px] font-bold text-zinc-300 focus:outline-none"
                    >
                      <option value="12">12 Ay Vade</option>
                      <option value="24">24 Ay Vade</option>
                    </select>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">€</span>
                    <input
                      type="number"
                      step="250000"
                      value={installmentsFee}
                      onChange={(e) => setInstallmentsFee(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-16 py-2 bg-zinc-950 border border-zinc-700 text-white font-black text-base focus:border-[#b7ff35] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      €{(installmentsFee / 1000000).toFixed(2)}M
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[250000, 500000, 1000000].map((step) => (
                      <button
                        key={step}
                        onClick={() => setInstallmentsFee((prev) => prev + step)}
                        className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                      >
                        +€{(step / 1000000).toFixed(2)}M
                      </button>
                    ))}
                    <button
                      onClick={() => setInstallmentsFee(0)}
                      className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    >
                      Sıfırla
                    </button>
                  </div>
                </div>

                {/* Box 3: Sonraki Satıştan Pay */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Sonraki Satıştan Pay (%)
                    </label>
                    <span className="text-[10px] text-zinc-500">Gelecekteki transfer gelirinden kulübe ödenecek oran</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setSellOnPercent(pct)}
                        className={`py-2 text-xs font-black uppercase border transition-all ${
                          sellOnPercent === pct
                            ? 'bg-[#b7ff35] text-black border-white'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        %{pct}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box 4: Başarı & Performans Bonusları */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Başarı & Performans Primleri
                    </label>
                    <span className="text-[10px] text-zinc-500">Hedefler tuttuğunda kulübe eklenecek bonuslar</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={hasAppearanceBonus}
                        onChange={(e) => setHasAppearanceBonus(e.target.checked)}
                        className="rounded-none bg-zinc-900 border-zinc-700 text-[#b7ff35] focus:ring-0"
                      />
                      <span className="text-zinc-300 font-bold">20 Maç Oynama Primi (+%15)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={hasGoalBonus}
                        onChange={(e) => setHasGoalBonus(e.target.checked)}
                        className="rounded-none bg-zinc-900 border-zinc-700 text-[#b7ff35] focus:ring-0"
                      />
                      <span className="text-zinc-300 font-bold">15 Gol / Asist Primi (+%15)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={hasChampBonus}
                        onChange={(e) => setHasChampBonus(e.target.checked)}
                        className="rounded-none bg-zinc-900 border-zinc-700 text-[#b7ff35] focus:ring-0"
                      />
                      <span className="text-zinc-300 font-bold">Lig Şampiyonluğu Primi (+%20)</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Total Financial Summary Strip */}
              <div className="p-3.5 bg-[#05070D] border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">Toplam Bonservis Yükü</span>
                    <span className="text-base font-black text-white">
                      €{(totalTransferCommitment / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">Kalan Bütçe Durumu</span>
                    <span className={`text-base font-black ${isOverTransferBudget ? 'text-rose-400' : 'text-[#b7ff35]'}`}>
                      €{(remainingBudgetAfterOffer / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 font-black uppercase text-[10px] border ${
                      isOverTransferBudget
                        ? 'bg-rose-950 text-rose-300 border-rose-600'
                        : 'bg-emerald-950 text-[#b7ff35] border-[#b7ff35]'
                    }`}
                  >
                    {isOverTransferBudget ? 'BÜTÇE AŞILDI' : 'BÜTÇE UYUMLU'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: PLAYER CONTRACT NEGOTIATION */}
          {(activeNeg.stage === 'PLAYER_NEGOTIATION' || isFreeAgent || isContractRenewal) && activeNeg.stage !== 'COMPLETED' && (
            <div className="space-y-4">
              
              {/* Top 3 Status Cards (Equal Height) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Temsilci Bilgisi</span>
                  <span className="text-sm font-black text-white mt-1">{valuation.agent.name}</span>
                  <span className="text-[10px] text-cyan-300 mt-1">{getAgentStyleDescription(valuation.agent.style)}</span>
                </div>

                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Oyuncu Sabrı</span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3].map((dot) => (
                      <div
                        key={dot}
                        className={`h-2 flex-1 rounded-none ${
                          dot <= activeNeg.playerPatience
                            ? activeNeg.playerPatience > 1
                              ? 'bg-[#b7ff35]'
                              : 'bg-rose-500 animate-pulse'
                            : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-zinc-300 ml-2">{activeNeg.playerPatience}/3</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">Maaş toleransı</span>
                </div>

                <div className="p-3.5 bg-[#0B101D] border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Maaş Bütçesi Durumu</span>
                  <span className="text-sm font-black text-[#4FE4FF] mt-1">
                    €{((finances.wageBudget - finances.weeklyWages) / 1000).toFixed(0)}K/hf
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    Toplam Limit: €{(finances.wageBudget / 1000).toFixed(0)}K/hf
                  </span>
                </div>
              </div>

              {/* Symmetrical 2-Column Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Box 1: Haftalık Maaş */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Haftalık Maaş Teklifi
                    </label>
                    <span className="text-[10px] text-zinc-500">Oyuncuya haftalık net ödenecek maaş</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">€</span>
                    <input
                      type="number"
                      step="2500"
                      value={wage}
                      onChange={(e) => setWage(Math.max(1000, Number(e.target.value)))}
                      className="w-full pl-8 pr-20 py-2 bg-zinc-950 border border-zinc-700 text-emerald-400 font-black text-base focus:border-[#b7ff35] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      /hafta
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[2500, 5000, 10000, 25000].map((step) => (
                      <button
                        key={step}
                        onClick={() => setWage((prev) => prev + step)}
                        className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                      >
                        +€{(step / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box 2: Sözleşme Süresi */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Sözleşme Süresi
                    </label>
                    <span className="text-[10px] text-zinc-500">Kulübe bağlanacağı resmi yıl sayısı</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setDurationYears(yr)}
                        className={`py-2 text-xs font-black uppercase border transition-all ${
                          durationYears === yr
                            ? 'bg-[#b7ff35] text-black border-white'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {yr} Yıl
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                    <span>Yıllık Maliyet:</span>
                    <span className="font-bold text-white">€{((wage * 52) / 1000000).toFixed(2)}M / yıl</span>
                  </div>
                </div>

                {/* Box 3: Kadro Rolü Vaadi (Symmetrical 6-role Grid) */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 md:col-span-2">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Vadedilen Kadro Rolü
                    </label>
                    <span className="text-[10px] text-zinc-500">Oyuncunun takım içindeki beklentisi ve oynama süresi</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {squadRoleList.map((role) => {
                      const isSelected = squadRole === role;
                      return (
                        <button
                          key={role}
                          onClick={() => setSquadRole(role)}
                          className={`p-2.5 text-left border transition-all ${
                            isSelected
                              ? 'bg-[#b7ff35] text-black border-white shadow-md'
                              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span className="block text-xs font-black uppercase truncate">{role}</span>
                          <span className={`block text-[9px] mt-0.5 truncate ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            {getSquadRoleInfo(role).expectedPlayingTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Box 4: İmza Parası */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      İmza Primi Tutarı
                    </label>
                    <span className="text-[10px] text-zinc-500">İmza atarken peşin ödenecek prim</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">€</span>
                    <input
                      type="number"
                      step="50000"
                      value={signingBonus}
                      onChange={(e) => setSigningBonus(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-16 py-2 bg-zinc-950 border border-zinc-700 text-white font-black text-sm focus:border-[#b7ff35] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      €{(signingBonus / 1000).toFixed(0)}K
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[50000, 100000, 250000].map((step) => (
                      <button
                        key={step}
                        onClick={() => setSigningBonus((prev) => prev + step)}
                        className="py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-800"
                      >
                        +€{(step / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box 5: Serbest Kalma Bedeli */}
                <div className="p-4 bg-[#0B101D] border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-black uppercase text-zinc-200 block">
                      Serbest Kalma Maddesi
                    </label>
                    <span className="text-[10px] text-zinc-500">Zorunlu fesih bedeli (0 = Madde yok)</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">€</span>
                    <input
                      type="number"
                      step="1000000"
                      value={releaseClause}
                      onChange={(e) => setReleaseClause(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-16 py-2 bg-zinc-950 border border-zinc-700 text-white font-black text-sm focus:border-[#b7ff35] focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                      {releaseClause > 0 ? `€${(releaseClause / 1000000).toFixed(1)}M` : 'Madde Yok'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[5000000, 10000000].map((step) => (
                      <button
                        key={step}
                        onClick={() => setReleaseClause((prev) => prev + step)}
                        className="py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-800"
                      >
                        +€{(step / 1000000).toFixed(0)}M
                      </button>
                    ))}
                    <button
                      onClick={() => setReleaseClause(0)}
                      className="py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-800"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STAGE 3: COMPLETED SUCCESS */}
          {activeNeg.stage === 'COMPLETED' && (
            <div className="p-8 bg-[#0B101D] border-2 border-emerald-500 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#b7ff35] mx-auto" />
              <h3 className="text-2xl font-black text-white uppercase">ANLAŞMA SAĞLANDI!</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                {player.firstName} {player.lastName} kulübümüzle resmi sözleşme imzalayarak A Takım kadromuza resmen katılmıştır.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#b7ff35] text-black font-black text-xs uppercase hover:bg-[#9bea27] border border-white"
              >
                Kadroya Git & Tamamla
              </button>
            </div>
          )}

          {/* Negotiation Log History */}
          <div className="p-3.5 bg-[#05070D] border border-zinc-800 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Görüşme Kayıtları & Masadaki Durum
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {activeNeg.history.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 flex items-start gap-2"
                >
                  <span className="font-bold text-[#b7ff35] shrink-0">[{log.date}] {log.senderName}:</span>
                  <span className="leading-relaxed">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 5. Modal Footer Action Bar */}
        <div className="p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B101D] border-t border-zinc-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 shrink-0 font-ibm">
          <button
            onClick={handleWithdraw}
            className="px-3 sm:px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-rose-400 border border-zinc-700 uppercase"
          >
            Pazarlıktan Çekil
          </button>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
            {activeNeg.stage === 'CLUB_NEGOTIATION' && !isFreeAgent && !isContractRenewal && (
              <>
                {activeNeg.latestClubDemand && (
                  <button
                    onClick={() => {
                      if (activeNeg.latestClubDemand) {
                        acceptClubCounterOffer(activeNeg.id);
                        const updated = getNegotiationByPlayerId(player.id);
                        if (updated) setActiveNeg(updated);
                      }
                    }}
                    className="px-3 sm:px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500 text-xs font-black uppercase hover:bg-amber-500/30"
                  >
                    Karşı Teklifi Kabul Et (€{(activeNeg.latestClubDemand.upfrontFee + (activeNeg.latestClubDemand.installmentsFee || 0)).toLocaleString('tr-TR')})
                  </button>
                )}
                <button
                  onClick={handleSendClubOffer}
                  disabled={isOverTransferBudget}
                  className="px-4 sm:px-6 py-2 bg-[#b7ff35] hover:bg-[#9bea27] text-black font-black text-xs uppercase border border-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Kulübe Teklifi İlet
                </button>
              </>
            )}

            {(activeNeg.stage === 'PLAYER_NEGOTIATION' || isFreeAgent || isContractRenewal) && activeNeg.stage !== 'COMPLETED' && (
              <>
                {activeNeg.latestContractDemand && (
                  <button
                    onClick={() => {
                      if (activeNeg.latestContractDemand) {
                        acceptPlayerCounterOffer(activeNeg.id);
                        const updated = getNegotiationByPlayerId(player.id);
                        if (updated) setActiveNeg(updated);
                      }
                    }}
                    className="px-3 sm:px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500 text-xs font-black uppercase hover:bg-amber-500/30"
                  >
                    Talebi Kabul Et (€{activeNeg.latestContractDemand.wage.toLocaleString('tr-TR')}/hf)
                  </button>
                )}
                <button
                  onClick={handleSendContractOffer}
                  className="px-4 sm:px-6 py-2 bg-[#b7ff35] hover:bg-[#9bea27] text-black font-black text-xs uppercase border border-white shadow-md"
                >
                  Sözleşme Teklifini Sun
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
