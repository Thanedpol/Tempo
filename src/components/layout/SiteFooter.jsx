import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Instagram } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

export default function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="glass border-t border-border/30 mt-8 px-6 py-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-syne font-bold text-sm gradient-text">Agentic AI</span>
            <p className="text-[10px] text-muted-foreground">Entertain Assistant · © 2026</p>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <Link to="/"               className="hover:text-foreground transition-colors">{t('nav.ai_assistant')}</Link>
          <Link to="/events"         className="hover:text-foreground transition-colors">{t('nav.events')}</Link>
          <Link to="/hotels"         className="hover:text-foreground transition-colors">{t('nav.hotels')}</Link>
          <Link to="/bookings"       className="hover:text-foreground transition-colors">{t('nav.my_bookings')}</Link>
          <Link to="/calendar"       className="hover:text-foreground transition-colors">{t('nav.calendar')}</Link>
          <Link to="/notifications"  className="hover:text-foreground transition-colors">{t('nav.notifications')}</Link>
          <Link to="/faqs"           className="hover:text-foreground transition-colors">{t('nav.faqs')}</Link>
        </nav>

        <div className="flex items-center gap-3 text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
          <a href="#" className="hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
          <a href="#" className="hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>
          <span className="text-xs ml-2">
            {t('footer.tagline', { en: 'Powered by AI · Made in Thailand 🇹🇭', th: 'ขับเคลื่อนด้วย AI · ทำในไทย 🇹🇭', ja: 'AI 駆動 · タイ製 🇹🇭', zh: 'AI 驱动 · 泰国制造 🇹🇭', ko: 'AI 기반 · 태국 제작 🇹🇭' })}
          </span>
        </div>
      </div>
    </footer>
  );
}
