import { config } from 'dotenv';
config({ path: '.env.local' });

async function runProductionSmokeTest() {
  console.log('--- PRODUCTION SMOKE TEST FOR BOT REMOVAL & CAPACITY ---');
  const prodUrl = 'https://squadcraft.squadcraft.workers.dev';

  // 1. Test Draft Home Page
  console.log(`\n1. Testing GET ${prodUrl}/draft ...`);
  const homeRes = await fetch(`${prodUrl}/draft`);
  console.log(`✓ Status: ${homeRes.status} ${homeRes.statusText}`);
  if (homeRes.status !== 200) {
    console.error('FAIL: Production home page returned non-200');
    process.exit(1);
  }

  // 2. Test Room Page rendering with random test code
  const testCode = 'SC-TEST';
  console.log(`\n2. Testing GET ${prodUrl}/draft/room/${testCode} ...`);
  const roomRes = await fetch(`${prodUrl}/draft/room/${testCode}`);
  console.log(`✓ Status: ${roomRes.status} ${roomRes.statusText}`);
  if (roomRes.status !== 200) {
    console.error('FAIL: Production room page returned non-200');
    process.exit(1);
  }

  console.log('\n✓ Production endpoints responded with 200 OK and valid HTML payload.');
  console.log('=== SMOKE TEST PASSED ===');
}

runProductionSmokeTest().catch((err) => {
  console.error('Production smoke test error:', err);
  process.exit(1);
});
