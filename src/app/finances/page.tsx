'use client';

import React, { useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { StatCard } from '@/components/ui/StatCard';
import {
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building,
  Users,
  ShieldCheck,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function FinancesPage() {
  const { finances, userClub, futureCommitments, isCareerHydrated, isInitialized, seasonYear } = useGame();

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Finans verileri yükleniyor...</span>
      </div>
    );
  }

  // Real Financial Values
  const totalIncome = Object.values(finances.incomeCategories || {}).reduce((a, b) => a + (b || 0), 0) || 62400000;
  const totalExpense = Object.values(finances.expenseCategories || {}).reduce((a, b) => a + (b || 0), 0) || 51700000;
  const netProfit = totalIncome - totalExpense;

  const weeklyWages = finances.weeklyWages || 150000;
  const wageBudget = finances.wageBudget || 220000;
  const wageUsagePercent = Math.min(100, Math.round((weeklyWages / (wageBudget || 1)) * 100));

  const clubCash = userClub.transferBudget * 1.5;

  // Monthly Breakdown (July to June)
  const months = ['Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
  const monthlyData = [
    { month: 'Tem', income: 8.5, expense: 9.2 },
    { month: 'Ağu', income: 10.2, expense: 11.5 },
    { month: 'Eyl', income: 5.4, expense: 4.2 },
    { month: 'Eki', income: 6.1, expense: 4.1 },
    { month: 'Kas', income: 5.8, expense: 4.3 },
    { month: 'Ara', income: 7.2, expense: 4.5 },
    { month: 'Oca', income: 11.4, expense: 8.9 },
    { month: 'Şub', income: 4.8, expense: 4.1 },
    { month: 'Mar', income: 5.2, expense: 4.2 },
    { month: 'Nis', income: 5.6, expense: 4.3 },
    { month: 'May', income: 9.8, expense: 5.1 },
    { month: 'Haz', income: 6.4, expense: 4.5 },
  ];

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

      {/* 2. TOP KPI CARDS (5 METRICS AS IN REFERENCE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Kulüp Kasası"
          value={`€${(clubCash / 1000000).toFixed(1)}M`}
          change="+12%"
          changeType="positive"
          subtext={`Sezon Başı: €${((clubCash * 0.9) / 1000000).toFixed(1)}M`}
          icon={Wallet}
        />

        <StatCard
          label="Transfer Bütçesi"
          value={`€${(userClub.transferBudget / 1000000).toFixed(1)}M`}
          change="+18%"
          changeType="positive"
          subtext={`Kalan: €${(userClub.transferBudget / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
        />

        <StatCard
          label="Maaş Bütçesi"
          value={`€${(weeklyWages / 1000).toFixed(0)}K / hf`}
          progressPercent={wageUsagePercent}
          subtext={`Kullanım: %${wageUsagePercent}`}
          icon={DollarSign}
        />

        <StatCard
          label="Sezon Geliri"
          value={`€${(totalIncome / 1000000).toFixed(1)}M`}
          change="+22%"
          changeType="positive"
          subtext="Yayın & Sponsorluklar"
          icon={BarChart3}
        />

        <StatCard
          label="Sezon Gideri"
          value={`€${(totalExpense / 1000000).toFixed(1)}M`}
          change="-9%"
          changeType="negative"
          subtext="Maaşlar & Operasyon"
          icon={TrendingDown}
        />
      </div>

      {/* 3. CHARTS ROW 1: GELİR-GİDER GRAFİĞİ + GELİR DAĞILIMI + GİDER DAĞILIMI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* GELİR-GİDER BAR CHART (6 COLS) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-4">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <BarChart3 className="w-3.5 h-3.5 text-[#65F56B]" />
              Gelir - Gider Grafiği
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded bg-[#65F56B]" /> Gelir
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Gider
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {/* Gelir bar */}
                  <div
                    className="w-1/2 max-w-[14px] bg-[#65F56B] rounded-t transition-all hover:brightness-125"
                    style={{ height: `${(d.income / 12) * 100}%` }}
                    title={`Gelir: €${d.income}M`}
                  />
                  {/* Gider bar */}
                  <div
                    className="w-1/2 max-w-[14px] bg-rose-500 rounded-t transition-all hover:brightness-125"
                    style={{ height: `${(d.expense / 12) * 100}%` }}
                    title={`Gider: €${d.expense}M`}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GELİR DAĞILIMI (3 COLS) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <PieChart className="w-3.5 h-3.5 text-[#65F56B]" />
              Gelir Dağılımı
            </span>
          </div>

          <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
            {/* Donut representation */}
            <div className="w-full h-full rounded-full border-[14px] border-[#65F56B] border-t-[#30D8CE] border-r-amber-400 border-b-sky-400 animate-in fade-in" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black font-sans text-white">€{(totalIncome / 1000000).toFixed(1)}M</span>
              <span className="text-[9px] font-mono text-zinc-400">Toplam Gelir</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] font-mono pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#65F56B]" /> Yayın Hakları
              </span>
              <span className="text-white font-bold">%42 (€26.2M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#30D8CE]" /> Sponsorluklar
              </span>
              <span className="text-white font-bold">%24 (€15.0M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Maç Günü
              </span>
              <span className="text-white font-bold">%18 (€11.2M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Ticari & Diğer
              </span>
              <span className="text-white font-bold">%16 (€10.0M)</span>
            </div>
          </div>
        </div>

        {/* GİDER DAĞILIMI (3 COLS) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <PieChart className="w-3.5 h-3.5 text-rose-400" />
              Gider Dağılımı
            </span>
          </div>

          <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
            {/* Donut representation */}
            <div className="w-full h-full rounded-full border-[14px] border-rose-500 border-t-amber-500 border-r-indigo-500 border-b-cyan-500 animate-in fade-in" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-black font-sans text-white">€{(totalExpense / 1000000).toFixed(1)}M</span>
              <span className="text-[9px] font-mono text-zinc-400">Toplam Gider</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] font-mono pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Oyuncu Maaşları
              </span>
              <span className="text-white font-bold">%62 (€32.1M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Transfer Harcamaları
              </span>
              <span className="text-white font-bold">%18 (€9.4M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Altyapı & Tesis
              </span>
              <span className="text-white font-bold">%8 (€4.1M)</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Operasyon & Diğer
              </span>
              <span className="text-white font-bold">%12 (€6.1M)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: AYLIK NAKİT AKIŞI + MAAŞ BÜTÇESİ DAĞILIMI + SEZON PROJEKSİYONU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* AYLIK NAKİT AKIŞI (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white font-sans">
              Aylık Nakit Akışı
            </span>
            <span className="text-[10px] font-mono text-[#65F56B]">Net +€10.7M</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {monthlyData.slice(0, 5).map((m) => {
              const diff = (m.income - m.expense).toFixed(1);
              const isPositive = Number(diff) >= 0;
              return (
                <div key={m.month} className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
                  <span className="text-zinc-300 font-bold">{m.month} 2027</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500">Gelir: €{m.income}M</span>
                    <span className={`font-bold ${isPositive ? 'text-[#65F56B]' : 'text-rose-400'}`}>
                      {isPositive ? `+€${diff}M` : `-€${Math.abs(Number(diff))}M`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAAŞ BÜTÇESİ DAĞILIMI (3 COLS) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-[rgba(125,160,175,0.14)] mb-2">
            <span className="text-xs font-black uppercase text-white font-sans">
              Maaş Bütçesi Dağılımı
            </span>
          </div>

          <div className="space-y-3 py-1 text-xs font-mono">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>A Takım</span>
                <span className="text-white font-bold">%66 (€2.1M)</span>
              </div>
              <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#65F56B] rounded-full" style={{ width: '66%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Rotasyon</span>
                <span className="text-white font-bold">%21 (€680K)</span>
              </div>
              <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#30D8CE] rounded-full" style={{ width: '21%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Altyapı</span>
                <span className="text-white font-bold">%7 (€220K)</span>
              </div>
              <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Teknik Ekip</span>
                <span className="text-white font-bold">%6 (€150K)</span>
              </div>
              <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* SEZON PROJEKSİYONU (4 COLS) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <div className="pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white font-sans">
              Sezon Projeksiyonu
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Toplam Gelir</span>
              <span className="text-white font-bold">€{(totalIncome / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Toplam Gider</span>
              <span className="text-white font-bold">€{(totalExpense / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Sezon Kârı (Zarar)</span>
              <span className="text-[#65F56B] font-black">+€{(netProfit / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Sezon Sonu Kasa Tahmini</span>
              <span className="text-white font-bold">€{((clubCash + netProfit) / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Maaş Bütçesi Tahmini</span>
              <span className="text-white font-bold">€3.4M / hf</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ROW 3: SPONSORLUKLAR, YÖNETİM BEKLENTİLERİ, FFP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SPONSORLUKLAR */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Sponsorluklar
          </h4>
          <div className="space-y-2 text-xs font-mono">
            {[
              { name: 'Kalyon Enerji', cat: 'Forma Göğüs Sponsoru', value: '€8.0M', end: '2030' },
              { name: 'Nexen Telecom', cat: 'Resmi Partner', value: '€3.5M', end: '2029' },
              { name: 'Peak Motors', cat: 'Stadyum İsmi Hakkı', value: '€2.8M', end: '2031' },
              { name: 'Kartepe Belediyesi', cat: 'Bölgesel Partner', value: '€0.9M', end: '2028' },
            ].map((sp) => (
              <div key={sp.name} className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
                <div>
                  <div className="text-white font-bold">{sp.name}</div>
                  <div className="text-[10px] text-zinc-500">{sp.cat}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#65F56B] font-bold">{sp.value}</div>
                  <div className="text-[9px] text-zinc-500">Bitiş: {sp.end}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YÖNETİM BEKLENTİLERİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Yönetim Beklentileri
          </h4>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-300">Finansal istikrarı koru</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40">
                Çok Önemli
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-300">Sürdürülebilir büyüme sağla</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40">
                Önemli
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-300">Maaş bütçesini kontrol altında tut</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Önemli
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-300">Altyapıya yatırım yap</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                Orta
              </span>
            </div>
          </div>
        </div>

        {/* FINANSAL FAIR PLAY DURUMU */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <h4 className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            Finansal Fair Play Durumu
          </h4>
          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#65F56B] shrink-0" />
              <div>
                <span className="text-white font-black uppercase block">Kurallara Uygun</span>
                <span className="text-[10px] text-zinc-400">UEFA ve Ulusal FFP limitleri dahilinde</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-zinc-300 text-[11px]">
                <span>Maaş / Gelir Oranı</span>
                <span className="text-[#65F56B] font-bold">%58 (Limit: %70)</span>
              </div>
              <div className="flex justify-between text-zinc-300 text-[11px]">
                <span>Transfer Dengesi</span>
                <span className="text-[#65F56B] font-bold">Pozitif (+€3.2M)</span>
              </div>
              <div className="flex justify-between text-zinc-300 text-[11px]">
                <span>Net Borç Limiti</span>
                <span className="text-[#65F56B] font-bold">Uygun (€0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
