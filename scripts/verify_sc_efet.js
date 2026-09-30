const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  const artifactDir = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

  console.log('Testing live production URL https://squadcraft.vercel.app/draft/room/SC-EFET/league...');
  await page.goto('https://squadcraft.vercel.app/draft/room/SC-EFET/league', { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(artifactDir, 'snap_prod_final_league_sc_efet.png') });
  console.log('Saved snap_prod_final_league_sc_efet.png');

  await browser.close();
}

main().catch((err) => {
  console.error('Error during live test:', err);
  process.exit(1);
});
