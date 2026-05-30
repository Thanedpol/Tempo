'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a neutral icon until mounted.
  if (!mounted) {
    return (
      <button className="relative p-2.5 rounded-lg hover:bg-secondary transition-all" aria-label="Toggle theme">
        <Moon className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-2.5 rounded-lg hover:bg-secondary transition-all"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {isDark
          ? <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          : <Sun  className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
      </motion.div>
    </button>
  );
}
