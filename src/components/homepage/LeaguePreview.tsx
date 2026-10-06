'use client';

import React from 'react';
import { Trophy, Calendar } from 'lucide-react';

export function LeaguePreview() {
  const standings = [
    { pos: 1, club: 'NORTHSTAR CITY', p: 12, w: 9, d: 2, l: 1, gd: '+18', pts: 29, isUser: true },
    { pos: 2, club: 'IRONVALE ATHLETIC', p: 12, w: 8, d: 3, l: 1, gd: '+14', pts: 27 },
    { pos: 3, club: 'RAVENPORT FC', p: 12, w: 7, d: 2, l: 3, gd: '+10', pts: 23 },
    { pos: 4, club: 'WESTHAVEN UNITED', p: 12, w: 6, d: 3, l: 3, gd: '+6', pts: 21 },
    { pos: 5, club: 'EMBER FC', p: 12, w: 6, d: 2, l: 4, gd: '+4', pts: 20 },
    { pos: 6, club: 'KINGSPORT 04', p: 12, w: 5, d: 3, l: 4, gd: '+2', pts: 18 },
  ];

  const fixtures = [
    { home: 'NORTHSTAR', away: 'IRONVALE', score: '2 — 1', status: '84\' LIVE' },
    { home: 'RAVENPORT', away: 'WESTHAVEN', score: '0 — 0', status: 'FT' },
    { home: 'EMBER FC', away: 'KINGSPORT 04', score: 'VS', status: 'SAT 21:00' },
    { home: 'REDMONT', away: 'ATLAS BOROUGH', score: 'VS', status: 'SUN 16:30' },
  ];

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.2em] uppercase font-semibold">
            BROADCAST DATA
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            LEAGUE TABLE & FIXTURES
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            Track championship races, continental qualification zones, and weekly fixtures.
          </p>
        </div>

        {/* 2 Columns: Table (7 cols) + Fixtures (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* League Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#090d0a] border border-white/10 rounded-[8px] p-6 shadow-xl overflow-x-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#b7ff35]" />
                <span className="font-barlow font-extrabold text-[20px] text-[#f2f5f2] tracking-wider uppercase">
                  DIVISION ONE TABLE
                </span>
              </div>
              <span className="font-ibm text-[11px] text-[#b7ff35]">CHAMPIONSHIP ZONE (1–2)</span>
            </div>

            <table className="w-full text-left font-ibm text-[12px]">
              <thead>
                <tr className="border-b border-white/10 text-[#8b958d] pb-2">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">CLUB</th>
                  <th className="py-2.5 px-2 text-center">P</th>
                  <th className="py-2.5 px-2 text-center">W</th>
                  <th className="py-2.5 px-2 text-center">D</th>
                  <th className="py-2.5 px-2 text-center">L</th>
                  <th className="py-2.5 px-2 text-center">GD</th>
                  <th className="py-2.5 px-3 text-right">PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr
                    key={row.club}
                    className={`border-b border-white/5 transition-colors ${
                      row.isUser
                        ? 'bg-[#b7ff35]/10 border-l-4 border-l-[#b7ff35] text-[#f2f5f2] font-semibold'
                        : 'hover:bg-white/5 text-[#8b958d]'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className={row.pos <= 2 ? 'text-[#b7ff35] font-bold' : ''}>
                        {row.pos}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-barlow font-bold text-[16px] text-[#f2f5f2] tracking-wide">
                      {row.club}
                    </td>
                    <td className="py-3 px-2 text-center">{row.p}</td>
                    <td className="py-3 px-2 text-center">{row.w}</td>
                    <td className="py-3 px-2 text-center">{row.d}</td>
                    <td className="py-3 px-2 text-center">{row.l}</td>
                    <td className="py-3 px-2 text-center text-[#17e5c2]">{row.gd}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#f2f5f2] text-[14px]">
                      {row.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fixtures Timeline (5 cols) */}
          <div className="lg:col-span-5 bg-[#090d0a] border border-white/10 rounded-[8px] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#17e5c2]" />
                <span className="font-barlow font-extrabold text-[20px] text-[#f2f5f2] tracking-wider uppercase">
                  MATCHDAY 13 TIMELINE
                </span>
              </div>
              <span className="font-ibm text-[11px] text-[#17e5c2]">CURRENT ROUND</span>
            </div>

            <div className="space-y-3 font-ibm">
              {fixtures.map((fix, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[4px] bg-white/5 border border-white/5 flex items-center justify-between hover:border-[#b7ff35]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-barlow font-bold text-[16px] text-[#f2f5f2] min-w-[90px] text-right">
                      {fix.home}
                    </span>
                    <span className="font-barlow font-extrabold text-[16px] px-2.5 py-1 rounded bg-[#050806] text-[#b7ff35] border border-white/10">
                      {fix.score}
                    </span>
                    <span className="font-barlow font-bold text-[16px] text-[#f2f5f2] min-w-[90px]">
                      {fix.away}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      fix.status.includes('LIVE')
                        ? 'bg-[#ff4d5f]/15 text-[#ff4d5f] animate-pulse'
                        : fix.status === 'FT'
                        ? 'bg-white/10 text-[#8b958d]'
                        : 'bg-[#17e5c2]/15 text-[#17e5c2]'
                    }`}
                  >
                    {fix.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
