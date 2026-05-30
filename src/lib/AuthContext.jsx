'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseBrowser';
import { base44 } from '@/api/base44Client';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
const DEV_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dev@tempo-ai-hub.local',
  full_name: 'Dev User',
  role: 'admin',
};

/**
 * Drop-in replacement for the old Base44 AuthContext.
 * Same hook shape — useAuth() still returns { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
 * authError, appPublicSettings, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState }.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                                   = useState(null);
  const [isAuthenticated, setIsAuthenticated]             = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]                 = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError]                         = useState(null);
  const [authChecked, setAuthChecked]                     = useState(false);
  const [appPublicSettings] = useState({ id: 'tempo-ai-hub', public_settings: {} });

  const refreshUser = async () => {
    if (DEV_BYPASS) {
      setUser(DEV_USER);
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
    if (DEV_BYPASS) return;            // no Supabase auth listener in dev-bypass mode
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
    base44.auth.logout(shouldRedirect ? window.location.href : null);
    setUser(null);
    setIsAuthenticated(false);
  };
  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
      appPublicSettings, authChecked,
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
