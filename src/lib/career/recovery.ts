import { Player } from '@/types/game';
import { TrainingIntensity } from './types';

export function processDailyPlayerRecovery(
  player: Player,
  trainingIntensity: TrainingIntensity = 'Normal'
): Player {
  // If injured, fitness recovery is handled by injury recovery protocol
  if (player.isInjured) {
    const sharpness = Math.max(20, (player.matchSharpness || 75) - 1.2);
    return {
      ...player,
      matchSharpness: Math.round(sharpness),
    };
  }

  const stamina = player.attributes?.stamina || 70;
  const age = player.age || 25;

  // Base daily recovery amount: ~6 to 10 points
  let dailyGain = 7.0;

  // Stamina bonus: stamina 90 -> +1.5, stamina 50 -> -1.5
  dailyGain += ((stamina - 70) / 20) * 1.5;

  // Age factor: players over 30 recover slightly slower
  if (age >= 31) {
    dailyGain -= (age - 30) * 0.45;
  }

  // Training intensity modifier
  if (trainingIntensity === 'Hafif') {
    dailyGain *= 1.30;
  } else if (trainingIntensity === 'Yoğun') {
    dailyGain *= 0.75; // More fatiguing
  }

  const newFitness = Math.min(100, Math.max(30, (player.fitness || 90) + dailyGain));

  // Match Sharpness update
  let currentSharpness = player.matchSharpness ?? 80;
  if (trainingIntensity === 'Yoğun') {
    currentSharpness = Math.min(100, currentSharpness + 1.8);
  } else if (trainingIntensity === 'Normal') {
    currentSharpness = Math.min(100, currentSharpness + 0.8);
  } else {
    // Hafif training sharpness decays slightly if no matches
    currentSharpness = Math.max(30, currentSharpness - 0.4);
  }

  return {
    ...player,
    fitness: Math.round(newFitness),
    matchSharpness: Math.round(currentSharpness),
  };
}
