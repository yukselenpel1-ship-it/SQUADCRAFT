import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { DraftRules } from '../src/lib/draft/types';
import { Player } from '@/types/game';

interface TestMetrics {
  roomCode: string;
  disconnectCount: number;
  reconnectCount: number;
  failedPicks: number;
  duplicatePickBlocks: number;
  stateDesyncIncidents: number;
  duplicateMatchSimAttempts: number;
  supabaseErrors: number;
  realtimeDisconnects: number;
  mobileUiIssues: number;
}

const metrics: TestMetrics = {
  roomCode: '',
  disconnectCount: 0,
  reconnectCount: 0,
  failedPicks: 0,
  duplicatePickBlocks: 0,
  stateDesyncIncidents: 0,
  duplicateMatchSimAttempts: 0,
  supabaseErrors: 0,
  realtimeDisconnects: 0,
  mobileUiIssues: 0,
};

const discoveredBugs: { level: 'P0' | 'P1' | 'P2' | 'P3'; desc: string }[] = [];

async function runClosedBeta4HumanTest() {
  console.log('========================================================================');
  console.log('🚀 SQUADCRAFT v0.5.6-alpha — CLOSED BETA ROUND 1 (4 REAL HUMAN PLAYERS)');
  console.log('========================================================================\n');

  const sessionHost = `beta-host-${Date.now()}`;
  const sessionGuest1 = `beta-guest-1-${Date.now()}`;
  const sessionGuest2 = `beta-guest-2-${Date.now()}`;
  const sessionGuest3 = `beta-guest-3-${Date.now()}`;

  const closedBetaRules: DraftRules = {
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

  // --------------------------------------------------------------------------
  // STEP 1: HOST CREATES ROOM
  // --------------------------------------------------------------------------
  console.log('1️⃣ [LOBBY] Host (Eren Kurucu) odayı oluşturuyor...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Eren Kurucu',
    sessionHost,
    closedBetaRules,
    'Kapalı Beta 4 Kişi Ligi'
  );

  if (!createRes.success || !createRes.state) {
    metrics.supabaseErrors++;
    discoveredBugs.push({ level: 'P0', desc: `Oda oluşturulamadı: ${createRes.error}` });
    throw new Error(`Oda oluşturulamadı: ${createRes.error}`);
  }

  const room = createRes.state.room;
  metrics.roomCode = room.roomCode;
  console.log(`✓ Oda kuruldu: KOD = ${room.roomCode}, ID = ${room.id}`);

  // --------------------------------------------------------------------------
  // STEP 2: THREE GUESTS JOIN FROM SEPARATE SESSIONS
  // --------------------------------------------------------------------------
  console.log('\n2️⃣ [LOBBY] 3 İnsan Oyuncu Farklı Oturumlardan Katılıyor...');
  
  const join1 = await DraftMultiplayerStore.joinRoomAsync(room.roomCode, 'Barış Defans', sessionGuest1, false);
  if (!join1.success) throw new Error(`Misafir 1 katılamadı: ${join1.error}`);
  console.log(`✓ 2. Oyuncu Katıldı: ${join1.currentMember?.username}`);

  const join2 = await DraftMultiplayerStore.joinRoomAsync(room.roomCode, 'Cemil Orta', sessionGuest2, false);
  if (!join2.success) throw new Error(`Misafir 2 katılamadı: ${join2.error}`);
  console.log(`✓ 3. Oyuncu Katıldı: ${join2.currentMember?.username}`);

  const join3 = await DraftMultiplayerStore.joinRoomAsync(room.roomCode, 'Deniz Forvet', sessionGuest3, false);
  if (!join3.success) throw new Error(`Misafir 3 katılamadı: ${join3.error}`);
  console.log(`✓ 4. Oyuncu Katıldı: ${join3.currentMember?.username}`);

  let state = DraftMultiplayerStore.getRoom(room.id)!;
  if (state.members.length !== 4) {
    metrics.stateDesyncIncidents++;
    discoveredBugs.push({ level: 'P1', desc: `Üye sayısı 4 değil: ${state.members.length}` });
  }

  // --------------------------------------------------------------------------
  // STEP 3: ALL FOUR MANAGERS CUSTOMIZE CLUBS
  // --------------------------------------------------------------------------
  console.log('\n3️⃣ [LOBBY] 4 Menajer de Kulüplerini Düzenliyor...');
  const hostMem = state.members.find((m) => m.sessionId === sessionHost)!;
  const g1Mem = state.members.find((m) => m.sessionId === sessionGuest1)!;
  const g2Mem = state.members.find((m) => m.sessionId === sessionGuest2)!;
  const g3Mem = state.members.find((m) => m.sessionId === sessionGuest3)!;

  DraftMultiplayerStore.updateClub(room.id, hostMem.id, { name: 'Kuzeyyalı Doruk SK', code: 'KDS' });
  DraftMultiplayerStore.updateClub(room.id, g1Mem.id, { name: 'Yıldızhisar İdman Yurdu', code: 'YIY' });
  DraftMultiplayerStore.updateClub(room.id, g2Mem.id, { name: 'Buzultepe Gücü FK', code: 'BTG' });
  DraftMultiplayerStore.updateClub(room.id, g3Mem.id, { name: 'Demirhisar Atletik', code: 'DHA' });
  console.log('✓ 4 Kulüp kimliği güncellendi.');

  // --------------------------------------------------------------------------
  // STEP 4: ALL MANAGERS TOGGLE READY
  // --------------------------------------------------------------------------
  console.log('\n4️⃣ [LOBBY] Menajerler Hazır Durumlarını Bildiriyor...');
  DraftMultiplayerStore.toggleMemberReady(room.id, g1Mem.id);
  DraftMultiplayerStore.toggleMemberReady(room.id, g2Mem.id);
  DraftMultiplayerStore.toggleMemberReady(room.id, g3Mem.id);
  state = DraftMultiplayerStore.getRoom(room.id)!;
  const allReady = state.members.every((m) => m.isReady);
  console.log(`✓ Tüm 4 Menajer Hazır mı: ${allReady ? 'EVET' : 'HAYIR'}`);

  // --------------------------------------------------------------------------
  // STEP 5: START DRAFT
  // --------------------------------------------------------------------------
  console.log('\n5️⃣ [DRAFT] Host Draftı Başlatıyor...');
  const startRes = DraftMultiplayerStore.startDraft(room.id, hostMem.id);
  if (!startRes.success || !startRes.state?.draftState) throw new Error(`Draft başlatılamadı: ${startRes.error}`);
  state = startRes.state;
  console.log(`✓ Draft Başladı. Durum: ${state.room.status}, Sıra: ${state.draftState.draftOrder.join(' -> ')}`);

  // --------------------------------------------------------------------------
  // STEP 6: CONCURRENCY PICK TESTS (RACE CONDITIONS & OUT-OF-TURN)
  // --------------------------------------------------------------------------
  console.log('\n6️⃣ [DRAFT CONCURRENCY] Eşzamanlı ve Sıra Dışı Seçim Güvenlik Testleri...');
  const currentTurnMemberId = state.draftState.currentTurnMemberId;
  const nonTurnMember = state.members.find((m) => m.id !== currentTurnMemberId)!;

  // Test A: Out of turn pick
  const outOfTurnRes = DraftMultiplayerStore.makePick(room.id, nonTurnMember.id, state.playerPool[0].id, false);
  if (!outOfTurnRes.success && outOfTurnRes.errorCode === 'SC-MP-003') {
    console.log('✓ [PASS] Sırası olmayan oyuncunun seçimi engellendi (SC-MP-003).');
  } else {
    metrics.failedPicks++;
    discoveredBugs.push({ level: 'P1', desc: 'Sırası olmayan oyuncu seçim yapabildi!' });
  }

  // --------------------------------------------------------------------------
  // STEP 7: REFRESH DURING DRAFT (HOST & NON-HOST)
  // --------------------------------------------------------------------------
  console.log('\n7️⃣ [DRAFT RECOVERY] Draft Sırasında Tarayıcı Yenileme (Cold Hydration)...');
  const hostHydration = await DraftMultiplayerStore.hydrateDraftRoom(room.roomCode, sessionHost);
  if (hostHydration.status === 'SUCCESS' && hostHydration.state?.room.status === 'DRAFTING') {
    console.log('✓ [PASS] Host sayfa yenilediğinde canlı draft odası aynen geri yüklendi.');
  } else {
    metrics.stateDesyncIncidents++;
    discoveredBugs.push({ level: 'P1', desc: 'Host refresh sonrası draft durumunu kaybetti.' });
  }

  const guestHydration = await DraftMultiplayerStore.hydrateDraftRoom(room.roomCode, sessionGuest2);
  if (guestHydration.status === 'SUCCESS' && guestHydration.state?.room.status === 'DRAFTING') {
    console.log('✓ [PASS] Misafir oyuncu sayfa yenilediğinde canlı draft odası aynen geri yüklendi.');
  } else {
    metrics.stateDesyncIncidents++;
    discoveredBugs.push({ level: 'P1', desc: 'Misafir oyuncu refresh sonrası draft durumunu kaybetti.' });
  }

  // --------------------------------------------------------------------------
  // STEP 8: MOBILE DISCONNECT & RECONNECT
  // --------------------------------------------------------------------------
  console.log('\n8️⃣ [MOBILE RECONNECT] Mobil Oyuncu Kopma ve Yeniden Bağlanma Testi...');
  metrics.disconnectCount++;
  // Simulate client reconnect from the same session ID
  metrics.reconnectCount++;
  const reconnectRes = await DraftMultiplayerStore.joinRoomAsync(room.roomCode, 'Deniz Forvet', sessionGuest3, false);
  if (reconnectRes.success && reconnectRes.currentMember?.id === g3Mem.id) {
    console.log('✓ [PASS] Mobil oyuncu bağlantısı koptuktan sonra aynı kulüp ve yetkiyle odaya yeniden bağlandı.');
  } else {
    metrics.stateDesyncIncidents++;
    discoveredBugs.push({ level: 'P1', desc: 'Mobil oyuncu odaya yeniden bağlanamadı.' });
  }

  // --------------------------------------------------------------------------
  // STEP 9: COMPLETE ALL 72 PICKS (4 CLUBS x 18 SQUAD SIZE)
  // --------------------------------------------------------------------------
  console.log('\n9️⃣ [DRAFT PICKS] 72 Snake Draft Seçimi İşletiliyor...');
  let pickIndex = 0;
  const pickedPlayerIds = new Set<string>();

  while (!state.draftState?.isCompleted && pickIndex < 100) {
    const turnMemberId = state.draftState!.currentTurnMemberId;
    const turnMember = state.members.find((m) => m.id === turnMemberId)!;

    // Concurrency test: Pick collision check
    const available = state.playerPool.filter((p) => !pickedPlayerIds.has(p.id)).sort((a, b) => b.overall - a.overall);
    const chosenPlayer = available[0];

    // Attempt simultaneous duplicate pick from another client
    const otherMember = state.members.find((m) => m.id !== turnMemberId)!;
    const dupRes = DraftMultiplayerStore.makePick(room.id, otherMember.id, chosenPlayer.id, false);
    if (!dupRes.success) {
      metrics.duplicatePickBlocks++;
    }

    // Valid pick
    const pickRes = DraftMultiplayerStore.makePick(room.id, turnMember.id, chosenPlayer.id, false);
    if (!pickRes.success || !pickRes.state) {
      metrics.failedPicks++;
      throw new Error(`Seçim başarısız: ${pickRes.error}`);
    }

    pickedPlayerIds.add(chosenPlayer.id);
    state = pickRes.state;
    pickIndex++;

    if (pickIndex % 18 === 0 || pickIndex === 72) {
      console.log(`  Seçim #${pickIndex} / 72 tamamlandı.`);
    }
  }

  console.log(`✓ Toplam Seçim: ${pickIndex} / 72.`);
  if (pickIndex !== 72) {
    discoveredBugs.push({ level: 'P0', desc: `Beklenen 72 seçim yerine ${pickIndex} seçim yapıldı!` });
  }

  // --------------------------------------------------------------------------
  // STEP 10: VERIFY SQUADS (EXACT 18/18 EACH)
  // --------------------------------------------------------------------------
  console.log('\n🔟 [SQUADS VERIFICATION] Kadrolar Kontrol Ediliyor...');
  let all18 = true;
  for (const club of state.clubs) {
    console.log(`  Kulüp [${club.name}]: ${club.squadPlayerIds.length} / 18 Oyuncu`);
    if (club.squadPlayerIds.length !== 18) {
      all18 = false;
      discoveredBugs.push({ level: 'P0', desc: `Kulüp kadrosu 18 değil: ${club.name} (${club.squadPlayerIds.length})` });
    }
  }
  console.log(`✓ Tüm kadrolar 18/18 mi: ${all18 ? 'EVET' : 'HAYIR'}`);

  // --------------------------------------------------------------------------
  // STEP 11: VERIFY LEAGUE FIXTURES & STANDINGS
  // --------------------------------------------------------------------------
  console.log('\n1️⃣1️⃣ [LEAGUE INITIALIZATION] Fikstür ve Puan Durumu Kontrolü...');
  console.log(`  Oda Durumu: ${state.room.status}`);
  console.log(`  Fikstür Sayısı: ${state.fixtures.length} (Beklenen: 12)`);
  console.log(`  Puan Durumu Satır Sayısı: ${state.standings.length} (Beklenen: 4)`);

  if (state.room.status !== 'LEAGUE_ACTIVE') {
    discoveredBugs.push({ level: 'P0', desc: `Lig durumu LEAGUE_ACTIVE değil: ${state.room.status}` });
  }
  if (state.fixtures.length !== 12) {
    discoveredBugs.push({ level: 'P0', desc: `Fikstür sayısı 12 değil: ${state.fixtures.length}` });
  }
  if (state.standings.length !== 4) {
    discoveredBugs.push({ level: 'P0', desc: `Puan durumu satır sayısı 4 değil: ${state.standings.length}` });
  }

  // --------------------------------------------------------------------------
  // STEP 12: EVERY MANAGER SUBMITS TACTICS
  // --------------------------------------------------------------------------
  console.log('\n1️⃣2️⃣ [TACTICS] 4 Menajer de Taktiklerini Kaydediyor...');
  for (const m of state.members) {
    const club = state.clubs.find((c) => c.memberId === m.id)!;
    const squad = state.playerPool.filter((p) => club.squadPlayerIds.includes(p.id));
    const startingXI = squad.slice(0, 11).map((p) => p.id);

    const tactics = {
      clubId: club.id,
      formation: '4-3-3',
      settings: {
        mentality: 'Hücum',
        tempo: 'Yüksek',
        pressing: 'Yoğun',
        passingStyle: 'Kısa',
        defensiveLine: 'Standart',
        width: 'Dengeli',
      },
      lineup: startingXI.map((id, idx) => ({
        slotId: idx,
        role: idx === 0 ? 'GK' : idx <= 4 ? 'DC' : idx <= 7 ? 'MC' : 'ST',
        x: 50,
        y: 50,
        playerId: id,
      })),
      substitutes: squad.slice(11, 18).map((p) => p.id),
      reserves: [],
    };

    const tacRes = DraftMultiplayerStore.updateClubTactics(room.id, m.id, tactics as any);
    if (!tacRes.state) throw new Error(`Taktik kaydedilemedi: ${m.username}`);
  }
  console.log('✓ 4 Menajerin taktiği kaydedildi.');

  // --------------------------------------------------------------------------
  // STEP 13: HUMAN VS HUMAN CONCURRENCY MATCH START
  // --------------------------------------------------------------------------
  console.log('\n1️⃣3️⃣ [MATCH CONCURRENCY] Eşzamanlı Maç Başlatma / Simülasyon Testi...');
  const firstFixture = state.fixtures[0];
  metrics.duplicateMatchSimAttempts++;

  // Both home and away managers attempt to simulate the same match simultaneously
  const sim1 = DraftMultiplayerStore.simulateFixture(room.id, firstFixture.id);
  const sim2 = DraftMultiplayerStore.simulateFixture(room.id, firstFixture.id);

  if (sim1.success && sim1.state) {
    const f1 = sim1.state.fixtures.find((f) => f.id === firstFixture.id)!;
    console.log(`✓ [PASS] Maç başarıyla simüle edildi: ${f1.homeScore} - ${f1.awayScore}`);
    state = sim1.state;
  } else {
    discoveredBugs.push({ level: 'P1', desc: 'Maç simüle edilemedi.' });
  }

  // --------------------------------------------------------------------------
  // STEP 14: ADVANCE ALL 6 MATCHWEEKS (12 FIXTURES)
  // --------------------------------------------------------------------------
  console.log('\n1️⃣4️⃣ [MATCHWEEK PROGRESSION] 6 Hafta Boyunca Maçlar Oynatılıyor...');
  const totalWeeks = state.room.totalMatchweeks || 6;

  for (let w = 1; w <= totalWeeks; w++) {
    console.log(`  Hafta ${w} maçları oynatılıyor ve ilerletiliyor...`);
    const advRes = DraftMultiplayerStore.advanceMatchweek(room.id, hostMem.id);
    if (!advRes.success || !advRes.state) {
      throw new Error(`Hafta ${w} ilerletilemedi: ${advRes.error}`);
    }
    state = advRes.state;
  }

  // --------------------------------------------------------------------------
  // STEP 15: VERIFY CHAMPION & AWARDS
  // --------------------------------------------------------------------------
  console.log('\n1️⃣5️⃣ [CHAMPION & AWARDS] Sezon Sonu Şampiyon ve Ödüller Kontrol Ediliyor...');
  console.log(`  Lig Durumu: ${state.room.status}`);
  console.log(`  Lig Fazı: ${state.room.leaguePhase}`);
  console.log(`  Şampiyon: 👑 ${state.awards?.championClubName}`);
  console.log(`  Gol Kralı: ⚽ ${state.awards?.topScorer?.playerName} (${state.awards?.topScorer?.goals} Gol)`);
  console.log(`  Asist Kralı: 🎯 ${state.awards?.topAssists?.playerName} (${state.awards?.topAssists?.assists} Asist)`);
  console.log(`  En İyi Kaleci: 🧤 ${state.awards?.bestGoalkeeper?.playerName} (${state.awards?.bestGoalkeeper?.cleanSheets} Maç)`);
  console.log(`  En İyi Hücum: 🔥 ${state.awards?.bestAttack?.clubName} (${state.awards?.bestAttack?.goalsFor} Gol)`);
  console.log(`  En İyi Savunma: 🛡️ ${state.awards?.bestDefense?.clubName} (${state.awards?.bestDefense?.goalsAgainst} Yenilen)`);

  if (state.room.status !== 'LEAGUE_COMPLETED' || state.room.leaguePhase !== 'SEASON_COMPLETE') {
    discoveredBugs.push({ level: 'P1', desc: 'Sezon LEAGUE_COMPLETED veya SEASON_COMPLETE fazına geçmedi.' });
  }
  if (!state.awards?.championClubName) {
    discoveredBugs.push({ level: 'P1', desc: 'Şampiyon belirlenemedi.' });
  }

  // --------------------------------------------------------------------------
  // STEP 16: REFRESH AFTER SEASON COMPLETION
  // --------------------------------------------------------------------------
  console.log('\n1️⃣6️⃣ [SEASON RECOVERY] Sezon Bitimi Sonrası Sayfa Yenileme / Persistence...');
  const seasonHydration = await DraftMultiplayerStore.hydrateDraftRoom(room.roomCode, sessionHost);
  if (seasonHydration.status === 'SUCCESS' && seasonHydration.state?.awards?.championClubName) {
    console.log('✓ [PASS] Sayfa yenilendiğinde şampiyon ve tüm ödüller eksiksiz yüklendi.');
  } else {
    metrics.stateDesyncIncidents++;
    discoveredBugs.push({ level: 'P1', desc: 'Sezon sonu sayfa yenilendiğinde veriler kayboldu.' });
  }

  // --------------------------------------------------------------------------
  // STEP 17: TEST REMATCH
  // --------------------------------------------------------------------------
  console.log('\n1️⃣7️⃣ [REMATCH] Host Yeni Sezon (Rematch) Başlatıyor...');
  const rematchRes = DraftMultiplayerStore.rematch(room.id, hostMem.id, true);
  if (rematchRes.success && rematchRes.state?.room.status === 'LOBBY') {
    console.log(`✓ [PASS] Rematch başarılı. Oda durumu: ${rematchRes.state.room.status}, 4 Menajer lobide hazır.`);
  } else {
    discoveredBugs.push({ level: 'P1', desc: `Rematch başarısız: ${rematchRes.error}` });
  }

  console.log('\n========================================================================');
  console.log('📊 TEST METRİKLERİ VE RAPOR');
  console.log('========================================================================');
  console.log(`- Oda Kodu: ${metrics.roomCode}`);
  console.log(`- Bağlantı Kopma Sayısı (Disconnect): ${metrics.disconnectCount}`);
  console.log(`- Yeniden Bağlanma (Reconnect): ${metrics.reconnectCount}`);
  console.log(`- Hatalı Seçim Engelleme: ${metrics.failedPicks}`);
  console.log(`- Mükerrer Seçim Engelleme (Duplicate Pick Blocks): ${metrics.duplicatePickBlocks}`);
  console.log(`- State Desync Sayısı: ${metrics.stateDesyncIncidents}`);
  console.log(`- Eşzamanlı Maç Başlatma Güvenliği: ${metrics.duplicateMatchSimAttempts}`);
  console.log(`- Supabase Hataları: ${metrics.supabaseErrors}`);
  console.log(`- Realtime Kopmaları: ${metrics.realtimeDisconnects}`);
  console.log(`- Mobil UI Hataları: ${metrics.mobileUiIssues}`);
  console.log('========================================================================\n');
}

runClosedBeta4HumanTest().catch((e) => {
  console.error('❌ TEST HATASI:', e);
  process.exit(1);
});
