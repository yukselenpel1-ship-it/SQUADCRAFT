'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { BudgetCard } from '@/components/ui/BudgetCard';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
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
  DollarSign,
  AlertTriangle,
  BarChart3,
  Percent,
} from 'lucide-react';

export default function FinancesPage() {
  const { finances, userClub, futureCommitments, isCareerHydrated, isInitialized } = useGame();

  const [chartPeriod, setChartPeriod] = useState<'MONTH' | 'QUARTER' | 'SEASON'>('SEASON');

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="KULÜP FİNANSI YÜKLENİYOR"
        message="Bütçe kalemleri, gelir-gider tabloları ve finansal projeksiyonlar derleniyor..."
      />
    );
  }

  const totalIncome = Object.values(finances.incomeCategories || {}).reduce((a, b) => a + (b || 0), 0);
  const totalExpense = Object.values(finances.expenseCategories || {}).reduce((a, b) => a + (b || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const wagePercentage = Math.round(((finances.weeklyWages || 0) / (finances.wageBudget || 1)) * 100);

  // Financial health status
  const financialHealth = useMemo(() => {
    if (finances.clubBalance > 15_000_000 && netProfit >= 0) {
      return { status: 'STRONG', text: 'GÜÇLÜ & STABİL // A+', color: 'text-[#356c52] bg-[#568b6b]/15 border-[#b8ff3d]/30' };
    }
    if (finances.clubBalance > 5_000_000) {
      return { status: 'STABLE', text: 'DENGELİ // B', color: 'text-[#245f62] bg-[#529b92]/15 border-[#21dfbd]/30' };
    }
    return { status: 'AT_RISK', text: 'RİSKLİ // DİKKAT', color: 'text-[#a13d45] bg-[#bc5960]/15 border-[#ff5365]/30' };
  }, [finances.clubBalance, netProfit]);

  // Filter user club commitments
  const payableCommitments = (futureCommitments || []).filter(
    (c) => c.fromClubId === userClub.id && !c.isPaid
  );
  const receivableCommitments = (futureCommitments || []).filter(
    (c) => c.toClubId === userClub.id && !c.isPaid
  );
  const totalPayable = payableCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalReceivable = receivableCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Filtered monthly cashflow based on period
  const displayCashflow = useMemo(() => {
    const list = finances.monthlyHistory || [];
    if (chartPeriod === 'MONTH') return list.slice(-1);
    if (chartPeriod === 'QUARTER') return list.slice(-3);
    return list;
  }, [finances.monthlyHistory, chartPeriod]);

  // Max value for chart normalization
  const maxCashflowVal = Math.max(
    ...displayCashflow.map((m) => Math.max(m.income, m.expense)),
    1_000_000
  );

  return (
    <div className="sc-editorial-restyle sc-finances-editorial space-y-5 px-4 sm:px-8 lg:px-12 py-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-300">
      {/* 1. BROADCAST FINANCIAL CONTROL HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-[#d5c8b9] p-5 md:p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#568b6b]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-[#529b92]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#568b6b]/15 text-[#356c52] border border-[#b8ff3d]/30">
                // CLUB FINANCIAL CONTROL & AUDIT
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${financialHealth.color}`}>
                SAĞLIK DURUMU: {financialHealth.text}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#568b6b]/10 border border-[#b8ff3d]/20 flex items-center justify-center text-[#356c52]">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#211e1a] tracking-tight uppercase font-sport">
                  FİNANSAL YÖNETİM
                </h1>
                <p className="text-sm text-[#62584f] font-inter leading-relaxed">
                  {userClub.name.toUpperCase()} • KULÜP BÜTÇESİ, NAKİT AKIŞI VE GELECEK TAAHHÜTLER
                </p>
              </div>
            </div>
          </div>

          {/* Right Health Pill */}
          <div className="flex items-center gap-3 bg-[#efe6da]/90 rounded-2xl border border-[#d5c8b9] p-4 shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#568b6b]/10 border border-[#b8ff3d]/30 flex items-center justify-center text-[#356c52]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#62584f] block tracking-wider">
                NET SEZON PROJEKSİYONU
              </span>
              <div className="text-xl font-black font-mono mt-0.5">
                <span className={netProfit >= 0 ? 'text-[#356c52]' : 'text-[#a13d45]'}>
                  {netProfit >= 0 ? '+' : ''}€{(netProfit / 1_000_000).toFixed(2)}M
                </span>
              </div>
              <span className="text-[11px] font-inter text-[#73675c] block">
                Tahmini gelir-gider dengesi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BUDGET KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Club Balance */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 space-y-2 shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-[#62584f]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">KULÜP KASASI (NET NAKİT)</span>
            <Wallet className="w-4 h-4 text-[#356c52]" />
          </div>
          <div className="text-2xl font-black text-[#211e1a] font-mono">
            €{(finances.clubBalance / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] font-mono text-[#356c52] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kullanılabilir likit sermaye</span>
          </div>
        </div>

        {/* Transfer Budget */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 space-y-2 shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-[#62584f]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">TRANSFER BÜTÇESİ</span>
            <Coins className="w-4 h-4 text-[#245f62]" />
          </div>
          <div className="text-2xl font-black text-[#245f62] font-mono">
            €{(finances.transferBudget / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs font-inter text-[#62584f]">
            Bonservis tavan limiti
          </div>
        </div>

        {/* Weekly Wages */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 space-y-2 shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-[#62584f]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">HAFTALIK MAAŞ YÜKÜ</span>
            <CreditCard className="w-4 h-4 text-[#846124]" />
          </div>
          <div className="text-2xl font-black text-[#846124] font-mono">
            €{(finances.weeklyWages / 1000).toFixed(0)}K
            <span className="text-xs text-[#73675c] font-normal"> /hf</span>
          </div>
          <div className="text-xs font-inter text-[#62584f]">
            Tavan: €{(finances.wageBudget / 1000).toFixed(0)}K/hf (%{wagePercentage})
          </div>
        </div>

        {/* Weekly Burn Rate */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 space-y-2 shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-[#62584f]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">HAFTALIK BURN RATE</span>
            <TrendingDown className="w-4 h-4 text-[#245f62]" />
          </div>
          <div className="text-2xl font-black text-[#211e1a] font-mono">
            €{((finances.weeklyWages + 25_000) / 1000).toFixed(0)}K
            <span className="text-xs text-[#73675c] font-normal"> /hf</span>
          </div>
          <div className="text-xs font-inter text-[#62584f]">
            Maaşlar + personel & tesis işletme
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE FINANCIAL CHART & PERIOD SELECTOR */}
      <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 sm:p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#d5c8b9]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#356c52]" />
              <h2 className="text-xl font-black text-[#211e1a] uppercase tracking-tight font-barlow">
                NAKİT AKIŞ PERFORMANS GRAFİĞİ (GELİR VS GİDER)
              </h2>
            </div>
            <p className="text-sm text-[#62584f] font-inter leading-relaxed mt-0.5">
              Aylık gelir ve gider dengesi, kulüp net operasyon marjı
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-[#efe6da] p-1 rounded-xl border border-[#d5c8b9] text-xs font-mono">
            {[
              { id: 'MONTH', label: 'SON AY' },
              { id: 'QUARTER', label: 'SON 3 AY' },
              { id: 'SEASON', label: 'TÜM SEZON' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChartPeriod(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartPeriod === tab.id
                    ? 'bg-[#9b2529] text-white font-black'
                    : 'text-[#4b4139] hover:text-[#9b2529]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Comparison Chart */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {displayCashflow.map((m, idx) => {
              const incomeWidth = Math.round((m.income / maxCashflowVal) * 100);
              const expenseWidth = Math.round((m.expense / maxCashflowVal) * 100);

              return (
                <div key={idx} className="bg-[#efe6da] p-4 rounded-xl border border-[#e0d5c9] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#211e1a] uppercase text-sm">{m.month} DÖNEMİ</span>
                    <span className="font-black text-[#211e1a]">
                      Net: <strong className={m.net >= 0 ? 'text-[#356c52]' : 'text-[#a13d45]'}>
                        {m.net >= 0 ? '+' : ''}€{m.net.toLocaleString('tr-TR')}
                      </strong>
                    </span>
                  </div>

                  {/* Income bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#356c52]">GELİR: +€{m.income.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="w-full bg-[#d8cbbc] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#568b6b] shadow-[0_0_10px_rgba(184,255,61,0.5)] transition-all duration-500"
                        style={{ width: `${incomeWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Expense bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#a13d45]">GİDER: -€{m.expense.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="w-full bg-[#d8cbbc] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#bc5960] shadow-[0_0_10px_rgba(255,83,101,0.5)] transition-all duration-500"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. BREAKDOWN LEDGER (REVENUE VS EXPENSES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REVENUE COLUMN */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#d5c8b9]">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#356c52]" />
              <h3 className="text-lg font-black uppercase tracking-tight text-[#211e1a] font-barlow">
                GELİR KALEMLERİ (REVENUE)
              </h3>
            </div>
            <span className="text-base font-black text-[#356c52] font-mono">
              €{(totalIncome / 1_000_000).toFixed(2)}M
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { label: 'Yayın Hakları ve TV Gelirleri', val: finances.incomeCategories?.broadcasting ?? 0 },
              { label: 'Resmi Sponsorluk Anlaşmaları', val: finances.incomeCategories?.sponsorships ?? 0 },
              { label: 'Oyuncu Satış ve Bonservis Gelirleri', val: finances.incomeCategories?.playerSales ?? 0 },
              { label: 'Maç Günü ve Bilet Satışları', val: finances.incomeCategories?.matchdayTickets ?? 0 },
              { label: 'Lisanslı Ürün Satışı (Merchandising)', val: finances.incomeCategories?.merchandising ?? 0 },
            ].map((item) => {
              const percent = totalIncome > 0 ? Math.round((item.val / totalIncome) * 100) : 0;
              return (
                <div key={item.label} className="p-3 bg-[#efe6da] rounded-xl border border-[#e0d5c9] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4f463e]">{item.label}</span>
                    <span className="font-bold text-[#211e1a]">€{item.val.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-[#d8cbbc] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#568b6b]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[10px] text-[#73675c] font-bold w-9 text-right">%{percent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXPENSES COLUMN */}
        <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#d5c8b9]">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[#a13d45]" />
              <h3 className="text-lg font-black uppercase tracking-tight text-[#211e1a] font-barlow">
                GİDER KALEMLERİ (EXPENSES)
              </h3>
            </div>
            <span className="text-base font-black text-[#a13d45] font-mono">
              €{(totalExpense / 1_000_000).toFixed(2)}M
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { label: 'Futbolcu Maaşları', val: finances.expenseCategories?.playerWages ?? 0 },
              { label: 'Yeni Transfer Bonservis Ödemeleri', val: finances.expenseCategories?.playerSignings ?? 0 },
              { label: 'Teknik Heyet & Personel Maaşları', val: finances.expenseCategories?.staffWages ?? 0 },
              { label: 'Altyapı & Akademi Yatırımları', val: finances.expenseCategories?.academyYouth ?? 0 },
              { label: 'Stadyum & Tesis Bakım Masrafları', val: finances.expenseCategories?.stadiumMaintenance ?? 0 },
            ].map((item) => {
              const percent = totalExpense > 0 ? Math.round((item.val / totalExpense) * 100) : 0;
              return (
                <div key={item.label} className="p-3 bg-[#efe6da] rounded-xl border border-[#e0d5c9] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4f463e]">{item.label}</span>
                    <span className="font-bold text-[#211e1a]">€{item.val.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-[#d8cbbc] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#bc5960]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-[10px] text-[#73675c] font-bold w-9 text-right">%{percent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. TRANSFER COMMITMENTS & INSTALLMENTS TABLE */}
      <div className="bg-[#fffaf2] rounded-2xl border border-[#d5c8b9] p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#d5c8b9]">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-[#211e1a] font-barlow flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#356c52]" />
              TRANSFER TAAHHÜTLERİ (TAKSİTLİ ÖDEMELER VE ALACAKLAR)
            </h3>
            <p className="text-sm font-inter text-[#62584f] mt-0.5">
              Gelecek transfer takvimine bağlı vadeli borçlar ve tahsilatlar
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-[#a13d45]">
              Toplam Borç: €{totalPayable.toLocaleString('tr-TR')}
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[#356c52]">
              Toplam Alacak: €{totalReceivable.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {payableCommitments.length === 0 && receivableCommitments.length === 0 ? (
          <div className="text-center py-8 text-[#73675c] text-xs font-mono">
            Kulübün aktif veya vadesi bekleyen taksitli transfer taahhüdü bulunmamaktadır.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payables */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-[#a13d45] flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                ÖDENECEK TAKSİTLER ({payableCommitments.length})
              </h4>
              {payableCommitments.length === 0 ? (
                <div className="p-4 bg-[#efe6da] rounded-xl border border-[#e0d5c9] text-xs font-mono text-[#73675c] text-center">
                  Ödenecek taksit bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {payableCommitments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-[#efe6da] rounded-xl border border-[#ff5365]/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-[#211e1a] uppercase">{c.playerName}</div>
                        <div className="text-[10px] text-[#62584f]">
                          {c.toClubName} kulübüne • TAKSİT {c.installmentIndex}/{c.totalInstallments}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#a13d45]">
                          -€{c.amount.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[10px] text-[#73675c]">
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
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-[#356c52] flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                TAHSİL EDİLECEK TAKSİTLER ({receivableCommitments.length})
              </h4>
              {receivableCommitments.length === 0 ? (
                <div className="p-4 bg-[#efe6da] rounded-xl border border-[#e0d5c9] text-xs font-mono text-[#73675c] text-center">
                  Tahsil edilecek taksit bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {receivableCommitments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-[#efe6da] rounded-xl border border-[#b8ff3d]/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-[#211e1a] uppercase">{c.playerName}</div>
                        <div className="text-[10px] text-[#62584f]">
                          {c.fromClubName} kulübünden • TAKSİT {c.installmentIndex}/{c.totalInstallments}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#356c52]">
                          +€{c.amount.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[10px] text-[#73675c]">
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
