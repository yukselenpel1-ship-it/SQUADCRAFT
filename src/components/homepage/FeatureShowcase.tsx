'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TacticalPitch3D } from '@/components/three/TacticalPitch3D';
import { Search, TrendingUp, Sparkles, UserCheck, ArrowUpRight } from 'lucide-react';

export function FeatureShowcase() {
  const [selectedOffer, setSelectedOffer] = useState('€48.5M');

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-14">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.2em] uppercase font-semibold">
            GAMEPLAY ENGINE
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            CONTROL EVERY DETAIL
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2 max-w-xl">
            An editorial sports command center built for tactical purists, market strategists, and talent architects.
          </p>
        </div>

        {/* Irregular Editorial Sports Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Transfers Module + Scouting & Youth */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* 1. TRANSFERS: Large Horizontal Module */}
            <div className="bg-[#090d0a] border border-white/10 rounded-[8px] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#b7ff35]" />
                  <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wider uppercase">
                    TRANSFER DESK // BID SUBMITTED
                  </span>
                </div>
                <span className="font-ibm text-[11px] text-[#b7ff35] bg-[#b7ff35]/10 px-2.5 py-1 rounded">
                  LIVE NEGOTIATION
                </span>
              </div>

              {/* Rumor ticker */}
              <div className="bg-[#121914] border border-white/5 rounded-[4px] px-3.5 py-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#17e5c2] animate-pulse" />
                <span className="font-ibm text-[11px] text-[#8b958d]">
                  RUMOR WIRE: Northstar submitting opening bid of {selectedOffer} for Aras Kimura. Ravenport reviewing payment structure.
                </span>
              </div>

              {/* Player Portrait & Valuation Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 relative">
                  <div
                    className="w-full aspect-[3/4] rounded-[6px] overflow-hidden bg-[#141d17] border border-[#b7ff35]/30 p-4 flex flex-col justify-between shadow-xl"
                    style={{
                      transform: 'rotate(-2deg)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-barlow font-extrabold text-[38px] text-[#b7ff35] leading-none">86</span>
                      <span className="font-ibm text-[12px] text-[#f2f5f2]">CM</span>
                    </div>
                    <div className="text-center my-auto">
                      <span className="font-barlow font-extrabold text-[26px] text-[#f2f5f2] tracking-wide block">
                        ARAS KIMURA
                      </span>
                      <span className="font-ibm text-[11px] text-[#8b958d]">24 YRS // JAPAN</span>
                    </div>
                    <div className="flex justify-between font-ibm text-[11px] text-[#17e5c2] border-t border-white/10 pt-2">
                      <span>VALUATION</span>
                      <span className="font-bold">€48.5M</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7 flex flex-col gap-3 font-ibm text-[12px]">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-[#8b958d]">CLUB INTEREST</span>
                    <span className="text-[#65ff83] font-bold">VERY HIGH (92%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-[#8b958d]">ESTIMATED WAGE</span>
                    <span className="text-[#f2f5f2]">€110,000 / WK</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-[#8b958d]">AGENT STANCE</span>
                    <span className="text-[#b7ff35]">OPEN TO TALKS</span>
                  </div>

                  {/* Offer selector buttons */}
                  <div className="pt-3">
                    <span className="text-[#8b958d] text-[11px] block mb-2">ADJUST OFFER AMOUNT:</span>
                    <div className="flex gap-2">
                      {['€42.0M', '€48.5M', '€54.0M'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSelectedOffer(amt)}
                          className={`flex-1 py-1.5 text-center rounded-[3px] border transition-all cursor-pointer ${
                            selectedOffer === amt
                              ? 'bg-[#b7ff35] text-[#050806] font-bold border-[#b7ff35]'
                              : 'bg-white/5 border-white/10 text-[#f2f5f2] hover:border-white/30'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-grid: Scouting (Left) & Youth Academy (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* 2. SCOUTING MODULE (Radar & Confidence Ring) */}
              <div className="bg-[#090d0a] border border-white/10 rounded-[8px] p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-barlow font-extrabold text-[20px] text-[#f2f5f2] tracking-wider uppercase">
                      SCOUTING RADAR
                    </span>
                    <span className="font-ibm text-[10px] text-[#17e5c2] bg-[#17e5c2]/10 px-2 py-0.5 rounded">
                      IN PROGRESS
                    </span>
                  </div>

                  {/* Scout Confidence Ring Graphic */}
                  <div className="flex items-center gap-4 my-4 p-3 bg-white/5 rounded-[4px]">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-white/10"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#17e5c2]"
                          strokeDasharray="64, 100"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute font-ibm font-bold text-[11px] text-[#17e5c2]">
                        64%
                      </span>
                    </div>
                    <div>
                      <span className="font-barlow font-bold text-[14px] text-[#f2f5f2] block">
                        CONFIDENCE RING
                      </span>
                      <span className="font-ibm text-[10px] text-[#8b958d]">
                        2 MORE MATCHES TO REVEAL
                      </span>
                    </div>
                  </div>

                  {/* Attributes Range */}
                  <div className="space-y-2 font-ibm text-[11px]">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8b958d]">PACE</span>
                      <span className="text-[#8b958d]">??</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8b958d]">FINISHING</span>
                      <span className="text-[#b7ff35] font-bold">14 – 18</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8b958d]">VISION</span>
                      <span className="text-[#17e5c2] font-bold">12 – 16</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#8b958d]">POTENTIAL</span>
                      <span className="text-[#ffc84a]">UNKNOWN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. YOUTH ACADEMY MODULE */}
              <div className="bg-[#080d0a] border border-white/10 rounded-[8px] p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-barlow font-extrabold text-[20px] text-[#f2f5f2] tracking-wider uppercase">
                      YOUTH PROSPECT
                    </span>
                    <span className="font-ibm text-[10px] text-[#65ff83] bg-[#65ff83]/10 px-2 py-0.5 rounded">
                      GENERATION 2026
                    </span>
                  </div>

                  <div className="p-4 bg-white/5 rounded-[4px] mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-barlow font-extrabold text-[22px] text-[#f2f5f2]">
                        MATEO SAAR
                      </span>
                      <span className="font-ibm text-[12px] text-[#b7ff35]">16 YRS</span>
                    </div>
                    <div className="flex justify-between font-ibm text-[11px] text-[#8b958d]">
                      <span>POSITION: CM</span>
                      <span className="text-[#ffc84a]">POTENTIAL ★★★★☆</span>
                    </div>
                  </div>

                  {/* Animated Development Curve Sparkline */}
                  <div className="mt-4">
                    <span className="font-ibm text-[10px] text-[#8b958d] uppercase block mb-1.5">
                      DEVELOPMENT TRAJECTORY (+14 OVR)
                    </span>
                    <div className="h-16 w-full flex items-end gap-1.5 pt-2">
                      {[32, 40, 52, 60, 72, 85, 96].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-[#65ff83] rounded-t-[2px] transition-all"
                            style={{ height: `${val}%`, opacity: 0.35 + idx * 0.1 }}
                          />
                          <span className="font-ibm text-[9px] text-[#8b958d]">Y{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 4. TACTICS: Interactive 3D Tactical Pitch */}
          <div className="lg:col-span-5 bg-[#090d0a] border border-white/10 rounded-[8px] p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wider uppercase">
                TACTICAL COMMAND
              </span>
              <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest font-semibold">
                SYSTEM 4-3-3
              </span>
            </div>

            {/* Embedded 3D Tactical Pitch */}
            <TacticalPitch3D />
          </div>
        </div>
      </div>
    </section>
  );
}
