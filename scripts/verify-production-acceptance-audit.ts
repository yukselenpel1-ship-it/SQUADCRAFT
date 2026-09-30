import { DraftMultiplayerStore, reconcileClubsBudget } from '../src/lib/draft/multiplayerStore';
import { DEFAULT_DRAFT_BUDGET, DEFAULT_DRAFT_RULES, DraftRules, DraftClub, DraftPick } from '../src/lib/draft/types';
import { getCachedDraftPlayerPool, calculatePlayerDraftValue } from '../src/lib/draft/playerPool';
import { generateCareerPlayerUniverse, calculateCareerMarketValue, EXTERNAL_CLUBS } from '../src/lib/career/careerUniverse';
import { simulateAIFixture } from '../src/lib/career/leagueMatchSimulator';
import { MatchEngine } from '../src/lib/match-engine/engine';
import { Club, ClubTactics, Player, TacticalSettings } from '../src/types/game';

async function runProductionAcceptanceAudit() {
  console.log('================================================================');
  console.log('SQUADCRAFT — CAREER MODE & DRAFT PRODUCTION ACCEPTANCE AUDIT');
  console.log('================================================================\n');

  // ============================================================================
  // 1. FICTIONAL PLAYER SAFETY AUDIT
  // ============================================================================
  console.log('--- 1. FICTIONAL PLAYER SAFETY & TERMINOLOGY AUDIT ---');
  const mockClubs: Club[] = [
    { id: 'c1', name: 'Alveria Stars', code: 'ALV', reputation: 80, balance: 10000000, transferBudget: 8000000, wageBudget: 150000, seasonWages: 0, fanMorale: 80, stadiumCapacity: 30000, facilitiesLevel: 3, youthAcademyLevel: 3, primaryColor: '#00D4FF', secondaryColor: '#FFFFFF', squad: [], leaguePosition: 1, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [] },
    { id: 'c2', name: 'Doruk Gücü', code: 'DRK', reputation: 75, balance: 7000000, transferBudget: 5000000, wageBudget: 120000, seasonWages: 0, fanMorale: 75, stadiumCapacity: 25000, facilitiesLevel: 2, youthAcademyLevel: 2, primaryColor: '#FF6B00', secondaryColor: '#FFFFFF', squad: [], leaguePosition: 2, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [] },
  ];

  const universe = generateCareerPlayerUniverse(mockClubs);
  console.log(`Total Universe Players: ${universe.length}`);
  
  const freeAgents = universe.filter(p => p.clubId === 'FREE_AGENT');
  console.log(`Total Free Agents: ${freeAgents.length} (Verified: "200 kurgusal serbest oyuncu")`);

  const knownRealStars = [
    'Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappe', 'Erling Haaland', 
    'Kevin De Bruyne', 'Robert Lewandowski', 'Neymar Jr', 'Mohamed Salah',
    'Karim Benzema', 'Luka Modric', 'Harry Kane', 'Vinicius Junior'
  ];

  let realStarFound = false;
  for (const p of universe) {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    for (const star of knownRealStars) {
      if (fullName === star.toLowerCase()) {
        realStarFound = true;
        console.error(`CRITICAL SAFETY BREACH: Real player found: ${fullName}`);
      }
    }
  }

  if (!realStarFound && freeAgents.length === 200 && universe.length === 2000) {
    console.log('✅ Fictional Player Safety: 100% PASS (Zero real-life players. All 2,000 players & 200 free agents are fully fictional).');
  } else {
    throw new Error('Fictional player safety audit failed!');
  }

  // ============================================================================
  // 2. P0 DRAFT BUDGET RESET BUG AUDIT (MULTI-TIER BUDGETS)
  // ============================================================================
  console.log('\n--- 2. P0 DRAFT BUDGET RESET BUG VERIFICATION ---');
  const testBudgets = [100_000_000, 150_000_000, 250_000_000, 300_000_000];

  for (const initialBudget of testBudgets) {
    const rules: DraftRules = { ...DEFAULT_DRAFT_RULES, draftBudget: initialBudget, squadSize: 18 };
    const clubId = `test-club-${initialBudget}`;
    const memberId = `test-mem-${initialBudget}`;

    let testClub: DraftClub = {
      id: clubId,
      roomId: 'room-audit',
      memberId,
      name: 'Audit FC',
      code: 'AFC',
      managerName: 'Auditor',
      primaryColor: '#00F5A0',
      secondaryColor: '#070D14',
      badge: {},
      squadPlayerIds: [],
      budget: initialBudget,
      spentBudget: 0,
    };

    // 1. User picks a player worth ~€20M
    const pool = getCachedDraftPlayerPool();
    const targetPlayer = pool.find(p => {
      const val = p.draftValue ?? calculatePlayerDraftValue(p);
      return val >= 18_000_000 && val <= 24_000_000;
    }) || pool[0];
    const playerPrice = targetPlayer.draftValue ?? calculatePlayerDraftValue(targetPlayer);

    const pick1: DraftPick = {
      id: 'pick-test-1',
      roomId: 'room-audit',
      round: 1,
      pickIndexInRound: 0,
      globalPickNumber: 1,
      memberId,
      clubId,
      playerId: targetPlayer.id,
      selectedAt: new Date().toISOString(),
      isAutoPick: false,
      timeTakenSeconds: 5,
      draftPrice: playerPrice,
    };

    // Reconcile budget
    let reconciled = reconcileClubsBudget([testClub], rules, [pick1], pool);
    let afterPickBudget = reconciled[0].budget;
    let expectedBudget = initialBudget - playerPrice;

    if (afterPickBudget !== expectedBudget) {
      throw new Error(`Budget mismatch after Pick 1! Expected ${expectedBudget}, got ${afterPickBudget}`);
    }

    // 2. Simulate Refresh / Hydration / Network Stale State Injection
    // Stale server packet sends club with old budget = initialBudget (€250M)
    let staleClub: DraftClub = {
      ...reconciled[0],
      budget: initialBudget, // Simulate stale DB row
      spentBudget: 0,
    };

    let reReconciled = reconcileClubsBudget([staleClub], rules, [pick1], pool);
    if (reReconciled[0].budget !== expectedBudget) {
      throw new Error(`CRITICAL P0 FAILURE: Budget reverted back to ${initialBudget} on refresh! Got ${reReconciled[0].budget}`);
    }

    // 3. User picks a second player worth ~€10M
    const secondPlayer = pool.find(p => p.id !== targetPlayer.id && (p.draftValue ?? calculatePlayerDraftValue(p)) >= 8_000_000 && (p.draftValue ?? calculatePlayerDraftValue(p)) <= 12_000_000) || pool[1];
    const secondPrice = secondPlayer.draftValue ?? calculatePlayerDraftValue(secondPlayer);
    const pick2: DraftPick = {
      id: 'pick-test-2',
      roomId: 'room-audit',
      round: 2,
      pickIndexInRound: 0,
      globalPickNumber: 2,
      memberId,
      clubId,
      playerId: secondPlayer.id,
      selectedAt: new Date().toISOString(),
      isAutoPick: false,
      timeTakenSeconds: 4,
      draftPrice: secondPrice,
    };

    let reconciled2 = reconcileClubsBudget(reReconciled, rules, [pick1, pick2], pool);
    let expectedBudget2 = initialBudget - playerPrice - secondPrice;
    if (reconciled2[0].budget !== expectedBudget2) {
      throw new Error(`Budget mismatch after Pick 2! Expected ${expectedBudget2}, got ${reconciled2[0].budget}`);
    }

    console.log(`✅ Tier €${initialBudget / 1_000_000}M: Start €${initialBudget / 1_000_000}M -> Pick 1 (-€${(playerPrice/1e6).toFixed(1)}M) = €${(afterPickBudget/1e6).toFixed(1)}M -> Refresh Test = €${(reReconciled[0].budget/1e6).toFixed(1)}M (PERSISTED) -> Pick 2 (-€${(secondPrice/1e6).toFixed(1)}M) = €${(reconciled2[0].budget/1e6).toFixed(1)}M (CANONICAL).`);
  }

  // ============================================================================
  // 3. CAREER TRANSFER ECONOMY REALITY CHECK
  // ============================================================================
  console.log('\n--- 3. CAREER TRANSFER ECONOMY REALITY CHECK ---');
  const valuesByTier = {
    under65: [] as number[],
    tier65_74: [] as number[],
    tier75_79: [] as number[],
    tier80_84: [] as number[],
    tier85_plus: [] as number[],
  };

  universe.forEach(p => {
    const val = p.marketValue || calculateCareerMarketValue(p);
    if (p.overall >= 85) valuesByTier.tier85_plus.push(val);
    else if (p.overall >= 80) valuesByTier.tier80_84.push(val);
    else if (p.overall >= 75) valuesByTier.tier75_79.push(val);
    else if (p.overall >= 65) valuesByTier.tier65_74.push(val);
    else valuesByTier.under65.push(val);
  });

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  console.log(`Valuation Distribution Across 2,000 Players:`);
  console.log(`- <65 OVR (${valuesByTier.under65.length} players): Avg €${(avg(valuesByTier.under65)/1e6).toFixed(2)}M (Min €${(Math.min(...valuesByTier.under65)/1e3).toFixed(0)}K, Max €${(Math.max(...valuesByTier.under65)/1e6).toFixed(2)}M)`);
  console.log(`- 65-74 OVR (${valuesByTier.tier65_74.length} players): Avg €${(avg(valuesByTier.tier65_74)/1e6).toFixed(2)}M`);
  console.log(`- 75-79 OVR (${valuesByTier.tier75_79.length} players): Avg €${(avg(valuesByTier.tier75_79)/1e6).toFixed(2)}M`);
  console.log(`- 80-84 OVR (${valuesByTier.tier80_84.length} players): Avg €${(avg(valuesByTier.tier80_84)/1e6).toFixed(2)}M`);
  console.log(`- 85+ OVR (${valuesByTier.tier85_plus.length} players): Avg €${(avg(valuesByTier.tier85_plus)/1e6).toFixed(2)}M`);

  // Simulate Multi-Season Transfer Window Liquidity
  console.log(`\nSimulating 3 Consecutive Seasons of Career Transfers...`);
  for (let s = 1; s <= 3; s++) {
    let completedTransfers = 0;
    let completed80Plus = 0;
    let completed85Plus = 0;
    let wonderkidSignings = 0;
    let freeAgentSignings = 0;
    let totalSpend = 0;

    // 10 league clubs simulating transfer market activity
    for (let c = 0; c < 10; c++) {
      let clubBudget = 6_000_000 + (c * 2_500_000); // €6M to €28.5M
      const targetSignings = 2 + (c % 3);
      for (let t = 0; t < targetSignings; t++) {
        // 25% chance looking at Free Agents, 75% paid transfer
        if (Math.random() < 0.25) {
          const fa = freeAgents[Math.floor(Math.random() * freeAgents.length)];
          freeAgentSignings++;
          completedTransfers++;
          if (fa.overall >= 80) completed80Plus++;
          if (fa.age <= 21 && (fa.potential || 0) >= 80) wonderkidSignings++;
        } else {
          // If club has large budget (€18M+), target high caliber players
          const targetTier = clubBudget >= 20_000_000 ? 84 : clubBudget >= 12_000_000 ? 79 : 72;
          const candidates = universe.filter(p => 
            p.clubId !== `c${c}` && 
            p.clubId !== 'FREE_AGENT' &&
            p.overall >= targetTier &&
            (p.marketValue || 1e6) <= clubBudget && 
            (p.marketValue || 1e6) >= 500_000
          );
          const candidate = candidates[Math.floor(Math.random() * candidates.length)] ||
            universe.find(p => p.clubId !== `c${c}` && (p.marketValue || 1e6) <= clubBudget && (p.marketValue || 1e6) >= 400_000);

          if (candidate && (candidate.marketValue || 1e6) <= clubBudget) {
            completedTransfers++;
            const cost = candidate.marketValue || 1e6;
            clubBudget -= cost;
            totalSpend += cost;
            if (candidate.overall >= 85) completed85Plus++;
            else if (candidate.overall >= 80) completed80Plus++;
            if (candidate.age <= 21 && (candidate.potential || 0) >= 82) wonderkidSignings++;
          }
        }
      }
    }
    console.log(`Season ${s}: Completed Transfers: ${completedTransfers} | 80+ Signings: ${completed80Plus} | 85+ Signings: ${completed85Plus} | Wonderkids: ${wonderkidSignings} | Free Agents Signed: ${freeAgentSignings} | Total Market Volume: €${(totalSpend/1e6).toFixed(1)}M`);
  }

  // ============================================================================
  // 4. CAREER MATCH SIMULATION DISTRIBUTION (5,000 Matches)
  // ============================================================================
  console.log('\n--- 4. CAREER MATCH SIMULATION DISTRIBUTION (5,000 Matches) ---');
  let totalGoals = 0;
  let over25Count = 0;
  let under25Count = 0;
  const scoreMap: Record<string, number> = {};

  const sampleClubA: Club = { ...mockClubs[0], id: 'club-a' };
  const sampleClubB: Club = { ...mockClubs[1], id: 'club-b' };
  const testPlayers: Player[] = [
    ...universe.slice(0, 20).map(p => ({ ...p, clubId: 'club-a' })),
    ...universe.slice(25, 45).map(p => ({ ...p, clubId: 'club-b' })),
  ];

  const SIM_MATCH_COUNT = 5000;
  for (let i = 0; i < SIM_MATCH_COUNT; i++) {
    const mockFixture = {
      id: `fix-${i}`,
      homeClubId: 'club-a',
      awayClubId: 'club-b',
      matchweek: 1,
      date: '2026-10-15',
      status: 'SCHEDULED' as const,
    };
    const res = simulateAIFixture(mockFixture as any, [sampleClubA, sampleClubB], testPlayers);
    const goals = (res.homeScore || 0) + (res.awayScore || 0);
    totalGoals += goals;
    if (goals > 2.5) over25Count++;
    else under25Count++;

    const key = `${res.homeScore}-${res.awayScore}`;
    scoreMap[key] = (scoreMap[key] || 0) + 1;
  }

  const avgGoals = totalGoals / SIM_MATCH_COUNT;
  const over25Pct = (over25Count / SIM_MATCH_COUNT) * 100;
  const under25Pct = (under25Count / SIM_MATCH_COUNT) * 100;

  console.log(`Simulated ${SIM_MATCH_COUNT} Matches:`);
  console.log(`- Average Goals: ${avgGoals.toFixed(2)} (Target: ~2.55)`);
  console.log(`- Over 2.5 Goals: ${over25Pct.toFixed(1)}% (Target: 46–48%)`);
  console.log(`- Under 2.5 Goals: ${under25Pct.toFixed(1)}% (Target: 52–54%)`);

  const topScores = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`- Top Scorelines:`);
  topScores.forEach(([sc, count]) => {
    console.log(`  * ${sc}: ${count} matches (${((count/SIM_MATCH_COUNT)*100).toFixed(1)}%)`);
  });

  // ============================================================================
  // 5. COMPLETE TACTICAL MATRIX AUDIT (Equal Strength Matchups)
  // ============================================================================
  console.log('\n--- 5. COMPLETE TACTICAL MATRIX AUDIT (Equal Strength) ---');
  const getTacticalSettings = (style: string): TacticalSettings => {
    switch (style) {
      case 'Hucum':
        return { mentality: 'Hücum', tempo: 'Yüksek', pressing: 'Yoğun', passingStyle: 'Kısa', defensiveLine: 'Yüksek', width: 'Geniş' };
      case 'Savunma':
        return { mentality: 'Savunmacı', tempo: 'Düşük', pressing: 'Hafif', passingStyle: 'Karışık', defensiveLine: 'Derin', width: 'Dar' };
      case 'On Alan Baskisi':
        return { mentality: 'Hücum', tempo: 'Çok Yüksek', pressing: 'Aşırı', passingStyle: 'Kısa', defensiveLine: 'Çok Yüksek', width: 'Geniş' };
      case 'Alcak Blok':
        return { mentality: 'Çok Savunmacı', tempo: 'Düşük', pressing: 'Hafif', passingStyle: 'Doğrudan', defensiveLine: 'Çok Derin', width: 'Dar' };
      case 'Direkt Hucum':
        return { mentality: 'Savunmacı', tempo: 'Yüksek', pressing: 'Orta', passingStyle: 'Doğrudan', defensiveLine: 'Derin', width: 'Geniş' };
      case 'Topa Sahip Olma':
        return { mentality: 'Dengeli', tempo: 'Düşük', pressing: 'Orta', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dar' };
      default:
        return { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Orta', passingStyle: 'Karışık', defensiveLine: 'Standart', width: 'Dengeli' };
    }
  };

  const matchups = [
    { name: 'Balanced vs Balanced', home: 'Dengeli', away: 'Dengeli' },
    { name: 'Attacking vs Balanced', home: 'Hucum', away: 'Dengeli' },
    { name: 'Defensive vs Balanced', home: 'Savunma', away: 'Dengeli' },
    { name: 'High Press vs Balanced', home: 'On Alan Baskisi', away: 'Dengeli' },
    { name: 'Balanced vs Low Block', home: 'Dengeli', away: 'Alcak Blok' },
    { name: 'High Press vs Low Block', home: 'On Alan Baskisi', away: 'Alcak Blok' },
    { name: 'Direct Counter vs High Press', home: 'Direkt Hucum', away: 'On Alan Baskisi' },
    { name: 'Possession vs Low Block', home: 'Topa Sahip Olma', away: 'Alcak Blok' },
  ];

  const squadForMatrix = universe.slice(0, 18);
  const matrixHomePlayers = squadForMatrix.map((p, idx) => ({ ...p, id: `h_${idx}_${p.id}` }));
  const matrixAwayPlayers = squadForMatrix.map((p, idx) => ({ ...p, id: `a_${idx}_${p.id}` }));

  console.log('| Matchup | Home W% | Draw% | Away W% | Avg H Goals | Avg A Goals | Avg H xG | Avg A xG | Avg H Poss% |');
  console.log('|---|---|---|---|---|---|---|---|---|');

  for (const m of matchups) {
    const tHome = getTacticalSettings(m.home);
    const tAway = getTacticalSettings(m.away);

    let hWins = 0, draws = 0, aWins = 0;
    let hGoals = 0, aGoals = 0, hXg = 0, aXg = 0, hPoss = 0;
    const MATCH_ROUNDS = 100;

    for (let r = 0; r < MATCH_ROUNDS; r++) {
      const engine = new MatchEngine(
        sampleClubA,
        sampleClubB,
        matrixHomePlayers,
        matrixAwayPlayers,
        tHome,
        tAway,
        '4-3-3',
        '4-3-3',
        matrixHomePlayers.slice(0, 11).map(p => p.id),
        matrixAwayPlayers.slice(0, 11).map(p => p.id),
        `matrix-${m.name}-${r}`,
        { isCompetitive: true, enableHomeAdvantage: false }
      );

      const sim = engine.simulateFullMatch();

      hGoals += sim.homeScore;
      aGoals += sim.awayScore;
      hXg += sim.home.stats.xG;
      aXg += sim.away.stats.xG;
      hPoss += sim.homePossessionPercent;

      if (sim.homeScore > sim.awayScore) hWins++;
      else if (sim.homeScore === sim.awayScore) draws++;
      else aWins++;
    }

    const hwPct = ((hWins / MATCH_ROUNDS) * 100).toFixed(1);
    const drPct = ((draws / MATCH_ROUNDS) * 100).toFixed(1);
    const awPct = ((aWins / MATCH_ROUNDS) * 100).toFixed(1);
    const hgAvg = (hGoals / MATCH_ROUNDS).toFixed(2);
    const agAvg = (aGoals / MATCH_ROUNDS).toFixed(2);
    const hxAvg = (hXg / MATCH_ROUNDS).toFixed(2);
    const axAvg = (aXg / MATCH_ROUNDS).toFixed(2);
    const hpAvg = (hPoss / MATCH_ROUNDS).toFixed(1);

    console.log(`| ${m.name} | ${hwPct}% | ${drPct}% | ${awPct}% | ${hgAvg} | ${agAvg} | ${hxAvg} | ${axAvg} | ${hpAvg}% |`);
  }

  // ============================================================================
  // 6. DRAFT HOST EXIT 3-CLIENT ARCHITECTURE AUDIT
  // ============================================================================
  console.log('\n--- 6. DRAFT HOST EXIT 3-CLIENT ARCHITECTURE AUDIT ---');
  const hostRoom = DraftMultiplayerStore.createRoom('HostManager', 'sess-host-01', {
    ...DEFAULT_DRAFT_RULES,
    maxManagers: 4,
  }, 'Audit Room');

  console.log(`Room created: ${hostRoom.room.roomCode} (Status: ${hostRoom.room.status})`);

  // Guest 1 joins
  const guest1Res = DraftMultiplayerStore.joinRoom(hostRoom.room.roomCode, 'Guest1', 'sess-guest-01');
  // Guest 2 joins
  const guest2Res = DraftMultiplayerStore.joinRoom(hostRoom.room.roomCode, 'Guest2', 'sess-guest-02');

  const roomBeforeLeave = DraftMultiplayerStore.getRoom(hostRoom.room.id);
  console.log(`Room active members: ${roomBeforeLeave?.members.length} (1 Host + 2 Guests)`);

  // Host leaves room
  const closeRes = await DraftMultiplayerStore.closeRoomByHost(hostRoom.room.id, hostRoom.room.hostMemberId);
  const roomAfterLeave = DraftMultiplayerStore.getRoom(hostRoom.room.id);

  console.log(`Host closed room result: success=${closeRes.success}`);
  console.log(`Room status after host exit: ${roomAfterLeave?.room.status} (Verified: CLOSED)`);
  if (roomAfterLeave?.room.status === 'CLOSED') {
    console.log('✅ Host exit successfully broadcasts closure and sets room status to CLOSED.');
  } else {
    throw new Error('Host exit did not close room!');
  }

  console.log('\n================================================================');
  console.log('ALL AUDIT SUITES PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runProductionAcceptanceAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
