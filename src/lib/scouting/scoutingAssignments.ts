import { Player, InboxMessage } from '@/types/game';
import {
  Scout,
  ScoutAssignment,
  AssignmentDurationDays,
  ScoutingRegionId,
  ScoutingReport,
  ScoutingKnowledgeRecord,
  PlayerHiddenProfile,
} from './types';
import { generateScoutingReport } from './reportGenerator';
import { applyScoutReportKnowledge } from './scoutingKnowledge';

export interface AssignScoutInput {
  scout: Scout;
  userClubId: string;
  targetType: 'PLAYER' | 'REGION';
  targetPlayer?: Player;
  targetRegionId?: ScoutingRegionId;
  durationDays: AssignmentDurationDays;
  currentDate: string;
}

export interface AssignmentCreationResult {
  success: boolean;
  assignment?: ScoutAssignment;
  updatedScout?: Scout;
  error?: string;
}

/**
 * Creates a new scouting assignment for a scout.
 * Enforces strictly ONE active assignment per scout at a time.
 */
export function createScoutAssignment({
  scout,
  userClubId,
  targetType,
  targetPlayer,
  targetRegionId,
  durationDays,
  currentDate,
}: AssignScoutInput): AssignmentCreationResult {
  // 1. Validation: Scout must not already have an active assignment
  if (scout.activeAssignmentId) {
    return {
      success: false,
      error: `${scout.firstName} ${scout.lastName} şu anda başka bir aktif görevde bulunmaktadır. Aynı anda iki görev verilemez.`,
    };
  }

  const assignmentId = `asg-${Date.now()}-${scout.id}`;

  const assignment: ScoutAssignment = {
    id: assignmentId,
    scoutId: scout.id,
    scoutName: `${scout.firstName} ${scout.lastName}`,
    userClubId,
    targetType,
    targetPlayerId: targetPlayer?.id,
    targetPlayerName: targetPlayer ? `${targetPlayer.firstName} ${targetPlayer.lastName}` : undefined,
    targetRegionId,
    durationDays,
    daysRemaining: durationDays,
    startDate: currentDate,
    status: 'ACTIVE',
  };

  const updatedScout: Scout = {
    ...scout,
    activeAssignmentId: assignmentId,
  };

  return {
    success: true,
    assignment,
    updatedScout,
  };
}

export function createScoutingAssignment(
  scout: Scout,
  targetType: 'PLAYER' | 'REGION',
  durationDays: AssignmentDurationDays,
  currentDate: string,
  userClubId: string,
  targetPlayer?: Player,
  targetRegionId?: ScoutingRegionId
): { success: boolean; message: string; assignment?: ScoutAssignment; updatedScout?: Scout } {
  const res = createScoutAssignment({
    scout,
    userClubId,
    targetType,
    targetPlayer,
    targetRegionId,
    durationDays,
    currentDate,
  });

  if (!res.success) {
    return {
      success: false,
      message: res.error || 'Gözlem görevi başlatılamadı.',
    };
  }

  return {
    success: true,
    message: `${scout.firstName} ${scout.lastName}, ${targetPlayer ? targetPlayer.firstName + ' ' + targetPlayer.lastName : 'bölge'} için ${durationDays} günlük gözlem görevine başladı.`,
    assignment: res.assignment,
    updatedScout: res.updatedScout,
  };
}

export interface DailyScoutingProcessingResult {
  updatedAssignments: ScoutAssignment[];
  updatedScouts: Scout[];
  newReports: ScoutingReport[];
  updatedKnowledgeMap: Record<string, ScoutingKnowledgeRecord>;
  newInboxMessages: InboxMessage[];
}

/**
 * Processes daily progression of all active scouting assignments during career loop.
 */
export function processDailyScoutingAssignments(
  assignments: ScoutAssignment[],
  scouts: Scout[],
  players: Player[],
  knowledgeMap: Record<string, ScoutingKnowledgeRecord>,
  hiddenProfiles: Record<string, PlayerHiddenProfile>,
  currentDate: string,
  userClubId: string
): DailyScoutingProcessingResult {
  const updatedAssignments: ScoutAssignment[] = [];
  const updatedScouts: Scout[] = [...scouts];
  const newReports: ScoutingReport[] = [];
  const updatedKnowledgeMap: Record<string, ScoutingKnowledgeRecord> = { ...knowledgeMap };
  const newInboxMessages: InboxMessage[] = [];

  for (const asg of assignments) {
    if (asg.status !== 'ACTIVE') {
      updatedAssignments.push(asg);
      continue;
    }

    const remaining = asg.daysRemaining - 1;

    if (remaining <= 0) {
      // Assignment Completed!
      const completedAsg: ScoutAssignment = {
        ...asg,
        daysRemaining: 0,
        completedDate: currentDate,
        status: 'COMPLETED',
      };
      updatedAssignments.push(completedAsg);

      // Free the assigned scout
      const scoutIdx = updatedScouts.findIndex((s) => s.id === asg.scoutId);
      if (scoutIdx !== -1) {
        updatedScouts[scoutIdx] = {
          ...updatedScouts[scoutIdx],
          activeAssignmentId: undefined,
        };
      }

      // If it was a player assignment, generate report and boost knowledge
      if (asg.targetType === 'PLAYER' && asg.targetPlayerId) {
        const player = players.find((p) => p.id === asg.targetPlayerId);
        const scout = scouts.find((s) => s.id === asg.scoutId);

        if (player && scout) {
          const report = generateScoutingReport(
            player,
            scout,
            asg.durationDays,
            currentDate,
            hiddenProfiles[player.id]
          );
          newReports.push(report);

          // Update Knowledge Record
          const existingKnowledge = updatedKnowledgeMap[player.id] || {
            userClubId,
            playerId: player.id,
            knowledgeLevel: 1,
            percentage: 20,
            lastObservedDate: currentDate,
            isDiscovered: true,
          };

          updatedKnowledgeMap[player.id] = applyScoutReportKnowledge(
            existingKnowledge,
            scout,
            asg.durationDays,
            currentDate
          );

          // Generate Inbox Notification
          const msg: InboxMessage = {
            id: `msg-scout-${Date.now()}-${player.id}`,
            clubId: userClubId,
            senderName: `${scout.firstName} ${scout.lastName}`,
            senderRole: 'Gözlemci (Scout)',
            subject: `Gözlem Raporu Hazır: ${player.firstName} ${player.lastName}`,
            preview: `${player.firstName} ${player.lastName} için ${asg.durationDays} günlük inceleme tamamlandı. Tavsiye: ${report.recommendation}`,
            body: `Sayın Menajer,\n\n${asg.durationDays} günlük gözlem görevim sonucunda ${player.firstName} ${player.lastName} (${player.position}) hakkındaki detaylı scout raporumu tamamladım.\n\nTahmini Yetenek: ${report.estimatedOverallMin}–${report.estimatedOverallMax}\nTahmini Potansiyel: ${report.estimatedPotentialMin}–${report.estimatedPotentialMax}\nGözlemci Tavsiyesi: ${report.recommendation}\nRapor Güveni: %${report.confidence}\n\nDetaylı verileri Gözlem Merkezi ve Oyuncu Profilinden inceleyebilirsiniz.`,
            date: currentDate,
            category: 'SCOUTING',
            isRead: false,
            priority: report.recommendation === 'Kesinlikle Önerilir' ? 'HIGH' : 'NORMAL',
            actionable: true,
            actionType: 'VIEW_PLAYER',
          };
          newInboxMessages.push(msg);
        }
      }
    } else {
      // Still active
      updatedAssignments.push({
        ...asg,
        daysRemaining: remaining,
      });
    }
  }

  return {
    updatedAssignments,
    updatedScouts,
    newReports,
    updatedKnowledgeMap,
    newInboxMessages,
  };
}

export function cancelScoutingAssignment(
  assignments: ScoutAssignment[],
  scouts: Scout[],
  assignmentId: string
): { updatedAssignments: ScoutAssignment[]; updatedScouts: Scout[] } {
  const target = assignments.find((a) => a.id === assignmentId);
  const updatedAssignments = assignments.map((a) =>
    a.id === assignmentId ? { ...a, status: 'CANCELLED' as const } : a
  );
  const updatedScouts = target
    ? scouts.map((s) => (s.id === target.scoutId ? { ...s, activeAssignmentId: undefined } : s))
    : scouts;

  return { updatedAssignments, updatedScouts };
}

