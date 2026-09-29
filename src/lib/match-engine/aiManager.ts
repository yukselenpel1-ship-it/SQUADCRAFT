import { MatchTeamRuntime, MatchEngineEvent } from './types';
import { performSubstitution } from './substitutions';
import { computeTacticalModifiers } from './tacticalEffects';
import { calculateTeamRatings } from './teamStrength';

export function runAIManagerDecisions(
  minute: number,
  aiTeam: MatchTeamRuntime,
  opponentTeam: MatchTeamRuntime,
  isAIHome: boolean,
  currentScoreHome: number,
  currentScoreAway: number
): MatchEngineEvent[] {
  const events: MatchEngineEvent[] = [];

  const aiScore = isAIHome ? currentScoreHome : currentScoreAway;
  const opponentScore = isAIHome ? currentScoreAway : currentScoreHome;
  const scoreDiff = aiScore - opponentScore; // >0 winning, <0 losing

  // 1. Mandatory injured player substitution
  const injuredPlayer = Object.values(aiTeam.players).find(
    (p) => p.isOnPitch && p.isInjured && p.injurySeverity === 'SEVERE'
  );

  if (injuredPlayer && aiTeam.substitutionsUsed < aiTeam.maxSubstitutions) {
    const availableBench = aiTeam.benchPlayerIds
      .map((id) => aiTeam.players[id])
      .filter((p) => !p.isOnPitch && p.redCards === 0 && !p.isInjured);

    if (availableBench.length > 0) {
      // Find best position match
      const targetPos = injuredPlayer.currentPosition;
      let subIn = availableBench.find((p) => p.player.position === targetPos);
      if (!subIn) {
        subIn = availableBench.find((p) => p.player.secondaryPositions.includes(targetPos));
      }
      if (!subIn) {
        subIn = availableBench[0];
      }

      const res = performSubstitution(aiTeam, injuredPlayer.player.id, subIn.player.id, minute);
      if (res.event) {
        events.push(res.event);
      }
    }
  }

  // 2. Tactical Mentality reaction based on score and minute
  if (minute >= 70 && scoreDiff < 0 && aiTeam.tactics.mentality !== 'Hücum' && aiTeam.tactics.mentality !== 'Aşırı Hücum') {
    if (minute >= 82) {
      aiTeam.tactics.mentality = 'Aşırı Hücum';
      aiTeam.tactics.tempo = 'Çok Yüksek';
      aiTeam.tactics.pressing = 'Aşırı';
      aiTeam.tactics.defensiveLine = 'Yüksek';
    } else {
      aiTeam.tactics.mentality = 'Hücum';
      aiTeam.tactics.tempo = 'Yüksek';
      aiTeam.tactics.pressing = 'Yoğun';
    }
  } else if (minute >= 82 && scoreDiff > 0 && aiTeam.tactics.mentality !== 'Savunmacı' && aiTeam.tactics.mentality !== 'Çok Savunmacı') {
    aiTeam.tactics.mentality = 'Savunmacı';
    aiTeam.tactics.tempo = 'Düşük';
    aiTeam.tactics.defensiveLine = 'Derin';
  }

  // 3. Fitness-based tactical substitutions (between 62 and 78 min)
  if (minute >= 62 && minute <= 78 && aiTeam.substitutionsUsed < aiTeam.maxSubstitutions && Math.random() < 0.15) {
    const tiredPlayer = Object.values(aiTeam.players).find(
      (p) => p.isOnPitch && p.currentFitness < 68 && p.currentPosition !== 'GK'
    );

    if (tiredPlayer) {
      const availableBench = aiTeam.benchPlayerIds
        .map((id) => aiTeam.players[id])
        .filter((p) => !p.isOnPitch && p.redCards === 0 && !p.isInjured && p.currentFitness > 80);

      if (availableBench.length > 0) {
        const targetPos = tiredPlayer.currentPosition;
        let subIn = availableBench.find((p) => p.player.position === targetPos);
        if (!subIn) {
          subIn = availableBench.find((p) => p.player.secondaryPositions.includes(targetPos));
        }
        if (!subIn) {
          subIn = availableBench[0];
        }

        const res = performSubstitution(aiTeam, tiredPlayer.player.id, subIn.player.id, minute);
        if (res.event) {
          events.push(res.event);
        }
      }
    }
  }

  return events;
}
