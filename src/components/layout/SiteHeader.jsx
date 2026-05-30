import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import ProfileMenu from '@/components/layout/ProfileMenu';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import ThemeSwitcher from '@/components/layout/ThemeSwitcher';
import { useI18n } from '@/lib/I18nContext';

const navLinks = [
  { path: '/',           key: 'nav.ai_assistant' },
  { path: '/dashboard',  key: 'nav.dashboard'    },
  { path: '/events',     key: 'nav.events'       },
  { path: '/bookings',   key: 'nav.my_bookings'  },
  { path: '/hotels',     key: 'nav.hotels'       },
  { path: '/calendar',   key: 'nav.calendar'     },
];

export default function SiteHeader({ unreadCount = 0 }) {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <header className="hidden lg:flex fixed top-0 left-64 right-0 z-30 header-bar px-6 h-20 items-center justify-between">
      {/* Nav Links */}
      <div className="flex items-center gap-2">
        {navLinks.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
              }`}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </div>

      {/* Right side: Bell + Theme + Language + Profile */}
      <div className="flex items-center gap-1">
        <Link
          to="/notifications"
          aria-label={t('nav.notifications')}
          className="relative p-2.5 text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-white text-[10px] flex items-center justify-center">{unreadCount}</span>
          )}
        </Link>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <ProfileMenu />
      </div>
    </header>
  );
}
