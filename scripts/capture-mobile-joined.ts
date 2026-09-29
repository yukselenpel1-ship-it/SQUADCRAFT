import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function captureMobileJoinedLobby() {
  const browser = await chromium.launch({ headless: true });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page = await mobileContext.newPage();

  // Create room on mobile
  await page.goto(`${BASE_URL}/draft/room`, { waitUntil: 'networkidle' });
  const nameInputs = page.locator('input[placeholder*="Menajer"], input[type="text"]');
  await nameInputs.nth(1).fill('Menajer Ali');
  await page.locator('button:has-text("ÖZEL ODA OLUŞTUR")').click();

  await page.waitForURL(/\/draft\/room\/[A-Z0-9-]+/, { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Add 1 bot
  const addBotBtn = page.locator('button:has-text("Orta")').first();
  if (await addBotBtn.isVisible()) {
    await addBotBtn.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'production_draft_room_lobby_mobile_joined_390x844.png'),
    fullPage: false,
  });
  console.log('✅ Captured production_draft_room_lobby_mobile_joined_390x844.png');

  await browser.close();
}

captureMobileJoinedLobby().catch((e) => console.error(e));
