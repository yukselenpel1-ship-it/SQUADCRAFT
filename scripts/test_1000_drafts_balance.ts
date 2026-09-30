import { getCachedDraftPlayerPool, calculatePlayerDraftValue } from '../src/lib/draft/playerPool';
import { chooseBotDraftPick } from '../src/lib/draft/botManager';
import {
  initializeDraftState,
  executeDraftPick,
  validateDraftPick,
  validateCompletedSquad,
  countSquadPositions,
} from '../src/lib/draft/draftEngine';
import {
  DraftRules,
  DraftClub,
  RoomMember,
  BotDifficulty,
  BotPersonality,
  DEFAULT_DRAFT_BUDGET,
  MIN_PLAYER_DRAFT_PRICE,
} from '../src/lib/draft/types';

interface SimulationMetrics {
  totalDrafts: number;
  totalSquads: number;
  successfulSquads: number;
  quotaViolations: number;
  budgetViolations: number;
  ovrByDifficulty: { KOLAY: number[]; ORTA: number[]; ZOR: number[] };
  ageByDifficulty: { KOLAY: number[]; ORTA: number[]; ZOR: number[] };
  budgetRemainingByDifficulty: { KOLAY: number[]; ORTA: number[]; ZOR: number[] };
  spentByDifficulty: { KOLAY: number[]; ORTA: number[]; ZOR: number[] };
  risingTalentsPickedTotal: number;
}

function run1000DraftsSimulation() {
  console.log('================================================================');
  console.log('SQUADCRAFT PLAYER DATABASE 2.0 — 1,000 DRAFTS BALANCE SIMULATION');
  console.log('================================================================');

  const playerPool = getCachedDraftPlayerPool();
  console.log(`Loaded cached player pool: ${playerPool.length} fictional players.`);

  const rules: DraftRules = {
    squadSize: 18,
    pickTimerSeconds: 0,
    injuries: false,
    suspensions: false,
    fitness: 'SIMPLIFIED',
    transferWindow: 'CLOSED',
    matchType: 'FAST_SIM',
    autoPickMode: 'AUTO_PICK',
  };

  const metrics: SimulationMetrics = {
    totalDrafts: 1000,
    totalSquads: 0,
    successfulSquads: 0,
    quotaViolations: 0,
    budgetViolations: 0,
    ovrByDifficulty: { KOLAY: [], ORTA: [], ZOR: [] },
    ageByDifficulty: { KOLAY: [], ORTA: [], ZOR: [] },
    budgetRemainingByDifficulty: { KOLAY: [], ORTA: [], ZOR: [] },
    spentByDifficulty: { KOLAY: [], ORTA: [], ZOR: [] },
    risingTalentsPickedTotal: 0,
  };

  const difficulties: BotDifficulty[] = ['KOLAY', 'ORTA', 'ZOR', 'ZOR'];
  const personalities: BotPersonality[] = ['Kontrollü', 'Hücumcu', 'Kontratakçı', 'Presçi', 'Dengeli'];

  const startTime = Date.now();

  for (let d = 0; d < 1000; d++) {
    const managerCount = 4; // 4-manager league
    const memberIds = ['m-0', 'm-1', 'm-2', 'm-3'];

    const members: RoomMember[] = memberIds.map((id, idx) => ({
      id,
      roomId: `sim-room-${d}`,
      sessionId: `session-${id}`,
      username: `Manager ${idx + 1}`,
      isHost: idx === 0,
      isSpectator: false,
      isReady: true,
      isBot: true,
      botDifficulty: difficulties[idx % difficulties.length],
      botPersonality: personalities[(d + idx) % personalities.length],
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    }));

    let clubs: DraftClub[] = members.map((m, idx) => ({
      id: `c-${m.id}`,
      roomId: `sim-room-${d}`,
      memberId: m.id,
      name: `Club ${idx + 1}`,
      code: `C0${idx + 1}`,
      managerName: m.username,
      primaryColor: '#00F5A0',
      secondaryColor: '#00D4FF',
      badge: {} as any,
      squadPlayerIds: [],
      budget: DEFAULT_DRAFT_BUDGET,
      spentBudget: 0,
    }));

    let draftState = initializeDraftState(`sim-room-${d}`, memberIds, rules);
    const pickedPlayerIds = new Set<string>();

    const totalPicks = rules.squadSize * managerCount; // 72 picks
    for (let p = 0; p < totalPicks; p++) {
      const currentTurnMemberId = draftState.currentTurnMemberId;
      const currentMember = members.find((m) => m.id === currentTurnMemberId)!;
      const currentClub = clubs.find((c) => c.memberId === currentTurnMemberId)!;

      const chosenPlayer = chooseBotDraftPick(
        playerPool,
        pickedPlayerIds,
        currentClub.squadPlayerIds,
        rules,
        currentMember.botDifficulty || 'ORTA',
        currentMember.botPersonality || 'Dengeli',
        draftState.picks,
        currentClub
      );

      if (!chosenPlayer) {
        throw new Error(`Draft ${d}: No valid player could be picked by ${currentMember.username}`);
      }

      // Validate pick
      const validation = validateDraftPick(
        draftState,
        currentMember.id,
        chosenPlayer.id,
        pickedPlayerIds,
        playerPool,
        rules,
        currentClub
      );

      if (!validation.isValid) {
        metrics.budgetViolations++;
        throw new Error(
          `Draft ${d}, Pick ${p}: Illegal pick validation! ${validation.error} (Code: ${validation.errorCode})`
        );
      }

      const playerPrice = chosenPlayer.draftValue ?? calculatePlayerDraftValue(chosenPlayer);

      // Execute pick
      const { nextState, newPick } = executeDraftPick(
        draftState,
        currentMember.id,
        currentClub.id,
        chosenPlayer.id,
        false,
        rules,
        Date.now(),
        playerPrice
      );

      draftState = nextState;
      pickedPlayerIds.add(chosenPlayer.id);

      // Update club
      clubs = clubs.map((c) =>
        c.id === currentClub.id
          ? {
              ...c,
              squadPlayerIds: [...c.squadPlayerIds, chosenPlayer.id],
              budget: Math.max(0, (c.budget ?? DEFAULT_DRAFT_BUDGET) - playerPrice),
              spentBudget: (c.spentBudget ?? 0) + playerPrice,
            }
          : c
      );

      if (chosenPlayer.isRisingTalent) {
        metrics.risingTalentsPickedTotal++;
      }
    }

    // Verify all 4 squads for this draft
    for (const club of clubs) {
      metrics.totalSquads++;
      const validation = validateCompletedSquad(playerPool, club.squadPlayerIds, rules);
      if (!validation.isValid) {
        metrics.quotaViolations++;
      } else {
        metrics.successfulSquads++;
      }

      const member = members.find((m) => m.id === club.memberId)!;
      const diff = member.botDifficulty || 'ORTA';
      const squadPlayers = playerPool.filter((pl) => club.squadPlayerIds.includes(pl.id));
      const avgOvr = squadPlayers.reduce((sum, pl) => sum + pl.overall, 0) / squadPlayers.length;
      const avgAge = squadPlayers.reduce((sum, pl) => sum + pl.age, 0) / squadPlayers.length;

      metrics.ovrByDifficulty[diff].push(avgOvr);
      metrics.ageByDifficulty[diff].push(avgAge);
      metrics.budgetRemainingByDifficulty[diff].push(club.budget ?? 0);
      metrics.spentByDifficulty[diff].push(club.spentBudget ?? 0);
    }
  }

  const elapsedMs = Date.now() - startTime;

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  console.log('\n================== SIMULATION RESULTS ==================');
  console.log(`Completed Drafts: ${metrics.totalDrafts}`);
  console.log(`Total Squads Created: ${metrics.totalSquads}`);
  console.log(`Successful Squads: ${metrics.successfulSquads} / ${metrics.totalSquads} (100% target)`);
  console.log(`Positional Quota Violations: ${metrics.quotaViolations}`);
  console.log(`Budget Violations: ${metrics.budgetViolations}`);
  console.log(`Execution Time: ${elapsedMs}ms (~${(elapsedMs / 1000).toFixed(2)}s)`);
  console.log(`Total "YÜKSELEN YETENEK" drafted: ${metrics.risingTalentsPickedTotal}`);

  console.log('\n--- PERFORMANCE & STRATEGY BY BOT DIFFICULTY ---');
  for (const diff of ['KOLAY', 'ORTA', 'ZOR'] as BotDifficulty[]) {
    const ovrs = metrics.ovrByDifficulty[diff];
    const ages = metrics.ageByDifficulty[diff];
    const rems = metrics.budgetRemainingByDifficulty[diff];
    const spents = metrics.spentByDifficulty[diff];

    console.log(`\n[${diff} BOT STRATEGY] (N = ${ovrs.length} squads):`);
    console.log(`  - Average Squad OVR:       ${avg(ovrs).toFixed(2)}`);
    console.log(`  - Average Squad Age:       ${avg(ages).toFixed(1)} years`);
    console.log(`  - Average Spent Budget:    €${(avg(spents) / 1_000_000).toFixed(2)}M`);
    console.log(`  - Average Remaining Budget: €${(avg(rems) / 1_000_000).toFixed(2)}M`);
    console.log(`  - Min Remaining Budget:    €${(Math.min(...rems) / 1_000_000).toFixed(2)}M`);
    console.log(`  - Max Remaining Budget:    €${(Math.max(...rems) / 1_000_000).toFixed(2)}M`);
  }

  console.log('\n========================================================');
  if (metrics.quotaViolations === 0 && metrics.budgetViolations === 0) {
    console.log('✅ ALL 1,000 DRAFTS PASSED WITH 100% PERFECT BALANCE!');
  } else {
    console.error('❌ SIMULATION HAD VIOLATIONS!');
    process.exit(1);
  }
}

run1000DraftsSimulation();
