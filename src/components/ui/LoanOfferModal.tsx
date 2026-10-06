'use client';

import React, { useState } from 'react';
import { Player, SquadRole } from '@/types/game';
import { useGame } from '@/lib/context/GameContext';
import { LoanDurationType, LoanOfferPackage, LoanNegotiationResponse } from '@/lib/loans/types';
import { X, Handshake, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface LoanOfferModalProps {
  player: Player;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoanOfferModal: React.FC<LoanOfferModalProps> = ({
  player,
  onClose,
  onSuccess,
}) => {
  const { submitLoanOffer, finances, getClubById } = useGame();
  const parentClub = getClubById(player.clubId);

  const [duration, setDuration] = useState<LoanDurationType>('SEASON_END');
  const [wageShare, setWageShare] = useState<number>(100);
  const [upfrontFee, setUpfrontFee] = useState<number>(Math.round(player.marketValue * 0.05));
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  const [hasBuyOption, setHasBuyOption] = useState<boolean>(false);
  const [isMandatoryBuy, setIsMandatoryBuy] = useState<boolean>(false);
  const [buyFee, setBuyFee] = useState<number>(player.marketValue);
  const [canRecall, setCanRecall] = useState<boolean>(true);
  const [playingTimePromise, setPlayingTimePromise] = useState<SquadRole>('İlk 11');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<LoanNegotiationResponse | null>(null);

  const weeklyWageCost = Math.round((player.wage * wageShare) / 100);
  const parentWageCost = player.wage - weeklyWageCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const offerPackage: LoanOfferPackage = {
      duration,
      upfrontLoanFee: upfrontFee,
      monthlyLoanFee: monthlyFee,
      wageContributionPercentage: wageShare,
      buyOption: hasBuyOption
        ? {
            isMandatory: isMandatoryBuy,
            fee: buyFee,
          }
        : undefined,
      canRecall,
      playingTimePromise,
    };

    const res = submitLoanOffer(player.id, offerPackage);
    setResult(res);
    setSubmitting(false);

    if (res.decision === 'ACCEPTED') {
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d120f]/95 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-6 text-zinc-200">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b7ff35] to-[#17e5c2]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#090d0a] hover:bg-[#121D33] text-zinc-400 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#b7ff35]/20 text-[#b7ff35] flex items-center justify-center border border-[#b7ff35]/30">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Kiralama Teklifi Yap</h3>
            <p className="text-xs text-zinc-400">
              {player.firstName} {player.lastName} ({parentClub?.name || 'Kulüp'})
            </p>
          </div>
        </div>

        {result && (
          <div
            className={`mb-4 p-4 rounded-xl border text-xs flex items-start gap-3 ${
              result.decision === 'ACCEPTED'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : result.decision === 'COUNTER_OFFER'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {result.decision === 'ACCEPTED' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            )}
            <div>
              <strong className="block text-sm font-bold mb-0.5">
                {result.decision === 'ACCEPTED'
                  ? 'Kiralama Teklifi Kabul Edildi!'
                  : result.decision === 'COUNTER_OFFER'
                  ? 'Karşı Teklif / Şartlar Yetersiz'
                  : 'Kiralama Teklifi Reddedildi'}
              </strong>
              <p>{result.feedback}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Duration & Playing Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Kiralama Süresi</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as LoanDurationType)}
                className="w-full bg-[#141A28] border border-[#20293D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b7ff35]"
              >
                <option value="3_MONTHS">3 Ay (Kısa Dönem)</option>
                <option value="6_MONTHS">6 Ay (Devre Arasına Kadar)</option>
                <option value="SEASON_END">Sezon Sonu (Standart)</option>
                <option value="1_YEAR">1 Tam Yıl</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Vadedilen Kadro Rolü</label>
              <select
                value={playingTimePromise}
                onChange={(e) => setPlayingTimePromise(e.target.value as SquadRole)}
                className="w-full bg-[#141A28] border border-[#20293D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b7ff35]"
              >
                <option value="Kilit Oyuncu">Kilit Oyuncu (Her maç)</option>
                <option value="İlk 11">İlk 11 (Düzenli Başlangıç)</option>
                <option value="Rotasyon">Rotasyon</option>
                <option value="Yedek">Yedek</option>
                <option value="Genç Yetenek">Geliştirilecek Genç</option>
              </select>
            </div>
          </div>

          {/* Wage Contribution Split */}
          <div className="p-4 rounded-xl bg-[#141A28] border border-[#20293D] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-300">Maaş Karşılama Oranı: %{wageShare}</span>
              <span className="text-[#b7ff35]">Ödeyeceğiniz: €{weeklyWageCost.toLocaleString('tr-TR')}/hf</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={wageShare}
              onChange={(e) => setWageShare(Number(e.target.value))}
              className="w-full accent-[#b7ff35] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>%0 (Maaşın tamamı ana kulüpte)</span>
              <span>Kulübü öder: €{parentWageCost.toLocaleString('tr-TR')}/hf</span>
            </div>
          </div>

          {/* Upfront & Monthly Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Peşin Kiralama Bedeli (€)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={upfrontFee}
                onChange={(e) => setUpfrontFee(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#141A28] border border-[#20293D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b7ff35]"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Mevcut Transfer Bütçeniz: €{finances.transferBudget.toLocaleString('tr-TR')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Aylık Kiralama Bedeli (€)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[#141A28] border border-[#20293D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b7ff35]"
              />
            </div>
          </div>

          {/* Buy Options & Recall */}
          <div className="p-4 rounded-xl bg-[#141A28] border border-[#20293D] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBuyOption}
                  onChange={(e) => setHasBuyOption(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-[#b7ff35] focus:ring-0"
                />
                Satın Alma Maddesi Ekle
              </label>

              {hasBuyOption && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-zinc-400">
                    <input
                      type="radio"
                      name="buyType"
                      checked={!isMandatoryBuy}
                      onChange={() => setIsMandatoryBuy(false)}
                      className="mr-1 accent-[#b7ff35]"
                    />
                    Opsiyonel
                  </label>
                  <label className="text-[11px] text-zinc-400">
                    <input
                      type="radio"
                      name="buyType"
                      checked={isMandatoryBuy}
                      onChange={() => setIsMandatoryBuy(true)}
                      className="mr-1 accent-[#b7ff35]"
                    />
                    Zorunlu
                  </label>
                </div>
              )}
            </div>

            {hasBuyOption && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  {isMandatoryBuy ? 'Zorunlu Satın Alma Bedeli (€)' : 'Opsiyonel Satın Alma Bedeli (€)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={buyFee}
                  onChange={(e) => setBuyFee(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b7ff35]"
                />
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800/80">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canRecall}
                  onChange={(e) => setCanRecall(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-[#b7ff35] focus:ring-0"
                />
                Ana kulübün ara transferde geri çağırma hakkı bulunsun (Recall Clause)
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting || result?.decision === 'ACCEPTED'}
              className="px-5 py-2 rounded-xl text-xs font-black bg-[#b7ff35] text-black hover:bg-[#9bea27] disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
              Teklifi İlet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
