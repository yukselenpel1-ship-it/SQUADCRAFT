import { Player, InboxMessage } from '@/types/game';
import { YouthPlayer } from './types';
import { NewsItem } from '../career/types';

/**
 * Promotes a youth player to the senior team.
 * Retains player identity, career history, attributes, and potential without duplicating objects.
 */
export function promoteYouthPlayerToSenior(
  youthPlayer: YouthPlayer,
  param2: string,
  param3: string
): {
  seniorPlayer: Player;
  promotedPlayer: Player;
  inboxMessage: InboxMessage;
  newsItem: NewsItem;
} {
  // Determine which parameter is date and which is userClubId
  const isParam2Date = param2.includes('-') && param2.length === 10;
  const currentDate = isParam2Date ? param2 : param3;
  const userClubId = isParam2Date ? param3 : param2;

  const baseSeniorWage = Math.max(1500, Math.round((youthPlayer.overall * 120) / 100) * 100);
  const currYear = parseInt(currentDate.split('-')[0], 10) || 2026;

  const seniorPlayer: Player = {
    ...youthPlayer,
    clubId: userClubId,
    wage: baseSeniorWage,
    squadRole: 'Genç Oyuncu',
    contractUntil: `${currYear + 3}-06-30`,
  };

  (seniorPlayer as any).contractStatus = 'PROFESYONEL';
  (seniorPlayer as any).isAcademyGraduate = true;

  const inboxMessage: InboxMessage = {
    id: `msg-promote-${Date.now()}-${youthPlayer.id}`,
    clubId: userClubId,
    senderName: 'Akademi Direktörü',
    senderRole: 'Altyapı Sorumlusu',
    subject: `A Takıma Yükseltildi: ${youthPlayer.firstName} ${youthPlayer.lastName}`,
    preview: `${youthPlayer.firstName} ${youthPlayer.lastName} resmi olarak A Takım kadrosuna dahil edildi.`,
    body: `Sayın Menajer,\n\nAkademimizden yetişen ${youthPlayer.firstName} ${youthPlayer.lastName} (${youthPlayer.position}, ${youthPlayer.age} Yaş) A Takım kadrosuna yükseltilmiştir.\n\nYeni Haftalık Maaş: €${baseSeniorWage.toLocaleString('tr-TR')}\nKadro Rolü: Genç Oyuncu\nSözleşme Bitiş: ${seniorPlayer.contractUntil}\n\nOyuncumuz artık taktik kadronuzda ve maç kadrolarında yer alabilir.`,
    date: currentDate,
    category: 'TRAINING',
    isRead: false,
    priority: 'NORMAL',
    actionable: true,
    actionType: 'VIEW_SQUAD',
  };

  const newsItem: NewsItem = {
    id: `news-promo-${Date.now()}-${youthPlayer.id}`,
    date: currentDate,
    category: 'TRAINING',
    headline: `GENÇ YETENEK: ${youthPlayer.firstName} ${youthPlayer.lastName} A Takımda!`,
    content: `Kulüp akademisinden yetişen ${youthPlayer.age} yaşındaki ${youthPlayer.position} ${youthPlayer.firstName} ${youthPlayer.lastName} profesyonel sözleşmeye imza atarak A Takım kadrosuna dahil edildi.`,
    importance: youthPlayer.potential >= 80 ? 'HIGH' : 'NORMAL',
    clubId: userClubId,
    playerId: youthPlayer.id,
  };

  return {
    seniorPlayer,
    promotedPlayer: seniorPlayer,
    inboxMessage,
    newsItem,
  };
}
