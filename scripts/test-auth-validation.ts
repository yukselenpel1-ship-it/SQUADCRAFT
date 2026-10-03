/**
 * Unit tests for src/lib/auth/validation.ts
 * Run: node --experimental-strip-types scripts/test-auth-validation.ts
 */
import assert from 'node:assert/strict';
import {
  hasErrors,
  mapAuthError,
  normalizeEmail,
  validateEmail,
  validateNewPassword,
  validatePassword,
  validateSignIn,
  validateSignUp,
  validateUsername,
} from '../src/lib/auth/validation.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('auth/validation');

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Menajer@SquadCraft.COM '), 'menajer@squadcraft.com');
});

test('validateEmail', () => {
  assert.equal(validateEmail(''), 'E-posta adresi gerekli.');
  assert.ok(validateEmail('abc'));
  assert.ok(validateEmail('a@b'));
  assert.ok(validateEmail('a b@c.com'));
  assert.equal(validateEmail('oyuncu@squadcraft.com'), undefined);
  assert.equal(validateEmail('  OYUNCU@squadcraft.com.tr '), undefined);
});

test('validatePassword', () => {
  assert.equal(validatePassword(''), 'Şifre gerekli.');
  assert.match(validatePassword('ab1')!, /en az 8/);
  assert.match(validatePassword('abcdefgh')!, /harf ve bir rakam/);
  assert.match(validatePassword('12345678')!, /harf ve bir rakam/);
  assert.match(validatePassword('a1'.repeat(40))!, /en fazla 72/);
  assert.equal(validatePassword('gol2026final'), undefined);
  assert.equal(validatePassword('şampiyon1'), undefined);
});

test('validateUsername', () => {
  assert.equal(validateUsername(''), 'Menajer adı gerekli.');
  assert.match(validateUsername('ab')!, /3-20/);
  assert.match(validateUsername('a'.repeat(21))!, /3-20/);
  assert.match(validateUsername('kötü isim')!, /harf, rakam/);
  assert.match(validateUsername('ali-veli')!, /harf, rakam/);
  assert.equal(validateUsername('Mourinho_10'), undefined);
});

test('validateSignIn', () => {
  assert.deepEqual(validateSignIn({ email: 'x@y.com', password: 'p' }), {});
  const e = validateSignIn({ email: '', password: '' });
  assert.ok(e.email && e.password);
});

test('validateSignUp reports every invalid field', () => {
  const e = validateSignUp({ email: 'bad', password: 'short', passwordConfirm: 'other', username: '!' });
  assert.ok(e.email && e.password && e.passwordConfirm && e.username);
  assert.equal(hasErrors(e), true);
});

test('validateSignUp password mismatch', () => {
  const e = validateSignUp({ email: 'a@b.co', password: 'gol2026final', passwordConfirm: 'gol2026finaL', username: 'hoca' });
  assert.deepEqual(Object.keys(e), ['passwordConfirm']);
  assert.equal(e.passwordConfirm, 'Şifreler eşleşmiyor.');
});

test('validateSignUp happy path', () => {
  const e = validateSignUp({ email: 'a@b.co', password: 'gol2026final', passwordConfirm: 'gol2026final', username: 'hoca_1' });
  assert.equal(hasErrors(e), false);
});

test('validateNewPassword', () => {
  assert.equal(hasErrors(validateNewPassword({ password: 'yeniSifre9', passwordConfirm: 'yeniSifre9' })), false);
  assert.ok(validateNewPassword({ password: 'yeniSifre9', passwordConfirm: 'x' }).passwordConfirm);
});

test('mapAuthError maps Supabase errors to Turkish', () => {
  assert.equal(mapAuthError({ message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 }), 'E-posta veya şifre hatalı.');
  assert.match(mapAuthError({ message: 'Email not confirmed', code: 'email_not_confirmed' }), /doğrulanmadı/);
  assert.match(mapAuthError({ message: 'User already registered', code: 'user_already_exists' }), /zaten var/);
  assert.match(mapAuthError({ message: 'x', status: 429 }), /Çok fazla deneme/);
  assert.match(mapAuthError({ message: 'Database error saving new user' }), /menajer adı alınmış/);
  assert.match(mapAuthError({ message: 'Failed to fetch' }), /Sunucuya ulaşılamadı/);
  assert.match(mapAuthError({ message: 'something new' }), /tekrar dene/);
  assert.match(mapAuthError(null), /Beklenmeyen/);
});

console.log(`\n${passed} test geçti.`);
