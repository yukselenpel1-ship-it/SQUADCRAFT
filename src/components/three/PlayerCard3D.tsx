'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function PlayerCard3D() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // max tilt 7 deg
    setRotateX(-(y / (rect.height / 2)) * 7);
    setRotateY((x / (rect.width / 2)) * 7);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-12 flex flex-col lg:flex-row items-center justify-center gap-12 select-none">
      {/* Huge blurred number "86" in the background */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-barlow font-extrabold text-[280px] sm:text-[420px] text-[#b7ff35]/5 pointer-events-none blur-sm select-none leading-none z-0"
        aria-hidden="true"
      >
        86
      </div>

      {/* 3D Interactive Card (approx 2.2 x 3.2 ratio) */}
      <div
        style={{ perspective: '1200px' }}
        className="relative z-10 flex items-center justify-center"
      >
        <motion.div
          animate={{
            rotateX,
            rotateY,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-[300px] sm:w-[340px] aspect-[2.2/3.2] rounded-[12px] p-6 flex flex-col justify-between overflow-hidden shadow-2xl cursor-pointer"
          style={{
            background: 'linear-gradient(145deg, #121914 0%, #080d09 100%)',
            border: '1.5px solid rgba(183, 255, 53, 0.45)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(183,255,53,0.18)',
          }}
        >
          {/* Subtle Holographic Edge Sheen */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-color-dodge"
            style={{
              background:
                'linear-gradient(115deg, transparent 20%, rgba(183,255,53,0.3) 45%, rgba(23,229,194,0.3) 55%, transparent 75%)',
            }}
          />

          {/* Top Row: Overall Rating & Position */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="font-barlow font-extrabold text-[58px] text-[#b7ff35] leading-none tracking-tight">
                86
              </div>
              <div className="font-ibm font-bold text-[16px] text-[#f2f5f2] tracking-wider mt-0.5">
                CM
              </div>
            </div>

            {/* Fictional Club Emblem */}
            <div className="w-12 h-12 rounded-full border border-[#b7ff35]/50 flex items-center justify-center bg-[#050806]/80 shadow-[0_0_12px_rgba(183,255,53,0.3)]">
              <span className="font-barlow font-extrabold text-[15px] text-[#b7ff35]">
                NSC
              </span>
            </div>
          </div>

          {/* Center: Player Silhouette / Portrait Graphic */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-white/10 bg-radial from-[#17e5c2]/10 to-transparent flex items-center justify-center mb-3">
              <span className="font-barlow text-[42px] font-bold text-[#f2f5f2]/80">
                AK
              </span>
            </div>
            <h3 className="font-barlow font-extrabold text-[32px] text-[#f2f5f2] tracking-wider uppercase text-center leading-tight">
              ARAS KIMURA
            </h3>
            <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest uppercase">
              NORTHSTAR CITY
            </span>
          </div>

          {/* Bottom Attributes: PAC 79 | PAS 91 | DRI 88 | DEF 71 | PHY 74 */}
          <div className="relative z-10 border-t border-white/10 pt-3">
            <div className="grid grid-cols-5 gap-1 text-center font-ibm text-[11px]">
              <div>
                <span className="block text-[#8b958d]">PAC</span>
                <span className="font-bold text-[#f2f5f2]">79</span>
              </div>
              <div>
                <span className="block text-[#8b958d]">PAS</span>
                <span className="font-bold text-[#b7ff35]">91</span>
              </div>
              <div>
                <span className="block text-[#8b958d]">DRI</span>
                <span className="font-bold text-[#b7ff35]">88</span>
              </div>
              <div>
                <span className="block text-[#8b958d]">DEF</span>
                <span className="font-bold text-[#f2f5f2]">71</span>
              </div>
              <div>
                <span className="block text-[#8b958d]">PHY</span>
                <span className="font-bold text-[#f2f5f2]">74</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Side Intelligence Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#0d120f]/90 border border-white/10 rounded-[8px] p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest uppercase">
            SCOUT DOSSIER // SC-882
          </span>
          <span className="font-ibm text-[11px] text-[#65ff83] bg-[#65ff83]/15 px-2 py-0.5 rounded">
            PEAK FORM
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="font-inter text-[13px] text-[#8b958d]">ROLE</span>
            <span className="font-barlow text-[18px] font-bold text-[#f2f5f2] tracking-wide">
              Advanced Playmaker
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="font-inter text-[13px] text-[#8b958d]">SEASON FORM</span>
            <span className="font-barlow text-[22px] font-extrabold text-[#b7ff35]">
              8.1 <span className="font-ibm text-[12px] text-[#8b958d]">/ 10</span>
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="font-inter text-[13px] text-[#8b958d]">MARKET VALUE</span>
            <span className="font-barlow text-[20px] font-bold text-[#17e5c2]">
              €64M
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-inter text-[13px] text-[#8b958d]">CONTRACT EXPIRY</span>
            <span className="font-ibm text-[14px] text-[#f2f5f2]">
              JUNE 2029
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mt-6 w-full py-3 bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-bold text-[16px] tracking-wider uppercase rounded-[3px] transition-all cursor-pointer shadow-[0_4px_16px_rgba(183,255,53,0.3)] hover:translate-y-[-2px]"
        >
          SHORTLIST PLAYER →
        </button>
      </div>
    </div>
  );
}
