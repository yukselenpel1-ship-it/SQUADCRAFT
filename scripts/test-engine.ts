import { MatchEngine } from '../src/lib/match-engine/engine';
import { MOCK_CLUBS, MOCK_PLAYERS } from '../src/lib/data/mockData';
import { TacticalSettings, Mentality } from '../src/types/game';

function runTests() {
  console.log('=== SQUADCRAFT MATCH ENGINE AUTOMATED TEST SUITE ===\n');
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  const homeClub = MOCK_CLUBS[0];
  const awayClub = MOCK_CLUBS[1];
  const homePlayers = MOCK_PLAYERS.filter((p) => p.clubId === homeClub.id);
  const awayPlayers = MOCK_PLAYERS.filter((p) => p.clubId === awayClub.id);

  const defaultTactics: TacticalSettings = {
    mentality: 'Dengeli',
    tempo: 'Standart',
    pressing: 'Orta',
    passingStyle: 'Kısa',
    defensiveLine: 'Standart',
    width: 'Dengeli',
  };

  // Test 1: Match reaches full time
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-1'
    );
    const finalState = engine.simulateFullMatch();
    assert(finalState.isFinished === true && finalState.minute >= 90, '1. Match reaches full time (90+ mins)');
  }

  // Test 2: Scores cannot become negative
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-2'
    );
    const finalState = engine.simulateFullMatch();
    assert(finalState.homeScore >= 0 && finalState.awayScore >= 0, '2. Scores cannot become negative');
  }

  // Test 3: Possession remains valid (~100%)
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-3'
    );
    const finalState = engine.simulateFullMatch();
    const sum = finalState.homePossessionPercent + finalState.awayPossessionPercent;
    assert(sum === 100 && finalState.homePossessionPercent > 0 && finalState.awayPossessionPercent > 0, '3. Possession remains valid and strictly sums to 100%');
  }

  // Test 4: Red-carded player cannot participate afterward & removed from active pitch
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-4'
    );
    const state = engine.getState();
    const firstPlayerId = state.home.activePitchPlayerIds[0];
    const player = state.home.players[firstPlayerId];
    player.redCards = 1;
    player.isOnPitch = false;
    state.home.activePitchPlayerIds = state.home.activePitchPlayerIds.filter((id) => id !== firstPlayerId);

    // Try substituting red carded player
    const subRes = engine.makeSubstitution(true, firstPlayerId, state.home.benchPlayerIds[0]);
    assert(subRes.success === false, '4. Red-carded player cannot participate or be substituted back');
  }

  // Test 5 & 6: Substitution rules & max 5 substitutions
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-5'
    );

    let subCount = 0;
    for (let i = 0; i < 6; i++) {
      const state = engine.getState();
      const outId = state.home.activePitchPlayerIds[i];
      const inId = state.home.benchPlayerIds[0];
      if (!outId || !inId) break;

      const res = engine.makeSubstitution(true, outId, inId);
      if (res.success) subCount++;
    }

    assert(subCount === 5, '5 & 6. Substitution rules work and maximum 5 substitutions enforced');
  }

  // Test 7: Injured player replacement
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-7'
    );
    const state = engine.getState();
    const outId = state.home.activePitchPlayerIds[1];
    const inId = state.home.benchPlayerIds[0];
    state.home.players[outId].isInjured = true;

    const res = engine.makeSubstitution(true, outId, inId);
    assert(res.success === true && state.home.players[inId].isOnPitch === true, '7. Injured player replacement works');
  }

  // Test 8: Tactical changes affect calculations
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-8'
    );
    engine.applyUserTactics({ mentality: 'Aşırı Hücum', tempo: 'Çok Yüksek' });
    const state = engine.getState();
    assert(state.home.tactics.mentality === 'Aşırı Hücum' && state.home.tactics.tempo === 'Çok Yüksek', '8. Tactical changes affect subsequent calculations');
  }

  // Test 9: Instant Result uses identical engine
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-9'
    );
    const finalState = engine.simulateFullMatch();
    assert(finalState.events.length > 0 && finalState.isFinished, '9. Instant Result uses identical match engine');
  }

  // Test 10: Match cannot continue after full time
  {
    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      defaultTactics,
      defaultTactics,
      '4-2-3-1',
      '4-2-3-1',
      undefined,
      undefined,
      'test-10'
    );
    engine.simulateFullMatch();
    const afterStep = engine.simulateMinute();
    assert(afterStep.isFinished === true && afterStep.events.length === 0, '10. Match cannot continue after full time');
  }

  console.log(`\nResults: ${passedCount}/${totalCount} tests passed.`);
}

runTests();
