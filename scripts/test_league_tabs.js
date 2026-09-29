const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const artifactDir = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

  console.log('Opening https://squadcraft.vercel.app/draft/room...');
  await page.goto('https://squadcraft.vercel.app/draft/room', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(artifactDir, 'snap_prod_room_hub_6mgr.png') });
  console.log('Saved snap_prod_room_hub_6mgr.png');

  // Let's also verify /draft page
  await page.goto('https://squadcraft.vercel.app/draft', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artifactDir, 'snap_prod_draft_home_6mgr.png') });
  console.log('Saved snap_prod_draft_home_6mgr.png');

  await browser.close();
}

main().catch((err) => {
  console.error('Error in test:', err);
  process.exit(1);
});
