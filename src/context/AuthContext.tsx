import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  display_name?: string | null;
  phone?: string | null;
  needs_password_change?: boolean | null;
  created_at?: string;
  updated_at?: string | null;
};

type AuthContextType = {
  session: any | null;
  loading: boolean;

  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;

  refreshProfile: () => Promise<void>;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- helper: timeout wrapper (prevents "stuck forever") ---
async function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // single-flight profile fetch control
  const fetchSeqRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchProfile = async (userId: string) => {
    // if one is already in-flight, don't start another
    if (inFlightRef.current) return inFlightRef.current;

    const seq = ++fetchSeqRef.current;

    const run = (async () => {
      console.log('[PROFILE] Fetch start', { seq, userId });
      if (!mountedRef.current) return;

      setProfileLoading(true);
      setProfileError(null);

      try {
        const { data, error } = await withTimeout(
          (async () => {
            const res = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            return res;
          })(),
          8000
        );
        console.log('[PROFILE] Fetch result', { seq, data, error });

        if (seq !== fetchSeqRef.current) {
          console.log('[PROFILE] Stale result ignored', { seq, latest: fetchSeqRef.current });
          return;
        }

        if (error) throw error;

        if (!mountedRef.current) return;
        setProfile(data as Profile);
      } catch (e: any) {
        console.warn('[PROFILE] Failed', { seq, message: e?.message || String(e) });
        if (!mountedRef.current) return;
        setProfile(null);
        setProfileError(e?.message || 'Failed to load profile');
      } finally {
        if (!mountedRef.current) return;
        setProfileLoading(false);
        console.log('[PROFILE] Fetch end', { seq });
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  };

  const refreshProfile = async () => {
    const uid = session?.user?.id;
    if (!uid) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    await fetchProfile(uid);
  };

  // ✅ Boot: only read session. DO NOT fetch profile here (prevents double-fetch)
  useEffect(() => {
    (async () => {
      console.log('[BOOT] Checking existing session…');
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session ?? null;

        console.log('[BOOT] Session:', { hasSession: !!s, userId: s?.user?.id });
        if (!mountedRef.current) return;

        setSession(s);
      } finally {
        if (!mountedRef.current) return;
        console.log('[BOOT] Done');
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Auth changes: fetch profile on SIGNED_IN / INITIAL_SESSION / TOKEN_REFRESHED only
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AUTH EVENT]', event, {
        hasSession: !!newSession,
        userId: newSession?.user?.id,
      });

      if (!mountedRef.current) return;
      setSession(newSession);

      // IMPORTANT: do NOT refetch profile on USER_UPDATED (it can fire during password update)
      if (event === 'USER_UPDATED') {
        console.log('[AUTH EVENT] Ignoring USER_UPDATED for profile fetch');
        return;
      }

      if (newSession?.user?.id) {
        // fire-and-forget (don’t block the auth event thread)
        fetchProfile(newSession.user.id).catch(() => {});
      } else {
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      inFlightRef.current = null;
      fetchSeqRef.current++;
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      loading,
      profile,
      profileLoading,
      profileError,
      refreshProfile,
      signIn,
      signOut,
    }),
    [session, loading, profile, profileLoading, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
