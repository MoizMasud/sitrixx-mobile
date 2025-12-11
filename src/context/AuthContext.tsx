// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type SupabaseSession = any;

type AuthContextType = {
  session: SupabaseSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'supabaseSession';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from storage on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          setSession(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load stored session', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Listen to auth changes (refresh, sign-out, etc.)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession)).catch(
          console.error,
        );
      } else {
        AsyncStorage.removeItem(SESSION_KEY).catch(console.error);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      setSession(data.session);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
