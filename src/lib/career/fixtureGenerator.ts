import { Club, Fixture } from '@/types/game';
import { addDaysToDate } from './calendar';

export function generateSeasonFixtures(
  clubs: Club[],
  seasonYear: string = '2026/27',
  startDateStr: string = '2026-08-15'
): Fixture[] {
  if (clubs.length < 2) return [];

  const n = clubs.length;
  const teamIds = clubs.map((c) => c.id);

  // Balanced Round-robin schedule generator using circle method with venue balancing
  const rounds: { homeId: string; awayId: string }[][] = [];
  const numRounds = n - 1; // 9 rounds for 10 teams
  const half = n / 2; // 5 matches per round

  // Rotating pool of n - 1 teams, fixing team 0
  const pool = teamIds.slice(1);
  const homeCount: Record<string, number> = {};
  const lastVenue: Record<string, 'H' | 'A' | null> = {};
  teamIds.forEach((t) => {
    homeCount[t] = 0;
    lastVenue[t] = null;
  });

  for (let r = 0; r < numRounds; r++) {
    const roundMatches: { homeId: string; awayId: string }[] = [];
    const currentRoundTeams = [teamIds[0], ...pool];

    for (let i = 0; i < half; i++) {
      const tA = currentRoundTeams[i];
      const tB = currentRoundTeams[n - 1 - i];

      let home = tA;
      let away = tB;

      // Smart venue balancing: prevent long consecutive home/away streaks
      if (lastVenue[tA] === 'H' && lastVenue[tB] !== 'H') {
        home = tB;
        away = tA;
      } else if (lastVenue[tB] === 'H' && lastVenue[tA] !== 'H') {
        home = tA;
        away = tB;
      } else if (homeCount[tA] > homeCount[tB]) {
        home = tB;
        away = tA;
      } else if (homeCount[tB] > homeCount[tA]) {
        home = tA;
        away = tB;
      } else if (r % 2 === 1) {
        home = tB;
        away = tA;
      }

      roundMatches.push({ homeId: home, awayId: away });
    }

    // Update venues after round is formed
    roundMatches.forEach((m) => {
      homeCount[m.homeId]++;
      lastVenue[m.homeId] = 'H';
      lastVenue[m.awayId] = 'A';
    });

    rounds.push(roundMatches);

    // Rotate pool
    const popped = pool.pop();
    if (popped) {
      pool.unshift(popped);
    }
  }

  // Second half of season (Rounds 10 to 18) are reverse of first half
  const secondHalfRounds: { homeId: string; awayId: string }[][] = [];
  rounds.forEach((roundMatches) => {
    const reversed = roundMatches.map((m) => ({
      homeId: m.awayId,
      awayId: m.homeId,
    }));
    secondHalfRounds.push(reversed);
  });

  const all18Rounds = [...rounds, ...secondHalfRounds];
  const fixtures: Fixture[] = [];

  let currentDate = startDateStr;

  all18Rounds.forEach((roundMatches, roundIndex) => {
    const roundNumber = roundIndex + 1;

    // Time slots for matches in the round (e.g., Saturday 16:00, 19:00, Sunday 15:00, 18:00, 20:00)
    const timeSlots = ['16:00', '19:00', '15:00', '18:00', '20:00'];

    roundMatches.forEach((m, matchIndex) => {
      // Small date offset within round (matches played Saturday or Sunday)
      const matchDate = matchIndex >= 3 ? addDaysToDate(currentDate, 1) : currentDate;
      const matchTime = timeSlots[matchIndex % timeSlots.length];

      const homeClub = clubs.find((c) => c.id === m.homeId);

      fixtures.push({
        id: `fix-s${seasonYear.replace('/', '')}-r${roundNumber}-${matchIndex + 1}`,
        seasonYear,
        competition: 'Alveria Elit Ligi',
        round: roundNumber,
        date: matchDate,
        time: matchTime,
        homeClubId: m.homeId,
        awayClubId: m.awayId,
        status: 'SCHEDULED',
        stadium: homeClub?.stadium || 'Şehir Stadyumu',
      });
    });

    // Advance 7 days for next round (with a 2-week winter break after round 9)
    const daysToNextRound = roundNumber === 9 ? 18 : 7;
    currentDate = addDaysToDate(currentDate, daysToNextRound);
  });

  return fixtures;
}
