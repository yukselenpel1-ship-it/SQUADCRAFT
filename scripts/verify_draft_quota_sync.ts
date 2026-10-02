import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';

async function testQuotaSync() {
  console.log('--- TESTING /draft QUOTA & SUMMARY SINGLE-SOURCE SYNC ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://localhost:3000/draft', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=DRAFT LEAGUE', { timeout: 6000 });

    // 1. Initial Load (Default = 4)
    console.log('\n[1/4] Checking Initial Load (Default Quota 4)...');
    const btn4Class = await page.locator('button:has-text("4 Menajer")').getAttribute('class');
    const is4Active = btn4Class?.includes('bg-[#00D4FF]') && btn4Class?.includes('text-black');
    
    const badgeText = await page.locator('span:has-text("KİŞİLİK ALFA LİGİ")').first().innerText();
    const specsTitle = await page.locator('span:has-text("LİG AYARLARI //")').first().innerText();
    const specsManagers = await page.locator('div:has-text("Menajer (İnsan/Bot)")').last().innerText();
    const specsFormat = await page.locator('div:has-text("Hafta")').last().innerText();
    const cardDesc = await page.locator('p:has-text("rekabetçi ligi başlat")').first().innerText();

    console.log(`- 4 Menajer button active: ${is4Active}`);
    console.log(`- Badge: "${badgeText}"`);
    console.log(`- Card desc: "${cardDesc}"`);
    console.log(`- Specs title: "${specsTitle}"`);
    console.log(`- Specs managers: "${specsManagers.trim()}"`);
    console.log(`- Specs format: "${specsFormat.trim()}"`);

    if (!is4Active || !badgeText.includes('4 KİŞİLİK') || !specsTitle.includes('4 KİŞİLİK') || !specsManagers.includes('4 Menajer') || !specsFormat.includes('6 Hafta')) {
      throw new Error('Default quota 4 mismatch on initial load!');
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'draft_quota_4_default.png') });
    console.log('✅ Initial Load (Default 4) strictly verified.');

    // 2. Click 6 Menajer
    console.log('\n[2/4] Clicking 6 Menajer button...');
    await page.locator('button:has-text("6 Menajer")').click();
    await page.waitForTimeout(100);

    const btn6Class = await page.locator('button:has-text("6 Menajer")').getAttribute('class');
    const is6Active = btn6Class?.includes('bg-[#00D4FF]') && btn6Class?.includes('text-black');
    const badgeText6 = await page.locator('span:has-text("KİŞİLİK ALFA LİGİ")').first().innerText();
    const specsTitle6 = await page.locator('span:has-text("LİG AYARLARI //")').first().innerText();
    const specsManagers6 = await page.locator('div:has-text("Menajer (İnsan/Bot)")').last().innerText();
    const specsFormat6 = await page.locator('div:has-text("Hafta")').last().innerText();
    const cardDesc6 = await page.locator('p:has-text("rekabetçi ligi başlat")').first().innerText();

    console.log(`- 6 Menajer button active: ${is6Active}`);
    console.log(`- Badge: "${badgeText6}"`);
    console.log(`- Card desc: "${cardDesc6}"`);
    console.log(`- Specs title: "${specsTitle6}"`);
    console.log(`- Specs managers: "${specsManagers6.trim()}"`);
    console.log(`- Specs format: "${specsFormat6.trim()}"`);

    if (!is6Active || !badgeText6.includes('6 KİŞİLİK') || !specsTitle6.includes('6 KİŞİLİK') || !specsManagers6.includes('6 Menajer') || !specsFormat6.includes('10 Hafta')) {
      throw new Error('Quota 6 mismatch after click!');
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'draft_quota_6_selected.png') });
    console.log('✅ Quota 6 strictly verified.');

    // 3. Click 8 Menajer
    console.log('\n[3/4] Clicking 8 Menajer button...');
    await page.locator('button:has-text("8 Menajer")').click();
    await page.waitForTimeout(100);

    const btn8Class = await page.locator('button:has-text("8 Menajer")').getAttribute('class');
    const is8Active = btn8Class?.includes('bg-[#00D4FF]') && btn8Class?.includes('text-black');
    const badgeText8 = await page.locator('span:has-text("KİŞİLİK ALFA LİGİ")').first().innerText();
    const specsTitle8 = await page.locator('span:has-text("LİG AYARLARI //")').first().innerText();
    const specsManagers8 = await page.locator('div:has-text("Menajer (İnsan/Bot)")').last().innerText();
    const specsFormat8 = await page.locator('div:has-text("Hafta")').last().innerText();
    const cardDesc8 = await page.locator('p:has-text("rekabetçi ligi başlat")').first().innerText();

    console.log(`- 8 Menajer button active: ${is8Active}`);
    console.log(`- Badge: "${badgeText8}"`);
    console.log(`- Card desc: "${cardDesc8}"`);
    console.log(`- Specs title: "${specsTitle8}"`);
    console.log(`- Specs managers: "${specsManagers8.trim()}"`);
    console.log(`- Specs format: "${specsFormat8.trim()}"`);

    if (!is8Active || !badgeText8.includes('8 KİŞİLİK') || !specsTitle8.includes('8 KİŞİLİK') || !specsManagers8.includes('8 Menajer') || !specsFormat8.includes('7 Hafta')) {
      throw new Error('Quota 8 mismatch after click!');
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'draft_quota_8_selected.png') });
    console.log('✅ Quota 8 strictly verified.');

    // 4. Click back to 4 Menajer
    console.log('\n[4/4] Clicking back to 4 Menajer button...');
    await page.locator('button:has-text("4 Menajer")').click();
    await page.waitForTimeout(100);

    const btn4ClassFinal = await page.locator('button:has-text("4 Menajer")').getAttribute('class');
    const is4ActiveFinal = btn4ClassFinal?.includes('bg-[#00D4FF]') && btn4ClassFinal?.includes('text-black');
    const badgeText4Final = await page.locator('span:has-text("KİŞİLİK ALFA LİGİ")').first().innerText();
    const specsTitle4Final = await page.locator('span:has-text("LİG AYARLARI //")').innerText();

    if (!is4ActiveFinal || !badgeText4Final.includes('4 KİŞİLİK') || !specsTitle4Final.includes('4 KİŞİLİK')) {
      throw new Error('Failed to switch back to 4 Menajer!');
    }
    console.log('✅ Switched back to 4 Menajer successfully.');

    console.log('\n🎉 ALL 4/6/8 QUOTA SELECTION & SUMMARY TESTS PASSED 100%!');
  } finally {
    await browser.close();
  }
}

testQuotaSync().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
