const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5';

(async () => {
  console.log('================================================================');
  console.log('SQUADCRAFT — IPHONE CAREER REFRESH PERSISTENCE & PLAYER MODAL TEST');
  console.log('================================================================');

  const iPhone14 = devices['iPhone 14 Pro'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone14,
    locale: 'tr-TR',
  });

  const page = await context.newPage();

  const results = {
    canonicalIndexedDBSave: false,
    indexedDBByteSize: 0,
    localStorageMetaUnder1KB: false,
    metaByteSize: 0,
    refreshPersistence1: false,
    refreshPersistence2: false,
    refreshPersistence3: false,
    refreshPersistence4: false,
    refreshPersistence5: false,
    playerModalOpened: false,
    playerModalHeroRendered: false,
    sixMetricCardsRendered: false,
    attributesTabRendered: false,
    statsTabRendered: false,
    contractTabRendered: false,
    playerModalClosed: false,
  };

  try {
    // 1. Visit homepage
    console.log('[Step 1] Visiting homepage on iPhone 14 Pro emulation...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check if Continue button is available
    const continueBtn = await page.$('button:has-text("KARİYERE DEVAM ET")');
    if (!continueBtn) {
      console.log('[Step 1.1] No existing career found. Creating brand new career on /career/new...');
      await page.goto('http://localhost:3000/career/new', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Step 1: LİG SEÇİMİNE GEÇ
      console.log('  -> Step 1 -> Step 2');
      const step1Btn = await page.waitForSelector('button:has-text("LİG SEÇİMİNE GEÇ")', { timeout: 10000 });
      await step1Btn.click();
      await page.waitForTimeout(600);

      // Step 2: KULÜP SEÇİMİNE GEÇ
      console.log('  -> Step 2 -> Step 3');
      const step2Btn = await page.waitForSelector('button:has-text("KULÜP SEÇİMİNE GEÇ")', { timeout: 10000 });
      await step2Btn.click();
      await page.waitForTimeout(600);

      // Step 3: KULÜBÜ SEÇ & İLERLE
      console.log('  -> Step 3 -> Step 4');
      const step3Btn = await page.waitForSelector('button:has-text("KULÜBÜ SEÇ & İLERLE")', { timeout: 10000 });
      await step3Btn.click();
      await page.waitForTimeout(600);

      // Step 4: ÖZET & ONAY AŞAMASINA GEÇ
      console.log('  -> Step 4 -> Step 5');
      const step4Btn = await page.waitForSelector('button:has-text("ÖZET & ONAY AŞAMASINA GEÇ")', { timeout: 10000 });
      await step4Btn.click();
      await page.waitForTimeout(600);

      // Step 5: KARİYERİ RESMEN BAŞLAT
      console.log('  -> Step 5: Launching Career...');
      const launchBtn = await page.waitForSelector('button:has-text("KARİYERİ RESMEN BAŞLAT")', { timeout: 10000 });
      await launchBtn.click();
      await page.waitForTimeout(600);

      // In case confirmation modal appeared
      const confirmModalBtn = await page.$('button:has-text("YENİ KARİYER BAŞLAT")');
      if (confirmModalBtn) {
        console.log('  -> Overwrite confirmation modal detected, confirming...');
        await confirmModalBtn.click();
      }

      await page.waitForURL('**/dashboard', { timeout: 25000 });
      console.log('[Step 1.2] Career created and redirected to dashboard successfully.');
    } else {
      console.log('[Step 1.1] Found existing career. Continuing to dashboard...');
      await continueBtn.click();
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    }

    await page.waitForTimeout(2000);

    // 2. Verify Canonical IndexedDB Save
    console.log('[Step 2] Verifying IndexedDB SquadCraftDB and localStorage metadata...');
    const storageDiag = await page.evaluate(async () => {
      // 1. Check IndexedDB
      const openReq = indexedDB.open('SquadCraftDB', 1);
      const db = await new Promise((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      const tx = db.transaction('careerSaves', 'readonly');
      const store = tx.objectStore('careerSaves');
      const getReq = store.get('mainCareer');
      const data = await new Promise((resolve, reject) => {
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => reject(getReq.error);
      });

      const serialized = JSON.stringify(data);
      const byteSize = new Blob([serialized]).size;

      // 2. Check localStorage
      const metaStr = localStorage.getItem('SquadCraftCareerMeta');
      const v3Str = localStorage.getItem('SquadCraftSaveV3');
      const metaByteSize = metaStr ? new Blob([metaStr]).size : 0;

      return {
        hasData: !!data,
        saveVersion: data?.saveVersion,
        playerCount: data?.players?.length || 0,
        clubCount: data?.clubs?.length || 0,
        currentDate: data?.currentDate,
        seasonYear: data?.seasonYear,
        userClubId: data?.userClubId,
        byteSize,
        metaExists: !!metaStr,
        metaByteSize,
        v3InLocalStorage: !!v3Str,
      };
    });

    console.log('[Storage Diagnostics]:', JSON.stringify(storageDiag, null, 2));

    if (storageDiag.hasData && storageDiag.playerCount > 1000 && storageDiag.byteSize > 1_000_000) {
      results.canonicalIndexedDBSave = true;
      results.indexedDBByteSize = storageDiag.byteSize;
      console.log(`[PASS] IndexedDB canonical storage verified: ${storageDiag.playerCount} players, ${(storageDiag.byteSize / (1024 * 1024)).toFixed(2)} MB`);
    } else {
      console.error('[FAIL] IndexedDB data invalid or missing');
    }

    if (storageDiag.metaExists && storageDiag.metaByteSize < 1000) {
      results.localStorageMetaUnder1KB = true;
      results.metaByteSize = storageDiag.metaByteSize;
      console.log(`[PASS] localStorage metadata is ultra-lightweight: ${storageDiag.metaByteSize} bytes (< 1 KB)`);
    } else {
      console.error(`[FAIL] localStorage metadata issue: size is ${storageDiag.metaByteSize} bytes`);
    }

    // 3. Perform 5 Consecutive Direct Browser Refreshes on /dashboard
    console.log('[Step 3] Testing 5 consecutive direct browser refreshes on iPhone dashboard...');
    for (let i = 1; i <= 5; i++) {
      console.log(`  -> Refresh #${i}...`);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const curUrl = page.url();
      const isStillOnDashboard = curUrl.includes('/dashboard');
      const hasHeading = await page.$('h1, h2, span:has-text("DASHBOARD"), span:has-text("MENAJER")');

      if (isStillOnDashboard && hasHeading) {
        results[`refreshPersistence${i}`] = true;
        console.log(`  -> Refresh #${i} PASS: Still on dashboard, state hydrated.`);
      } else {
        console.error(`  -> Refresh #${i} FAIL: Redirected or blank page. URL: ${curUrl}`);
      }
    }

    const snapDashboard = path.join(ARTIFACT_DIR, 'snap_mobile_dashboard_after_5_refreshes.png');
    await page.screenshot({ path: snapDashboard, fullPage: false });
    console.log(`[Screenshot saved]: ${snapDashboard}`);

    // 4. Kadro Yönetimi (/squad) & Modern Player Modal Rework
    console.log('[Step 4] Navigating to /squad and inspecting player modal...');
    await page.goto('http://localhost:3000/squad', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find and click "İncele" button
    const inspectBtn = await page.$('button:has-text("İncele"), button:has-text("İNCELE")');
    if (inspectBtn) {
      await inspectBtn.click();
      await page.waitForTimeout(1000);

      // Verify modal is open
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        results.playerModalOpened = true;
        console.log('[PASS] PlayerModal opened successfully.');

        // Hero Header verification: OVR, POT, Form badges
        const ovrBadge = await page.$('text=GENEL');
        const potBadge = await page.$('text=POTANSİYEL');
        const formBadge = await page.$('text=FORM');

        if (ovrBadge && potBadge && formBadge) {
          results.playerModalHeroRendered = true;
          console.log('[PASS] Hero Header rendered with EA FC dual OVR / POT / FORM neon badges.');
        }

        // 6 Metric Cards
        const marketValCard = await page.$('text=Piyasa Değeri');
        const wageCard = await page.$('text=Haftalık Maaş');
        const contractCard = await page.$('text=Sözleşme Bitiş');
        const fitnessCard = await page.$('text=Kondisyon');
        const sharpnessCard = await page.$('text=Maç Keskinliği');
        const moraleCard = await page.$('text=Moral');

        if (marketValCard && wageCard && contractCard && fitnessCard && sharpnessCard && moraleCard) {
          results.sixMetricCardsRendered = true;
          console.log('[PASS] All 6 horizontal metric cards rendered.');
        }

        const snapModalHero = path.join(ARTIFACT_DIR, 'snap_mobile_player_modal_hero.png');
        await page.screenshot({ path: snapModalHero, fullPage: false });
        console.log(`[Screenshot saved]: ${snapModalHero}`);

        // Test Tab 2: NİTELİKLER
        console.log('[Step 4.1] Testing NİTELİKLER tab...');
        const attrTabBtn = await page.$('button:has-text("NİTELİKLER")');
        if (attrTabBtn) {
          await attrTabBtn.click();
          await page.waitForTimeout(800);

          const pacSection = await page.$('text=HIZ (PAC)');
          const shoSection = await page.$('text=ŞUT (SHO)');
          const pasSection = await page.$('text=PAS (PAS)');

          if (pacSection && shoSection && pasSection) {
            results.attributesTabRendered = true;
            console.log('[PASS] Nitelikler tab rendered with FIFA categorized sections & sliders.');
          }

          const snapModalAttr = path.join(ARTIFACT_DIR, 'snap_mobile_player_modal_attributes.png');
          await page.screenshot({ path: snapModalAttr, fullPage: false });
          console.log(`[Screenshot saved]: ${snapModalAttr}`);
        }

        // Test Tab 3: SEZON İSTATİSTİKLERİ
        console.log('[Step 4.2] Testing SEZON İSTATİSTİKLERİ tab...');
        const statsTabBtn = await page.$('button:has-text("SEZON İSTATİSTİKLERİ")');
        if (statsTabBtn) {
          await statsTabBtn.click();
          await page.waitForTimeout(800);

          const appStat = await page.$('text=Toplam Maç');
          const goalStat = await page.$('text=Goller');
          const assistStat = await page.$('text=Asistler');

          if (appStat && goalStat && assistStat) {
            results.statsTabRendered = true;
            console.log('[PASS] Sezon İstatistikleri tab rendered with all metric cards.');
          }

          const snapModalStats = path.join(ARTIFACT_DIR, 'snap_mobile_player_modal_stats.png');
          await page.screenshot({ path: snapModalStats, fullPage: false });
          console.log(`[Screenshot saved]: ${snapModalStats}`);
        }

        // Test Tab 4: SÖZLEŞME & KULÜP
        console.log('[Step 4.3] Testing SÖZLEŞME & KULÜP tab...');
        const contractTabBtn = await page.$('button:has-text("SÖZLEŞME & KULÜP")');
        if (contractTabBtn) {
          await contractTabBtn.click();
          await page.waitForTimeout(800);

          const wageDetail = await page.$('text=Finansal Sözleşme Detayları');
          const transferDetail = await page.$('text=Transfer ve Karakter Analizi');

          if (wageDetail && transferDetail) {
            results.contractTabRendered = true;
            console.log('[PASS] Sözleşme & Kulüp tab rendered with contract terms & character analysis.');
          }

          const snapModalContract = path.join(ARTIFACT_DIR, 'snap_mobile_player_modal_contract.png');
          await page.screenshot({ path: snapModalContract, fullPage: false });
          console.log(`[Screenshot saved]: ${snapModalContract}`);
        }

        // Close modal
        console.log('[Step 4.4] Closing modal...');
        const closeXBtn = await page.$('button[aria-label="Kapat"]');
        if (closeXBtn) {
          await closeXBtn.click({ force: true });
        } else {
          const closeTextBtn = await page.$('button:has-text("Kapat")');
          if (closeTextBtn) await closeTextBtn.click({ force: true });
        }
        await page.waitForTimeout(1000);
        const modalAfterClose = await page.$('.fixed.z-50');
        if (!modalAfterClose) {
          results.playerModalClosed = true;
          console.log('[PASS] PlayerModal closed cleanly and unmounted from DOM (.fixed.z-50 is null).');
        } else {
          console.log(`[DEBUG] Modal still detected: .fixed.z-50 exists`);
        }
      }
    } else {
      console.error('[FAIL] Could not find İncele button in squad table');
    }

  } catch (err) {
    console.error('[TEST ERROR]:', err);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('FINAL VERIFICATION SUMMARY:');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every((v) => v === true || (typeof v === 'number' && v > 0));
  if (allPassed) {
    console.log('\n>>> ALL 14 TEST CRITERIA PASSED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('\n>>> SOME CRITERIA FAILED! <<<');
    process.exit(1);
  }
})();
