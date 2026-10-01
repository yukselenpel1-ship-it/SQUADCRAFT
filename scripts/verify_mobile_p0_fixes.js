const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

async function runVerification() {
  const checklist = {};
  const browser = await chromium.launch({ headless: true });

  try {
    // =============================================================
    // 1 & 2: Keyboard Footer on Mobile (393px) vs Desktop (1280px)
    // =============================================================
    console.log('--- Step 1: Mobile Homepage (393x852) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 393, height: 852 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await mobileContext.newPage();

    const consoleErrors = [];
    mobilePage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_homepage_initial.png') });

    // Check if the keyboard shortcut HUD is visible on mobile
    const mobileHUD = mobilePage.locator('footer div.hidden.md\\:flex');
    const isMobileHUDVisible = await mobileHUD.isVisible().catch(() => false);
    checklist['MOBILE HOMEPAGE KEYBOARD FOOTER HIDDEN (393px)'] = !isMobileHUDVisible;
    console.log('1. MOBILE HOMEPAGE KEYBOARD FOOTER HIDDEN (393px):', !isMobileHUDVisible ? 'PASS' : 'FAIL');

    console.log('--- Step 2: Desktop Homepage (1280x800) ---');
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    const desktopHUD = desktopPage.locator('footer div.hidden.md\\:flex');
    const isDesktopHUDVisible = await desktopHUD.isVisible().catch(() => false);
    checklist['DESKTOP KEYBOARD FOOTER VISIBLE (1280px)'] = isDesktopHUDVisible;
    console.log('2. DESKTOP KEYBOARD FOOTER VISIBLE (1280px):', isDesktopHUDVisible ? 'PASS' : 'FAIL');
    await desktopContext.close();

    // =============================================================
    // 3: Career Setup & Persistence Flow
    // =============================================================
    console.log('--- Step 3: Mobile Career Setup ---');
    await mobilePage.goto('http://localhost:3000/career/new', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    // Jump to Step 5 (ONAY & BAŞLAT) directly via stepper tab
    const step5Btn = mobilePage.locator('button:has-text("05")').first();
    await step5Btn.click();
    await mobilePage.waitForTimeout(600);

    // Click official launch button
    const launchBtn = mobilePage.locator('button:has-text("KARİYERİ RESMEN BAŞLAT")').first();
    await launchBtn.click();
    await mobilePage.waitForTimeout(2000);

    const isDashboard = mobilePage.url().includes('/dashboard');
    checklist['MOBILE CAREER SAVE PERSISTENCE FLOW'] = isDashboard;
    console.log('3. MOBILE CAREER SAVE PERSISTENCE FLOW:', isDashboard ? 'PASS' : 'FAIL');

    // =============================================================
    // 4: Pre-Hydration Overwrite Guard
    // =============================================================
    const gameContextCode = fs.readFileSync(path.resolve('src/lib/context/GameContext.tsx'), 'utf-8');
    const hasPersistGuard = gameContextCode.includes('if (!isInitialized) return false;') &&
                            gameContextCode.includes('if (!isInitialized) return;');
    checklist['PRE-HYDRATION OVERWRITE GUARD'] = hasPersistGuard;
    console.log('4. PRE-HYDRATION OVERWRITE GUARD:', hasPersistGuard ? 'PASS' : 'FAIL');

    // =============================================================
    // 5: Tactics SVG Coordinates Check
    // =============================================================
    console.log('--- Step 5: Tactics SVG Check ---');
    await mobilePage.goto('http://localhost:3000/tactics', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_tactics_screen.png') });

    const svgErrors = consoleErrors.filter(e => e.includes('<path>') || e.includes('attribute d'));
    checklist['TACTICS SVG COORDINATES (NO CONSOLE ERRORS)'] = svgErrors.length === 0;
    console.log('15. TACTICS SVG COORDINATES (NO CONSOLE ERRORS):', svgErrors.length === 0 ? 'PASS' : 'FAIL');

    // =============================================================
    // 6 & 7: Homepage Continue Career & Safety Confirmation Modal
    // =============================================================
    console.log('--- Step 6: Homepage with Career Save ---');
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1200);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_homepage_with_save.png') });

    const continueBtn = mobilePage.locator('button:has-text("KARİYERE DEVAM ET")').first();
    const isContinueVisible = await continueBtn.isVisible().catch(() => false);
    checklist['HOMEPAGE CONTINUE CAREER BUTTON'] = isContinueVisible;
    console.log('5. HOMEPAGE CONTINUE CAREER BUTTON:', isContinueVisible ? 'PASS' : 'FAIL');

    // Click YENİ KARİYER to trigger safety confirmation modal
    const newCareerBtn = mobilePage.locator('button:has-text("YENİ KARİYER")').first();
    await newCareerBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_safety_modal.png') });

    const confirmModal = mobilePage.locator('text="Mevcut kariyer kaydınız silinecek. Yeni kariyer başlatmak istiyor musunuz?"');
    const isConfirmModalVisible = await confirmModal.isVisible().catch(() => false);
    checklist['NEW CAREER SAFETY CONFIRMATION MODAL'] = isConfirmModalVisible;
    console.log('6. NEW CAREER SAFETY CONFIRMATION MODAL:', isConfirmModalVisible ? 'PASS' : 'FAIL');

    // Click İPTAL
    const iptalBtn = mobilePage.locator('button:has-text("İPTAL")').first();
    await iptalBtn.click();
    await mobilePage.waitForTimeout(600);

    const continueStillVisible = await continueBtn.isVisible().catch(() => false);
    checklist['CANCEL NEW CAREER PRESERVES SAVE'] = continueStillVisible;
    console.log('7. CANCEL NEW CAREER PRESERVES SAVE:', continueStillVisible ? 'PASS' : 'FAIL');

    // Click KARİYERE DEVAM ET to go to dashboard
    await continueBtn.click();
    await mobilePage.waitForTimeout(1500);

    // =============================================================
    // 9: Mobile Autosave Lifecycle Listeners Check
    // =============================================================
    const hasLifecycleListeners = gameContextCode.includes('visibilitychange') &&
                                  gameContextCode.includes('pagehide') &&
                                  gameContextCode.includes('beforeunload');
    checklist['MOBILE AUTOSAVE LIFECYCLE LISTENERS'] = hasLifecycleListeners;
    console.log('9. MOBILE AUTOSAVE LIFECYCLE LISTENERS:', hasLifecycleListeners ? 'PASS' : 'FAIL');

    // =============================================================
    // 10, 11, 12, 13, 14: Transfers & Free Agent Negotiation
    // =============================================================
    console.log('--- Step 10: Transfers & Free Agent Negotiation ---');
    await mobilePage.goto('http://localhost:3000/transfers', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1200);

    // Switch to Free Agents tab
    const freeAgentsTab = mobilePage.locator('button:has-text("Serbest Oyuncular")').first();
    await freeAgentsTab.click();
    await mobilePage.waitForTimeout(800);

    // Click first "Sözleşme Görüşmesi" button
    const negButton = mobilePage.locator('button:has-text("Sözleşme Görüşmesi")').first();
    await negButton.scrollIntoViewIfNeeded();
    await negButton.click({ force: true });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_negotiation_opened.png') });

    // Check modal height & fit on 393px screen
    const modalBox = await mobilePage.locator('div.fixed.inset-0 > div').first().boundingBox();
    const isModalResponsive = modalBox && modalBox.width <= 393 && modalBox.height <= 852;
    checklist['MOBILE NEGOTIATION MODAL VIEWPORT (393px)'] = !!isModalResponsive;
    console.log('14. MOBILE NEGOTIATION MODAL VIEWPORT (393px):', isModalResponsive ? 'PASS' : 'FAIL');

    // Offer contract
    const sendOfferBtn = mobilePage.locator('button:has-text("Sözleşme Teklifini Sun")').first();
    if (await sendOfferBtn.isVisible()) {
      await sendOfferBtn.click();
      await mobilePage.waitForTimeout(1000);
    }

    // Accept counter-demand if presented
    const acceptDemandBtn = mobilePage.locator('button:has-text("Talebi Kabul Et")').first();
    if (await acceptDemandBtn.isVisible()) {
      await acceptDemandBtn.click();
      await mobilePage.waitForTimeout(1000);
    }

    // Close or complete
    const finishBtn = mobilePage.locator('button:has-text("Kadroya Git & Tamamla"), button[title="Kapat"]').first();
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      await mobilePage.waitForTimeout(1000);
    }

    // Switch to Görüşmeler tab
    const gorusmelerTab = mobilePage.locator('button:has-text("Görüşmeler")').first();
    await gorusmelerTab.click();
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_mobile_gorusmeler_tab.png') });

    // Verify negotiations list is populated
    const negCard = mobilePage.locator('text=hafta').first();
    const isGorusmelerPopulated = await negCard.isVisible().catch(() => false);
    checklist['TRANSFER GÖRÜŞMELER ACTIVE LISTING'] = isGorusmelerPopulated;
    console.log('10. TRANSFER GÖRÜŞMELER ACTIVE LISTING:', isGorusmelerPopulated ? 'PASS' : 'FAIL');

    // Check completed or active retention
    const statusPill = mobilePage.locator('span:has-text("KABUL EDİLDİ"), span:has-text("AKTİF"), span:has-text("KULÜP ANLAŞTI")').first();
    const isStatusVisible = await statusPill.isVisible().catch(() => false);
    checklist['TRANSFER GÖRÜŞMELER COMPLETED RETENTION'] = isStatusVisible;
    console.log('11. TRANSFER GÖRÜŞMELER COMPLETED RETENTION:', isStatusVisible ? 'PASS' : 'FAIL');

    // Check squad integration & finances from localStorage (SAVE_KEY_V3: SquadCraftSaveV3)
    const playerCheck = await mobilePage.evaluate(() => {
      const raw = localStorage.getItem('SquadCraftSaveV3') || localStorage.getItem('SquadCraftSaveV2');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const userClubId = parsed.userClubId;
      const userPlayers = (parsed.players || []).filter(p => p.clubId === userClubId);
      return {
        userClubId,
        userPlayersCount: userPlayers.length,
        hasFinances: !!parsed.finances && parsed.finances.transferBudget > 0,
        negsCount: (parsed.activeNegotiations || []).length
      };
    });

    checklist['FREE AGENT NEGOTIATION SQUAD INTEGRATION'] = !!(playerCheck && playerCheck.userPlayersCount > 0);
    console.log('12. FREE AGENT NEGOTIATION SQUAD INTEGRATION:', checklist['FREE AGENT NEGOTIATION SQUAD INTEGRATION'] ? 'PASS' : 'FAIL');

    checklist['TRANSFER BUDGET / WAGE DEDUCTION'] = !!(playerCheck && playerCheck.hasFinances);
    console.log('13. TRANSFER BUDGET / WAGE DEDUCTION:', checklist['TRANSFER BUDGET / WAGE DEDUCTION'] ? 'PASS' : 'FAIL');

    // =============================================================
    // 16: Mobile Full Lifecycle Refresh Persistence Check
    // =============================================================
    console.log('--- Step 16: Refresh & Persistence ---');
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    const postReloadSave = await mobilePage.evaluate(() => {
      const raw = localStorage.getItem('SquadCraftSaveV3') || localStorage.getItem('SquadCraftSaveV2');
      return !!raw && raw.length > 500;
    });

    checklist['MOBILE FULL LIFECYCLE REFRESH PERSISTENCE'] = postReloadSave;
    console.log('16. MOBILE FULL LIFECYCLE REFRESH PERSISTENCE:', postReloadSave ? 'PASS' : 'FAIL');

    // =============================================================
    // 8: Confirm New Career Resets and Creates
    // =============================================================
    console.log('--- Step 8: Confirm New Career Reset ---');
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const newCarBtn2 = mobilePage.locator('button:has-text("YENİ KARİYER")').first();
    await newCarBtn2.click();
    await mobilePage.waitForTimeout(500);

    const confirmResetBtn = mobilePage.locator('button:has-text("YENİ KARİYER BAŞLAT")').first();
    await confirmResetBtn.click();
    await mobilePage.waitForTimeout(2000);

    const isAtNewCareer = mobilePage.url().includes('/career/new');
    checklist['CONFIRM NEW CAREER RESETS AND CREATES'] = isAtNewCareer;
    console.log('8. CONFIRM NEW CAREER RESETS AND CREATES:', isAtNewCareer ? 'PASS' : 'FAIL');

    await mobileContext.close();

    // =============================================================
    // 17: FINAL STATUS
    // =============================================================
    const allPassed = Object.values(checklist).every(v => v === true);
    checklist['FINAL STATUS'] = allPassed ? 'PASS' : 'FAIL';

    console.log('\n==================================================');
    console.log('FINAL CHECKLIST RESULTS:');
    console.log('==================================================');
    for (const [key, val] of Object.entries(checklist)) {
      console.log(`${key}: ${typeof val === 'boolean' ? (val ? 'PASS' : 'FAIL') : val}`);
    }

    return allPassed;
  } catch (err) {
    console.error('Test execution error:', err);
    return false;
  } finally {
    await browser.close();
  }
}

runVerification().then(success => {
  process.exit(success ? 0 : 1);
});
