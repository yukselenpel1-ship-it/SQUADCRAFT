'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import AuthModal, { type AuthMode } from './AuthModal';
import styles from './AuthNavActions.module.css';

/**
 * Top-right navbar auth block:
 *  - signed out → "GİRİŞ YAP" + "ÜYE OL"
 *  - signed in  → manager chip with dropdown (account info + sign out)
 */
export default function AuthNavActions() {
  const { status, user, signOut, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [userModalMode, setUserModalMode] = useState<AuthMode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // User arrived from a password-reset email → ask for a new password.
  const modalMode = isPasswordRecovery ? 'reset' : userModalMode;

  const handleCloseModal = () => {
    if (isPasswordRecovery) {
      clearPasswordRecovery();
    }
    setUserModalMode(null);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setMenuOpen(false);
  }

  let content: React.ReactNode;
  if (status === 'loading') {
    content = <div className={styles.skeleton} aria-hidden data-testid="auth-loading" />;
  } else if (status === 'authenticated' && user) {
    content = (
      <div className={styles.userWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.userChip}
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-testid="auth-user-chip"
        >
          <span className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</span>
          <span className={styles.userName} data-testid="auth-username">{user.username}</span>
          <ChevronDown size={14} className={menuOpen ? styles.chevOpen : undefined} />
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu" data-testid="auth-user-menu">
            <div className={styles.menuHead}>
              <span className={styles.menuLabel}>MENAJER HESABI</span>
              <strong>{user.username}</strong>
              <span className={styles.menuEmail}>{user.email}</span>
            </div>
            <button
              type="button"
              role="menuitem"
              className={styles.menuDanger}
              onClick={handleSignOut}
              disabled={signingOut}
              data-testid="auth-signout"
            >
              <LogOut size={15} /> {signingOut ? 'ÇIKIŞ YAPILIYOR…' : 'ÇIKIŞ YAP'}
            </button>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <>
        <button type="button" className={styles.loginButton} onClick={() => setUserModalMode('signin')} data-testid="nav-login">
          <LogIn size={14} className={styles.btnIcon} />
          GİRİŞ YAP
        </button>
        <button type="button" className={styles.signupButton} onClick={() => setUserModalMode('signup')} data-testid="nav-signup">
          <UserPlus size={14} className={styles.btnIcon} />
          ÜYE OL
        </button>
      </>
    );
  }

  return (
    <>
      {content}
      {modalMode !== null && (
        <AuthModal
          key={modalMode}
          open={true}
          initialMode={modalMode}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
