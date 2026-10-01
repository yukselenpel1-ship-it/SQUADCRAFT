import { DraftMultiplayerStore, reconcileClubsBudget } from '../src/lib/draft/multiplayerStore';
import { DEFAULT_DRAFT_BUDGET, DEFAULT_DRAFT_RULES, DraftRules, DraftClub, DraftPick } from '../src/lib/draft/types';
import { getCachedDraftPlayerPool, calculatePlayerDraftValue } from '../src/lib/draft/playerPool';

async function runBudgetZeroResetVerification() {
  console.log('================================================================');
  console.log('SQUADCRAFT — P0 DRAFT BUDGET ZERO-RESET AUDIT & VERIFICATION');
  console.log('================================================================\n');

  const budgetsToTest = [100_000_000, 150_000_000, 250_000_000, 300_000_000];
  const playerPool = getCachedDraftPlayerPool();

  for (const testBudget of budgetsToTest) {
    const budgetInM = testBudget / 1_000_000;
    console.log(`\n--- TESTING ROOM BUDGET: €${budgetInM}M ---`);

    const rules: DraftRules = {
      ...DEFAULT_DRAFT_RULES,
      draftBudget: testBudget,
      maxManagers: 4,
      squadSize: 18,
    };

    // 1. Create Room (Host + 3 Bots)
    const hostRoom = DraftMultiplayerStore.createRoom('HostTestManager', 'sess-host-' + testBudget, rules, `BudgetTest-${budgetInM}M`);
    const roomId = hostRoom.room.id;
    const roomCode = hostRoom.room.roomCode;
    const hostMemberId = hostRoom.room.hostMemberId;

    // Add 3 Bots
    DraftMultiplayerStore.addBot(roomId, hostMemberId, 'KOLAY');
    DraftMultiplayerStore.addBot(roomId, hostMemberId, 'ORTA');
    DraftMultiplayerStore.addBot(roomId, hostMemberId, 'ZOR');

    // Start Draft
    const startRes = DraftMultiplayerStore.startDraft(roomId, hostMemberId);
    if (!startRes.success || !startRes.state || !startRes.state.draftState) {
      throw new Error(`Failed to start draft for €${budgetInM}M: ${startRes.error}`);
    }

    const stateAfterStart = startRes.state;
    const hostClub = stateAfterStart.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[INIT] Host Club: ${hostClub.name} | Budget: €${(hostClub.budget / 1e6).toFixed(1)}M | Target Initial: €${budgetInM}M`);

    if (hostClub.budget !== testBudget) {
      throw new Error(`Initial budget mismatch! Expected €${budgetInM}M, got €${(hostClub.budget / 1e6).toFixed(1)}M`);
    }

    // Process turns until Host gets turn
    let state = stateAfterStart;
    while (state.draftState && state.draftState.currentTurnMemberId !== hostMemberId) {
      const botTurnRes = DraftMultiplayerStore.processBotDraftTurn(roomId);
      if (!botTurnRes.didPick || !botTurnRes.state) {
        throw new Error('Initial bot turn failed!');
      }
      state = botTurnRes.state;
    }

    const hostClubBeforePick = state.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[TURN REACHED HOST] Host budget before pick: €${(hostClubBeforePick.budget / 1e6).toFixed(1)}M`);
    if (hostClubBeforePick.budget !== testBudget) {
      throw new Error(`Host budget corrupted before first pick! Got €${(hostClubBeforePick.budget / 1e6).toFixed(1)}M, expected €${budgetInM}M`);
    }

    // 2. Human Turn: Make Pick 1
    const pickedSoFar = new Set(state.draftState!.picks.map(p => p.playerId));
    const affordablePlayer1 = playerPool.filter(p => !pickedSoFar.has(p.id)).find(p => (p.draftValue || 0) <= (testBudget * 0.4) && (p.draftValue || 0) >= 10_000_000) || playerPool[0];
    const player1Price = affordablePlayer1.draftValue || calculatePlayerDraftValue(affordablePlayer1);
    const expectedRemaining1 = testBudget - player1Price;

    console.log(`[ACTION] Host picks player 1: ${affordablePlayer1.firstName} ${affordablePlayer1.lastName} (Price: €${(player1Price / 1e6).toFixed(1)}M)`);

    const pick1Res = DraftMultiplayerStore.makePick(roomId, hostMemberId, affordablePlayer1.id, false);
    if (!pick1Res.success || !pick1Res.state) {
      throw new Error(`Human pick 1 failed: ${pick1Res.error}`);
    }

    const hostClubAfterPick1 = pick1Res.state.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[PICK 1 RESULT] Host remaining budget: €${(hostClubAfterPick1.budget / 1e6).toFixed(1)}M (Expected: €${(expectedRemaining1 / 1e6).toFixed(1)}M)`);

    if (Math.abs(hostClubAfterPick1.budget - expectedRemaining1) > 1) {
      throw new Error(`Post-pick remaining budget incorrect! Got €${(hostClubAfterPick1.budget / 1e6).toFixed(1)}M, expected €${(expectedRemaining1 / 1e6).toFixed(1)}M`);
    }

    // 3. Bot Turns Execution (Let bots pick until next turn cycle)
    let turnsRun = 0;
    while (pick1Res.state.draftState && !pick1Res.state.draftState.isCompleted && turnsRun < 3) {
      const turnMember = pick1Res.state.members.find(m => m.id === pick1Res.state?.draftState?.currentTurnMemberId);
      if (turnMember && turnMember.isBot) {
        const botPickRes = DraftMultiplayerStore.processBotDraftTurn(roomId);
        if (!botPickRes.didPick || !botPickRes.state) break;
        turnsRun++;
        const hostClubDuringBotTurn = botPickRes.state.clubs.find(c => c.memberId === hostMemberId)!;
        console.log(`[BOT TURN ${turnsRun}] Host budget after bot pick: €${(hostClubDuringBotTurn.budget / 1e6).toFixed(1)}M (Must stay €${(expectedRemaining1 / 1e6).toFixed(1)}M)`);

        if (hostClubDuringBotTurn.budget !== expectedRemaining1) {
          throw new Error(`CRITICAL RESET DETECTED during Bot turn! Budget reverted to €${(hostClubDuringBotTurn.budget / 1e6).toFixed(1)}M instead of staying at €${(expectedRemaining1 / 1e6).toFixed(1)}M!`);
        }
      } else {
        break;
      }
    }

    // 4. Polling / Realtime / Hydration Simulation
    console.log(`[SIMULATION] Triggering Hydration / Reconcile cycle (simulating realtime postgres_changes & 3s polling)...`);
    const hydratedResult = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, 'sess-host-' + testBudget);
    if (hydratedResult.status !== 'SUCCESS' || !hydratedResult.state) {
      throw new Error(`Hydration failed: ${hydratedResult.errorMessage}`);
    }

    const hostClubAfterHydrate = hydratedResult.state.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[HYDRATE RESULT] Host budget after hydration: €${(hostClubAfterHydrate.budget / 1e6).toFixed(1)}M (Must stay €${(expectedRemaining1 / 1e6).toFixed(1)}M)`);

    if (hostClubAfterHydrate.budget !== expectedRemaining1) {
      throw new Error(`CRITICAL RESET DETECTED after hydration! Budget reverted to €${(hostClubAfterHydrate.budget / 1e6).toFixed(1)}M!`);
    }

    // 5. Pick 2 by Human (advance until host's turn)
    let statePick2 = hydratedResult.state;
    while (statePick2.draftState && !statePick2.draftState.isCompleted && statePick2.draftState.currentTurnMemberId !== hostMemberId) {
      const botPickRes = DraftMultiplayerStore.processBotDraftTurn(roomId);
      if (!botPickRes.didPick || !botPickRes.state) break;
      statePick2 = botPickRes.state;
      const hostClubDuringBotTurn = statePick2.clubs.find(c => c.memberId === hostMemberId)!;
      if (hostClubDuringBotTurn.budget !== expectedRemaining1) {
        throw new Error(`CRITICAL RESET DETECTED during Bot turn before Pick 2! Budget was €${(hostClubDuringBotTurn.budget/1e6).toFixed(1)}M, expected €${(expectedRemaining1/1e6).toFixed(1)}M`);
      }
    }

    // Pick 2 player
    const pickedSet = new Set(statePick2.draftState?.picks.map(p => p.playerId));
    const availablePlayers = playerPool.filter(p => !pickedSet.has(p.id));
    const affordablePlayer2 = availablePlayers.find(p => (p.draftValue || 0) <= 25_000_000 && (p.draftValue || 0) >= 10_000_000) || availablePlayers[0];
    const player2Price = affordablePlayer2.draftValue || calculatePlayerDraftValue(affordablePlayer2);
    const expectedRemaining2 = expectedRemaining1 - player2Price;

    console.log(`[ACTION] Host picks player 2: ${affordablePlayer2.firstName} ${affordablePlayer2.lastName} (Price: €${(player2Price / 1e6).toFixed(1)}M)`);

    const pick2Res = DraftMultiplayerStore.makePick(roomId, hostMemberId, affordablePlayer2.id, false);
    if (!pick2Res.success || !pick2Res.state) {
      throw new Error(`Human pick 2 failed: ${pick2Res.error}`);
    }

    const hostClubAfterPick2 = pick2Res.state.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[PICK 2 RESULT] Host remaining budget: €${(hostClubAfterPick2.budget / 1e6).toFixed(1)}M (Expected: €${(expectedRemaining2 / 1e6).toFixed(1)}M)`);

    if (Math.abs(hostClubAfterPick2.budget - expectedRemaining2) > 1) {
      throw new Error(`Post-pick 2 remaining budget incorrect! Got €${(hostClubAfterPick2.budget / 1e6).toFixed(1)}M, expected €${(expectedRemaining2 / 1e6).toFixed(1)}M`);
    }

    // Second Hydration cycle
    const hydratedResult2 = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, 'sess-host-' + testBudget);
    const hostClubAfterHydrate2 = hydratedResult2.state?.clubs.find(c => c.memberId === hostMemberId)!;
    console.log(`[HYDRATE 2 RESULT] Host budget after 2nd hydration: €${(hostClubAfterHydrate2.budget / 1e6).toFixed(1)}M (Must stay €${(expectedRemaining2 / 1e6).toFixed(1)}M)`);

    if (hostClubAfterHydrate2.budget !== expectedRemaining2) {
      throw new Error(`CRITICAL RESET DETECTED after 2nd hydration! Budget reverted!`);
    }

    console.log(`✅ Room €${budgetInM}M: ZERO RESETS CONFIRMED (Picks: 2, Spent: €${((player1Price + player2Price)/1e6).toFixed(1)}M, Remaining: €${(expectedRemaining2/1e6).toFixed(1)}M)`);
  }

  console.log('\n================================================================');
  console.log('✅ ALL TEST BUDGETS (€100M, €150M, €250M, €300M) PASSED WITH 0 RESETS!');
  console.log('================================================================');
}

runBudgetZeroResetVerification().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
