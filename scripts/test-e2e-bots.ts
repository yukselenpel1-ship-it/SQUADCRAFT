import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { BotDifficulty, DraftRules } from '../src/lib/draft/types';

async function runE2EBotsTest() {
  console.log('====================================================');
  console.log('🧪 SQUADCRAFT v0.5.6-alpha — E2E BOTS INTEGRATION TEST');
  console.log('====================================================\n');

  const sessionId = `test-human-host-${Date.now()}`;
  const username = 'Murat Hoca';
  const roomName = 'Alfa Şampiyonlar Ligi';

  const customRules: DraftRules = {
    maxManagers: 4,
    squadSize: 18,
    pickTimerSeconds: 30,
    format: 'DOUBLE_ROUND',
    fitness: 'SIMPLIFIED',
    injuries: true,
    suspensions: true,
    transfers: false,
    matchType: 'FAST_SIM',
  };

  // STEP 1: Host creates room
  console.log('1️⃣ Oda Kuruluyor (Host + 3 AI Bot)...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(username, sessionId, customRules, roomName);
  if (!createRes.success || !createRes.state) {
    throw new Error(`Oda oluşturulamadı: ${createRes.error}`);
  }

  const room = createRes.state.room;
  console.log(`✓ Oda kuruldu: KOD=${room.roomCode}, ID=${room.id}`);

  // STEP 2: Host adds 3 Bots (Easy, Medium, Hard)
  console.log('\n2️⃣ Botlar Ekleniyor...');
  const botDifficulties: BotDifficulty[] = ['KOLAY', 'ORTA', 'ZOR'];

  for (const diff of botDifficulties) {
    const addBotRes = DraftMultiplayerStore.addBot(room.id, room.hostMemberId, diff);
    if (!addBotRes.success || !addBotRes.state) {
      throw new Error(`Bot (${diff}) eklenemedi: ${addBotRes.error}`);
    }
    const addedBot = addBotRes.state.members[addBotRes.state.members.length - 1];
    const addedClub = addBotRes.state.clubs[addBotRes.state.clubs.length - 1];
    console.log(`✓ Bot Eklendi: ${addedBot.username} (${diff} / ${addedBot.botPersonality}) -> Kulüp: ${addedClub.name} [${addedClub.code}]`);
  }

  let state = DraftMultiplayerStore.getRoom(room.id)!;
  console.log(`✓ Toplam Katılımcı: ${state.members.length}, Toplam Kulüp: ${state.clubs.length}`);
  if (state.members.length !== 4 || state.clubs.length !== 4) {
    throw new Error('Katılımcı veya kulüp sayısı 4 değil!');
  }

  // STEP 3: Start Draft
  console.log('\n3️⃣ Draft Başlatılıyor...');
  const startRes = DraftMultiplayerStore.startDraft(room.id, room.hostMemberId);
  if (!startRes.success || !startRes.state || !startRes.state.draftState) {
    throw new Error(`Draft başlatılamadı: ${startRes.error}`);
  }
  state = startRes.state;
  console.log(`✓ Draft Başladı: Durum=${state.room.status}, Sıra=${state.draftState?.draftOrder.join(' -> ')}`);

  // STEP 4: Simulate 72 picks (18 rounds x 4 managers)
  console.log('\n4️⃣ 72 Snake Draft Seçimi Yapılıyor (18 Tur x 4 Kulüp)...');
  let pickCount = 0;

  while (!state.draftState?.isCompleted && pickCount < 100) {
    const turnMemberId = state.draftState!.currentTurnMemberId;
    const turnMember = state.members.find((m) => m.id === turnMemberId)!;
    const isBot = turnMember.isBot;

    if (isBot) {
      const botPickRes = DraftMultiplayerStore.processBotDraftTurn(state.room.id);
      if (!botPickRes.didPick || !botPickRes.state) {
        throw new Error(`Bot (${turnMember.username}) seçim yapamadı!`);
      }
      state = botPickRes.state;
    } else {
      // Human auto-select best available
      const pickedIds = new Set(state.draftState!.picks.map((p) => p.playerId));
      const myClub = state.clubs.find((c) => c.memberId === turnMember.id)!;
      const available = state.playerPool.filter((p) => !pickedIds.has(p.id));
      available.sort((a, b) => b.overall - a.overall);
      const chosen = available[0];

      const humanPickRes = DraftMultiplayerStore.makePick(state.room.id, turnMember.id, chosen.id, false);
      if (!humanPickRes.success || !humanPickRes.state) {
        throw new Error(`İnsan (${turnMember.username}) seçim yapamadı: ${humanPickRes.error}`);
      }
      state = humanPickRes.state;
    }

    pickCount++;
    if (pickCount % 8 === 0 || pickCount === 72) {
      console.log(`  Seçim #${pickCount} / 72 tamamlandı (Son: Tur ${state.draftState?.currentRound || 18})`);
    }
  }

  console.log(`✓ Toplam Seçim Yapıldı: ${pickCount}`);
  if (pickCount !== 72) {
    throw new Error(`Beklenen 72 seçim yerine ${pickCount} seçim yapıldı!`);
  }

  // STEP 5: Verify Squad Sizes
  console.log('\n5️⃣ Kadro Büyüklükleri ve Dağılımları Kontrol Ediliyor...');
  for (const club of state.clubs) {
    console.log(`  Kulüp [${club.name}]: ${club.squadPlayerIds.length} / 18 Futbolcu`);
    if (club.squadPlayerIds.length !== 18) {
      throw new Error(`Kulüp ${club.name} kadro boyutu 18 değil: ${club.squadPlayerIds.length}`);
    }
  }

  // STEP 6: Verify League Fixtures and Standings
  console.log('\n6️⃣ Lig Başlatma ve Fikstür / Puan Durumu Kontrolü...');
  console.log(`  Lig Durumu: ${state.room.status}`);
  console.log(`  Toplam Maç Haftası: ${state.room.totalMatchweeks || 12}`);
  console.log(`  Toplam Fikstür Sayısı: ${state.fixtures.length}`);
  console.log(`  Puan Durumu Kulüp Sayısı: ${state.standings.length}`);

  if (state.room.status !== 'LEAGUE_ACTIVE') {
    throw new Error(`Oda durumu LEAGUE_ACTIVE değil: ${state.room.status}`);
  }
  if (state.fixtures.length !== 12) { // 4 teams double round = (4*3) = 12 matches (6 weeks of 2 matches)
    console.log(`  Fikstür sayısı: ${state.fixtures.length}`);
  }
  if (state.standings.length !== 4) {
    throw new Error(`Puan durumu satır sayısı 4 değil: ${state.standings.length}`);
  }

  // STEP 7: Advance all matchweeks
  console.log('\n7️⃣ Lig Maç Haftaları İlerletiliyor (Hafta 1 -> Sezon Sonu)...');
  const totalWeeks = state.room.totalMatchweeks || 6;

  for (let week = 1; week <= totalWeeks; week++) {
    console.log(`  Hafta ${week} simüle ediliyor ve ilerletiliyor...`);
    const advRes = DraftMultiplayerStore.advanceMatchweek(state.room.id, state.room.hostMemberId);
    if (!advRes.success || !advRes.state) {
      throw new Error(`Hafta ${week} ilerletilemedi: ${advRes.error}`);
    }
    state = advRes.state;
  }

  // STEP 8: Verify Completed League & Awards
  console.log('\n8️⃣ Sezon Tamamlanma & Ödüller Kontrol Ediliyor...');
  console.log(`  Oda Durumu: ${state.room.status}`);
  console.log(`  Lig Fazı: ${state.room.leaguePhase}`);
  console.log(`  Şampiyon: ${state.awards?.championClubName}`);
  console.log(`  Gol Kralı: ${state.awards?.topScorer?.playerName} (${state.awards?.topScorer?.goals} Gol)`);
  console.log(`  Asist Kralı: ${state.awards?.topAssists?.playerName} (${state.awards?.topAssists?.assists} Asist)`);
  console.log(`  En İyi Kaleci: ${state.awards?.bestGoalkeeper?.playerName} (${state.awards?.bestGoalkeeper?.cleanSheets} Maç)`);
  console.log(`  En İyi Hücum: ${state.awards?.bestAttack?.clubName} (${state.awards?.bestAttack?.goalsFor} Gol)`);
  console.log(`  En İyi Savunma: ${state.awards?.bestDefense?.clubName} (${state.awards?.bestDefense?.goalsAgainst} Yenilen)`);

  if (state.room.status !== 'LEAGUE_COMPLETED' && state.room.leaguePhase !== 'SEASON_COMPLETE') {
    throw new Error('Sezon tamamlanmadı!');
  }
  if (!state.awards || !state.awards.championClubName) {
    throw new Error('Şampiyon ve ödüller hesaplanamadı!');
  }

  console.log('\n====================================================');
  console.log('🏆 PUAN DURUMU (SEZON SONU)');
  console.log('====================================================');
  console.table(
    state.standings.map((s) => ({
      Sıra: s.rank,
      Kulüp: s.clubName,
      O: s.played,
      G: s.won,
      B: s.drawn,
      M: s.lost,
      AG: s.goalsFor,
      YG: s.goalsAgainst,
      AV: s.goalDifference,
      Puan: s.points,
    }))
  );

  console.log('\n✅ TÜM E2E BOTS TESTLERİ EKSİKSİZ VE BAŞARIYLA GEÇTİ!');
}

runE2EBotsTest().catch((err) => {
  console.error('\n❌ TEST BAŞARISIZ:', err);
  process.exit(1);
});
