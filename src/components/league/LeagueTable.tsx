import React from 'react';
import { LeagueStanding, Club } from '@/types/game';
import { ClubBadge } from '@/components/ui/ClubBadge';

interface LeagueTableProps {
  standings: LeagueStanding[];
  clubs: Club[];
  userClubId?: string;
  limit?: number;
}

export const LeagueTable: React.FC<LeagueTableProps> = ({ standings, clubs, userClubId, limit }) => {
  const displayStandings = limit ? standings.slice(0, limit) : standings;
  const getClub = (id: string) => clubs.find(c => c.id === id);
  const formColor: Record<string,string> = {
    W: 'bg-[#e1edde] text-[#315c38]',
    D: 'bg-[#f1e7cb] text-[#725a23]',
    L: 'bg-[#f4dad7] text-[#922e30]',
  };
  return (
    <div className="w-full overflow-x-auto border border-[#d5c9b9] bg-[#fffaf2]">
      <table className="w-full min-w-[720px] border-collapse text-left font-ibm text-[12px] tabular-nums">
        <thead>
          <tr className="bg-[#ded2c3] border-b-2 border-[#5c4b40] text-[#322922] uppercase text-[11px] tracking-wide">
            <th scope="col" className="p-3 text-center w-12">#</th>
            <th scope="col" className="p-3 min-w-[190px]">KULÜP</th>
            <th scope="col" className="p-3 text-center">O</th>
            <th scope="col" className="p-3 text-center">G</th>
            <th scope="col" className="p-3 text-center">B</th>
            <th scope="col" className="p-3 text-center">M</th>
            <th scope="col" className="p-3 text-center">AG</th>
            <th scope="col" className="p-3 text-center">YG</th>
            <th scope="col" className="p-3 text-center">AV</th>
            <th scope="col" className="p-3 text-center font-black">PUAN</th>
            <th scope="col" className="p-3 text-center">FORM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dfd5c8]">
          {displayStandings.map((item, index) => {
            const club=getClub(item.clubId);
            const mine=item.clubId===userClubId;
            const rank=index+1;
            const border=mine?'border-[#9b2529]':rank===1?'border-[#b58b36]':rank<=3?'border-[#52978c]':rank>=displayStandings.length-1?'border-[#b65c60]':'border-transparent';
            return (
              <tr key={item.clubId} className={`border-l-4 ${border} ${mine?'bg-[#f3e0d9]':'hover:bg-[#f4eee5]'} text-[#181818] transition-colors`}>
                <td className="p-3 text-center font-bold text-[#202020]">{rank}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {club && <ClubBadge code={club.code} name={club.name} clubId={club.id} primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} size="xs"/>}
                    <span className="font-barlow font-extrabold uppercase text-[16px] tracking-wide text-[#111111]">{club?.name || item.clubId}</span>
                    {mine && <span className="shrink-0 bg-[#9b2529] px-2 py-1 text-[10px] font-black text-white">SEN</span>}
                  </div>
                </td>
                <td className="p-3 text-center">{item.played}</td>
                <td className="p-3 text-center">{item.won}</td>
                <td className="p-3 text-center">{item.drawn}</td>
                <td className="p-3 text-center">{item.lost}</td>
                <td className="p-3 text-center">{item.goalsFor}</td>
                <td className="p-3 text-center">{item.goalsAgainst}</td>
                <td className="p-3 text-center font-semibold">{item.goalDifference>0?`+${item.goalDifference}`:item.goalDifference}</td>
                <td className="p-3 text-center bg-[#eee5d9] font-barlow font-black text-lg text-[#171717]">{item.points}</td>
                <td className="p-3"><div className="flex items-center justify-center gap-1">
                  {(item.form || []).slice(-5).map((form,i)=><span key={i} title={form==='W'?'Galibiyet':form==='D'?'Beraberlik':'Mağlubiyet'} className={`w-5 h-5 flex items-center justify-center font-bold text-[10px] ${formColor[form] || 'bg-[#e5dfd7] text-[#333]'}`}>{form}</span>)}
                  {!item.form?.length && <span className="text-[#766e67]">—</span>}
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
