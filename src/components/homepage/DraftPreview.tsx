'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  TiltedCard,
} from '@/components/ui/react-bits';

export function DraftPreview() {
  const { t } = useLanguage();
  const [timerSeconds, setTimerSeconds] = useState(26);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [pickAnnounced, setPickAnnounced] = useState<string | null>(null);

  // Live draft timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setPickAnnounced(`NORTHSTAR SELECTS ${playerName.toUpperCase()}`);
    setTimeout(() => {
      setPickAnnounced(null);
    }, 3500);
  };

  const draftPool = [
    { id: '1', name: 'Luca Moreno', pos: 'LB', ovr: 84, club: 'Ravenport', age: 25 },
    { id: '2', name: 'Aras Kimura', pos: 'CM', ovr: 86, club: 'Northstar', age: 24, featured: true },
    { id: '3', name: 'Hugo Popov', pos: 'ST', ovr: 88, club: 'Ironvale', age: 26 },
  ];

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none overflow-hidden">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#17e5c2] tracking-[0.2em] uppercase font-semibold">
            <DecryptedText
              text={t.draftStageBadge}
              speed={28}
              maxIterations={10}
              animateOn="view"
            />
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            {t.draftStageTitle}
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            {t.draftStageDesc}
          </p>
        </div>

        {/* Draft Arena Frame */}
        <div className="relative w-full rounded-[10px] border border-white/15 bg-[#080d0a] shadow-2xl p-6 sm:p-8 overflow-hidden">
          {/* Draft League Media Asset Atmosphere */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
            <img
              src="/media/homepage/draft-league.webp"
              alt="Draft League Arena Stage"
              className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.25]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 20%, rgba(23, 229, 194, 0.25), transparent 70%), linear-gradient(to bottom, transparent 0%, #080d0a 90%)',
              }}
            />
          </div>

          {/* Draft Arena Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4 font-ibm">
            <div>
              <span className="text-[11px] text-[#17e5c2] uppercase tracking-widest block font-semibold">
                DRAFT LEAGUE // PRE-SEASON EVENT
              </span>
              <span className="font-barlow font-extrabold text-[28px] text-[#f2f5f2] tracking-wide">
                ROOM SC-4091 <span className="text-[#8b958d] font-normal text-[18px]">· ROUND 4 / 18</span>
              </span>
            </div>

            {/* Live Draft Clock (turns amber/red below 10s) */}
            <div className="flex items-center gap-3 bg-[#0d1611] border border-white/10 px-5 py-2.5 rounded-[4px] shadow-lg">
              <Clock
                size={18}
                className={timerSeconds < 10 ? 'text-[#ff4d5f] animate-spin' : 'text-[#b7ff35]'}
              />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] text-[#8b958d] uppercase tracking-wider">{t.draftOnTheClock}</span>
                <span
                  className={`font-barlow font-extrabold text-[32px] tracking-wider ${
                    timerSeconds < 10 ? 'text-[#ff4d5f] animate-pulse' : 'text-[#b7ff35]'
                  }`}
                >
                  00:{String(timerSeconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Pick Announcement Banner */}
          <AnimatePresence>
            {pickAnnounced && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative z-20 mb-6 p-4 rounded-[4px] bg-[#b7ff35] text-[#050806] font-barlow font-extrabold text-[22px] tracking-wider text-center shadow-[0_0_30px_rgba(183,255,53,0.5)] flex items-center justify-center gap-3"
              >
                <Sparkles size={20} />
                {pickAnnounced}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draft Arena Center Stage */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Player Draft Cards (8 cols) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider mb-6">
                AVAILABLE TALENT POOL // ROUND 4 SELECTIONS
              </span>

              <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-6 w-full">
                {draftPool.map((player) => {
                  const isFeatured = player.featured;
                  const isPicked = selectedPlayer === player.name;

                  return (
                    <TiltedCard
                      key={player.id}
                      maxAngle={10}
                      scale={1.03}
                      glareOpacity={isFeatured ? 0.3 : 0.15}
                      className={`relative rounded-[8px] p-5 cursor-pointer flex flex-col justify-between transition-all duration-300 ${
                        isFeatured
                          ? 'w-full sm:w-[220px] h-[310px] bg-[#121c16] border-2 border-[#b7ff35] shadow-[0_0_30px_rgba(183,255,53,0.25)]'
                          : 'w-full sm:w-[180px] h-[260px] bg-[#0c1410] border border-white/10 opacity-90 hover:opacity-100'
                      }`}
                    >
                      <div onClick={() => handlePick(player.name)} className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span
                            className={`font-barlow font-extrabold ${
                              isFeatured ? 'text-[44px] text-[#b7ff35]' : 'text-[32px] text-[#17e5c2]'
                            } leading-none`}
                          >
                            {player.ovr}
                          </span>
                          <span className="font-ibm font-bold text-[12px] text-[#f2f5f2]">
                            {player.pos}
                          </span>
                        </div>

                        <div className="text-center my-auto">
                          <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wide uppercase block">
                            {player.name}
                          </span>
                          <span className="font-ibm text-[11px] text-[#8b958d]">
                            {player.age} YRS · {player.club}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 rounded-[2px] font-barlow font-bold text-[15px] tracking-wider uppercase transition-colors cursor-pointer ${
                            isPicked
                              ? 'bg-[#65ff83] text-[#050806]'
                              : isFeatured
                              ? 'bg-[#b7ff35] text-[#050806] hover:bg-[#a6f028]'
                              : 'bg-white/10 text-[#f2f5f2] hover:bg-white/20'
                          }`}
                        >
                          {isPicked ? `${t.draftSelected} ✓` : `${t.draftSelectPlayer} →`}
                        </button>
                      </div>
                    </TiltedCard>
                  );
                })}
              </div>
            </div>

            {/* Right Participants Panel (4 cols) */}
            <div className="lg:col-span-4 bg-[#0d1410] border border-white/10 rounded-[8px] p-6">
              <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider block mb-4">
                DRAFT PARTICIPANTS (4 MANAGERS)
              </span>

              <div className="space-y-3 font-ibm text-[12px]">
                {/* User */}
                <div className="p-3 rounded-[4px] bg-[#b7ff35]/15 border-l-4 border-[#b7ff35] flex items-center justify-between">
                  <div>
                    <span className="font-barlow font-extrabold text-[17px] text-[#f2f5f2] block">
                      YOU // NORTHSTAR FC
                    </span>
                    <span className="text-[#b7ff35] text-[11px]">ACTIVE PICK NOW</span>
                  </div>
                  <span className="font-bold text-[#f2f5f2]">8 / 18</span>
                </div>

                {/* Bots */}
                {[
                  { name: 'RAVENPORT FC', type: 'BOT // TACTICIAN', count: '7 / 18' },
                  { name: 'IRONVALE ATHLETIC', type: 'BOT // AGGRESSIVE', count: '7 / 18' },
                  { name: 'WESTHAVEN UNITED', type: 'BOT // DATA-DRIVEN', count: '7 / 18' },
                ].map((bot) => (
                  <div
                    key={bot.name}
                    className="p-3 rounded-[4px] bg-white/5 border-l-4 border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-barlow font-bold text-[16px] text-[#f2f5f2] block">
                        {bot.name}
                      </span>
                      <span className="text-[#8b958d] text-[10px]">{bot.type}</span>
                    </div>
                    <span className="text-[#8b958d]">{bot.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Draft Order Timeline Bottom */}
          <div className="relative z-10 mt-8 pt-4 border-t border-white/10 font-ibm text-[11px]">
            <span className="text-[#8b958d] block mb-2 uppercase">SNAKE DRAFT ORDER ROUND 4:</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { name: 'YOU (NORTHSTAR)', active: true },
                { name: 'RAVENPORT', active: false },
                { name: 'IRONVALE', active: false },
                { name: 'WESTHAVEN', active: false },
                { name: 'WESTHAVEN', active: false },
                { name: 'IRONVALE', active: false },
                { name: 'RAVENPORT', active: false },
                { name: 'YOU (NORTHSTAR)', active: false },
              ].map((pick, i) => (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-[2px] border ${
                    pick.active
                      ? 'bg-[#b7ff35] text-[#050806] border-[#b7ff35] font-bold shadow-[0_0_8px_#b7ff35]'
                      : 'bg-white/5 text-[#8b958d] border-white/5'
                  }`}
                >
                  #{i + 1} {pick.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
