import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Sparkles, LayoutDashboard, Ticket, Hotel, Bell,
  MessageSquare, Calendar, Menu, X, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import EventCarousel from '@/components/layout/EventCarousel';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import ProfileMenu from '@/components/layout/ProfileMenu';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useI18n } from '@/lib/I18nContext';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/',           icon: MessageSquare,    key: 'nav.ai_assistant',  en: 'AI Assistant' },
  { path: '/dashboard',  icon: LayoutDashboard,  key: 'nav.dashboard',     en: 'Dashboard'    },
  { path: '/events',     icon: Ticket,           key: 'nav.events',        en: 'Events'       },
  { path: '/bookings',   icon: Zap,              key: 'nav.my_bookings',   en: 'My Bookings'  },
  { path: '/hotels',     icon: Hotel,            key: 'nav.hotels',        en: 'Hotels'       },
  { path: '/calendar',   icon: Calendar,         key: 'nav.calendar',      en: 'Calendar'     },
];

/** Pick the nav item that matches the current pathname (longest prefix wins). */
function currentNav(pathname) {
  if (pathname === '/notifications') return { key: 'nav.notifications', en: 'Notifications' };
  if (pathname === '/faqs')          return { key: 'nav.faqs',          en: 'FAQs'          };
  if (pathname === '/home')          return { key: 'nav.home',          en: 'Home'          };
  return navItems
    .filter(i => i.path !== '/' ? pathname.startsWith(i.path) : pathname === '/')
    .sort((a, b) => b.path.length - a.path.length)[0] || null;
}

/** Render a label that's primary in current lang, with the English variant as a tiny subtitle (when not already English). */
function NavLabel({ item, t, lang }) {
  const primary   = t(item.key);
  const secondary = lang === 'en' ? null : item.en;
  return (
    <div className="flex-1">
      <div className="text-sm font-medium">{primary}</div>
      {secondary && <div className="text-xs opacity-60">{secondary}</div>}
    </div>
  );
}

// Carousel is promotional — show ONLY on browse-style pages.
// Other pages (Bookings, Notifications, Calendar, Profile, AI Assistant, …) get a clean view.
const SHOW_CAROUSEL_PATHS = ['/home', '/events'];
// Footer hides on admin only.
const NO_FOOTER_PATHS = ['/admin'];

export default function Layout() {
  const location = useLocation();
  const { t, lang } = useI18n();
  const { demoMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);

  const showCarousel = SHOW_CAROUSEL_PATHS.includes(location.pathname);
  const hideFooter   = NO_FOOTER_PATHS.includes(location.pathname);
  const showDemoBanner = demoMode && !demoBannerDismissed;

  useEffect(() => {
    base44.entities.Notification.list('-created_date', 20).then(data => {
      setUnreadCount(data.filter(n => !n.is_read).length);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex bg-background">

      {/* Tablet Sidebar Overlay */}
      <AnimatePresence>
        {tabletSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:block lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setTabletSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Tablet (md-lg) */}
      <motion.aside
        initial={false}
        animate={{ x: tabletSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 200 }}
        className="md:flex lg:hidden flex-col glass border-r border-border/50 fixed h-full z-50 w-72 hidden"
      >
        <div className="p-5 border-b border-border/30 flex items-center justify-between gap-2">
          <Link to="/home" className="flex items-center gap-3" onClick={() => setTabletSidebarOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-syne font-bold text-sm gradient-text">Agentic AI</div>
              <div className="text-xs text-muted-foreground">Entertain Assistant</div>
            </div>
          </Link>
          <button onClick={() => setTabletSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setTabletSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-primary/20 text-primary neon-border' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <NavLabel item={item} t={t} lang={lang} />
                {item.path === '/bookings' && unreadCount > 0 && (
                  <Badge className="bg-accent/20 text-accent border-accent/30 text-xs px-1.5">{unreadCount}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/30">
          <Link to="/notifications" onClick={() => setTabletSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <Bell className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{t('nav.notifications')}</span>
            {unreadCount > 0 && <Badge className="bg-destructive text-white text-xs px-1.5">{unreadCount}</Badge>}
          </Link>
        </div>
      </motion.aside>

      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col glass border-r border-border/50 fixed h-full z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-border/30 flex items-center justify-between gap-2">
          <Link to="/home" className="flex items-center gap-3 group flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <div className="font-syne font-bold text-sm gradient-text">Agentic AI</div>
                <div className="text-xs text-muted-foreground">Entertain Assistant</div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            title={t('common.refresh', { en: sidebarOpen ? 'Collapse' : 'Expand', th: sidebarOpen ? 'ยุบ' : 'ขยาย', ja: sidebarOpen ? '折りたたむ' : '展開', zh: sidebarOpen ? '折叠' : '展开', ko: sidebarOpen ? '접기' : '펼치기' })}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary/20 text-primary neon-border' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                {sidebarOpen && (
                  <>
                    <NavLabel item={item} t={t} lang={lang} />
                    {item.path === '/bookings' && unreadCount > 0 && (
                      <Badge className="bg-accent/20 text-accent border-accent/30 text-xs px-1.5">{unreadCount}</Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Notifications Bell */}
        <div className="p-4 border-t border-border/30">
          <Link to="/notifications" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <Bell className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <>
                <span className="text-sm font-medium flex-1">{t('nav.notifications')}</span>
                {unreadCount > 0 && (
                  <Badge className="bg-destructive text-white text-xs px-1.5">{unreadCount}</Badge>
                )}
              </>
            )}
          </Link>
        </div>
      </aside>

      {/* Desktop Header */}
      <SiteHeader unreadCount={unreadCount} />

      {/* Mobile / Tablet Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 header-bar px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — opens sidebar on md+, drawer on sm */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.innerWidth >= 768) {
                setTabletSidebarOpen(!tabletSidebarOpen);
              } else {
                setMobileOpen(!mobileOpen);
              }
            }}
            className="text-foreground/80 hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-syne font-bold text-sm gradient-text hidden sm:inline">Agentic AI</span>
          </Link>
          {/* Active page indicator */}
          {(() => {
            const curr = currentNav(location.pathname);
            if (!curr) return null;
            return (
              <>
                <span className="text-muted-foreground/40 text-sm hidden sm:inline">/</span>
                <span className="text-sm font-medium text-foreground truncate">{t(curr.key, curr.en ? { en: curr.en } : undefined)}</span>
              </>
            );
          })()}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link
            to="/notifications"
            aria-label={t('nav.notifications')}
            className="relative p-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              unreadCount > 9
                ? <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive rounded-full text-white text-[10px] font-semibold flex items-center justify-center">9+</span>
                : <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-destructive rounded-full text-white text-[10px] font-semibold flex items-center justify-center">{unreadCount}</span>
            )}
            {/* Always-visible dot when zero unread and >0 read — keeps the bell from looking dead */}
            {unreadCount === 0 && (
              <span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
            )}
          </Link>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <ProfileMenu />
        </div>
      </div>

      {/* Mobile Nav Drawer (sm only) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 glass z-50 pt-16 flex flex-col border-r border-border/50"
            >
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive ? 'bg-primary/20 text-primary neon-border' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs opacity-60">{item.labelTh}</div>
                      </div>
                      {item.path === '/bookings' && unreadCount > 0 && (
                        <Badge className="bg-accent/20 text-accent border-accent/30 text-xs px-1.5">{unreadCount}</Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border/30">
                <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Bell className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{t('nav.notifications')}</span>
                  {unreadCount > 0 && <Badge className="bg-destructive text-white text-xs px-1.5">{unreadCount}</Badge>}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="pt-16 lg:pt-24 flex-1">
          {/* Demo-mode banner — appears once until dismissed for the session */}
          {showDemoBanner && (
            <div className="mx-4 mt-2 lg:mx-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <span>🧪</span>
                <span>
                  {t('demo.banner', {
                    en: 'Demo mode — auto-signed-in as Demo User. Connect Supabase to enable real login.',
                    th: 'โหมดทดลอง — เข้าใช้งานเป็น Demo User อัตโนมัติ ต่อ Supabase เพื่อเปิด login จริง',
                    ja: 'デモモード — Demo User として自動サインイン中。Supabase を接続すると本物のログインが有効になります',
                    zh: '演示模式 — 已自动登录为 Demo User。连接 Supabase 以启用真实登录',
                    ko: '데모 모드 — Demo User로 자동 로그인됨. Supabase 연결 시 실제 로그인 활성화',
                  })}
                </span>
              </div>
              <button onClick={() => setDemoBannerDismissed(true)} className="text-amber-300/70 hover:text-amber-200 flex-shrink-0" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {showCarousel && <EventCarousel />}
          <Outlet />
        </div>
        {!hideFooter && <SiteFooter />}
      </main>
    </div>
  );
}