import { PlayerInMatch, MatchEngineEvent } from './types';
import { getEffectiveAttribute } from './teamStrength';
import { matchRandom } from './random';

export interface DisciplineCheckResult {
  foulOccurred: boolean;
  fouler?: PlayerInMatch;
  victim?: PlayerInMatch;
  cardType?: 'NONE' | 'YELLOW' | 'RED';
  event?: MatchEngineEvent;
}

export function evaluateFoulsAndDiscipline(
  minute: number,
  defendingTeamId: string,
  defendingPlayers: PlayerInMatch[],
  attackingPlayers: PlayerInMatch[],
  foulRiskMult: number,
  isDangerousCounter: boolean = false
): DisciplineCheckResult {
  if (defendingPlayers.length === 0 || attackingPlayers.length === 0) {
    return { foulOccurred: false };
  }

  // Base foul probability per attacking sequence ~0.14
  const foulProb = Math.min(0.35, 0.13 * foulRiskMult);
  if (matchRandom() >= foulProb) {
    return { foulOccurred: false };
  }

  // Select fouler (defenders and DMCs commit more fouls, higher aggression = higher weight)
  const weights = defendingPlayers.map((p) => {
    const isDef = ['DR', 'DC', 'DL', 'DMC'].includes(p.currentPosition);
    const agg = getEffectiveAttribute(p, 'aggression');
    const posWeight = isDef ? 2.2 : 1.0;
    return agg * posWeight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = matchRandom() * totalWeight;
  let foulerIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      foulerIndex = i;
      break;
    }
  }
  const fouler = defendingPlayers[foulerIndex];
  const victim = attackingPlayers[Math.floor(matchRandom() * attackingPlayers.length)];

  fouler.foulsCommitted += 1;

  // Card check
  let cardType: 'NONE' | 'YELLOW' | 'RED' = 'NONE';
  const agg = getEffectiveAttribute(fouler, 'aggression');
  let cardProb = isDangerousCounter ? 0.38 : (agg / 100) * 0.16 * (foulRiskMult * 0.9);

  // If already on yellow, player is slightly more careful
  if (fouler.yellowCards === 1) {
    cardProb *= 0.70;
  }

  let event: MatchEngineEvent | undefined;

  if (matchRandom() < cardProb) {
    if (fouler.yellowCards === 1) {
      // Second Yellow -> RED!
      fouler.yellowCards += 1;
      fouler.redCards = 1;
      fouler.isOnPitch = false;
      cardType = 'RED';

      event = {
        id: `card-${minute}-${fouler.player.id}-2y`,
        minute,
        second: Math.floor(matchRandom() * 59),
        type: 'RED_CARD',
        teamId: defendingTeamId,
        playerId: fouler.player.id,
        playerName: `${fouler.player.firstName} ${fouler.player.lastName}`,
        description: `${fouler.player.firstName} ${fouler.player.lastName} 2. sarı karttan KIRMIZI KART gördü ve oyundan atıldı!`,
        commentary: `HAKEM KARTINA BAŞVURUYOR! ${fouler.player.firstName} ${fouler.player.lastName} ikinci sarı kartın ardından kırmızı kartla oyun dışı kalıyor! Takımı sahada 10 kişi!`,
        isImportant: true,
      };
    } else {
      // Direct red check (very rare: 1.5% of cards)
      const directRedChance = isDangerousCounter ? 0.03 : 0.012;
      if (matchRandom() < directRedChance && agg > 75) {
        fouler.redCards = 1;
        fouler.isOnPitch = false;
        cardType = 'RED';

        event = {
          id: `card-${minute}-${fouler.player.id}-dr`,
          minute,
          second: Math.floor(matchRandom() * 59),
          type: 'RED_CARD',
          teamId: defendingTeamId,
          playerId: fouler.player.id,
          playerName: `${fouler.player.firstName} ${fouler.player.lastName}`,
          description: `${fouler.player.firstName} ${fouler.player.lastName} sert müdahalesi nedeniyle DOĞRUDAN KIRMIZI KART gördü!`,
          commentary: `DOĞRUDAN KIRMIZI KART! ${fouler.player.firstName} ${fouler.player.lastName} çok sert bir faul yaptı ve hakem tereddütsüz kırmızı kartını çıkardı!`,
          isImportant: true,
        };
      } else {
        // Yellow Card
        fouler.yellowCards += 1;
        cardType = 'YELLOW';

        event = {
          id: `card-${minute}-${fouler.player.id}-yc`,
          minute,
          second: Math.floor(matchRandom() * 59),
          type: 'YELLOW_CARD',
          teamId: defendingTeamId,
          playerId: fouler.player.id,
          playerName: `${fouler.player.firstName} ${fouler.player.lastName}`,
          description: `${fouler.player.firstName} ${fouler.player.lastName} faulü nedeniyle sarı kart gördü.`,
          commentary: `Hakem oyunu durdurdu. ${fouler.player.firstName} ${fouler.player.lastName} yaptığı kontrolsüz müdahale sonrasında sarı kartla cezalandırılıyor.`,
          isImportant: false,
        };
      }
    }
  } else {
    // Normal Foul
    event = {
      id: `foul-${minute}-${fouler.player.id}`,
      minute,
      second: Math.floor(matchRandom() * 59),
      type: 'FOUL',
      teamId: defendingTeamId,
      playerId: fouler.player.id,
      playerName: `${fouler.player.firstName} ${fouler.player.lastName}`,
      description: `${fouler.player.firstName} ${fouler.player.lastName} tarafından yapılan faul.`,
      commentary: `${fouler.player.firstName} ${fouler.player.lastName} rakibini faulle durdurdu. Hakem serbest vuruş kararı veriyor.`,
      isImportant: false,
    };
  }

  return {
    foulOccurred: true,
    fouler,
    victim,
    cardType,
    event,
  };
}
