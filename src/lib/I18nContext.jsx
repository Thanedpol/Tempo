'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const I18nContext = createContext(null);

/** Translation dictionary. English is the source of truth; other langs fall back to it. */
const dict = {
  // — nav —
  'nav.ai_assistant':  { en: 'AI Assistant',  th: 'ผู้ช่วย AI',    ja: 'AIアシスタント', zh: 'AI助手',     ko: 'AI 어시스턴트' },
  'nav.dashboard':     { en: 'Dashboard',     th: 'แดชบอร์ด',     ja: 'ダッシュボード', zh: '仪表板',      ko: '대시보드' },
  'nav.events':        { en: 'Events',        th: 'อีเวนต์',       ja: 'イベント',      zh: '活动',        ko: '이벤트' },
  'nav.my_bookings':   { en: 'My Bookings',   th: 'การจอง',       ja: '予約',          zh: '我的预订',    ko: '내 예약' },
  'nav.hotels':        { en: 'Hotels',        th: 'โรงแรม',       ja: 'ホテル',        zh: '酒店',        ko: '호텔' },
  'nav.calendar':      { en: 'Calendar',      th: 'ปฏิทิน',       ja: 'カレンダー',    zh: '日历',        ko: '캘린더' },
  'nav.notifications': { en: 'Notifications', th: 'การแจ้งเตือน', ja: '通知',          zh: '通知',        ko: '알림' },
  'nav.faqs':          { en: 'FAQs',          th: 'คำถามที่พบบ่อย', ja: 'よくある質問', zh: '常见问题',    ko: '자주 묻는 질문' },

  // — common —
  'common.search':    { en: 'Search',      th: 'ค้นหา',         ja: '検索',           zh: '搜索',         ko: '검색' },
  'common.all':       { en: 'All',         th: 'ทั้งหมด',       ja: 'すべて',         zh: '全部',         ko: '전체' },
  'common.loading':   { en: 'Loading…',    th: 'กำลังโหลด...',  ja: '読み込み中...',  zh: '加载中...',    ko: '로딩 중...' },
  'common.refresh':   { en: 'Refresh',     th: 'รีเฟรช',        ja: '更新',           zh: '刷新',         ko: '새로고침' },
  'common.book':      { en: 'Book',        th: 'จอง',           ja: '予約する',       zh: '预订',         ko: '예약' },
  'common.sign_out':  { en: 'Sign out',    th: 'ออกจากระบบ',    ja: 'サインアウト',   zh: '退出登录',     ko: '로그아웃' },

  // — events page —
  'events.title':           { en: 'Events & Concerts',     th: 'อีเวนต์และคอนเสิร์ต',                ja: 'イベント＆コンサート',               zh: '活动与音乐会',         ko: '이벤트 & 콘서트' },
  'events.subtitle':        { en: 'All upcoming events',   th: 'อีเวนต์และคอนเสิร์ตทั้งหมด',           ja: 'すべての公演とイベント',             zh: '所有活动与音乐会',     ko: '모든 이벤트와 콘서트' },
  'events.realtime_update': { en: 'Real-time Update',      th: 'อัปเดตเรียลไทม์',                     ja: 'リアルタイム更新',                   zh: '实时更新',             ko: '실시간 업데이트' },
  'events.found':           { en: 'Found',                 th: 'พบ',                                ja: '見つかった',                         zh: '找到',                 ko: '검색됨' },
  'events.count_suffix':    { en: 'events',                th: 'อีเวนต์',                            ja: '件',                                zh: '场',                   ko: '개' },
  'events.no_results':      { en: 'No matching events',    th: 'ไม่พบอีเวนต์ที่ตรงกับเกณฑ์',            ja: '条件に一致するイベントはありません',    zh: '未找到符合条件的活动',  ko: '조건에 맞는 이벤트가 없습니다' },
  'events.start_from':      { en: 'From',                  th: 'เริ่มต้น',                            ja: '価格',                              zh: '起价',                 ko: '시작' },

  // — language switcher —
  'lang.label': { en: 'Language', th: 'ภาษา', ja: '言語', zh: '语言', ko: '언어' },
};

export const LANGUAGES = [
  { code: 'en', name: 'English',  label: 'English'  },
  { code: 'th', name: 'ไทย',      label: 'Thai'     },
  { code: 'ja', name: '日本語',   label: 'Japanese' },
  { code: 'zh', name: '中文',     label: 'Chinese'  },
  { code: 'ko', name: '한국어',   label: 'Korean'   },
];

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');     // default = English; useEffect picks the saved one
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    if (saved && LANGUAGES.some(l => l.code === saved)) setLangState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang, hydrated]);

  const setLang = (next) => {
    setLangState(next);
    try { localStorage.setItem('language', next); } catch {}
  };

  /**
   * t(key, { en, th } | string) — returns the translated string.
   * - When called with just a key, looks it up in the dict.
   * - When called with inline pairs (e.g. `t('foo', { en: 'Foo', th: 'ฟู' })`) uses those directly.
   *   Useful for one-off labels that aren't worth adding to the dict.
   */
  const t = (key, inline) => {
    const entry = (typeof inline === 'object' && inline) || dict[key] || null;
    if (!entry) return key;
    if (lang === 'en') return entry.en || key;
    return entry[lang] || entry.en || key;
  };

  /** Pick a label from a bilingual pair. Used by Layout's nav items. */
  const pick = ({ en, th, ja, zh, ko }) => {
    if (lang === 'en') return en;
    if (lang === 'th') return th || en;
    if (lang === 'ja') return ja || en;
    if (lang === 'zh') return zh || en;
    if (lang === 'ko') return ko || en;
    return en;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, pick, LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
