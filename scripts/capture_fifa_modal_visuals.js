const { chromium, devices } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5';

(async () => {
  console.log('=== CAPTURING FIFA EA FC PLAYER MODAL VISUALS ===');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Context
    console.log('Launching Desktop browser (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'tr-TR',
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto('http://localhost:3000/squad', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);

    // Open first player modal
    const inspectBtn = await desktopPage.waitForSelector('button:has-text("İncele"), button:has-text("İNCELE")', { timeout: 10000 });
    await inspectBtn.click();
    await desktopPage.waitForTimeout(1200);

    // Desktop: Tab 1 (BİLGİ & KÜNYE)
    const snapDesktopBio = path.join(ARTIFACT_DIR, 'snap_fifa_player_modal_desktop_bio.png');
    await desktopPage.screenshot({ path: snapDesktopBio, fullPage: false });
    console.log('[Saved]: snap_fifa_player_modal_desktop_bio.png');

    // Desktop: Tab 2 (DETAYLI NİTELİKLER)
    const attrTab = await desktopPage.$('button:has-text("DETAYLI NİTELİKLER")');
    if (attrTab) {
      await attrTab.click();
      await desktopPage.waitForTimeout(600);
      const snapDesktopAttr = path.join(ARTIFACT_DIR, 'snap_fifa_player_modal_desktop_attributes.png');
      await desktopPage.screenshot({ path: snapDesktopAttr, fullPage: false });
      console.log('[Saved]: snap_fifa_player_modal_desktop_attributes.png');
    }

    // Desktop: Tab 3 (PLAYSTYLES)
    const playstylesTab = await desktopPage.$('button:has-text("PLAYSTYLES")');
    if (playstylesTab) {
      await playstylesTab.click();
      await desktopPage.waitForTimeout(600);
      const snapDesktopPlaystyles = path.join(ARTIFACT_DIR, 'snap_fifa_player_modal_desktop_playstyles.png');
      await desktopPage.screenshot({ path: snapDesktopPlaystyles, fullPage: false });
      console.log('[Saved]: snap_fifa_player_modal_desktop_playstyles.png');
    }

    await desktopContext.close();

    // 2. Mobile Context (iPhone 14 Pro)
    console.log('Launching Mobile iPhone 14 Pro emulation...');
    const iPhone14 = devices['iPhone 14 Pro'] || {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    };
    const mobileContext = await browser.newContext({
      ...iPhone14,
      locale: 'tr-TR',
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:3000/squad', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    const mobileInspectBtn = await mobilePage.waitForSelector('button:has-text("İncele"), button:has-text("İNCELE")', { timeout: 10000 });
    await mobileInspectBtn.click();
    await mobilePage.waitForTimeout(1200);

    const snapMobile = path.join(ARTIFACT_DIR, 'snap_fifa_player_modal_mobile.png');
    await mobilePage.screenshot({ path: snapMobile, fullPage: false });
    console.log('[Saved]: snap_fifa_player_modal_mobile.png');

    await mobileContext.close();
    console.log('=== ALL VISUALS CAPTURED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error capturing visuals:', err);
  } finally {
    await browser.close();
  }
})();
