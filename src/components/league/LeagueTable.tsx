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
      W: { label: 'W', bg: 'bg-[#65ff83]/20 text-[#65ff83] border-[#65ff83]/40' },
      D: { label: 'D', bg: 'bg-[#ffd34f]/20 text-[#ffd34f] border-[#ffd34f]/40' },
      L: { label: 'L', bg: 'bg-[#ff5365]/20 text-[#ff5365] border-[#ff5365]/40' },
    }[form] || { label: 'W', bg: 'bg-[#65ff83]/20 text-[#65ff83] border-[#65ff83]/40' };

    return (
      <span
        key={index}
        className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-[2px] font-ibm text-[10px] font-black border ${config.bg}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-[8px] border border-white/10 bg-[#090d0a] shadow-2xl">
      <table className="w-full text-left border-collapse min-w-[700px] font-ibm text-[12px]">
        <thead>
          <tr className="border-b border-white/10 bg-[#0c120e] text-[10px] text-[#8f9a91] font-bold uppercase tracking-widest">
            <th className="py-3 px-3 text-center w-12">#</th>
            <th className="py-3 px-4">CLUB</th>
            <th className="py-3 px-3 text-center w-10">P</th>
            <th className="py-3 px-3 text-center w-10">W</th>
            <th className="py-3 px-3 text-center w-10">D</th>
            <th className="py-3 px-3 text-center w-10">L</th>
            <th className="py-3 px-3 text-center w-10">GF</th>
            <th className="py-3 px-3 text-center w-10">GA</th>
            <th className="py-3 px-3 text-center w-12">GD</th>
            <th className="py-3 px-4 text-center w-16 text-[#f3f6f3] bg-[#0d130f]">PTS</th>
            <th className="py-3 px-4 text-center">FORM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {displayStandings.map((item, index) => {
            const club = getClub(item.clubId);
            const isUserClub = item.clubId === userClubId;
            const rank = index + 1;

            // Subtle highlights & relegation markers
            let rankBorder = 'border-l-4 border-transparent';
            if (isUserClub) {
              rankBorder = 'border-l-4 border-[#b8ff3d] bg-[#b8ff3d]/15 text-[#f3f6f3] font-bold';
            } else if (rank === 1) {
              rankBorder = 'border-l-4 border-[#ffd34f] bg-[#ffd34f]/5';
            } else if (rank <= 3) {
              rankBorder = 'border-l-4 border-[#21dfbd] bg-[#21dfbd]/5';
            } else if (rank >= displayStandings.length - 1) {
              rankBorder = 'border-l-4 border-[#ff5365] bg-[#ff5365]/5';
            }

            return (
              <tr
                key={item.clubId}
                className={`transition-colors hover:bg-white/[0.03] ${rankBorder}`}
              >
                {/* # Rank */}
                <td className="py-3 px-3 text-center font-bold">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-[2px] text-[11px] ${
                      isUserClub
                        ? 'bg-[#b8ff3d] text-[#050806] font-extrabold shadow-[0_0_8px_#b8ff3d]'
                        : rank === 1
                        ? 'text-[#ffd34f] font-bold'
                        : rank <= 3
                        ? 'text-[#21dfbd] font-bold'
                        : rank >= displayStandings.length - 1
                        ? 'text-[#ff5365] font-bold'
                        : 'text-[#8f9a91]'
                    }`}
                  >
                    {rank}
                  </span>
                </td>

                {/* CLUB */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {club && (
                      <ClubBadge
                        code={club.code}
                        name={club.name}
                        clubId={club.id}
                        primaryColor={club.primaryColor}
                        secondaryColor={club.secondaryColor}
                        size="xs"
                      />
                    )}
                    <span
                      className={`font-barlow font-bold text-[16px] uppercase tracking-wide truncate ${
                        isUserClub ? 'text-[#b8ff3d]' : 'text-[#f3f6f3]'
                      }`}
                    >
                      {club?.name || item.clubId}
                    </span>
                    {isUserClub && (
                      <span className="px-1.5 py-0.2 rounded bg-[#b8ff3d] text-[#050806] font-ibm font-black text-[9px] uppercase">
                        SEN
                      </span>
                    )}
                  </div>
                </td>

                {/* P, W, D, L, GF, GA, GD, PTS */}
                <td className="py-3 px-3 text-center text-[#8f9a91]">{item.played}</td>
                <td className="py-3 px-3 text-center text-[#f3f6f3]">{item.won}</td>
                <td className="py-3 px-3 text-center text-[#8f9a91]">{item.drawn}</td>
                <td className="py-3 px-3 text-center text-[#8f9a91]">{item.lost}</td>
                <td className="py-3 px-3 text-center text-[#8f9a91]">{item.goalsFor}</td>
                <td className="py-3 px-3 text-center text-[#8f9a91]">{item.goalsAgainst}</td>
                <td className="py-3 px-3 text-center text-[#21dfbd] font-semibold">
                  {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
                </td>
                <td className="py-3 px-4 text-center font-barlow font-extrabold text-[17px] text-[#f3f6f3] bg-[#0c120e]">
                  {item.points}
                </td>

                {/* FORM */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(item.form || ['W', 'W', 'D', 'W', 'L']).slice(-5).map((f, i) => getFormPill(f as any, i))}
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
