import { Player } from '@/types/game';
import { TrainingIntensity } from './types';

export function processPlayerBirthday(player: Player, currentDate: string): { updatedPlayer: Player; isBirthday: boolean } {
  const [currYear, currMonth, currDay] = currentDate.split('-');
  const [, birthMonth, birthDay] = player.birthDate.split('-');

  if (currMonth === birthMonth && currDay === birthDay) {
    const newAge = Number(currYear) - Number(player.birthDate.split('-')[0]);
    return {
      updatedPlayer: {
        ...player,
        age: newAge > 0 ? newAge : player.age + 1,
      },
      isBirthday: true,
    };
  }

  return { updatedPlayer: player, isBirthday: false };
}

export function processMonthlyPlayerDevelopment(
  player: Player,
  trainingIntensity: TrainingIntensity = 'Normal'
): Player {
  const age = player.age;
  const overall = player.overall;
  const potential = player.potential;

  const newAttributes = { ...player.attributes };
  let newOverall = overall;

  // 1. Youth Growth (Age 16 - 23, with room to grow)
  if (age <= 23 && potential > overall) {
    const growthRoll = Math.random();
    const intensityBonus = trainingIntensity === 'Yoğun' ? 0.15 : trainingIntensity === 'Normal' ? 0.08 : 0.02;

    if (growthRoll < 0.35 + intensityBonus) {
      // Pick 2 key attributes to improve
      const keys = Object.keys(newAttributes) as (keyof typeof newAttributes)[];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      newAttributes[randomKey] = Math.min(99, newAttributes[randomKey] + 1);

      // Re-evaluate overall
      newOverall = Math.min(potential, overall + 1);
    }
  }

  // 2. Physical Decline (Age 32+)
  if (age >= 32) {
    const declineRoll = Math.random();
    if (declineRoll < 0.25) {
      newAttributes.pace = Math.max(30, newAttributes.pace - 1);
      newAttributes.acceleration = Math.max(30, newAttributes.acceleration - 1);
      newAttributes.stamina = Math.max(35, newAttributes.stamina - 1);

      if (age >= 34 && Math.random() < 0.4) {
        newOverall = Math.max(55, overall - 1);
      }
    }
  }

  return {
    ...player,
    attributes: newAttributes,
    overall: newOverall,
  };
}
