import { Club, InboxMessage } from '@/types/game';
import { YouthAcademyFacility, YouthIntakeBatch, YouthPlayer } from './types';
import { generateSingleYouthProspect } from './youthGenerator';

/**
 * Generates the annual youth intake batch for a club on March 15th.
 */
export function generateAnnualYouthIntake(
  club: Club,
  facility: YouthAcademyFacility,
  currentDate: string,
  seasonYear: string
): { intakeBatch: YouthIntakeBatch; inboxMessage: InboxMessage } {
  // Generate 8 to 14 players based on academy recruitment
  const count = 8 + (facility.academyLevel % 7);
  const players: YouthPlayer[] = [];

  for (let i = 0; i < count; i++) {
    players.push(
      generateSingleYouthProspect(
        i,
        club.id,
        facility.academyLevel,
        facility.youthRecruitmentNetwork,
        seasonYear
      )
    );
  }

  const topProspect = [...players].sort((a, b) => b.potential - a.potential)[0];

  const intakeSummary = `Akademi Direktörü Raporu: ${seasonYear} dönemi için ${players.length} genç oyuncu akademimize katıldı. En çok dikkat çeken isim: ${topProspect.firstName} ${topProspect.lastName} (${topProspect.position}, Tahmini Potansiyel: ${topProspect.estimatedPotentialRange[0]}–${topProspect.estimatedPotentialRange[1]}).`;

  const intakeBatch: YouthIntakeBatch = {
    id: `intake-${Date.now()}-${club.id}`,
    date: currentDate,
    seasonYear,
    clubId: club.id,
    players,
    intakeSummary,
  };

  const inboxMessage: InboxMessage = {
    id: `msg-intake-${Date.now()}-${club.id}`,
    clubId: club.id,
    senderName: 'Akademi Direktörü',
    senderRole: 'Altyapı Sorumlusu',
    subject: `Yıllık Genç Yetenek Alımı Tamamlandı (${seasonYear})`,
    preview: `${players.length} yeni genç oyuncu kulübümüz akademisine katıldı. Öne çıkan: ${topProspect.firstName} ${topProspect.lastName}`,
    body: `Sayın Menajer,\n\nKulübümüzün yıllık altyapı seçmeleri tamamlanmış olup ${players.length} yetenekli genç futbolcu akademi kadromuza dahil edilmiştir.\n\nÖne Çıkan İsim: ${topProspect.firstName} ${topProspect.lastName} (${topProspect.position}, ${topProspect.age} Yaş)\nTahmini Potansiyel: ${topProspect.estimatedPotentialRange[0]}–${topProspect.estimatedPotentialRange[1]}\nGözlem Notu: ${topProspect.scoutOpinion}\n\nGenç oyuncularımızın gelişimlerini Akademi sekmesinden takip edebilir, hazır hissettiklerinizi A Takıma yükseltebilirsiniz.`,
    date: currentDate,
    category: 'TRAINING',
    isRead: false,
    priority: 'HIGH',
    actionable: true,
    actionType: 'VIEW_ACADEMY',
  };

  return { intakeBatch, inboxMessage };
}
