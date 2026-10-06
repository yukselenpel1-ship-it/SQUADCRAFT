import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Globe, Monitor, Volume2, Shield, Eye, Check } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSettingsModal({ isOpen, onClose }: GameSettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [graphics3D, setGraphics3D] = useState('High');
  const [particles, setParticles] = useState(true);
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
            className="absolute top-4 right-4 text-[#8b958d] hover:text-[#f2f5f2] p-1 rounded cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2.5 mb-6 border-b border-white/10 pb-4">
            <Settings size={22} className="text-[#b7ff35]" />
            <h3 className="font-barlow font-extrabold text-[26px] sm:text-[28px] text-[#f2f5f2] tracking-wider uppercase leading-none">
              {t.settingsTitle}
            </h3>
          </div>

          <div className="space-y-6 font-ibm text-[12px]">
            {/* 1. Language Switcher Section (TR & EN) */}
            <div className="p-4 rounded-xl bg-[#0d140f] border border-[#b7ff35]/30 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#b7ff35] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[12px]">
                  <Globe size={15} />
                  {t.languageSection}
                </span>
                <span className="text-[10px] text-[#8b958d]">
                  {language === 'tr' ? 'Seçili: Türkçe' : 'Selected: English'}
                </span>
              </div>
              <p className="text-[11px] text-[#8b958d] mb-3">
                {t.languageDesc}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {/* TR Button */}
                <button
                  type="button"
                  onClick={() => setLanguage('tr')}
                  className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    language === 'tr'
                      ? 'bg-[#b7ff35] text-[#050806] border-[#b7ff35] shadow-[0_0_15px_rgba(183,255,53,0.4)]'
                      : 'bg-white/5 border-white/10 text-[#8b958d] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black font-ibm ${
                      language === 'tr' ? 'bg-[#050806] text-[#b7ff35]' : 'bg-white/10 text-[#8b958d]'
                    }`}
                  >
                    TR
                  </span>
                  <span className="font-barlow font-bold text-[14px]">TÜRKÇE</span>
                  {language === 'tr' && <Check size={15} className="stroke-[3] ml-auto text-[#050806]" />}
                </button>

                {/* EN Button */}
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#b7ff35] text-[#050806] border-[#b7ff35] shadow-[0_0_15px_rgba(183,255,53,0.4)]'
                      : 'bg-white/5 border-white/10 text-[#8b958d] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black font-ibm ${
                      language === 'en' ? 'bg-[#050806] text-[#b7ff35]' : 'bg-white/10 text-[#8b958d]'
                    }`}
                  >
                    EN
                  </span>
                  <span className="font-barlow font-bold text-[14px]">ENGLISH</span>
                  {language === 'en' && <Check size={15} className="stroke-[3] ml-auto text-[#050806]" />}
                </button>
              </div>
            </div>

            {/* 2. Graphics Options */}
            <div>
              <span className="text-[#b7ff35] font-bold block mb-3 uppercase tracking-wider">
                {t.graphicsSection}
              </span>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#8b958d]">{t.quality3D}</span>
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
                  <span className="text-[#8b958d]">{t.particles}</span>
                  <button
                    type="button"
                    onClick={() => setParticles(!particles)}
                    className={`px-3 py-1 rounded text-[11px] border font-bold cursor-pointer ${
                      particles
                        ? 'bg-[#b7ff35]/20 text-[#b7ff35] border-[#b7ff35]'
                        : 'bg-white/5 text-[#8b958d] border-white/10'
                    }`}
                  >
                    {particles ? t.enabled : t.disabled}
                  </button>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[#8b958d]">{t.stadiumBg}</span>
                  <button
                    type="button"
                    onClick={() => setStadiumBg(!stadiumBg)}
                    className={`px-3 py-1 rounded text-[11px] border font-bold cursor-pointer ${
                      stadiumBg
                        ? 'bg-[#17e5c2]/20 text-[#17e5c2] border-[#17e5c2]'
                        : 'bg-white/5 text-[#8b958d] border-white/10'
                    }`}
                  >
                    {stadiumBg ? t.enabled : t.disabled}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Accessibility & Motion */}
            <div>
              <span className="text-[#17e5c2] font-bold block mb-3 uppercase tracking-wider">
                {t.accessibilitySection}
              </span>
              <div className="flex justify-between items-center py-2">
                <div className="flex flex-col">
                  <span className="text-[#f2f5f2]">{t.reduceMotion}</span>
                  <span className="text-[#8b958d] text-[10px]">
                    {t.reduceMotionDesc}
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
                  {reducedMotion ? t.active : t.off}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-[3px] bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-bold text-[16px] tracking-wider uppercase transition-colors cursor-pointer"
          >
            {t.applySettings}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
