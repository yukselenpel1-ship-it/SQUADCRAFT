import { Player, InboxMessage } from '@/types/game';

export interface DailyInjuryResult {
  updatedPlayer: Player;
  recoveredMessage?: InboxMessage;
}

export function processDailyPlayerInjury(
  player: Player,
  currentDate: string,
  userClubId: string
): DailyInjuryResult {
  if (!player.isInjured || !player.injuryDetails) {
    return { updatedPlayer: player };
  }

  const remaining = player.injuryDetails.daysRemaining - 1;

  if (remaining <= 0) {
    // Player has recovered!
    const updatedPlayer: Player = {
      ...player,
      isInjured: false,
      injuryDetails: undefined,
      fitness: Math.max(78, player.fitness || 75),
    };

    let recoveredMessage: InboxMessage | undefined;
    if (player.clubId === userClubId) {
      recoveredMessage = {
        id: `msg-rec-${Date.now()}-${player.id}`,
        clubId: userClubId,
        senderName: 'Dr. Selçuk Tan',
        senderRole: 'Baş Fizyoterapist',
        subject: `Sakatlık İyileşti: ${player.firstName} ${player.lastName}`,
        preview: `${player.firstName} ${player.lastName} antrenmanlara döndü ve maç kadrosunda yer alabilir.`,
        body: `Sayın Menajer,\n\n${player.firstName} ${player.lastName} (${player.position}) rehabilitasyon sürecini başarıyla tamamlamış olup takımla birlikte tam antrenmanlara başlamıştır.\n\nSağlık heyetimiz oyuncunun fiziksel durumunun maç kadrosuna girmeye uygun olduğunu onaylamıştır.\n\nDr. Selçuk Tan\nSağlık Kurulu Başkanı`,
        date: currentDate,
        category: 'INJURY',
        isRead: false,
        priority: 'NORMAL',
        actionable: true,
        actionType: 'VIEW_SQUAD',
      };
    }

    return { updatedPlayer, recoveredMessage };
  }

  return {
    updatedPlayer: {
      ...player,
      injuryDetails: {
        ...player.injuryDetails,
        daysRemaining: remaining,
      },
    },
  };
}
