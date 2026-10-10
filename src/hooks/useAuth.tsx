import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ensureProfile } from '../lib/db';
import { useUserDoc } from './useFirestore';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  syncPending: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function friendlyAuthError(err: any): string {
  const code: string = err?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'The sign-in window was closed before finishing.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in pop-up. Allow pop-ups for this site, or try again.';
  if (code === 'auth/unauthorized-domain') return 'This website address is not authorised for sign-in yet. Add it under Firebase → Authentication → Settings → Authorised domains.';
  if (code === 'auth/network-request-failed') return 'No internet connection. Check your network and try again.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this project.';
  return err?.message || 'Sign-in failed. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: profile, pendingWrites } = useUserDoc<UserProfile>(user?.uid);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setLoading(false);
        if (u) ensureProfile(u).catch((e) => console.warn('ensureProfile', e));
      }),
    []
  );

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Some mobile browsers can't do pop-ups: fall back to a full-page redirect.
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, profile, syncPending: pendingWrites, signIn, signOutUser: () => signOut(auth) }}>
      {children}
    </Ctx.Provider>
  );
};

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

/** For views rendered only when signed in. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user.uid;
}
