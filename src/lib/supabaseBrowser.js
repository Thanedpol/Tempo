'use client';
import { createBrowserClient } from '@supabase/ssr';

const url      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!url || !anonKey)) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase calls will fail.');
}

export const supabase = createBrowserClient(url || 'http://placeholder', anonKey || 'placeholder');
