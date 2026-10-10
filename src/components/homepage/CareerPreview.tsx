'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Compass,
  Calendar,
  ArrowLeftRight,
  Eye,
  GraduationCap,
  Briefcase,
  Wallet,
  Play,
  Mail,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  AnimatedCounter,
  MagneticButton,
} from '@/components/ui/react-bits';

export function CareerPreview() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Overview');

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Squad', icon: Users },
    { label: 'Tactics', icon: Compass },
    { label: 'Schedule', icon: Calendar },
    { label: 'Transfers', icon: ArrowLeftRight },
    { label: 'Scouting', icon: Eye },
    { label: 'Youth', icon: GraduationCap },
    { label: 'Staff', icon: Briefcase },
    { label: 'Finances', icon: Wallet },
  ];

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.2em] uppercase font-semibold">
            <DecryptedText
              text={t.careerSuiteBadge}
              speed={30}
              maxIterations={10}
              animateOn="view"
            />
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            {t.careerSuiteTitle}
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            {t.careerSuiteDesc}
          </p>
        </div>

        {/* The Game Interface Mockup Container */}
        <div className="w-full rounded-[10px] border border-white/15 bg-[#090d0a] shadow-2xl overflow-hidden">
          {/* Top Status Bar */}
          <div className="bg-[#0c120e] border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-4 font-ibm text-[12px]">
            <div className="flex items-center gap-6">
              <span className="font-barlow font-bold text-[18px] text-[#b7ff35] tracking-wider">
                NORTHSTAR CITY FC
              </span>
              <span className="text-[#8b958d]">
                {t.careerSeason} <span className="text-[#f2f5f2] font-semibold">2026/27</span>
              </span>
              <span className="text-[#8b958d]">
                {t.careerMatchday} <span className="text-[#f2f5f2] font-semibold">12</span>
              </span>
              <span className="text-[#8b958d]">
                {t.careerPosition} <span className="text-[#b7ff35] font-bold">3RD</span> (26 PTS)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[#8b958d]">
                {t.careerTransferBudget}:{' '}
                <span className="text-[#17e5c2] font-semibold">
                  €<AnimatedCounter value={34.2} decimals={1} duration={1.2} />M
                </span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#65ff83] animate-pulse" />
              <span className="text-[#65ff83]">{t.careerGameSaved}</span>
            </div>
          </div>

          {/* Interface Layout: Left Sidebar + Main Command Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            {/* Left Management Sidebar (2 cols) */}
            <div className="lg:col-span-2 bg-[#080c09] border-r border-white/10 p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.label)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] font-barlow text-[16px] tracking-wide uppercase font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#b7ff35] text-[#050806] shadow-[0_0_12px_rgba(183,255,53,0.3)]'
                        : 'text-[#8b958d] hover:text-[#f2f5f2] hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Central Asymmetrical Command Grid (10 cols) */}
            <div className="lg:col-span-10 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#070b08]">
              {/* Module 1 (Large - 8 cols): NEXT MATCH CAROUSEL */}
              <div className="md:col-span-8 bg-[#0d1410] border border-white/10 rounded-[8px] p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
                {/* Career Mode Stadium Clash Media Backdrop */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
                  <img
                    src="/media/homepage/career-mode.webp"
                    alt="Career Stadium Clash Atmosphere"
                    className="w-full h-full object-cover object-center filter brightness-[0.5] contrast-[1.2]"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, #0d1410 0%, rgba(13,20,16,0.85) 50%, rgba(13,20,16,0.3) 100%)',
                    }}
                  />
                </div>

                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 mb-6">
                  <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest uppercase">
                    NEXT FIXTURE // LEAGUE MATCHDAY 12
                  </span>
                  <span className="font-ibm text-[11px] text-[#8b958d]">
                    SATURDAY 20:45 // POLAR ARENA
                  </span>
                </div>

                {/* Match Clash Presentation */}
                <div className="grid grid-cols-3 items-center text-center my-4">
                  {/* Home Team */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-[#b7ff35] bg-[#050806] flex items-center justify-center shadow-[0_0_20px_rgba(183,255,53,0.25)] mb-3 animate-[spin_24s_linear_infinite]">
                      <span className="font-barlow font-extrabold text-[24px] text-[#b7ff35]">
                        NSC
                      </span>
                    </div>
                    <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wider uppercase">
                      NORTHSTAR CITY
                    </span>
                    <span className="font-ibm text-[11px] text-[#8b958d]">HOME · 3RD</span>
                  </div>

                  {/* VS Badge */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-barlow font-extrabold text-[44px] text-outline-lime leading-none">
                      VS
                    </span>
                    <span className="font-ibm text-[11px] text-[#b7ff35] mt-1 bg-[#b7ff35]/10 px-2 py-0.5 rounded">
                      RIVALRY DERBY
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-[#17e5c2] bg-[#050806] flex items-center justify-center shadow-[0_0_20px_rgba(23,229,194,0.25)] mb-3 animate-[spin_24s_linear_infinite_reverse]">
                      <span className="font-barlow font-extrabold text-[24px] text-[#17e5c2]">
                        RPF
                      </span>
                    </div>
                    <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wider uppercase">
                      RAVENPORT FC
                    </span>
                    <span className="font-ibm text-[11px] text-[#8b958d]">AWAY · 2ND</span>
                  </div>
                </div>

                {/* Match Day Action Button */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="font-ibm text-[11px] text-[#8b958d]">
                    PROJECTED xG: <span className="text-[#b7ff35]">1.84</span> vs <span className="text-[#17e5c2]">1.22</span>
                  </div>
                  <MagneticButton strength={0.16}>
                    <button
                      type="button"
                      className="font-barlow font-bold text-[18px] text-[#050806] bg-[#b7ff35] hover:bg-[#a6f028] px-8 py-3 rounded-[3px] flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
                    >
                      <Play size={16} fill="currentColor" />
                      {t.careerEnterMatchday}
                    </button>
                  </MagneticButton>
                </div>
              </div>

              {/* Module 2 (Narrow Vertical - 4 cols): BOARD CONFIDENCE */}
              <div className="md:col-span-4 bg-[#0d1410] border border-white/10 rounded-[8px] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <span className="font-barlow font-bold text-[18px] text-[#f2f5f2] uppercase tracking-wide">
                      {t.careerBoardConfidence}
                    </span>
                    <span className="font-ibm text-[12px] text-[#65ff83] font-bold">
                      <AnimatedCounter value={88} suffix="%" duration={1.2} /> {'//'} A+
                    </span>
                  </div>

                  <div className="space-y-3 font-ibm text-[11px]">
                    <div>
                      <div className="flex justify-between text-[#8b958d] mb-1">
                        <span>LEAGUE TARGET (TOP 4)</span>
                        <span className="text-[#65ff83]">ON TRACK</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[92%] h-full bg-[#65ff83]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#8b958d] mb-1">
                        <span>FINANCIAL CONTROL</span>
                        <span className="text-[#b7ff35]">EXCELLENT</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-[#b7ff35]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#8b958d] mb-1">
                        <span>TACTICAL IDENTITY</span>
                        <span className="text-[#17e5c2]">APPROVED</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[88%] h-full bg-[#17e5c2]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 font-ibm text-[11px] text-[#8b958d]">
                  &ldquo;The board is delighted with the recent 4-1 derby victory.&rdquo;
                </div>
              </div>

              {/* Module 3 (4 cols): SQUAD CONDITION RADIAL */}
              <div className="md:col-span-4 bg-[#0d1410] border border-white/10 rounded-[8px] p-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <span className="font-barlow font-bold text-[18px] text-[#f2f5f2] uppercase tracking-wide">
                    {t.careerSquadCondition}
                  </span>
                  <Activity size={16} className="text-[#b7ff35]" />
                </div>
                <div className="space-y-2.5 font-ibm text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8b958d]">AVERAGE FITNESS</span>
                    <span className="text-[#b7ff35] font-bold">
                      <AnimatedCounter value={94} suffix="%" duration={1.2} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b958d]">MATCH SHARPNESS</span>
                    <span className="text-[#f2f5f2] font-bold">
                      <AnimatedCounter value={89} suffix="%" duration={1.2} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b958d]">SQUAD MORALE</span>
                    <span className="text-[#65ff83] font-bold">EXCELLENT</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-[#8b958d]">INJURY REPORT</span>
                    <span className="text-[#65ff83]">0 PLAYERS OUT</span>
                  </div>
                </div>
              </div>

              {/* Module 4 (4 cols): INBOX COMPACT LIST */}
              <div className="md:col-span-4 bg-[#0d1410] border border-white/10 rounded-[8px] p-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                  <span className="font-barlow font-bold text-[18px] text-[#f2f5f2] uppercase tracking-wide">
                    {t.careerInbox} (3)
                  </span>
                  <Mail size={16} className="text-[#17e5c2]" />
                </div>
                <div className="space-y-2 font-ibm text-[11px]">
                  <div className="p-2 bg-white/5 rounded border border-white/5 hover:border-[#b7ff35]/30 cursor-pointer transition-colors">
                    <span className="text-[#b7ff35] font-bold block">SCOUT REPORT: CENTRAL MID</span>
                    <span className="text-[#8b958d]">Chief Scout Costa submitted 3 targets</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded border border-white/5 hover:border-[#b7ff35]/30 cursor-pointer transition-colors">
                    <span className="text-[#f2f5f2] font-bold block">TACTICAL ANALYSIS: RAVENPORT</span>
                    <span className="text-[#8b958d]">Opponent relies on fast wing counters</span>
                  </div>
                </div>
              </div>

              {/* Module 5 (4 cols): TEAM FORM RECORD */}
              <div className="md:col-span-4 bg-[#0d1410] border border-white/10 rounded-[8px] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                    <span className="font-barlow font-bold text-[18px] text-[#f2f5f2] uppercase tracking-wide">
                      {t.careerFormTrend}
                    </span>
                    <TrendingUp size={16} className="text-[#65ff83]" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    {[
                      { res: 'W', opp: 'EST 3-0' },
                      { res: 'W', opp: 'KPT 2-1' },
                      { res: 'D', opp: 'IVL 1-1' },
                      { res: 'W', opp: 'EMB 4-1' },
                      { res: 'L', opp: 'WES 0-1' },
                    ].map((f, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center p-2 bg-white/5 rounded">
                        <span
                          className={`font-ibm font-bold text-[14px] ${
                            f.res === 'W'
                              ? 'text-[#65ff83]'
                              : f.res === 'D'
                              ? 'text-[#ffc84a]'
                              : 'text-[#ff4d5f]'
                          }`}
                        >
                          {f.res}
                        </span>
                        <span className="font-ibm text-[9px] text-[#8b958d] mt-1">{f.opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="font-ibm text-[11px] text-[#8b958d]">
                  UNBEATEN RUN: 4 MATCHES IN ALL COMPS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
