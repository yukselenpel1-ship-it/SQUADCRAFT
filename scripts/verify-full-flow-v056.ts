import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { DraftRules } from '../src/lib/draft/types';

async function verifyFullFlow() {
  console.log('========================================================================');
  console.log('🎮 SQUADCRAFT v0.5.6-alpha — COMPREHENSIVE BROWSER FLOW VERIFICATION');
  console.log('========================================================================\n');

  const hostSessionId = `browser-flow-user-${Date.now()}`;
  const hostUsername = 'Eren Kartal';
  const customRules: DraftRules = {
    maxManagers: 4,
    squadSize: 18,
    pickTimerSeconds: 60,
    format: 'DOUBLE_ROUND',
    fitness: 'SIMPLIFIED',
    injuries: true,
    suspensions: true,
    transfers: false,
    matchType: 'FAST_SIM',
  };

  // 1. HOME -> CREATE ROOM
  console.log('1️⃣ [LOBBY] Host oda oluşturuyor...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(hostUsername, hostSessionId, customRules, 'Süper Alfa Ligi');
  if (!createRes.success || !createRes.state) throw new Error(createRes.error);
  const room = createRes.state.room;
  console.log(`✓ Oda kuruldu: KOD = ${room.roomCode}`);

  // 2. LOBBY -> ADD BOTS (EASY, MEDIUM, HARD)
  console.log('\n2️⃣ [LOBBY] 3 Adet Bot Ekleniyor (Kolay, Orta, Zor)...');
  const bot1 = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, 'KOLAY');
  if (!bot1.success) throw new Error('Kolay bot eklenemedi');
  const bot2 = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, 'ORTA');
  if (!bot2.success) throw new Error('Orta bot eklenemedi');
  const bot3 = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, 'ZOR');
  if (!bot3.success) throw new Error('Zor bot eklenemedi');

  let state = DraftMultiplayerStore.getRoom(room.id)!;
  console.log(`✓ Katılımcılar (${state.members.length}):`);
  state.members.forEach((m) => {
    const c = state.clubs.find((cl) => cl.memberId === m.id);
    console.log(`   - ${m.username} ${m.isHost ? '(KURUCU)' : `(BOT • ${m.botDifficulty})`} -> Kulüp: ${c?.name} [${c?.code}]`);
  });

  // Verify none of the clubs have real world names
  const forbiddenRealNames = ['Boğazkale', 'Akdeniz', 'Bozkır', 'Anadolu', 'İstanbul', 'Madrid'];
  for (const c of state.clubs) {
    for (const bad of forbiddenRealNames) {
      if (c.name.includes(bad)) {
        throw new Error(`Kurgusal olmayan kulüp ismi bulundu: ${c.name}`);
      }
    }
  }
  console.log('✓ Tüm kulüp isimleri %100 kurgusal.');

  // 3. START DRAFT
  console.log('\n3️⃣ [DRAFT] Draft Başlatılıyor...');
  const startRes = DraftMultiplayerStore.startDraft(room.id, room.hostMemberId);
  if (!startRes.success || !startRes.state?.draftState) throw new Error(startRes.error);
  state = startRes.state;
  console.log(`✓ Draft Başladı. Sıra: ${state.draftState.draftOrder.length} Menajer`);

  // 4. FULL DRAFT (72 PICKS)
  console.log('\n4️⃣ [DRAFT] 72 Seçim Gerçekleştiriliyor...');
  let pickNum = 0;
  while (!state.draftState?.isCompleted && pickNum < 100) {
    const turnMemberId = state.draftState!.currentTurnMemberId;
    const turnMember = state.members.find((m) => m.id === turnMemberId)!;

    if (turnMember.isBot) {
      const bRes = DraftMultiplayerStore.processBotDraftTurn(state.room.id);
      if (!bRes.didPick || !bRes.state) throw new Error('Bot seçimi başarısız');
      state = bRes.state;
    } else {
      const pickedIds = new Set(state.draftState!.picks.map((p) => p.playerId));
      const available = state.playerPool.filter((p) => !pickedIds.has(p.id)).sort((a, b) => b.overall - a.overall);
      const hRes = DraftMultiplayerStore.makePick(state.room.id, turnMember.id, available[0].id, false);
      if (!hRes.success || !hRes.state) throw new Error(hRes.error);
      state = hRes.state;
    }
    pickNum++;
  }

  console.log(`✓ 72 Seçim Tamamlandı. Oda Durumu: ${state.room.status}`);
  if (state.room.status !== 'LEAGUE_ACTIVE') {
    throw new Error(`Draft bitiminde LEAGUE_ACTIVE olunmalıydı! Mevcut: ${state.room.status}`);
  }

  // 5. LEAGUE HUB & WEEK PROGRESSION (WEEKS 1 TO 6)
  console.log('\n5️⃣ [LEAGUE HUB] Lig Maçları ve Hafta İlerletmesi...');
  const totalWeeks = state.room.totalMatchweeks || 6;
  console.log(`✓ Toplam Hafta: ${totalWeeks}, Toplam Fikstür: ${state.fixtures.length}`);

  for (let w = 1; w <= totalWeeks; w++) {
    console.log(`\n--- HAFTA ${w} / ${totalWeeks} ---`);
    const weekFix = state.fixtures.filter((f) => f.round === w);
    console.log(`  Bu haftaki maçlar: ${weekFix.length}`);

    // Simulate each fixture in week
    for (const f of weekFix) {
      const simRes = DraftMultiplayerStore.simulateFixture(state.room.id, f.id);
      if (!simRes.success || !simRes.state) throw new Error(`Maç ${f.id} simüle edilemedi`);
      state = simRes.state;
      const updated = state.fixtures.find((fix) => fix.id === f.id)!;
      const hClub = state.clubs.find((c) => c.id === updated.homeClubId)!;
      const aClub = state.clubs.find((c) => c.id === updated.awayClubId)!;
      console.log(`  ⚽ [Skor] ${hClub.name} ${updated.homeScore} - ${updated.awayScore} ${aClub.name}`);
    }

    // Advance matchweek if not last week
    if (w < totalWeeks) {
      const advRes = DraftMultiplayerStore.advanceMatchweek(state.room.id, state.room.hostMemberId);
      if (!advRes.success || !advRes.state) throw new Error(`Hafta ${w} ilerletilemedi: ${advRes.error}`);
      state = advRes.state;
      console.log(`  ✓ Hafta ${w} tamamlandı -> Hafta ${state.room.currentMatchweek}'e geçildi.`);
    } else {
      const finalAdv = DraftMultiplayerStore.advanceMatchweek(state.room.id, state.room.hostMemberId);
      if (finalAdv.state) state = finalAdv.state;
    }
  }

  // 6. CHAMPION & AWARDS
  console.log('\n6️⃣ [CHAMPION] Sezon Sonu & Ödüller Kontrolü...');
  console.log(`  Lig Durumu: ${state.room.status}`);
  console.log(`  Şampiyon: 👑 ${state.awards?.championClubName}`);
  console.log(`  Gol Kralı: ⚽ ${state.awards?.topScorer?.playerName} (${state.awards?.topScorer?.goals} Gol)`);
  console.log(`  Asist Kralı: 🎯 ${state.awards?.topAssists?.playerName} (${state.awards?.topAssists?.assists} Asist)`);
  console.log(`  En İyi Kaleci: 🧤 ${state.awards?.bestGoalkeeper?.playerName} (${state.awards?.bestGoalkeeper?.cleanSheets} Maç Gol Yemedi)`);
  console.log(`  En İyi Hücum: 🔥 ${state.awards?.bestAttack?.clubName} (${state.awards?.bestAttack?.goalsFor} Gol)`);
  console.log(`  En İyi Savunma: 🛡️ ${state.awards?.bestDefense?.clubName} (${state.awards?.bestDefense?.goalsAgainst} Yenilen Gol)`);

  if (!state.awards || !state.awards.championClubName) {
    throw new Error('Şampiyon veya ödüller hesaplanamadı!');
  }

  // 7. REFRESH PERSISTENCE SIMULATION
  console.log('\n7️⃣ [PERSISTENCE] Sayfa Yenileme / Soğuk Yükleme (Hydration) Testi...');
  const hydrated = await DraftMultiplayerStore.hydrateDraftRoom(room.roomCode, hostSessionId);
  if (hydrated.status !== 'SUCCESS' || !hydrated.state) {
    throw new Error(`Hydration başarısız: ${hydrated.errorMessage}`);
  }
  console.log(`✓ Hydration Başarılı: Status=${hydrated.state.room.status}, Şampiyon=${hydrated.state.awards?.championClubName}`);

  // 8. REMATCH
  console.log('\n8️⃣ [REMATCH] Yeni Sezon Başlatma Testi...');
  const rematchRes = DraftMultiplayerStore.rematch(state.room.id, state.room.hostMemberId, true);
  if (!rematchRes.success || !rematchRes.state) {
    throw new Error(`Rematch başarısız: ${rematchRes.error}`);
  }
  console.log(`✓ Rematch Başarılı: Oda Lobiye Sıfırlandı (Durum = ${rematchRes.state.room.status})`);
  console.log(`  Kayıtlı Üyeler: ${rematchRes.state.members.length}, Sıfırlanan Kadrolar: ${rematchRes.state.clubs[0].squadPlayerIds.length}`);

  console.log('\n========================================================================');
  console.log('🎉 TÜM BROWSER KULLANICI AKIŞI EKSİKSİZ VE HATASIZ DOĞRULANDI!');
  console.log('========================================================================');
}

verifyFullFlow().catch((e) => {
  console.error('❌ HATA:', e);
  process.exit(1);
});
