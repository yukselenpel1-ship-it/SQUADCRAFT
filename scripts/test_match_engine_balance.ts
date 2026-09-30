import { MatchEngine } from '../src/lib/match-engine/engine';
import { Club, Player, PlayerPosition, PlayerArchetype, TacticalSettings } from '../src/types/game';

function createMockClub(id: string, name: string): Club {
  return {
    id,
    name,
    shortName: name.substring(0, 3).toUpperCase(),
    reputation: 80,
    transferBudget: 50_000_000,
    wageBudget: 1_000_000,
    colors: { primary: '#1E40AF', secondary: '#FFFFFF' },
    leagueId: 'league-1',
    division: 1,
  };
}

function createPlayer(
  id: string,
  name: string,
  pos: PlayerPosition,
  ovr: number,
  archetype: PlayerArchetype,
  fitness: number = 98,
  consistency: number = 75,
  bigMatch: number = 75
): Player {
  const clamp = (v: number) => Math.max(15, Math.min(99, Math.round(v)));

  const baseAttrs = {
    pace: ovr,
    acceleration: ovr,
    strength: ovr,
    stamina: ovr,
    finishing: ovr,
    longShots: ovr,
    passing: ovr,
    vision: ovr,
    crossing: ovr,
    dribbling: ovr,
    technique: ovr,
    heading: ovr,
    tackling: ovr,
    marking: ovr,
    positioning: ovr,
    aggression: 70,
    composure: ovr,
    decisions: ovr,
    teamwork: 75,
    leadership: 70,
    handling: 40,
    reflexes: 40,
    positioningGK: 40,
    kicking: 40,
  };

  switch (pos) {
    case 'GK':
      baseAttrs.handling = clamp(ovr + 1);
      baseAttrs.reflexes = clamp(ovr + 2);
      baseAttrs.positioningGK = clamp(ovr + 1);
      baseAttrs.kicking = clamp(ovr - 2);
      baseAttrs.decisions = clamp(ovr);
      baseAttrs.composure = clamp(ovr);
      baseAttrs.pace = 45;
      baseAttrs.finishing = 20;
      baseAttrs.tackling = 30;
      break;
    case 'DC':
      baseAttrs.tackling = clamp(ovr + 3);
      baseAttrs.marking = clamp(ovr + 2);
      baseAttrs.positioning = clamp(ovr + 2);
      baseAttrs.strength = clamp(ovr + 3);
      baseAttrs.heading = clamp(ovr + 2);
      baseAttrs.pace = clamp(ovr - 3);
      baseAttrs.finishing = clamp(ovr - 25);
      break;
    case 'DR':
    case 'DL':
      baseAttrs.pace = clamp(ovr + 3);
      baseAttrs.acceleration = clamp(ovr + 3);
      baseAttrs.stamina = clamp(ovr + 2);
      baseAttrs.crossing = clamp(ovr + 1);
      baseAttrs.tackling = clamp(ovr);
      baseAttrs.positioning = clamp(ovr - 1);
      baseAttrs.dribbling = clamp(ovr);
      break;
    case 'DMC':
      baseAttrs.tackling = clamp(ovr + 2);
      baseAttrs.positioning = clamp(ovr + 2);
      baseAttrs.passing = clamp(ovr + 1);
      baseAttrs.strength = clamp(ovr + 2);
      baseAttrs.stamina = clamp(ovr + 2);
      baseAttrs.decisions = clamp(ovr + 1);
      break;
    case 'MC':
      baseAttrs.passing = clamp(ovr + 3);
      baseAttrs.vision = clamp(ovr + 2);
      baseAttrs.technique = clamp(ovr + 2);
      baseAttrs.stamina = clamp(ovr + 1);
      baseAttrs.decisions = clamp(ovr + 1);
      baseAttrs.composure = clamp(ovr + 1);
      break;
    case 'AMC':
      baseAttrs.passing = clamp(ovr + 3);
      baseAttrs.vision = clamp(ovr + 4);
      baseAttrs.technique = clamp(ovr + 4);
      baseAttrs.dribbling = clamp(ovr + 2);
      baseAttrs.composure = clamp(ovr + 2);
      baseAttrs.longShots = clamp(ovr + 1);
      baseAttrs.finishing = clamp(ovr - 2);
      break;
    case 'AMR':
    case 'AML':
      baseAttrs.pace = clamp(ovr + 4);
      baseAttrs.acceleration = clamp(ovr + 4);
      baseAttrs.dribbling = clamp(ovr + 3);
      baseAttrs.crossing = clamp(ovr + 2);
      baseAttrs.technique = clamp(ovr + 2);
      baseAttrs.finishing = clamp(ovr - 1);
      break;
    case 'ST':
      baseAttrs.finishing = clamp(ovr + 5);
      baseAttrs.pace = clamp(ovr + 2);
      baseAttrs.acceleration = clamp(ovr + 2);
      baseAttrs.composure = clamp(ovr + 3);
      baseAttrs.positioning = clamp(ovr + 3);
      baseAttrs.heading = clamp(ovr + 1);
      baseAttrs.strength = clamp(ovr + 1);
      break;
  }

  return {
    id,
    name,
    age: 25,
    nationality: 'Türkiye',
    position: pos,
    secondaryPositions: [],
    overall: ovr,
    potential: ovr + 2,
    clubId: 'club-1',
    value: 10_000_000,
    wage: 50_000,
    contractYears: 3,
    preferredFoot: 'Sağ',
    archetype,
    squadRole: 'İlk 11',
    attributes: baseAttrs,
    fitness,
    morale: 75,
    form: 7.0,
    trainingFocus: 'Dengeli',
    developmentCurve: 'Standart',
    hiddenAttributes: {
      consistency,
      dirtiness: 30,
      injuryProneness: 25,
      bigMatchPerformance: bigMatch,
    },
  };
}

function createTeamSquad(prefix: string, ovr: number, overrides?: Partial<Record<PlayerPosition, Partial<Player>>>): Player[] {
  const positions: { pos: PlayerPosition; arch: PlayerArchetype }[] = [
    { pos: 'GK', arch: 'Çizgi Kalecisi' },
    { pos: 'DR', arch: 'İki Yönlü Bek' },
    { pos: 'DC', arch: 'Pasör Stoper' },
    { pos: 'DC', arch: 'Fiziksel Stoper' },
    { pos: 'DL', arch: 'İki Yönlü Bek' },
    { pos: 'DMC', arch: 'Top Kapan Orta Saha' },
    { pos: 'MC', arch: 'Kutu İçi (Box-to-Box)' },
    { pos: 'AMR', arch: 'Hızlı Kanat' },
    { pos: 'AMC', arch: 'Oyun Kurucu' },
    { pos: 'AML', arch: 'İç Forvet' },
    { pos: 'ST', arch: 'Bitirici Forvet' },
  ];

  return positions.map((slot, idx) => {
    const id = `${prefix}-${slot.pos}-${idx}`;
    const p = createPlayer(id, `${prefix} ${slot.pos}`, slot.pos, ovr, slot.arch);
    if (overrides && overrides[slot.pos]) {
      Object.assign(p, overrides[slot.pos]);
      if (overrides[slot.pos]!.attributes) {
        p.attributes = { ...p.attributes, ...overrides[slot.pos]!.attributes };
      }
    }
    return p;
  });
}

const defaultTactics: TacticalSettings = {
  mentality: 'Dengeli',
  tempo: 'Standart',
  pressing: 'Orta',
  passingStyle: 'Dengeli',
  defensiveLine: 'Standart',
  width: 'Dengeli',
};

interface ScenarioResult {
  scenario: string;
  matches: number;
  teamAWins: number;
  draws: number;
  teamBWins: number;
  teamAGoalsTotal: number;
  teamBGoalsTotal: number;
  teamAShotsTotal: number;
  teamBShotsTotal: number;
  teamASOTTotal: number;
  teamBSOTTotal: number;
  teamAxGTotal: number;
  teamBxGTotal: number;
}

function simulateScenario(
  scenarioName: string,
  ovrA: number,
  ovrB: number,
  matches: number
): ScenarioResult {
  const result: ScenarioResult = {
    scenario: scenarioName,
    matches,
    teamAWins: 0,
    draws: 0,
    teamBWins: 0,
    teamAGoalsTotal: 0,
    teamBGoalsTotal: 0,
    teamAShotsTotal: 0,
    teamBShotsTotal: 0,
    teamASOTTotal: 0,
    teamBSOTTotal: 0,
    teamAxGTotal: 0,
    teamBxGTotal: 0,
  };

  const clubA = createMockClub('club-a', `Team ${ovrA}`);
  const clubB = createMockClub('club-b', `Team ${ovrB}`);

  const squadA = createTeamSquad('A', ovrA);
  const squadB = createTeamSquad('B', ovrB);

  // Play half home, half away with realistic league home advantage to ensure symmetrical balance
  const half = Math.floor(matches / 2);

  for (let i = 0; i < matches; i++) {
    const aIsHome = i < half;
    const homeClub = aIsHome ? clubA : clubB;
    const awayClub = aIsHome ? clubB : clubA;
    const homeSquad = aIsHome ? squadA : squadB;
    const awaySquad = aIsHome ? squadB : squadA;

    // Reset fitness/stats for match simulation
    homeSquad.forEach(p => { p.fitness = 98; });
    awaySquad.forEach(p => { p.fitness = 98; });

    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homeSquad,
      awaySquad,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      `fix-${i}`,
      {
        isCompetitive: true,
        enableHomeAdvantage: true,
        homeAdvantageMultiplier: 1.05,
      }
    );

    const state = engine.simulateFullMatch();

    const aScore = aIsHome ? state.homeScore : state.awayScore;
    const bScore = aIsHome ? state.awayScore : state.homeScore;

    const aShots = aIsHome ? state.home.stats.shots : state.away.stats.shots;
    const bShots = aIsHome ? state.away.stats.shots : state.home.stats.shots;

    const aSOT = aIsHome ? state.home.stats.shotsOnTarget : state.away.stats.shotsOnTarget;
    const bSOT = aIsHome ? state.away.stats.shotsOnTarget : state.home.stats.shotsOnTarget;

    const axG = aIsHome ? state.home.stats.xG : state.away.stats.xG;
    const bxG = aIsHome ? state.away.stats.xG : state.home.stats.xG;

    if (aScore > bScore) result.teamAWins++;
    else if (aScore === bScore) result.draws++;
    else result.teamBWins++;

    result.teamAGoalsTotal += aScore;
    result.teamBGoalsTotal += bScore;
    result.teamAShotsTotal += aShots;
    result.teamBShotsTotal += bShots;
    result.teamASOTTotal += aSOT;
    result.teamBSOTTotal += bSOT;
    result.teamAxGTotal += axG;
    result.teamBxGTotal += bxG;
  }

  return result;
}

async function main() {
  console.log('==================================================');
  console.log('STARTING SQUADCRAFT 10,000 MATCHES BALANCE TEST');
  console.log('==================================================\n');

  const startMs = Date.now();

  // 1. Overall winrates (10,000 matches)
  const scenarios = [
    { name: '82 OVR vs 72 OVR', ovrA: 82, ovrB: 72, count: 2000 },
    { name: '80 OVR vs 78 OVR', ovrA: 80, ovrB: 78, count: 2000 },
    { name: '80 OVR vs 75 OVR', ovrA: 80, ovrB: 75, count: 2000 },
    { name: '80 OVR vs 70 OVR', ovrA: 80, ovrB: 70, count: 2000 },
    { name: '85 OVR vs 70 OVR', ovrA: 85, ovrB: 70, count: 2000 },
  ];

  const results: ScenarioResult[] = [];
  for (const s of scenarios) {
    const res = simulateScenario(s.name, s.ovrA, s.ovrB, s.count);
    results.push(res);
    const winPct = ((res.teamAWins / s.count) * 100).toFixed(1);
    const drawPct = ((res.draws / s.count) * 100).toFixed(1);
    const lossPct = ((res.teamBWins / s.count) * 100).toFixed(1);
    const aG = (res.teamAGoalsTotal / s.count).toFixed(2);
    const bG = (res.teamBGoalsTotal / s.count).toFixed(2);
    const axG = (res.teamAxGTotal / s.count).toFixed(2);
    const bxG = (res.teamBxGTotal / s.count).toFixed(2);
    const aSh = (res.teamAShotsTotal / s.count).toFixed(1);
    const bSh = (res.teamBShotsTotal / s.count).toFixed(1);

    console.log(`[DONE] ${s.name} (${s.count} matches)`);
    console.log(`       Win: ${winPct}% | Draw: ${drawPct}% | Loss: ${lossPct}%`);
    console.log(`       Goals: ${aG} - ${bG} | xG: ${axG} - ${bxG} | Shots: ${aSh} - ${bSh}\n`);
  }

  // 2. Individual Star Impact: ST 90 vs ST 75 (1,000 matches)
  console.log('Running ST 90 vs ST 75 Individual Impact Test (1,000 matches)...');
  const club1 = createMockClub('c-1', 'Team Star 90');
  const club2 = createMockClub('c-2', 'Team Good 75');
  const squadStar = createTeamSquad('Star', 80);
  const squadReg = createTeamSquad('Reg', 80);

  // Overwrite STs
  squadStar[10] = createPlayer('star-st', 'Erling Star', 'ST', 90, 'Bitirici Forvet');
  squadReg[10] = createPlayer('reg-st', 'Marco Good', 'ST', 75, 'Bitirici Forvet');

  let starGoals = 0, starShots = 0, starMinutes = 0, starRatingSum = 0;
  let regGoals = 0, regShots = 0, regMinutes = 0, regRatingSum = 0;

  for (let i = 0; i < 1000; i++) {
    const aIsHome = i % 2 === 0;
    const hClub = aIsHome ? club1 : club2;
    const aClub = aIsHome ? club2 : club1;
    const hSquad = aIsHome ? squadStar : squadReg;
    const aSquad = aIsHome ? squadReg : squadStar;

    hSquad.forEach(p => { p.fitness = 98; });
    aSquad.forEach(p => { p.fitness = 98; });

    const engine = new MatchEngine(hClub, aClub, hSquad, aSquad, defaultTactics, defaultTactics);
    const st = engine.simulateFullMatch();

    const starP = (st.home.players['star-st'] || st.away.players['star-st'])!;
    const regP = (st.home.players['reg-st'] || st.away.players['reg-st'])!;

    starGoals += starP.goals;
    starShots += starP.shots;
    starMinutes += starP.minutesPlayed;
    starRatingSum += starP.matchRating;

    regGoals += regP.goals;
    regShots += regP.shots;
    regMinutes += regP.minutesPlayed;
    regRatingSum += regP.matchRating;
  }

  const starG90 = ((starGoals / (starMinutes / 90))).toFixed(2);
  const starSh90 = ((starShots / (starMinutes / 90))).toFixed(2);
  const starConv = ((starGoals / Math.max(1, starShots)) * 100).toFixed(1);
  const starRating = (starRatingSum / 1000).toFixed(2);

  const regG90 = ((regGoals / (regMinutes / 90))).toFixed(2);
  const regSh90 = ((regShots / (regMinutes / 90))).toFixed(2);
  const regConv = ((regGoals / Math.max(1, regShots)) * 100).toFixed(1);
  const regRating = (regRatingSum / 1000).toFixed(2);

  console.log(`ST 90: Goals/90: ${starG90}, Shots/90: ${starSh90}, Conv: ${starConv}%, Rating: ${starRating}`);
  console.log(`ST 75: Goals/90: ${regG90}, Shots/90: ${regSh90}, Conv: ${regConv}%, Rating: ${regRating}\n`);

  // 3. Fatigue Impact: 82 Fresh (98 fitness) vs 90 Exhausted (45 fitness) (1,000 matches)
  console.log('Running Fatigue Impact Test: 82 Fresh vs 90 Exhausted (1,000 matches)...');
  const clubFresh = createMockClub('cf', 'Team 82 Fresh');
  const clubTired = createMockClub('ct', 'Team 90 Exhausted');
  const squadFresh = createTeamSquad('F', 82);
  const squadTired = createTeamSquad('T', 90);

  let freshWins = 0, tiredDraws = 0, tiredWins = 0;
  let freshGoals = 0, tiredGoals = 0;
  for (let i = 0; i < 1000; i++) {
    const freshHome = i % 2 === 0;
    const hClub = freshHome ? clubFresh : clubTired;
    const aClub = freshHome ? clubTired : clubFresh;
    const hSquad = freshHome ? squadFresh : squadTired;
    const aSquad = freshHome ? squadTired : squadFresh;

    squadFresh.forEach(p => { p.fitness = 98; });
    squadTired.forEach(p => { p.fitness = 45; }); // Severely exhausted

    const engine = new MatchEngine(hClub, aClub, hSquad, aSquad, defaultTactics, defaultTactics);
    const st = engine.simulateFullMatch();

    const fScore = freshHome ? st.homeScore : st.awayScore;
    const tScore = freshHome ? st.awayScore : st.homeScore;

    if (fScore > tScore) freshWins++;
    else if (fScore === tScore) tiredDraws++;
    else tiredWins++;

    freshGoals += fScore;
    tiredGoals += tScore;
  }
  console.log(`Fresh 82 vs Exhausted 90: Fresh Wins: ${(freshWins/10).toFixed(1)}%, Draws: ${(tiredDraws/10).toFixed(1)}%, Exhausted Wins: ${(tiredWins/10).toFixed(1)}%`);
  console.log(`Goals: Fresh ${(freshGoals/1000).toFixed(2)} - Exhausted ${(tiredGoals/1000).toFixed(2)}\n`);

  // 4. Archetype Impact (Playmaker vs Standard MC & Finisher vs Target Forward)
  console.log('Running Archetype Impact Test (1,000 matches)...');
  const squadPlaymaker = createTeamSquad('PM', 80);
  const squadGeneric = createTeamSquad('GEN', 80);
  squadPlaymaker[8] = createPlayer('pm-amc', 'Zinedine PM', 'AMC', 80, 'Oyun Kurucu');
  squadGeneric[8] = createPlayer('gen-amc', 'Standard Mid', 'AMC', 80, 'Kutu İçi (Box-to-Box)');

  let pmAssists = 0, pmKeyPasses = 0, pmRating = 0;
  let genAssists = 0, genKeyPasses = 0, genRating = 0;

  for (let i = 0; i < 1000; i++) {
    const isHome = i % 2 === 0;
    squadPlaymaker.forEach(p => { p.fitness = 98; });
    squadGeneric.forEach(p => { p.fitness = 98; });
    const engine = new MatchEngine(
      isHome ? club1 : club2,
      isHome ? club2 : club1,
      isHome ? squadPlaymaker : squadGeneric,
      isHome ? squadGeneric : squadPlaymaker,
      defaultTactics,
      defaultTactics
    );
    const st = engine.simulateFullMatch();
    const pm = (st.home.players['pm-amc'] || st.away.players['pm-amc'])!;
    const gen = (st.home.players['gen-amc'] || st.away.players['gen-amc'])!;
    pmAssists += pm.assists;
    pmKeyPasses += pm.keyPasses || 0;
    pmRating += pm.matchRating;
    genAssists += gen.assists;
    genKeyPasses += gen.keyPasses || 0;
    genRating += gen.matchRating;
  }
  console.log(`Playmaker AMC: KeyPasses/match: ${(pmKeyPasses/1000).toFixed(2)}, Assists/1000: ${pmAssists}, Rating: ${(pmRating/1000).toFixed(2)}`);
  console.log(`Generic AMC: KeyPasses/match: ${(genKeyPasses/1000).toFixed(2)}, Assists/1000: ${genAssists}, Rating: ${(genRating/1000).toFixed(2)}\n`);

  // 5. Development Impact (68 OVR Young Player vs 75 OVR Developed Player) (1,000 matches)
  console.log('Running Development Impact Test (68 OVR -> 75 OVR) (1,000 matches)...');
  const squadDevBefore = createTeamSquad('DEV1', 78);
  const squadDevAfter = createTeamSquad('DEV2', 78);
  squadDevBefore[10] = createPlayer('dev-p-before', 'Young Talent (Pre)', 'ST', 68, 'Bitirici Forvet');
  squadDevAfter[10] = createPlayer('dev-p-after', 'Young Talent (Post)', 'ST', 75, 'Bitirici Forvet');

  let beforeGoals = 0, beforeRating = 0, beforeShots = 0;
  let afterGoals = 0, afterRating = 0, afterShots = 0;

  for (let i = 0; i < 1000; i++) {
    const opp = createTeamSquad('OPP', 78);
    squadDevBefore.forEach(p => { p.fitness = 98; });
    squadDevAfter.forEach(p => { p.fitness = 98; });
    opp.forEach(p => { p.fitness = 98; });

    // Match 1: With 68 ST
    const eng1 = new MatchEngine(club1, club2, squadDevBefore, opp, defaultTactics, defaultTactics);
    const st1 = eng1.simulateFullMatch();
    const p1 = st1.home.players['dev-p-before'];
    beforeGoals += p1.goals;
    beforeShots += p1.shots;
    beforeRating += p1.matchRating;

    // Match 2: With 75 ST
    const eng2 = new MatchEngine(club1, club2, squadDevAfter, opp, defaultTactics, defaultTactics);
    const st2 = eng2.simulateFullMatch();
    const p2 = st2.home.players['dev-p-after'];
    afterGoals += p2.goals;
    afterShots += p2.shots;
    afterRating += p2.matchRating;
  }
  console.log(`Pre-Development (68 OVR): Goals/1000: ${beforeGoals}, Shots/1000: ${beforeShots}, Rating: ${(beforeRating/1000).toFixed(2)}`);
  console.log(`Post-Development (75 OVR): Goals/1000: ${afterGoals}, Shots/1000: ${afterShots}, Rating: ${(afterRating/1000).toFixed(2)}\n`);

  console.log(`ALL TESTS FINISHED IN ${((Date.now() - startMs) / 1000).toFixed(1)}s`);
}

main().catch(console.error);
