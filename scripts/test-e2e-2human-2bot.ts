import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { BotDifficulty, DraftRules } from '../src/lib/draft/types';

async function runE2E2Human2BotTest() {
  console.log('===========================================================');
  console.log('🧪 SQUADCRAFT v0.5.6-alpha — E2E 2-HUMAN + 2-BOT TEST');
  console.log('===========================================================\n');

  const hostSession = `human-host-${Date.now()}`;
  const secondSession = `human-second-${Date.now()}`;

  const customRules: DraftRules = {
    maxManagers: 4,
    squadSize: 18,
    pickTimerSeconds: 60,
    format: 'SINGLE_ROUND',
    fitness: 'SIMPLIFIED',
    injuries: true,
    suspensions: true,
    transfers: false,
    matchType: 'FAST_SIM',
  };

  // 1. Host creates room
  console.log('1️⃣ Host Odayı Kuruyor...');
  const createRes = await DraftMultiplayerStore.createRoomAsync('Ahmet Kurucu', hostSession, customRules, 'Alfa 2v2 Ligi');
  if (!createRes.success || !createRes.state) throw new Error(createRes.error);
  const room = createRes.state.room;
  console.log(`✓ Oda Açıldı: ${room.roomCode}`);

  // 2. Second human joins
  console.log('2️⃣ İkinci İnsan Oyuncu Katılıyor...');
  const joinRes = await DraftMultiplayerStore.joinRoomAsync(room.roomCode, 'Mehmet Forvet', secondSession, false);
  if (!joinRes.success || !joinRes.state) throw new Error(joinRes.error);
  console.log(`✓ İkinci Oyuncu Katıldı: ${joinRes.currentMember?.username}`);

  // 3. Host adds 2 Bots (Medium, Hard)
  console.log('3️⃣ 2 Adet AI Bot Ekleniyor (Orta ve Zor)...');
  const addBot1 = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, 'ORTA');
  if (!addBot1.success) throw new Error(addBot1.error);
  const addBot2 = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, 'ZOR');
  if (!addBot2.success) throw new Error(addBot2.error);
  console.log('✓ 2 Bot Eklendi.');

  // 4. Second human marks ready
  const secondMember = joinRes.state.members.find((m) => m.sessionId === secondSession)!;
  DraftMultiplayerStore.toggleMemberReady(room.id, secondMember.id);
  console.log('✓ İkinci Oyuncu Hazır.');

  // 5. Host starts draft
  console.log('4️⃣ Draft Başlatılıyor...');
  const startRes = DraftMultiplayerStore.startDraft(room.id, room.hostMemberId);
  if (!startRes.success || !startRes.state?.draftState) throw new Error(startRes.error);
  let state = startRes.state;
  console.log('✓ Draft Başladı.');

  // 6. Complete 72 picks
  console.log('5️⃣ 72 Seçim Gerçekleştiriliyor...');
  let picks = 0;
  while (!state.draftState?.isCompleted && picks < 100) {
    const turnMemberId = state.draftState!.currentTurnMemberId;
    const turnMember = state.members.find((m) => m.id === turnMemberId)!;

    if (turnMember.isBot) {
      const bRes = DraftMultiplayerStore.processBotDraftTurn(state.room.id);
      if (!bRes.didPick || !bRes.state) throw new Error('Bot seçemedi');
      state = bRes.state;
    } else {
      const pickedIds = new Set(state.draftState!.picks.map((p) => p.playerId));
      const available = state.playerPool.filter((p) => !pickedIds.has(p.id)).sort((a, b) => b.overall - a.overall);
      const pRes = DraftMultiplayerStore.makePick(state.room.id, turnMember.id, available[0].id, false);
      if (!pRes.success || !pRes.state) throw new Error(pRes.error);
      state = pRes.state;
    }
    picks++;
  }
  console.log(`✓ 72 Seçim Tamamlandı (${picks} seçim).`);

  // 7. Verify all clubs have 18 players
  for (const c of state.clubs) {
    if (c.squadPlayerIds.length !== 18) throw new Error(`Kadro boyutu hatalı: ${c.name}`);
  }
  console.log('✓ Tüm 4 Kulübün kadrosu tam 18 futbolcu.');

  // 8. Advance matches to completion
  const totalWeeks = state.room.totalMatchweeks || 3;
  for (let w = 1; w <= totalWeeks; w++) {
    const adv = DraftMultiplayerStore.advanceMatchweek(state.room.id, state.room.hostMemberId);
    if (!adv.success || !adv.state) throw new Error(adv.error);
    state = adv.state;
  }
  console.log(`✓ Tüm ${totalWeeks} hafta tamamlandı. Şampiyon: ${state.awards?.championClubName}`);

  // 9. Test Rematch
  const remRes = DraftMultiplayerStore.rematch(state.room.id, state.room.hostMemberId, true);
  if (!remRes.success || !remRes.state) throw new Error(remRes.error);
  console.log(`✓ Rematch Başarılı. Oda Lobiye Sıfırlandı: Durum=${remRes.state.room.status}`);

  console.log('\n✅ 2 İNSAN + 2 BOT TESTİ TAMAMEN BAŞARILI!');
}

runE2E2Human2BotTest().catch((e) => {
  console.error('❌ TEST BAŞARISIZ:', e);
  process.exit(1);
});
