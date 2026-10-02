import React from 'react';
import { LeagueStanding, Club } from '@/types/game';
import { ClubBadge } from '@/components/ui/ClubBadge';

interface LeagueTableProps {
  standings: LeagueStanding[];
  clubs: Club[];
  userClubId?: string;
  limit?: number;
}

export const LeagueTable: React.FC<LeagueTableProps> = ({
  standings,
  clubs,
  userClubId = 'kalyon-doruk',
  limit,
}) => {
  const displayStandings = limit ? standings.slice(0, limit) : standings;

  const getClub = (id: string) => clubs.find((c) => c.id === id);

  const getFormPill = (form: 'W' | 'D' | 'L', index: number) => {
    const config = {
      W: { label: 'G', bg: 'bg-[#C7FF38]/20 text-[#C7FF38] border-[#C7FF38]/40' },
      D: { label: 'B', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
      L: { label: 'M', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
    }[form];

    return (
      <span
        key={index}
        className={`inline-flex items-center justify-center w-5 h-5 font-mono text-[10px] font-black border ${config.bg}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto border border-zinc-850 bg-[#080D1A] shadow-2xl">
      <table className="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
            <th className="py-3 px-3 text-center w-12"># POS</th>
            <th className="py-3 px-4">KULÜP</th>
            <th className="py-3 px-3 text-center w-10">O</th>
            <th className="py-3 px-3 text-center w-10">G</th>
            <th className="py-3 px-3 text-center w-10">B</th>
            <th className="py-3 px-3 text-center w-10">M</th>
            <th className="py-3 px-3 text-center w-10">A</th>
            <th className="py-3 px-3 text-center w-10">Y</th>
            <th className="py-3 px-3 text-center w-12">AV</th>
            <th className="py-3 px-4 text-center w-14 text-white bg-zinc-900/60">P</th>
            <th className="py-3 px-4 text-center hidden md:table-cell">FORM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
          {displayStandings.map((item, index) => {
            const club = getClub(item.clubId);
            const isUserClub = item.clubId === userClubId;
            const rank = index + 1;

            // Position qualification markers
            let rankBorder = 'border-l-2 border-transparent';
            if (rank === 1) rankBorder = 'border-l-4 border-[#C7FF38]'; // Kıtasal Şampiyona
            else if (rank <= 3) rankBorder = 'border-l-4 border-[#4FE4FF]'; // Kıtasal Eleme
            else if (rank >= 9) rankBorder = 'border-l-4 border-rose-500'; // Relegation

            return (
              <tr
                key={item.clubId}
                className={`transition-colors ${rankBorder} ${
                  isUserClub
                    ? 'bg-[#C7FF38]/10 hover:bg-[#C7FF38]/15'
                    : 'hover:bg-zinc-900/70'
                }`}
              >
                {/* Rank Number */}
                <td className="py-3 px-3 text-center font-mono font-black">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-black ${
                      rank === 1
                        ? 'bg-[#C7FF38] text-black border border-white'
                        : rank <= 3
                        ? 'bg-[#4FE4FF]/20 text-[#4FE4FF] border border-[#4FE4FF]/40'
                        : rank >= 9
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'text-zinc-400 font-mono'
                    }`}
                  >
                    {rank}
                  </span>
                </td>

                {/* Club Crest & Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {club && (
                      <ClubBadge
                        code={club.code}
                        primaryColor={club.primaryColor}
                        secondaryColor={club.secondaryColor}
                        size="xs"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-tight">
                          {club ? club.name : item.clubId}
                        </span>
                        {isUserClub && (
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 bg-[#C7FF38] text-black border border-white">
                            KULÜBÜNÜZ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{club?.city || 'Şehir'}</span>
                    </div>
                  </div>
                </td>

                {/* Match Stats */}
                <td className="py-3 px-3 text-center font-mono text-zinc-300">{item.played}</td>
                <td className="py-3 px-3 text-center font-mono text-zinc-300">{item.won}</td>
                <td className="py-3 px-3 text-center font-mono text-zinc-300">{item.drawn}</td>
                <td className="py-3 px-3 text-center font-mono text-zinc-300">{item.lost}</td>
                <td className="py-3 px-3 text-center font-mono text-zinc-400">{item.goalsFor}</td>
                <td className="py-3 px-3 text-center font-mono text-zinc-400">{item.goalsAgainst}</td>
                <td
                  className={`py-3 px-3 text-center font-mono font-bold ${
                    item.goalDifference > 0
                      ? 'text-[#C7FF38]'
                      : item.goalDifference < 0
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
                </td>

                {/* Points */}
                <td className="py-3 px-4 text-center font-mono font-black text-sm text-white bg-zinc-900/40">
                  {item.points}
                </td>

                {/* Recent Form */}
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {item.form.slice(-5).map((f, i) => getFormPill(f, i))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
