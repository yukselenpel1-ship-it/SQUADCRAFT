async function smokeTest() {
  console.log('🌐 Smoke testing Cloudflare Production Worker: https://squadcraft.squadcraft.workers.dev\n');
  const routes = [
    '/',
    '/draft',
    '/career/new',
    '/dashboard',
    '/draft/room/SC-Y22F',
  ];

  for (const route of routes) {
    try {
      const url = `https://squadcraft.squadcraft.workers.dev${route}`;
      const res = await fetch(url);
      const text = await res.text();
      console.log(`✅ [${res.status}] ${route} - Content Length: ${text.length} bytes`);
    } catch (e: any) {
      console.error(`❌ [ERROR] ${route}:`, e.message);
    }
  }
}

smokeTest();
