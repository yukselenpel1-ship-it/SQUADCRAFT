'use client';

import React, { useState } from 'react';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { Search, Check, Wallet, Activity, Award } from 'lucide-react';

interface ClubItem {
  id: string;
  name: string;
  code: string;
  city: string;
  transferBudget: number;
  reputation: number;
  primaryColor: string;
  secondaryColor: string;
}

interface Step3Props {
  clubs: ClubItem[];
  selectedClubId: string;
  setSelectedClubId: (id: string) => void;
  clubStatsMap: Record<string, { avgOverall: number; avgAge: number; starPlayer?: any }>;
}

export function StepClubSelection({
  clubs,
  selectedClubId,
  setSelectedClubId,
  clubStatsMap,
}: Step3Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Step Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#B7FF3C] tracking-[0.2em] uppercase font-semibold">
            ADIM 03 // KULÜP SEÇİMİ ({clubs.length} KULÜP MEVCUT)
          </span>
          <h2 className="font-condensed font-black text-3xl sm:text-4xl text-[#F2F6FA] uppercase tracking-wide leading-none mt-1.5">
            YÖNETECEĞİN KULÜBÜ SEÇ
          </h2>
          <p className="font-sans text-sm text-[#91A2B4] mt-1.5 max-w-xl">
            Her kulübün bütçesi, kadro kalitesi ve yönetim hedefleri farklıdır.
          </p>
        </div>

        {/* Club Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8B9E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kulüp veya şehir ara..."
            className="w-full bg-[#050910] border border-white/10 focus:border-[#B7FF3C] pl-9 pr-3 py-2 rounded-[3px] text-xs font-sans text-[#F2F6FA] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Responsive Club Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredClubs.map((club) => {
          const isSelected = selectedClubId === club.id;
          const stats = clubStatsMap[club.id] || { avgOverall: 75, avgAge: 25 };

          return (
            <div
              key={club.id}
              onClick={() => setSelectedClubId(club.id)}
              className={`p-3.5 rounded-[4px] border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#B7FF3C]/10 border-[#B7FF3C] shadow-[0_4px_20px_rgba(183,255,60,0.22)]'
                  : 'bg-[#050910] border-white/10 hover:border-white/20 hover:bg-[#070D14]'
              }`}
            >
              {/* Club Header */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <ClubBadge
                    code={club.code}
                    name={club.name}
                    clubId={club.id}
                    primaryColor={club.primaryColor}
                    secondaryColor={club.secondaryColor}
                    size="md"
                  />
                  <div className="truncate">
                    <span className="font-condensed font-black text-lg text-[#F2F6FA] uppercase block leading-tight truncate">
                      {club.name}
                    </span>
                    <span className="font-mono text-xs text-[#7A8B9E] block">
                      {club.city}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[#B7FF3C] text-[#070D14] flex items-center justify-center shrink-0">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Club Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[#7A8B9E] block">GÜÇ</span>
                  <span className="font-bold text-[#F2F6FA]">{stats.avgOverall} OVR</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8B9E] block">BÜTÇE</span>
                  <span className="font-bold text-[#B7FF3C]">
                    €{(club.transferBudget / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8B9E] block">İTİBAR</span>
                  <span className="font-bold text-[#FFC84A]">%{club.reputation}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredClubs.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#7A8B9E] font-sans text-sm">
            Arama kriterine uygun kulüp bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
