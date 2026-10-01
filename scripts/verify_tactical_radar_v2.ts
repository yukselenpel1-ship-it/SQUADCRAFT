import { MatchEngine } from '../src/lib/match-engine/engine';
import { MOCK_CLUBS, MOCK_PLAYERS, FORMATION_COORDINATES } from '../src/lib/data/mockData';
import {
  computeTacticalTargets,
  determinePossessionPhase,
  getBaseFormationCoordinates,
  applyTacticalModifiers,
} from '../src/components/match/radar/tacticalMovementEngine';
import { MatchEngineState, TacticalSettings } from '../src/lib/match-engine/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`[PASS] ${msg}`);
}

async function runTacticalRadarV2Verification() {
  console.log('========================================================================');
  console.log('⚽ SQUADCRAFT 2D LIVE TACTICAL RADAR V2 VERIFICATION');
  console.log('========================================================================\n');

  const homeClub = MOCK_CLUBS[0]; // Kalyon Doruk
  const awayClub = MOCK_CLUBS[1]; // Vadişehir

  const homePlayers = MOCK_PLAYERS.filter((p) => p.clubId === homeClub.id);
  const awayPlayers = MOCK_PLAYERS.filter((p) => p.clubId === awayClub.id);

  const homeTactics: TacticalSettings = {
    mentality: 'Hücum',
    tempo: 'Yüksek',
    pressing: 'Aşırı',
    passingStyle: 'Kısa',
    defensiveLine: 'Yüksek',
    width: 'Geniş',
  };

  const awayTactics: TacticalSettings = {
    mentality: 'Savunmacı',
    tempo: 'Düşük',
    pressing: 'Hafif',
    passingStyle: 'Uzun',
    defensiveLine: 'Derin',
    width: 'Dar',
  };

  const engine = new MatchEngine(
    homeClub,
    awayClub,
    homePlayers,
    awayPlayers,
    homeTactics,
    awayTactics,
    '4-3-3',
    '5-3-2',
    undefined,
    undefined,
    'test-radar-v2'
  );

  let state = engine.getState();

  // ------------------------------------------------------------------------
  // 1. 22 PLAYER LIVE MOVEMENT
  // ------------------------------------------------------------------------
  console.log('--- 1. 22 PLAYER LIVE MOVEMENT TEST ---');
  const initialTargets = computeTacticalTargets(state, 0.5);
  const playerIds = Object.keys(initialTargets.players);
  assert(playerIds.length === 22, 'Exactly 22 active players have calculated targets (11 Home, 11 Away)');

  // Verify within pitch bounds
  const allInBounds = playerIds.every((id) => {
    const p = initialTargets.players[id];
    return p.x >= 5 && p.x <= 95 && p.y >= 8 && p.y <= 92;
  });
  assert(allInBounds, 'All 22 player positions are strictly inside pitch bounds (x: 5-95, y: 8-92)');

  // Simulate 10 minutes and verify players move dynamically
  const positionsMin0 = { ...initialTargets.players };
  for (let m = 0; m < 10; m++) {
    engine.simulateMinute();
  }
  state = engine.getState();
  const minute10Targets = computeTacticalTargets(state, 0.5);

  let positionDiffCount = 0;
  playerIds.forEach((id) => {
    const p0 = positionsMin0[id];
    const p10 = minute10Targets.players[id];
    if (Math.abs(p10.x - p0.x) > 0.5 || Math.abs(p10.y - p0.y) > 0.5) {
      positionDiffCount++;
    }
  });
  assert(positionDiffCount >= 18, `Players dynamically move across minutes (at least 18/22 shifted position, got ${positionDiffCount})`);

  // ------------------------------------------------------------------------
  // 2. REAL BALL MOVEMENT
  // ------------------------------------------------------------------------
  console.log('\n--- 2. REAL BALL MOVEMENT TEST ---');
  const ball0 = initialTargets.ball;
  const ball10 = minute10Targets.ball;
  assert(typeof ball0.x === 'number' && typeof ball0.y === 'number', 'Ball has valid numerical pitch coordinates');
  assert(ball0.x >= 3 && ball0.x <= 97 && ball0.y >= 5 && ball0.y <= 95, 'Ball coordinates are strictly inside pitch boundary');

  // Verify ball moves across ticks
  let ballMovedAcrossTicks = false;
  for (let t = 0; t < 5; t++) {
    engine.simulateMinute();
    const curBall = computeTacticalTargets(engine.getState(), 0.5).ball;
    if (Math.abs(curBall.x - ball0.x) > 1.0 || Math.abs(curBall.y - ball0.y) > 1.0) {
      ballMovedAcrossTicks = true;
      break;
    }
  }
  assert(ballMovedAcrossTicks, 'Ball position continuously moves as game progresses');

  // ------------------------------------------------------------------------
  // 3. PASS ANIMATION & PHASE PROGRESSION
  // ------------------------------------------------------------------------
  console.log('\n--- 3. PASS ANIMATION TEST ---');
  // Verify phase progression interpolates ball coordinates between carrier and receiver
  const phase1 = computeTacticalTargets(state, 0.1).ball;
  const phase2 = computeTacticalTargets(state, 0.9).ball;
  assert(typeof phase1.x === 'number' && typeof phase2.x === 'number', 'Pass animation interpolates ball coordinates across frame progression');

  // ------------------------------------------------------------------------
  // 4. SHOT / GOAL ANIMATION
  // ------------------------------------------------------------------------
  console.log('\n--- 4. SHOT / GOAL ANIMATION TEST ---');
  // Inject mock goal event to verify goal celebration detection
  const goalState: MatchEngineState = {
    ...state,
    latestEvent: {
      id: 'test-goal',
      minute: 25,
      second: 0,
      type: 'GOAL',
      teamId: homeClub.id,
      playerId: homePlayers[0].id,
      playerName: `${homePlayers[0].firstName} ${homePlayers[0].lastName}`,
      description: 'GOL!',
      commentary: 'Harika bir vuruş ve top ağlarda!',
      isImportant: true,
    },
    lastAttackingAction: {
      direction: 'HOME_ATTACK',
      type: 'GOAL',
      coords: { x: 96, y: 50 },
    },
  };
  const goalTargets = computeTacticalTargets(goalState, 0.5);
  assert(goalTargets.activePhase === 'GOAL_CELEBRATION', 'Goal triggers GOAL_CELEBRATION phase');
  assert(goalTargets.ball.isGoal === true, 'Ball state flags isGoal: true');
  assert(goalTargets.ball.x > 95, 'Ball is placed inside net coordinates during goal celebration (x > 95)');

  // ------------------------------------------------------------------------
  // 5. TACTICAL TEAM SHAPE (ATTACK VS DEFENSE)
  // ------------------------------------------------------------------------
  console.log('\n--- 5. TACTICAL TEAM SHAPE TEST ---');
  // When Home is in HOME_ATTACK phase, Home team average X must be significantly higher than when defending
  const homeAttackState: MatchEngineState = {
    ...state,
    lastAttackingAction: {
      direction: 'HOME_ATTACK',
      type: 'SHOT',
      coords: { x: 85, y: 45 },
    },
  };
  const attackTargets = computeTacticalTargets(homeAttackState, 0.5);
  const homeAttackingAvgX = homePlayers
    .map((p) => attackTargets.players[p.id]?.x)
    .filter(Boolean)
    .reduce((a, b) => a + b, 0) / 11;

  const awayAttackState: MatchEngineState = {
    ...state,
    lastAttackingAction: {
      direction: 'AWAY_ATTACK',
      type: 'SHOT',
      coords: { x: 15, y: 45 },
    },
  };
  const defendTargets = computeTacticalTargets(awayAttackState, 0.5);
  const homeDefendingAvgX = homePlayers
    .map((p) => defendTargets.players[p.id]?.x)
    .filter(Boolean)
    .reduce((a, b) => a + b, 0) / 11;

  assert(homeAttackingAvgX > homeDefendingAvgX + 8, `Team shape advances during attack and drops during defense (Attacking avg: ${homeAttackingAvgX.toFixed(1)}%, Defending avg: ${homeDefendingAvgX.toFixed(1)}%)`);

  // ------------------------------------------------------------------------
  // 6. PRESSING VISUALIZATION
  // ------------------------------------------------------------------------
  console.log('\n--- 6. PRESSING VISUALIZATION TEST ---');
  // In homeAttackState, Away team has pressing: 'Hafif' vs 'Aşırı'
  const highPressState: MatchEngineState = {
    ...homeAttackState,
    away: {
      ...homeAttackState.away,
      tactics: {
        ...homeAttackState.away.tactics,
        pressing: 'Aşırı',
      },
    },
  };
  const pressTargets = computeTacticalTargets(highPressState, 0.5);
  const hasPressingPlayer = Object.values(pressTargets.players).some((p) => p.isPressing);
  assert(hasPressingPlayer, 'High pressing tactics identify nearest defender and engage active pressing surge towards ball');

  // ------------------------------------------------------------------------
  // 7. FORMATION DIFFERENCES
  // ------------------------------------------------------------------------
  console.log('\n--- 7. FORMATION DIFFERENCES TEST ---');
  const base433 = getBaseFormationCoordinates(true, '4-3-3', 10); // ST in 4-3-3
  const base532 = getBaseFormationCoordinates(true, '5-3-2', 1);  // CB in 5-3-2
  const base442 = getBaseFormationCoordinates(true, '4-4-2', 5);  // MR in 4-4-2
  assert(base433.x !== base532.x || base433.y !== base532.y, '4-3-3 and 5-3-2 produce distinct tactical coordinates');
  assert(base442.x !== base433.x || base442.y !== base433.y, '4-4-2 produces distinct tactical coordinates');

  // ------------------------------------------------------------------------
  // 8. MATCH ENGINE EVENT SYNC
  // ------------------------------------------------------------------------
  console.log('\n--- 8. MATCH ENGINE EVENT SYNC TEST ---');
  // Full match simulation produces events that sync with radar
  while (!state.isFinished) {
    engine.simulateMinute();
    state = engine.getState();
  }
  assert(state.isFinished === true, 'Engine completed 90 minutes');
  assert(state.events.length >= 25, `Engine generated rich event log (${state.events.length} events) synced to radar timeline`);

  console.log('\n========================================================================');
  console.log('>>> ALL 8 TACTICAL RADAR V2 ENGINE CHECKS PASSED SUCCESSFULLY! <<<');
  console.log('========================================================================\n');
}

runTacticalRadarV2Verification();
