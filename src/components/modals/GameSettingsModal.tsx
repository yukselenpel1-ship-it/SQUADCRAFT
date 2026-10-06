'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Monitor, Volume2, Shield, Eye } from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSettingsModal({ isOpen, onClose }: GameSettingsModalProps) {
  const [graphics3D, setGraphics3D] = useState('High');
  const [particles, setParticles] = useState(true);
  const [motionEffects, setMotionEffects] = useState('Full');
  const [stadiumBg, setStadiumBg] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#090d0a] border border-[#b7ff35]/30 rounded-[8px] p-6 sm:p-8 text-[#f2f5f2] shadow-2xl z-10 my-8"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(183,255,53,0.15)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#8b958d] hover:text-[#f2f5f2] p-1 rounded"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2.5 mb-6 border-b border-white/10 pb-4">
            <Settings size={20} className="text-[#b7ff35]" />
            <h3 className="font-barlow font-extrabold text-[28px] text-[#f2f5f2] tracking-wider uppercase leading-none">
              SYSTEM SETTINGS
            </h3>
          </div>

          <div className="space-y-6 font-ibm text-[12px]">
            {/* Graphics Options */}
            <div>
              <span className="text-[#b7ff35] font-bold block mb-3 uppercase tracking-wider">
                GRAPHICS & 3D ENGINE
              </span>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#8b958d]">3D Quality</span>
                  <div className="flex gap-1.5">
                    {['Low', 'Medium', 'High'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setGraphics3D(lvl)}
                        className={`px-3 py-1 rounded text-[11px] border cursor-pointer ${
                          graphics3D === lvl
                            ? 'bg-[#b7ff35] text-[#050806] font-bold border-[#b7ff35]'
                            : 'bg-white/5 border-white/10 text-[#8b958d]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#8b958d]">Atmospheric Particles</span>
                  <button
                    type="button"
                    onClick={() => setParticles(!particles)}
                    className={`px-3 py-1 rounded text-[11px] border font-bold cursor-pointer ${
                      particles
                        ? 'bg-[#b7ff35]/20 text-[#b7ff35] border-[#b7ff35]'
                        : 'bg-white/5 text-[#8b958d] border-white/10'
                    }`}
                  >
                    {particles ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#8b958d]">Stadium Background 3D</span>
                  <button
                    type="button"
                    onClick={() => setStadiumBg(!stadiumBg)}
                    className={`px-3 py-1 rounded text-[11px] border font-bold cursor-pointer ${
                      stadiumBg
                        ? 'bg-[#17e5c2]/20 text-[#17e5c2] border-[#17e5c2]'
                        : 'bg-white/5 text-[#8b958d] border-white/10'
                    }`}
                  >
                    {stadiumBg ? 'ENABLED' : 'STATIC PITCH'}
                  </button>
                </div>
              </div>
            </div>

            {/* Accessibility & Motion */}
            <div>
              <span className="text-[#17e5c2] font-bold block mb-3 uppercase tracking-wider">
                ACCESSIBILITY & MOTION
              </span>
              <div className="flex justify-between items-center py-2">
                <div className="flex flex-col">
                  <span className="text-[#f2f5f2]">Reduce Motion Mode</span>
                  <span className="text-[#8b958d] text-[10px]">
                    Disables camera cursor tracking and floating parallax
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`px-3 py-1 rounded text-[11px] border font-bold cursor-pointer ${
                    reducedMotion
                      ? 'bg-[#ffc84a]/20 text-[#ffc84a] border-[#ffc84a]'
                      : 'bg-white/5 text-[#8b958d] border-white/10'
                  }`}
                >
                  {reducedMotion ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-[3px] bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-bold text-[16px] tracking-wider uppercase transition-colors cursor-pointer"
          >
            APPLY CONFIGURATION
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
