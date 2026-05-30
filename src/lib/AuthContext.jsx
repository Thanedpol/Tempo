'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabaseBrowser';
import { base44 } from '@/api/base44Client';

/**
 * Demo mode (auto sign-in as Demo User) kicks in when EITHER:
 *  - NEXT_PUBLIC_DEV_BYPASS_AUTH=true   (explicit, even with Supabase configured)
 *  - Supabase env vars are missing      (graceful default — app works out of the box)
 * Force real-auth even without Supabase: set NEXT_PUBLIC_DEV_BYPASS_AUTH=false.
 */
const explicitBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH;
const DEMO_MODE = explicitBypass === 'false'
  ? false
  : (explicitBypass === 'true' || !supabaseConfigured);

const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@tempo-ai-hub.local',
  full_name: 'Demo User',
  role: 'admin',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                                   = useState(null);
  const [isAuthenticated, setIsAuthenticated]             = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]                 = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError]                         = useState(null);
  const [authChecked, setAuthChecked]                     = useState(false);
  const [demoMode] = useState(DEMO_MODE);
  const [appPublicSettings] = useState({ id: 'tempo-ai-hub', public_settings: {} });

  const refreshUser = async () => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    try {
      const me = await base44.auth.me();
      setUser(me);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
      if (e.status === 401) setAuthError({ type: 'auth_required', message: 'Authentication required' });
      else setAuthError({ type: 'unknown', message: e.message || 'Unknown error' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    refreshUser();
    if (DEMO_MODE) return;            // no Supabase auth listener in demo mode
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshUser();
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const logout = (shouldRedirect = false) => {
    if (DEMO_MODE) return;            // no-op in demo mode (no real session to clear)
    base44.auth.logout(shouldRedirect ? window.location.href : null);
    setUser(null);
    setIsAuthenticated(false);
  };
  const navigateToLogin = () => {
    if (DEMO_MODE) return;            // no real login in demo mode
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
      appPublicSettings, authChecked, demoMode,
      logout, navigateToLogin,
      checkUserAuth: refreshUser, checkAppState: refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
