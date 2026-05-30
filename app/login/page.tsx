'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, supabaseConfigured } from '@/lib/supabaseBrowser';

function LoginForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const returnTo = params.get('returnTo') || '/';
  const [email, setEmail]     = useState('');
  const [busy,  setBusy]      = useState(false);
  const [msg,   setMsg]       = useState<string | null>(null);
  const [err,   setErr]       = useState<string | null>(null);

  const signInGoogle = async () => {
    setErr(null);
    if (!supabaseConfigured) { setErr('Supabase is not configured — see warning below.'); return; }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setErr(error.message);
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!supabaseConfigured) { setErr('Supabase is not configured — see warning below.'); return; }
    setBusy(true);
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    setBusy(false);
    if (error) setErr(error.message);
    else setMsg('Magic link sent — check your inbox.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 glass rounded-2xl p-8">
        <div className="text-center">
          <h1 className="font-syne text-2xl font-bold gradient-text">Tempo AI Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        {!supabaseConfigured && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 space-y-1">
            <p className="font-semibold">⚠️ Supabase not configured</p>
            <p>This deployment is missing <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and/or <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Login won't work until they're set in Vercel project settings + redeployed.</p>
            <p>Quick workaround: set <code className="font-mono">NEXT_PUBLIC_DEV_BYPASS_AUTH=true</code> to skip login.</p>
          </div>
        )}

        <button
          onClick={signInGoogle}
          disabled={!supabaseConfigured}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.6 15 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 3.9-3.8 5.1l6.2 5c-.4.4 6.3-4.6 6.3-14.1 0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">or</span>
          <div className="absolute inset-0 top-1/2 border-t border-border" />
        </div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg bg-secondary/50 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={busy || !supabaseConfigured}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Sending…' : 'Send magic link'}
          </button>
        </form>

        {msg && <p className="text-xs text-emerald-400 text-center">{msg}</p>}
        {err && <p className="text-xs text-destructive text-center">{err}</p>}
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
