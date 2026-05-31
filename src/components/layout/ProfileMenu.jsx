import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Settings as SettingsIcon, LogOut, ChevronDown, Ticket, ShieldCheck } from 'lucide-react';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => base44.auth.redirectToLogin()}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
      >
        {t('profile.sign_in', { en: 'Sign in', th: 'เข้าสู่ระบบ', ja: 'サインイン', zh: '登录', ko: '로그인' })}
      </button>
    );
  }

  const initials = (user.full_name || user.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const roleLabel = user.role === 'admin'
    ? t('profile.role_admin',  { en: '👑 Admin',  th: '👑 ผู้ดูแล',  ja: '👑 管理者', zh: '👑 管理员', ko: '👑 관리자' })
    : t('profile.role_member', { en: '🎵 Member', th: '🎵 สมาชิก',   ja: '🎵 メンバー', zh: '🎵 会员',  ko: '🎵 회원' });

  return (
    <div className="relative" ref={ref}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary/80 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${open ? 'bg-secondary/70 ring-2 ring-primary/30' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold glow-primary flex-shrink-0">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-medium leading-none">{user.full_name || t('profile.user', { en: 'User', th: 'ผู้ใช้', ja: 'ユーザー', zh: '用户', ko: '사용자' })}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{roleLabel}</div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ease-out ${open ? 'rotate-180 text-primary' : ''}`}
          strokeWidth={2.25}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 glass border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* User Info */}
            <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold glow-primary">
                  {initials}
                </div>
                <div>
                  <div className="text-sm font-semibold">{user.full_name || t('profile.user', { en: 'User', th: 'ผู้ใช้', ja: 'ユーザー', zh: '用户', ko: '사용자' })}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</div>
                  <div className="text-[10px] mt-0.5 text-primary">{roleLabel}</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-0.5">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-sm group">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{t('profile.payments',        { en: 'Payments',          th: 'ยอดชำระเงิน',     ja: '支払い',     zh: '付款',         ko: '결제' })}</div>
                  <div className="text-[10px] text-muted-foreground">{t('profile.payments_sub', { en: 'View payment history', th: 'ดูประวัติการจ่ายเงิน', ja: '支払い履歴を見る', zh: '查看付款历史', ko: '결제 내역 보기' })}</div>
                </div>
              </Link>

              <Link to="/bookings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-sm group">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Ticket className="w-3.5 h-3.5 text-gold" />
                </div>
                <div>
                  <div className="font-medium">{t('profile.my_tickets',      { en: 'My Tickets',     th: 'ตั๋วของฉัน',      ja: 'マイチケット',  zh: '我的票',     ko: '내 티켓' })}</div>
                  <div className="text-[10px] text-muted-foreground">{t('profile.my_tickets_sub',{ en: 'View all bookings', th: 'ดูการจองทั้งหมด', ja: 'すべての予約を見る', zh: '查看所有预订', ko: '모든 예약 보기' })}</div>
                </div>
              </Link>

              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-sm group">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <div className="font-medium">{t('profile.edit_profile',    { en: 'Edit Profile',     th: 'แก้ไขโปรไฟล์',  ja: 'プロフィール編集', zh: '编辑资料', ko: '프로필 수정' })}</div>
                  <div className="text-[10px] text-muted-foreground">{t('profile.edit_profile_sub',{ en: 'Name, email, password', th: 'ชื่อ, อีเมล, รหัสผ่าน', ja: '名前、メール、パスワード', zh: '姓名、邮箱、密码', ko: '이름, 이메일, 비밀번호' })}</div>
                </div>
              </Link>

              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-sm group">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <SettingsIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{t('profile.settings', { en: 'Settings', th: 'การตั้งค่า', ja: '設定', zh: '设置', ko: '설정' })}</div>
                  <div className="text-[10px] text-muted-foreground">{t('profile.settings_sub', { en: 'Payment · Favorites', th: 'การชำระเงิน · รายการโปรด', ja: '支払い · お気に入り', zh: '支付 · 收藏', ko: '결제 · 즐겨찾기' })}</div>
                </div>
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-sm group">
                  <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium">Admin Panel</div>
                    <div className="text-[10px] text-muted-foreground">{t('profile.admin_sub', { en: 'System · AI · Platforms', th: 'ระบบ · AI · แพลตฟอร์ม', ja: 'システム · AI · プラットフォーム', zh: '系统 · AI · 平台', ko: '시스템 · AI · 플랫폼' })}</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-border/30">
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-all text-sm text-muted-foreground hover:text-destructive group"
              >
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span>{t('common.sign_out')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
