'use client';
import { useEffect, useState } from 'react';
import App from '@/App.jsx';

// SPA mount. Render-null on the SSR pass so React Router's BrowserRouter
// (which touches window) only ever runs client-side.
export default function CatchAll() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <App />;
}
