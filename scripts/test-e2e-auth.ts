/**
 * E2E tests for Homepage Auth options (Giriş Yap / Üye Ol).
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const ARTIFACT_DIR = 'C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5';

async function run() {
  console.log('--- STARTING HOMEPAGE AUTH E2E TESTS ---');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop 1920x1080 Viewport
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify nav action buttons exist
    const loginBtn = page.getByTestId('nav-login');
    const signupBtn = page.getByTestId('nav-signup');

    assert.ok(await loginBtn.isVisible(), 'Login button should be visible in navbar');
    assert.ok(await signupBtn.isVisible(), 'Signup button should be visible in navbar');

    const loginText = await loginBtn.innerText();
    const signupText = await signupBtn.innerText();
    console.log(`✓ Navbar buttons found: "${loginText.trim()}" & "${signupText.trim()}"`);

    // Screenshot initial homepage with top-right auth buttons
    await page.screenshot({ path: `${ARTIFACT_DIR}/homepage_auth_nav_1920x1080.png` });
    console.log('✓ Captured homepage_auth_nav_1920x1080.png');

    // 2. Click "GİRİŞ YAP"
    await loginBtn.click();
    await page.waitForSelector('[data-testid="auth-modal"]');
    assert.ok(await page.getByTestId('auth-modal').isVisible(), 'Auth modal should be open');

    const modalTitle = await page.getByTestId('auth-title').innerText();
    assert.equal(modalTitle.trim(), 'GİRİŞ YAP');
    console.log('✓ "GİRİŞ YAP" modal opened successfully');

    // Test inline validation on empty submit
    await page.getByTestId('auth-submit').click();
    assert.ok(await page.getByTestId('auth-email-error').isVisible(), 'Email error should be displayed');
    assert.ok(await page.getByTestId('auth-password-error').isVisible(), 'Password error should be displayed');
    console.log('✓ Empty submit correctly triggers email & password errors');

    // Screenshot Sign In Modal
    await page.screenshot({ path: `${ARTIFACT_DIR}/auth_modal_signin.png` });
    console.log('✓ Captured auth_modal_signin.png');

    // 3. Switch to "ÜYE OL" tab inside the modal
    await page.getByTestId('auth-tab-signup').click();
    const signupModalTitle = await page.getByTestId('auth-title').innerText();
    assert.equal(signupModalTitle.trim(), 'ÜYE OL');
    assert.ok(await page.getByTestId('auth-username').isVisible(), 'Username field should be visible in signup mode');
    assert.ok(await page.getByTestId('auth-password-confirm').isVisible(), 'Password confirm field should be visible');
    console.log('✓ Switched to "ÜYE OL" tab inside modal');

    // Test signup validation with mismatched passwords
    await page.getByTestId('auth-username').fill('yeni_menajer');
    await page.getByTestId('auth-email').fill('menajer@squadcraft.com');
    await page.getByTestId('auth-password').fill('squad2026pass');
    await page.getByTestId('auth-password-confirm').fill('farkli_sifre');
    await page.getByTestId('auth-submit').click();

    assert.ok(await page.getByTestId('auth-password-confirm-error').isVisible(), 'Password mismatch error should show');
    const confirmErr = await page.getByTestId('auth-password-confirm-error').innerText();
    assert.equal(confirmErr, 'Şifreler eşleşmiyor.');
    console.log('✓ Password mismatch validation error verified: "Şifreler eşleşmiyor."');

    // Screenshot Sign Up Modal with validation
    await page.screenshot({ path: `${ARTIFACT_DIR}/auth_modal_signup.png` });
    console.log('✓ Captured auth_modal_signup.png');

    // 4. Test Forgot Password link
    await page.getByTestId('auth-tab-signin').click();
    await page.getByTestId('auth-forgot-link').click();
    const forgotTitle = await page.getByTestId('auth-title').innerText();
    assert.equal(forgotTitle.trim(), 'ŞİFREMİ UNUTTUM');
    console.log('✓ Navigated to "ŞİFREMİ UNUTTUM" mode');

    // Back to signin
    await page.getByTestId('auth-back-signin').click();
    assert.equal((await page.getByTestId('auth-title').innerText()).trim(), 'GİRİŞ YAP');
    console.log('✓ Back to signin verified');

    // 5. Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert.ok(!(await page.getByTestId('auth-modal').isVisible()), 'Modal should close on Escape key');
    console.log('✓ Modal closed cleanly on Escape');

    // 6. Test Direct Click on "ÜYE OL" from Navbar
    await signupBtn.click();
    await page.waitForSelector('[data-testid="auth-modal"]');
    assert.equal((await page.getByTestId('auth-title').innerText()).trim(), 'ÜYE OL');
    console.log('✓ Direct click on navbar "ÜYE OL" opened signup mode');

    // Close via 'X' button
    await page.getByTestId('auth-close').click();
    await page.waitForTimeout(300);
    assert.ok(!(await page.getByTestId('auth-modal').isVisible()), 'Modal should close on close button click');
    console.log('✓ Modal closed cleanly on "X" button');

    // 7. Mobile Viewport (390x844 iPhone 14)
    console.log('Testing mobile layout...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const mobileLogin = mobilePage.getByTestId('nav-login');
    const mobileSignup = mobilePage.getByTestId('nav-signup');
    assert.ok(await mobileLogin.isVisible(), 'Mobile login button should be visible');
    assert.ok(await mobileSignup.isVisible(), 'Mobile signup button should be visible');

    await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/homepage_auth_mobile_390x844.png` });
    console.log('✓ Captured homepage_auth_mobile_390x844.png');

    await mobileLogin.click();
    await mobilePage.waitForSelector('[data-testid="auth-modal"]');
    await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/auth_modal_mobile_sheet.png` });
    console.log('✓ Captured auth_modal_mobile_sheet.png');

    await mobileContext.close();
    await context.close();

    console.log('--- ALL E2E AUTH TESTS PASSED PERFECTLY! ---');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
