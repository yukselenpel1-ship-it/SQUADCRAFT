'use client';

import React from 'react';
import { Calendar, ArrowRightLeft, Cpu, ShieldCheck } from 'lucide-react';

export function StepSeasonSetup() {
  const parameters = [
    {
      icon: Calendar,
      title: 'SEZON BAŞLANGIÇ TARİHİ',
      desc: 'Resmi sezon öncesi hazırlık kampı başlangıcı. Hazırlık maçları ve taktik testleri bu tarihte devreye girer.',
      value: '1 AĞUSTOS 2026',
      badge: '2026/27 SEZONU',
      accentColor: 'text-[#B7FF3C]',
    },
    {
      icon: ArrowRightLeft,
      title: 'YAZ TRANSFER DÖNEMİ',
      desc: '1 Ağustos — 1 Eylül tarihleri arasında transfer pazarı tam yetkiyle açıktır. Teklifler ve pazarlıklar aktiftir.',
      value: 'AKTİF & AÇIK',
      badge: 'RESMİ PENCERE',
      accentColor: 'text-[#38D8FF]',
    },
    {
      icon: Cpu,
      title: 'MAÇ VE RADAR SİMÜLASYON MOTORU',
      desc: '22 oyunculu canlı 2D taktiksel radar, deterministik maç hesaplama ve maç içi anlık hamle altyapısı.',
      value: 'SQUADCRAFT CORE v3.0',
      badge: 'DETERMİNİSTİK',
      accentColor: 'text-[#B7FF3C]',
    },
    {
      icon: ShieldCheck,
      title: 'KULÜP MALİ DİSİPLİN KURALLARI',
      desc: 'Haftalık maaş bütçesi ve transfer harcamaları lig finans komitesi tarafından denetlenir.',
      value: 'DEVREDE',
      badge: 'STANDART',
      accentColor: 'text-[#FFC84A]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-xs text-[#38D8FF] tracking-[0.2em] uppercase font-semibold">
          ADIM 04 // SEZON PARAMETRELERİ VE TAKVİM
        </span>
        <h2 className="font-condensed font-black text-3xl sm:text-4xl text-[#F2F6FA] uppercase tracking-wide leading-none mt-1.5">
          SEZON VE SİMÜLASYON KURALLARI
        </h2>
        <p className="font-sans text-sm text-[#91A2B4] mt-1.5 max-w-xl">
          Kariyerinin takvim başlangıcı, transfer penceresi ve maç motoru ayarlarını doğrula.
        </p>
      </div>

      {/* Parameter Cards */}
      <div className="space-y-3.5">
        {parameters.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="p-4.5 rounded-[4px] bg-[#050910] border border-white/10 hover:border-white/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-[3px] bg-white/[0.04] text-[#B7FF3C] shrink-0 mt-0.5 sm:mt-0">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-condensed font-black text-lg text-[#F2F6FA] uppercase tracking-wide">
                      {p.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[2px] bg-white/[0.06] text-[#91A2B4] font-mono text-[10px] tracking-wider uppercase">
                      {p.badge}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#91A2B4] mt-1 leading-relaxed max-w-xl">
                    {p.desc}
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.05]">
                <span className={`font-mono font-bold text-sm sm:text-base ${p.accentColor} block`}>
                  {p.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
