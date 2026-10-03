/**
 * SquadCraft auth form validation.
 * Pure functions (no imports) so they can be unit-tested with plain Node.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;

export type FieldErrors = Partial<Record<'email' | 'password' | 'passwordConfirm' | 'username', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | undefined {
  const value = normalizeEmail(email);
  if (!value) return 'E-posta adresi gerekli.';
  if (value.length > 254 || !EMAIL_RE.test(value)) return 'Geçerli bir e-posta adresi gir.';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Şifre gerekli.';
  if (password.length < PASSWORD_MIN) return `Şifre en az ${PASSWORD_MIN} karakter olmalı.`;
  if (password.length > 72) return 'Şifre en fazla 72 karakter olabilir.';
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) {
    return 'Şifre en az bir harf ve bir rakam içermeli.';
  }
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  const value = username.trim();
  if (!value) return 'Menajer adı gerekli.';
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Menajer adı ${USERNAME_MIN}-${USERNAME_MAX} karakter olmalı.`;
  }
  if (!USERNAME_RE.test(value)) return 'Sadece harf, rakam ve alt çizgi (_) kullanılabilir.';
  return undefined;
}

export function validateSignIn(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = 'Şifre gerekli.';
  return errors;
}

export function validateSignUp(input: {
  email: string;
  password: string;
  passwordConfirm: string;
  username: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const username = validateUsername(input.username);
  if (username) errors.username = username;
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  const password = validatePassword(input.password);
  if (password) errors.password = password;
  if (!input.passwordConfirm) errors.passwordConfirm = 'Şifreyi tekrar gir.';
  else if (input.password !== input.passwordConfirm) errors.passwordConfirm = 'Şifreler eşleşmiyor.';
  return errors;
}

export function validateNewPassword(input: { password: string; passwordConfirm: string }): FieldErrors {
  const errors: FieldErrors = {};
  const password = validatePassword(input.password);
  if (password) errors.password = password;
  if (input.password !== input.passwordConfirm) errors.passwordConfirm = 'Şifreler eşleşmiyor.';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Maps raw Supabase Auth error messages / codes to user-facing Turkish text. */
export function mapAuthError(error: { message?: string; code?: string; status?: number } | null | undefined): string {
  if (!error) return 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.';
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) {
    return 'Bu e-posta ile kayıtlı bir hesap zaten var. Giriş yapmayı dene.';
  }
  if (code === 'weak_password' || message.includes('password should')) {
    return 'Şifre çok zayıf. Daha uzun ve karmaşık bir şifre seç.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429 || message.includes('rate limit')) {
    return 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  }
  if (code === 'signup_disabled' || message.includes('signups not allowed')) {
    return 'Yeni üyelik şu anda kapalı.';
  }
  if (code === 'same_password') {
    return 'Yeni şifre eskisiyle aynı olamaz.';
  }
  if (message.includes('database error saving new user')) {
    return 'Bu menajer adı alınmış olabilir. Farklı bir ad dene.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';
  }
  return 'İşlem tamamlanamadı. Lütfen tekrar dene.';
}
