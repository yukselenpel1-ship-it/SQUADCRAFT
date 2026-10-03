'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapAuthError, normalizeEmail } from './validation';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable';

export type AuthUserView = {
  id: string;
  email: string;
  username: string;
};

export type AuthResult = { ok: true } | { ok: false; error: string };
export type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; error: string };

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUserView | null;
  session: Session | null;
  /** True after the user lands from a password-reset email link. */
  isPasswordRecovery: boolean;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (input: { email: string; password: string; username: string }) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const UNAVAILABLE_ERROR = 'Üyelik sistemi şu anda kullanılamıyor.';

function toUserView(user: User | null | undefined): AuthUserView | null {
  if (!user) return null;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const email = user.email || '';
  const username =
    (typeof meta.username === 'string' && meta.username) ||
    (typeof meta.display_name === 'string' && meta.display_name) ||
    email.split('@')[0] ||
    'Menajer';
  return { id: user.id, email, username };
}

function fail(error: AuthError | Error | null | undefined): { ok: false; error: string } {
  return { ok: false, error: mapAuthError(error as { message?: string; code?: string; status?: number }) };
}

function siteRedirect(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (isSupabaseConfigured ? 'loading' : 'unavailable'));
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    let active = true;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setStatus(data.session ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (active) setStatus('anonymous');
      });

    const { data: subscription } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'anonymous');
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(async ({ email, password }) => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: UNAVAILABLE_ERROR };
    try {
      const { error } = await client.auth.signInWithPassword({ email: normalizeEmail(email), password });
      return error ? fail(error) : { ok: true };
    } catch (error) {
      return fail(error as Error);
    }
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async ({ email, password, username }) => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: UNAVAILABLE_ERROR };
    try {
      const { data, error } = await client.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: { username: username.trim(), display_name: username.trim() },
          emailRedirectTo: siteRedirect(),
        },
      });
      if (error) return fail(error);
      // Supabase obfuscates existing accounts: user is returned with no identities.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return fail({ name: 'AuthError', message: 'User already registered', code: 'user_already_exists' } as unknown as Error);
      }
      return { ok: true, needsConfirmation: !data.session };
    } catch (error) {
      return fail(error as Error);
    }
  }, []);

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: UNAVAILABLE_ERROR };
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        // Even if the server call fails, clear the local session so the UI is consistent.
        await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
      setSession(null);
      setStatus('anonymous');
      return { ok: true };
    } catch (error) {
      return fail(error as Error);
    }
  }, []);

  const requestPasswordReset = useCallback<AuthContextValue['requestPasswordReset']>(async (email) => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: UNAVAILABLE_ERROR };
    try {
      const { error } = await client.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: siteRedirect(),
      });
      return error ? fail(error) : { ok: true };
    } catch (error) {
      return fail(error as Error);
    }
  }, []);

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(async (password) => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, error: UNAVAILABLE_ERROR };
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) return fail(error);
      setIsPasswordRecovery(false);
      return { ok: true };
    } catch (error) {
      return fail(error as Error);
    }
  }, []);

  const clearPasswordRecovery = useCallback(() => setIsPasswordRecovery(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: toUserView(session?.user),
      isPasswordRecovery,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      clearPasswordRecovery,
    }),
    [status, session, isPasswordRecovery, signIn, signUp, signOut, requestPasswordReset, updatePassword, clearPasswordRecovery]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
