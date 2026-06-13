'use client';
import { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/I18nContext';

export default function LanguageSwitcher() {
  const { lang, setLang, LANGUAGES } = useI18n();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const visible = LANGUAGES.filter(l =>
    !filter || l.name.toLowerCase().includes(filter.toLowerCase()) || l.label.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all text-sm"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{current.short || current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 w-48 glass neon-border rounded-xl z-50 overflow-hidden shadow-2xl"
          >
            <div className="p-3 border-b border-border/30 flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search languages..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {visible.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-border/10 last:border-0 hover:bg-primary/10 ${
                    lang === l.code ? 'bg-primary/20 text-primary' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.label}</div>
                  </div>
                  {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </button>
              ))}
              {!visible.length && (
                <div className="px-4 py-3 text-xs text-muted-foreground">No match</div>
              )}
            </div>
            <div className="p-3 border-t border-border/30 text-center text-xs text-muted-foreground">
              {LANGUAGES.length} languages · more coming soon
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
