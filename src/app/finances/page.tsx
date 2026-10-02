'use client';

import React from 'react';
import { useGame } from '@/lib/context/GameContext';
import { BudgetCard } from '@/components/ui/BudgetCard';
import {
  Landmark,
  Wallet,
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building,
  Users,
  ShieldCheck,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function FinancesPage() {
  const { finances, userClub, futureCommitments, isCareerHydrated, isInitialized } = useGame();

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  const totalIncome = Object.values(finances.incomeCategories || {}).reduce((a, b) => a + (b || 0), 0);
  const totalExpense = Object.values(finances.expenseCategories || {}).reduce((a, b) => a + (b || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const wagePercentage = Math.round(((finances.weeklyWages || 0) / (finances.wageBudget || 1)) * 100);

  // Filter user club commitments
  const payableCommitments = (futureCommitments || []).filter(
    (c) => c.fromClubId === userClub.id && !c.isPaid
  );
  const receivableCommitments = (futureCommitments || []).filter(
    (c) => c.toClubId === userClub.id && !c.isPaid
  );
  const totalPayable = payableCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalReceivable = receivableCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#C7FF38]/10 text-[#C7FF38] border border-[#C7FF38]/30">
              // FINANCIAL CONTROL & LEDGER
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {userClub.name.toUpperCase()} FİNANSAL TABLOSU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Landmark className="w-7 h-7 text-[#C7FF38]" />
            Finansal Yönetim
          </h1>
        </div>

        {/* Financial Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080D1A] border border-emerald-500/30 text-[#C7FF38] text-xs font-mono font-bold">
          <ShieldCheck className="w-4 h-4 text-[#C7FF38]" />
          <span>FİNANSAL SAĞLIK: GÜÇLÜ & STABİL</span>
        </div>
      </div>

      {/* 1. Main Budget Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BudgetCard
          title="KULÜP KASASI"
          amount={finances.clubBalance}
          subtitle="Toplam Net Nakit Varlık"
          icon={Wallet}
          trend={{ value: '+%8.4 Bu Ay', isPositive: true }}
          highlight={true}
        />

        <BudgetCard
          title="TRANSFER BÜTÇESİ"
          amount={finances.transferBudget}
          subtitle="Kullanılabilir Bonservis"
          icon={Coins}
        />

        <BudgetCard
          title="HAFTALIK MAAŞ BÜTÇESİ"
          amount={finances.wageBudget}
          subtitle={`Harcama: €${finances.weeklyWages.toLocaleString('tr-TR')}/hf`}
          icon={CreditCard}
        />

        <BudgetCard
          title="YILLIK NET PROJEKSİYON"
          amount={`€${(netProfit / 1000000).toFixed(2)}M`}
          subtitle="Sezon Sonu Tahmini Kâr"
          icon={TrendingUp}
          trend={{ value: '+€2.6M Sezon', isPositive: true }}
        />
      </div>

      {/* 2. Wage Budget Utilization Bar */}
      <div className="p-4 sm:p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div>
            <span className="font-bold text-white text-sm uppercase">Haftalık Maaş Bütçesi Kullanımı</span>
            <span className="text-zinc-500 block text-[11px] mt-0.5">
              €{finances.weeklyWages.toLocaleString('tr-TR')} harcanıyor / €{finances.wageBudget.toLocaleString('tr-TR')} tavan limit
            </span>
          </div>
          <span
            className={`text-sm font-black ${
              wagePercentage > 90 ? 'text-rose-400' : 'text-[#C7FF38]'
            }`}
          >
            %{wagePercentage} DOLU
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#040711] overflow-hidden border border-zinc-800">
          <div
            className={`h-full transition-all duration-500 ${
              wagePercentage > 90 ? 'bg-rose-500' : 'bg-[#C7FF38]'
            }`}
            style={{ width: `${Math.min(100, wagePercentage)}%` }}
          />
        </div>
      </div>

      {/* 3. Income vs Expense Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#C7FF38] flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Sezonluk Gelir Kalemleri
            </h3>
            <span className="text-sm font-mono font-black text-white">
              €{(totalIncome / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Yayın Hakları ve TV Gelirleri</span>
              <span className="font-bold text-white">€{(finances.incomeCategories?.broadcasting ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Resmi Sponsorluk Anlaşmaları</span>
              <span className="font-bold text-white">€{(finances.incomeCategories?.sponsorships ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Oyuncu Satış ve Bonservis Gelirleri</span>
              <span className="font-bold text-white">€{(finances.incomeCategories?.playerSales ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Maç Günü ve Bilet Satışları</span>
              <span className="font-bold text-white">€{(finances.incomeCategories?.matchdayTickets ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-zinc-400">Lisanslı Ürün Satışı (Merchandising)</span>
              <span className="font-bold text-white">€{(finances.incomeCategories?.merchandising ?? 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Sezonluk Gider Kalemleri
            </h3>
            <span className="text-sm font-mono font-black text-white">
              €{(totalExpense / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Futbolcu Maaşları</span>
              <span className="font-bold text-white">€{(finances.expenseCategories?.playerWages ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Yeni Transfer Bonservis Ödemeleri</span>
              <span className="font-bold text-white">€{(finances.expenseCategories?.playerSignings ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Teknik Heyet & Personel Maaşları</span>
              <span className="font-bold text-white">€{(finances.expenseCategories?.staffWages ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-850">
              <span className="text-zinc-400">Altyapı & Akademi Yatırımları</span>
              <span className="font-bold text-white">€{(finances.expenseCategories?.academyYouth ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-zinc-400">Stadyum & Tesis Bakım Masrafları</span>
              <span className="font-bold text-white">€{(finances.expenseCategories?.stadiumMaintenance ?? 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Monthly Cashflow History */}
      <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-3">
        <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300">
          Son 5 Aylık Nakit Akış Tablosu <span className="text-[10px] text-zinc-500">// CASHFLOW STATEMENT</span>
        </h3>

        <div className="border border-zinc-850 bg-[#040711] overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs font-mono min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                <th className="py-2.5 px-3">DÖNEM</th>
                <th className="py-2.5 px-3 text-right">AYLIK GELİR</th>
                <th className="py-2.5 px-3 text-right">AYLIK GİDER</th>
                <th className="py-2.5 px-3 text-right">NET BAKİYE DEĞİŞİMİ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-semibold">
              {finances.monthlyHistory.map((m, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/60">
                  <td className="py-2.5 px-3 text-white font-bold">{m.month}</td>
                  <td className="py-2.5 px-3 text-right text-[#C7FF38]">
                    +€{m.income.toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-400">
                    -€{m.expense.toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-white">
                    +€{m.net.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Future Transfer Commitments (Taksitler ve Vadeli Ödemeler) */}
      <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C7FF38]" />
              Transfer Taahhütleri (Taksitli Ödeme & Alacaklar)
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Kulübün transfer anlaşmalarına bağlı vadeli taksit yükümlülükleri ve alacakları
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-rose-400">
              Borç: €{totalPayable.toLocaleString('tr-TR')}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[#C7FF38]">
              Alacak: €{totalReceivable.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {payableCommitments.length === 0 && receivableCommitments.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs font-mono">
            Aktif veya vadesi bekleyen taksitli transfer taahhüdü bulunmamaktadır.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payables */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                Ödenecek Taksitler ({payableCommitments.length})
              </h4>
              {payableCommitments.length === 0 ? (
                <div className="p-4 bg-[#040711] border border-zinc-850 text-xs font-mono text-zinc-500 text-center">
                  Ödenecek transfer taksidi bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {payableCommitments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-[#040711] border border-rose-500/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white uppercase">{c.playerName}</div>
                        <div className="text-[10px] text-zinc-400">
                          {c.toClubName} kulübüne • TAKSİT {c.installmentIndex}/{c.totalInstallments}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-rose-400">
                          -€{c.amount.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          Vade: {c.dueDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receivables */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-[#C7FF38] flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Tahsil Edilecek Taksitler ({receivableCommitments.length})
              </h4>
              {receivableCommitments.length === 0 ? (
                <div className="p-4 bg-[#040711] border border-zinc-850 text-xs font-mono text-zinc-500 text-center">
                  Tahsil edilecek transfer taksidi bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {receivableCommitments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-[#040711] border border-[#C7FF38]/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white uppercase">{c.playerName}</div>
                        <div className="text-[10px] text-zinc-400">
                          {c.fromClubName} kulübünden • TAKSİT {c.installmentIndex}/{c.totalInstallments}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#C7FF38]">
                          +€{c.amount.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          Vade: {c.dueDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
