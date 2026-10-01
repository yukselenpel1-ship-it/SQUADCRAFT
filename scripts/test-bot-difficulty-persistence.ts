import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_6_MANAGERS } from '../src/lib/draft/types';

async function main() {
  console.log('=== TEST: BOT DIFFICULTY PERSISTENCE ===');

  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'HostBoss',
    'Bot Diff Test Room',
    PRESET_6_MANAGERS
  );

  if (!createRes.success || !createRes.state) {
    console.error('Failed to create room:', createRes.error);
    process.exit(1);
  }

  const room = createRes.state.room;
  const hostMember = createRes.state.members.find((m) => m.isHost)!;
  console.log('Created room:', room.roomCode, 'Host:', hostMember.id);

  // 1. Add KOLAY bot
  console.log('\n[TEST 1] Adding KOLAY bot...');
  const addKolayRes = await DraftMultiplayerStore.addBotAsync(room.id, hostMember.id, 'KOLAY');
  if (!addKolayRes.success || !addKolayRes.state) {
    console.error('Failed to add KOLAY bot:', addKolayRes.error);
    process.exit(1);
  }
  const kolayBot = addKolayRes.state.members.find((m) => m.isBot);
  console.log('Added bot:', kolayBot?.username, 'Difficulty:', kolayBot?.botDifficulty, 'Session:', kolayBot?.sessionId);
  if (kolayBot?.botDifficulty !== 'KOLAY') {
    console.error('FAIL: Expected KOLAY but got:', kolayBot?.botDifficulty);
    process.exit(1);
  }

  // 2. Add ZOR bot
  console.log('\n[TEST 2] Adding ZOR bot...');
  const addZorRes = await DraftMultiplayerStore.addBotAsync(room.id, hostMember.id, 'ZOR');
  if (!addZorRes.success || !addZorRes.state) {
    console.error('Failed to add ZOR bot:', addZorRes.error);
    process.exit(1);
  }
  const zorBot = addZorRes.state.members.filter((m) => m.isBot)[1];
  console.log('Added bot:', zorBot?.username, 'Difficulty:', zorBot?.botDifficulty, 'Session:', zorBot?.sessionId);
  if (zorBot?.botDifficulty !== 'ZOR') {
    console.error('FAIL: Expected ZOR but got:', zorBot?.botDifficulty);
    process.exit(1);
  }

  // 3. Add ORTA bot
  console.log('\n[TEST 3] Adding ORTA bot...');
  const addOrtaRes = await DraftMultiplayerStore.addBotAsync(room.id, hostMember.id, 'ORTA');
  if (!addOrtaRes.success || !addOrtaRes.state) {
    console.error('Failed to add ORTA bot:', addOrtaRes.error);
    process.exit(1);
  }
  const ortaBot = addOrtaRes.state.members.filter((m) => m.isBot)[2];
  console.log('Added bot:', ortaBot?.username, 'Difficulty:', ortaBot?.botDifficulty, 'Session:', ortaBot?.sessionId);
  if (ortaBot?.botDifficulty !== 'ORTA') {
    console.error('FAIL: Expected ORTA but got:', ortaBot?.botDifficulty);
    process.exit(1);
  }

  // 4. Test fetchRoom / Hydrate (Simulating 1.5s / 3s polling and page refresh)
  console.log('\n[TEST 4] Simulating fetchRoom / hydrate (reconstruction from DB / storage)...');
  const fetchedState = await DraftMultiplayerStore.fetchRoom(room.id);
  if (!fetchedState) {
    console.error('Failed to fetch room');
    process.exit(1);
  }

  const fetchedBots = fetchedState.members.filter((m) => m.isBot);
  console.log('Fetched bots count:', fetchedBots.length);
  for (const b of fetchedBots) {
    console.log(`- Bot "${b.username}": difficulty=${b.botDifficulty}, personality=${b.botPersonality}`);
  }

  const b0 = fetchedBots.find((b) => b.id === kolayBot?.id);
  const b1 = fetchedBots.find((b) => b.id === zorBot?.id);
  const b2 = fetchedBots.find((b) => b.id === ortaBot?.id);

  if (b0?.botDifficulty !== 'KOLAY') {
    console.error(`FAIL: Kolay bot reverted to ${b0?.botDifficulty}!`);
    process.exit(1);
  }
  if (b1?.botDifficulty !== 'ZOR') {
    console.error(`FAIL: Zor bot reverted to ${b1?.botDifficulty}!`);
    process.exit(1);
  }
  if (b2?.botDifficulty !== 'ORTA') {
    console.error(`FAIL: Orta bot became ${b2?.botDifficulty}!`);
    process.exit(1);
  }
  console.log('✅ ALL BOT DIFFICULTIES PERSISTED ACCURATELY ACROSS REFETCH / HYDRATION!');

  // 5. Test changing bot difficulty via updateBot
  console.log('\n[TEST 5] Testing updateBot to switch Kolay bot to ZOR...');
  const updateRes = DraftMultiplayerStore.updateBot(room.id, hostMember.id, kolayBot.id, { difficulty: 'ZOR' });
  if (!updateRes.success || !updateRes.state) {
    console.error('Failed to update bot difficulty:', updateRes.error);
    process.exit(1);
  }

  const updatedBotAfterChange = updateRes.state.members.find((m) => m.id === kolayBot.id);
  console.log('Bot after update:', updatedBotAfterChange?.username, 'newDifficulty:', updatedBotAfterChange?.botDifficulty);
  if (updatedBotAfterChange?.botDifficulty !== 'ZOR') {
    console.error('FAIL: Bot difficulty did not update to ZOR!');
    process.exit(1);
  }

  // Refetch to test persistence of updated difficulty
  const refetchedAfterUpdate = await DraftMultiplayerStore.fetchRoom(room.id);
  const refetchedBot = refetchedAfterUpdate?.members.find((m) => m.id === kolayBot.id);
  console.log('Refetched bot after update:', refetchedBot?.username, 'difficulty:', refetchedBot?.botDifficulty);
  if (refetchedBot?.botDifficulty !== 'ZOR') {
    console.error('FAIL: Updated difficulty did not persist after refetch!');
    process.exit(1);
  }
  console.log('✅ BOT DIFFICULTY UPDATE & PERSISTENCE VERIFIED 100%!');

  console.log('\n================================================================');
  console.log('🎉 ALL BOT DIFFICULTY TESTS PASSED WITH ZERO ERRORS!');
  console.log('================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
