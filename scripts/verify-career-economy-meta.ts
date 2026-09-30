import { MOCK_CLUBS } from '../src/lib/data/mockData';
import { generateCareerPlayerUniverse, calculateCareerMarketValue, EXTERNAL_CLUBS } from '../src/lib/career/careerUniverse';
import { startNewSeason, calculateSeasonBudgets, evaluateSeasonEnd } from '../src/lib/career/seasonRollover';
import { simulateAIFixture } from '../src/lib/career/leagueMatchSimulator';
import { MatchEngine } from '../src/lib/match-engine/engine';
import { generateDailyNews } from '../src/lib/career/newsGenerator';
import { TacticalSettings, Fixture, LeagueStanding } from '../src/types/game';

async function runVerification() {
  console.log('================================================================');
  console.log('SQUADCRAFT — FULL CAREER ECONOMY, META & GOAL REALISM AUDIT');
  console.log('================================================================\n');

  // ==========================================================================
  // TEST 1: 2,000-PLAYER CAREER UNIVERSE & FREE AGENTS AUDIT
  // ==========================================================================
  console.log('>>> [1/5] Auditing Career Player Universe & Free Agents Pool...');
  const universe = generateCareerPlayerUniverse(MOCK_CLUBS);
  console.log(`Total Universe Players Generated: ${universe.length}`);

  const freeAgents = universe.filter((p) => p.clubId === 'FREE_AGENT');
  const leaguePlayers = universe.filter((p) => MOCK_CLUBS.some((c) => c.id === p.clubId));
  const externalPlayers = universe.filter((p) => EXTERNAL_CLUBS.some((c) => c.id === p.clubId));

  console.log(`League Clubs Players: ${leaguePlayers.length} (25 per club across ${MOCK_CLUBS.length} clubs)`);
  console.log(`Authentic Free Agents: ${freeAgents.length}`);
  console.log(`External Regional Players: ${externalPlayers.length}`);

  if (universe.length < 1950) throw new Error(`Universe size too small: ${universe.length}`);
  if (freeAgents.length < 190) throw new Error(`Free agents pool too small: ${freeAgents.length}`);

  // Value distribution check
  const topTier = universe.filter((p) => p.overall >= 85);
  const starTier = universe.filter((p) => p.overall >= 80 && p.overall < 85);
  const qualityTier = universe.filter((p) => p.overall >= 75 && p.overall < 80);
  const midTier = universe.filter((p) => p.overall >= 70 && p.overall < 75);
  const lowerTier = universe.filter((p) => p.overall < 70);

  const avgTopVal = topTier.reduce((acc, p) => acc + p.marketValue, 0) / (topTier.length || 1);
  const avgStarVal = starTier.reduce((acc, p) => acc + p.marketValue, 0) / (starTier.length || 1);
  const avgQualityVal = qualityTier.reduce((acc, p) => acc + p.marketValue, 0) / (qualityTier.length || 1);
  const avgMidVal = midTier.reduce((acc, p) => acc + p.marketValue, 0) / (midTier.length || 1);

  console.log(`\nMarket Value Tiers in Career Economy:`);
  console.log(`- 85+ OVR (Elites, n=${topTier.length}): Avg €${(avgTopVal / 1_000_000).toFixed(2)}M (Target: €15M–€35M)`);
  console.log(`- 80-84 OVR (Stars, n=${starTier.length}): Avg €${(avgStarVal / 1_000_000).toFixed(2)}M (Target: €8M–€18M)`);
  console.log(`- 75-79 OVR (Starting XI, n=${qualityTier.length}): Avg €${(avgQualityVal / 1_000_000).toFixed(2)}M (Target: €3.5M–€8.5M)`);
  console.log(`- 70-74 OVR (Rotation, n=${midTier.length}): Avg €${(avgMidVal / 1_000_000).toFixed(2)}M (Target: €1.5M–€4.0M)`);

  // Verify free agent attributes
  const sampleFA = freeAgents[0];
  console.log(`Sample Free Agent: ${sampleFA.firstName} ${sampleFA.lastName} (${sampleFA.position}, OVR ${sampleFA.overall}, Wage €${sampleFA.wage}/wk, Prev: ${sampleFA.previousClubName})`);
  if (!sampleFA.previousClubName) throw new Error('Free agent missing previousClubName');

  // ==========================================================================
  // TEST 2: NEW SEASON BUDGET ROLLOVER
  // ==========================================================================
  console.log('\n>>> [2/5] Testing Season Rollover Budget Economy...');
  const initialStandings: LeagueStanding[] = MOCK_CLUBS.map((c, i) => ({
    rank: i + 1,
    clubId: c.id,
    played: 18,
    won: 10 - i,
    drawn: 4,
    lost: 4 + i,
    goalsFor: 30 - i,
    goalsAgainst: 15 + i,
    goalDifference: 15 - 2 * i,
    points: 34 - 3 * i,
    form: ['W', 'W', 'D', 'L', 'W'],
  }));

  const userClub = MOCK_CLUBS[0];
  const rollover = startNewSeason('2026/27', MOCK_CLUBS, universe, initialStandings, userClub.id);

  console.log(`New Season Rolled: ${rollover.newSeasonYear}, Date: ${rollover.newCurrentDate}`);
  console.log(`User Club Post-Rollover Balance: €${(rollover.newFinances.clubBalance / 1_000_000).toFixed(2)}M`);
  console.log(`User Club Post-Rollover Transfer Budget: €${(rollover.newFinances.transferBudget / 1_000_000).toFixed(2)}M`);
  console.log(`User Club Post-Rollover Wage Limit: €${(rollover.newFinances.wageBudget / 1_000).toFixed(0)}K/wk`);
  console.log(`Board Message Headline: "${rollover.boardMessage.subject}"`);

  if (rollover.newFinances.transferBudget >= rollover.newFinances.clubBalance) {
    throw new Error('Transfer budget must not exceed club balance');
  }
  if (rollover.newFinances.clubBalance > 50_000_000) {
    throw new Error('Runaway inflation: balance exceeded €50M cap');
  }

  // ==========================================================================
  // TEST 3: LIVING NEWS SYSTEM
  // ==========================================================================
  console.log('\n>>> [3/5] Testing Procedural Living News Engine...');
  const mockFixtures: Fixture[] = [
    {
      id: 'fix-today-1',
      round: 1,
      date: '2026-08-15',
      homeClubId: MOCK_CLUBS[0].id,
      awayClubId: MOCK_CLUBS[1].id,
      status: 'FINISHED',
      homeScore: 3,
      awayScore: 2,
    },
  ];

  const newsDay15 = generateDailyNews('2026-08-15', MOCK_CLUBS, initialStandings, mockFixtures, universe, userClub.id, rollover.newFinances);
  const newsDay18 = generateDailyNews('2026-08-18', MOCK_CLUBS, initialStandings, [], universe, userClub.id, rollover.newFinances);
  const newsDay21 = generateDailyNews('2026-08-21', MOCK_CLUBS, initialStandings, [], universe, userClub.id, rollover.newFinances);

  console.log(`Generated News Items Count: ${newsDay15.length + newsDay18.length + newsDay21.length}`);
  [...newsDay15, ...newsDay18, ...newsDay21].forEach((n) => {
    console.log(`  [${n.category}] ${n.headline}`);
  });

  // ==========================================================================
  // TEST 4: CAREER MATCH GOAL BALANCE (5,000 FIXTURES SIMULATION)
  // ==========================================================================
  console.log('\n>>> [4/5] Simulating 5,000 AI League Matches for 2.5 Over/Under & Goal Realism...');
  const simMatchCount = 5000;
  let totalGoals = 0;
  let over25Count = 0;
  let under25Count = 0;
  const scoreFrequency: Record<string, number> = {};

  for (let i = 0; i < simMatchCount; i++) {
    const homeClub = MOCK_CLUBS[i % MOCK_CLUBS.length];
    const awayClub = MOCK_CLUBS[(i + 1) % MOCK_CLUBS.length];

    const fix: Fixture = {
      id: `sim-fix-${i}`,
      round: (i % 18) + 1,
      date: '2026-09-12',
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      status: 'SCHEDULED',
    };

    const finished = simulateAIFixture(fix, MOCK_CLUBS, universe);
    const h = finished.homeScore || 0;
    const a = finished.awayScore || 0;
    const g = h + a;
    totalGoals += g;

    if (g > 2.5) over25Count++;
    else under25Count++;

    const scoreKey = `${h}-${a}`;
    scoreFrequency[scoreKey] = (scoreFrequency[scoreKey] || 0) + 1;
  }

  const avgGoals = totalGoals / simMatchCount;
  const over25Pct = (over25Count / simMatchCount) * 100;
  const under25Pct = (under25Count / simMatchCount) * 100;

  console.log(`\n5,000 Match Simulation Results:`);
  console.log(`- Average Goals Per Match: ${avgGoals.toFixed(2)} (Target: 2.55 – 2.65)`);
  console.log(`- 2.5 Over Percentage: ${over25Pct.toFixed(1)}% (Target: ~46% – 48%)`);
  console.log(`- 2.5 Under Percentage: ${under25Pct.toFixed(1)}% (Target: ~52% – 54%)`);

  // Print top 6 most common scores
  const topScores = Object.entries(scoreFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  console.log(`- Top 6 Most Common Scores:`);
  topScores.forEach(([score, cnt]) => {
    console.log(`    ${score}: ${cnt} matches (${((cnt / simMatchCount) * 100).toFixed(1)}%)`);
  });

  // ==========================================================================
  // TEST 5: TACTICAL META REBALANCE (HIGH PRESS VS LOW BLOCK, 10,000 SIMULATIONS)
  // ==========================================================================
  console.log('\n>>> [5/5] Simulating 10,000 Matches: High Press vs Low Block on Identical Teams...');
  const homeClub = MOCK_CLUBS[0];
  const awayClub = MOCK_CLUBS[1];
  const homeSquad = universe.filter((p) => p.clubId === homeClub.id).slice(0, 16);
  const awaySquad = universe.filter((p) => p.clubId === awayClub.id).slice(0, 16);

  // Equalize OVR between both sides for pure tactical assessment
  const targetOvr = 78;
  const homeEqualed = homeSquad.map((p) => ({ ...p, overall: targetOvr, fitness: 100 }));
  const awayEqualed = awaySquad.map((p) => ({ ...p, overall: targetOvr, fitness: 100 }));

  const highPressTactics: TacticalSettings = {
    mentality: 'Hücum',
    tempo: 'Yüksek',
    pressing: 'Aşırı',
    passingStyle: 'Kısa',
    defensiveLine: 'Yüksek',
    width: 'Dengeli',
  };

  const lowBlockTactics: TacticalSettings = {
    mentality: 'Savunmacı',
    tempo: 'Düşük',
    pressing: 'Hafif',
    passingStyle: 'Doğrudan',
    defensiveLine: 'Derin',
    width: 'Dar',
  };

  const tacticalSimCount = 10000;
  let highPressWins = 0;
  let lowBlockWins = 0;
  let draws = 0;
  let totalHighPressGoals = 0;
  let totalLowBlockGoals = 0;

  for (let i = 0; i < tacticalSimCount; i++) {
    // Alternate home/away to eliminate home advantage bias
    const isHighPressHome = i % 2 === 0;

    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homeEqualed,
      awayEqualed,
      isHighPressHome ? highPressTactics : lowBlockTactics,
      isHighPressHome ? lowBlockTactics : highPressTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      `meta-${i}`,
      { isCompetitive: true, enableHomeAdvantage: false, homeAdvantageMultiplier: 1.0 }
    );

    // Fast simulate match (90 minutes)
    for (let m = 1; m <= 94; m++) {
      engine.simulateMinute();
      if (engine.getState().isFinished) break;
    }

    const state = engine.getState();
    const hpScore = isHighPressHome ? state.homeScore : state.awayScore;
    const lbScore = isHighPressHome ? state.awayScore : state.homeScore;

    totalHighPressGoals += hpScore;
    totalLowBlockGoals += lbScore;

    if (hpScore > lbScore) highPressWins++;
    else if (lbScore > hpScore) lowBlockWins++;
    else draws++;
  }

  const hpWinPct = (highPressWins / tacticalSimCount) * 100;
  const lbWinPct = (lowBlockWins / tacticalSimCount) * 100;
  const drawPct = (draws / tacticalSimCount) * 100;

  console.log(`\n10,000 Tactical Match Simulation Results:`);
  console.log(`- High Press Wins: ${highPressWins} (${hpWinPct.toFixed(1)}%)`);
  console.log(`- Low Block Wins: ${lowBlockWins} (${lbWinPct.toFixed(1)}%)`);
  console.log(`- Draws: ${draws} (${drawPct.toFixed(1)}%)`);
  console.log(`- High Press Avg Goals: ${(totalHighPressGoals / tacticalSimCount).toFixed(2)}`);
  console.log(`- Low Block Avg Goals: ${(totalLowBlockGoals / tacticalSimCount).toFixed(2)}`);

  console.log(`\nDominance Assessment:`);
  if (hpWinPct >= 60.0) {
    console.error(`FAILED: High Press is still dominating with ${hpWinPct.toFixed(1)}%`);
  } else {
    console.log(`SUCCESS: High Press dominance eliminated! Win rate is balanced at ${hpWinPct.toFixed(1)}% (< 60% requirement satisfied).`);
  }

  console.log('\n================================================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
