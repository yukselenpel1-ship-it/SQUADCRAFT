import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  hasErrors,
  validateEmail,
  validateNewPassword,
  validateSignIn,
  validateSignUp,
  type FieldErrors,
} from '@/lib/auth/validation';
import styles from './AuthModal.module.css';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

type Props = {
  open: boolean;
  initialMode: AuthMode;
  onClose: () => void;
};

type Notice = { kind: 'success'; title: string; text: string } | null;

const emptySubscribe = () => () => {};

export default function AuthModal({ open, initialMode, onClose }: Props) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { signIn, signUp, requestPasswordReset, updatePassword, clearPasswordRecovery } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    if (mode === 'reset') clearPasswordRecovery();
    onClose();
  }, [mode, clearPasswordRecovery, onClose]);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrors({});
      setFormError(null);
      setNotice(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open || !isClient) return;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open, isClient, mode, notice]);

  useEffect(() => {
    if (!open || !isClient) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        event.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isClient, submitting, handleClose]);

  if (!open || !isClient) return null;

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrors({});
    setFormError(null);
    setNotice(null);
    setPassword('');
    setPasswordConfirm('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    let nextErrors: FieldErrors = {};
    if (mode === 'signin') nextErrors = validateSignIn({ email, password });
    if (mode === 'signup') nextErrors = validateSignUp({ email, password, passwordConfirm, username });
    if (mode === 'forgot') {
      const emailError = validateEmail(email);
      nextErrors = emailError ? { email: emailError } : {};
    }
    if (mode === 'reset') nextErrors = validateNewPassword({ password, passwordConfirm });

    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const result = await signIn({ email, password });
        if (!result.ok) return setFormError(result.error);
        onClose();
        return;
      }

      if (mode === 'signup') {
        const result = await signUp({ email, password, username });
        if (!result.ok) return setFormError(result.error);
        if (!result.needsConfirmation) {
          onClose();
          return;
        }
        setNotice({
          kind: 'success',
          title: 'Kayıt alındı!',
          text: `${email.trim()} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.`,
        });
        return;
      }

      if (mode === 'forgot') {
        const result = await requestPasswordReset(email);
        if (!result.ok) return setFormError(result.error);
        setNotice({
          kind: 'success',
          title: 'E-posta gönderildi',
          text: 'Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi.',
        });
        return;
      }

      if (mode === 'reset') {
        const result = await updatePassword(password);
        if (!result.ok) return setFormError(result.error);
        setNotice({ kind: 'success', title: 'Şifre güncellendi', text: 'Yeni şifrenle oturumun açık. İyi oyunlar!' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const titles: Record<AuthMode, { kicker: string; title: string; sub: string }> = {
    signin: { kicker: 'TEKRAR HOŞ GELDİN', title: 'GİRİŞ YAP', sub: 'Menajer hesabınla devam et.' },
    signup: { kicker: 'MENAJER KAYDI', title: 'KAYIT OL', sub: 'Ücretsiz hesap oluştur, kulübünü ve liglerini kaydet.' },
    forgot: { kicker: 'HESAP KURTARMA', title: 'ŞİFREMİ UNUTTUM', sub: 'E-posta adresine sıfırlama bağlantısı gönderelim.' },
    reset: { kicker: 'HESAP KURTARMA', title: 'YENİ ŞİFRE', sub: 'Hesabın için yeni bir şifre belirle.' },
  };
  const heading = titles[mode];
  const submitLabel: Record<AuthMode, string> = {
    signin: 'GİRİŞ YAP',
    signup: 'KAYIT OL',
    forgot: 'BAĞLANTI GÖNDER',
    reset: 'ŞİFREYİ GÜNCELLE',
  };

  return createPortal(
    <div
      className={styles.backdrop}
      data-testid="auth-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) handleClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.panel}>
        <button type="button" className={styles.close} onClick={handleClose} aria-label="Kapat" data-testid="auth-close">
          <X size={18} />
        </button>

        <div className={styles.brandRow}>
          <Image src="/images/sc-emblem-official-hd.png" alt="" width={34} height={34} />
          <span>SQUAD<em>CRAFT</em></span>
        </div>

        {(mode === 'signin' || mode === 'signup') && !notice && (
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={mode === 'signin' ? styles.tabActive : styles.tab}
              onClick={() => switchMode('signin')}
              data-testid="auth-tab-signin"
            >
              GİRİŞ YAP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? styles.tabActive : styles.tab}
              onClick={() => switchMode('signup')}
              data-testid="auth-tab-signup"
            >
              KAYIT OL
            </button>
          </div>
        )}

        <p className={styles.kicker}>{heading.kicker}</p>
        <h2 id={titleId} className={styles.title} data-testid="auth-title">{heading.title}</h2>

        {notice ? (
          <div className={styles.notice} data-testid="auth-notice" role="status">
            <CheckCircle2 size={28} />
            <strong>{notice.title}</strong>
            <p>{notice.text}</p>
            <button
              type="button"
              className={styles.submit}
              onClick={() => (mode === 'reset' ? handleClose() : switchMode('signin'))}
              data-testid="auth-notice-action"
            >
              {mode === 'reset' ? 'DEVAM ET' : 'GİRİŞ EKRANINA DÖN'}
            </button>
          </div>
        ) : (
          <>
            <p className={styles.sub}>{heading.sub}</p>
            <form className={styles.form} onSubmit={handleSubmit} noValidate data-testid={`auth-form-${mode}`}>
              {mode === 'signup' && (
                <Field
                  id="auth-username"
                  label="Menajer adı"
                  icon={<User size={16} />}
                  error={errors.username}
                  inputProps={{
                    ref: firstFieldRef,
                    value: username,
                    onChange: (e) => setUsername(e.target.value),
                    autoComplete: 'username',
                    placeholder: 'ornek_menajer',
                    maxLength: 20,
                  }}
                />
              )}

              {mode !== 'reset' && (
                <Field
                  id="auth-email"
                  label="E-posta"
                  icon={<Mail size={16} />}
                  error={errors.email}
                  inputProps={{
                    ref: mode === 'signup' ? undefined : firstFieldRef,
                    type: 'email',
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    autoComplete: 'email',
                    placeholder: 'menajer@squadcraft.com',
                    inputMode: 'email',
                  }}
                />
              )}

              {mode !== 'forgot' && (
                <Field
                  id="auth-password"
                  label={mode === 'reset' ? 'Yeni şifre' : 'Şifre'}
                  icon={<Lock size={16} />}
                  error={errors.password}
                  trailing={
                    <button
                      type="button"
                      className={styles.eye}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      data-testid="auth-toggle-password"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  inputProps={{
                    ref: mode === 'reset' ? firstFieldRef : undefined,
                    type: showPassword ? 'text' : 'password',
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    autoComplete: mode === 'signin' ? 'current-password' : 'new-password',
                    placeholder: mode === 'signin' ? '••••••••' : 'En az 8 karakter, harf + rakam',
                  }}
                />
              )}

              {(mode === 'signup' || mode === 'reset') && (
                <Field
                  id="auth-password-confirm"
                  label="Şifre (tekrar)"
                  icon={<Lock size={16} />}
                  error={errors.passwordConfirm}
                  inputProps={{
                    type: showPassword ? 'text' : 'password',
                    value: passwordConfirm,
                    onChange: (e) => setPasswordConfirm(e.target.value),
                    autoComplete: 'new-password',
                    placeholder: 'Şifreni tekrar gir',
                  }}
                />
              )}

              {mode === 'signin' && (
                <button type="button" className={styles.linkRight} onClick={() => switchMode('forgot')} data-testid="auth-forgot-link">
                  Şifremi unuttum
                </button>
              )}

              {formError && (
                <div className={styles.formError} role="alert" data-testid="auth-error">
                  {formError}
                </div>
              )}

              <button type="submit" className={styles.submit} disabled={submitting} data-testid="auth-submit">
                {submitting ? <Loader2 size={18} className={styles.spin} /> : submitLabel[mode]}
              </button>
            </form>

            {/* Alt Bar: Kayıt Olmayanlar İçin Kayıt Ol / Giriş Yap */}
            <div className={styles.bottomBar}>
              {mode === 'signin' && (
                <div className={styles.bottomBarContent}>
                  <div className={styles.bottomBarText}>
                    <span className={styles.bottomBarPrompt}>Hesabın yok mu?</span>
                    <span className={styles.bottomBarHint}>Hemen ücretsiz menajer kaydı oluştur</span>
                  </div>
                  <button
                    type="button"
                    className={styles.bottomBarAction}
                    onClick={() => switchMode('signup')}
                    data-testid="auth-switch-signup"
                  >
                    KAYIT OL →
                  </button>
                </div>
              )}
              {mode === 'signup' && (
                <div className={styles.bottomBarContent}>
                  <div className={styles.bottomBarText}>
                    <span className={styles.bottomBarPrompt}>Zaten hesabın var mı?</span>
                    <span className={styles.bottomBarHint}>Mevcut menajer oturumunu aç</span>
                  </div>
                  <button
                    type="button"
                    className={styles.bottomBarActionSecondary}
                    onClick={() => switchMode('signin')}
                    data-testid="auth-switch-signin"
                  >
                    GİRİŞ YAP →
                  </button>
                </div>
              )}
              {mode === 'forgot' && (
                <button
                  type="button"
                  className={styles.bottomBarBack}
                  onClick={() => switchMode('signin')}
                  data-testid="auth-back-signin"
                >
                  ← Giriş ekranına dön
                </button>
              )}
            </div>
            {mode === 'signup' && (
              <p className={styles.legal}>Kayıt olarak oyun kurallarını ve gizlilik politikasını kabul etmiş olursun.</p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  trailing?: React.ReactNode;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };
};

function Field({ id, label, icon, error, trailing, inputProps }: FieldProps) {
  const { ref, ...rest } = inputProps;
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.inputInvalid : ''}`}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          data-testid={id}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <span id={errorId} className={styles.fieldError} data-testid={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
