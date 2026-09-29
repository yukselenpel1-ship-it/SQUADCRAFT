import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function captureDraftRoomVisuals() {
  console.log('🚀 Starting Draft Room Visual Capture on local Next server...');

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop 1920x1080 capture of /draft/room (Gateway Hub)
  const desktopPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  console.log('1. Navigating to /draft/room gateway...');
  await desktopPage.goto(`${BASE_URL}/draft/room`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACTS_DIR, 'production_draft_room_hub_1920x1080.png'),
    fullPage: false,
  });
  console.log('✅ Captured production_draft_room_hub_1920x1080.png');

  // 2. Create room through UI
  console.log('2. Creating room through UI...');
  const nameInputs = desktopPage.locator('input[placeholder*="Menajer"], input[type="text"]');
  // Fill the Create Room form's username input (second input)
  await nameInputs.nth(1).fill('Menajer Kerem');
  const roomTitleInput = desktopPage.locator('input[placeholder*="Şampiyonlar"]');
  await roomTitleInput.fill('Süper Lig EA Draft Şampiyonası');

  const createBtn = desktopPage.locator('button:has-text("ÖZEL ODA OLUŞTUR")');
  await createBtn.click();

  await desktopPage.waitForURL(/\/draft\/room\/[A-Z0-9-]+/, { timeout: 15000 });
  const roomUrl = desktopPage.url();
  console.log(`✅ Room Created at URL: ${roomUrl}`);

  await desktopPage.waitForTimeout(1500);

  // Add 2 bots for rich visual card presentation
  const addBotEasy = desktopPage.locator('button:has-text("Kolay")').first();
  if (await addBotEasy.isVisible()) {
    await addBotEasy.click();
    await desktopPage.waitForTimeout(800);
  }
  const addBotHard = desktopPage.locator('button:has-text("Zor")').first();
  if (await addBotHard.isVisible()) {
    await addBotHard.click();
    await desktopPage.waitForTimeout(800);
  }

  // 3. Capture Desktop Lobby
  await desktopPage.screenshot({
    path: path.join(ARTIFACTS_DIR, 'production_draft_room_lobby_1920x1080.png'),
    fullPage: false,
  });
  console.log('✅ Captured production_draft_room_lobby_1920x1080.png');

  // Open Customizer Modal and capture
  const customizerBtn = desktopPage.locator('button:has-text("Kulübümü Düzenle")').first();
  if (await customizerBtn.isVisible()) {
    await customizerBtn.click();
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({
      path: path.join(ARTIFACTS_DIR, 'production_draft_club_customizer_1920x1080.png'),
      fullPage: false,
    });
    console.log('✅ Captured production_draft_club_customizer_1920x1080.png');
    // Close modal
    const cancelBtn = desktopPage.locator('button:has-text("İptal")').first();
    if (await cancelBtn.isVisible()) await cancelBtn.click();
    await desktopPage.waitForTimeout(400);
  }

  // 4. Capture Mobile Viewport
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto(roomUrl, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS_DIR, 'production_draft_room_lobby_mobile_390x844.png'),
    fullPage: false,
  });
  console.log('✅ Captured production_draft_room_lobby_mobile_390x844.png');

  await browser.close();
  console.log('🎉 All visuals captured successfully!');
}

captureDraftRoomVisuals().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
