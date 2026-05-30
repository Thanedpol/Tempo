import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Calendar, Ticket, Hotel, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/I18nContext';

export default function Home() {
  const { t } = useI18n();

  const features = [
    { icon: Zap,      title: t('nav.ai_assistant'), desc: t('home.feat_ai',      { en: 'Smart AI helper that picks events for you',        th: 'ผู้ช่วย AI อัจฉริยะ ช่วยตัดสินใจเลือกอีเวนต์',         ja: 'イベント選びを助けるスマートAIアシスタント',    zh: '智能 AI 帮你挑选活动',     ko: '이벤트 선택을 돕는 AI 어시스턴트' }), link: '/',         color: 'text-primary' },
    { icon: Ticket,   title: t('nav.events'),       desc: t('home.feat_events',  { en: 'Find and book concert + event tickets',            th: 'ค้นหาและจองตั๋วคอนเสิร์ต อีเวนต์ต่างๆ',                ja: 'コンサートやイベントのチケット検索・予約',      zh: '查找并预订音乐会和活动门票', ko: '콘서트와 이벤트 티켓 검색 및 예약' }),       link: '/events',   color: 'text-gold' },
    { icon: Hotel,    title: t('nav.hotels'),       desc: t('home.feat_hotels',  { en: 'Hotels near venues, from multiple platforms',      th: 'โรงแรมใกล้สถานที่จัดงาน จากหลายแพลตฟอร์ม',         ja: '複数のサイトから会場近くのホテル',              zh: '从多个平台查找场馆附近的酒店', ko: '여러 플랫폼에서 공연장 근처 호텔' }),         link: '/hotels',   color: 'text-neon-cyan' },
    { icon: Calendar, title: t('nav.calendar'),     desc: t('home.feat_calendar',{ en: 'Manage your tickets and events on a calendar',      th: 'จัดการตั๋วและอีเวนต์ของคุณในปฏิทิน',                  ja: 'カレンダーでチケットとイベントを管理',          zh: '在日历中管理您的票务和活动',   ko: '캘린더에서 티켓과 이벤트 관리' }),  link: '/calendar', color: 'text-accent' },
  ];

  const stats = [
    { label: t('home.stat_events',  { en: 'Total events',     th: 'อีเวนต์ทั้งหมด', ja: '総イベント数',  zh: '活动总数',  ko: '총 이벤트' }),    value: '1,200+', icon: Ticket },
    { label: t('home.stat_hotels',  { en: 'Nearby hotels',    th: 'โรงแรมใกล้',     ja: '近くのホテル',  zh: '附近酒店',  ko: '근처 호텔' }),     value: '500+',   icon: Hotel },
    { label: t('home.stat_users',   { en: 'Active users',     th: 'ผู้ใช้งาน',       ja: 'アクティブユーザー', zh: '活跃用户', ko: '활성 사용자' }), value: '10K+',   icon: Sparkles },
    { label: t('home.stat_rating',  { en: 'Satisfaction',     th: 'ความพึงพอใจ',    ja: '満足度',        zh: '满意度',    ko: '만족도' }),         value: '4.8/5',  icon: Zap },
  ];

  return (
    <div className="min-h-screen space-y-20 pb-12">
      {/* Hero Section */}
      <section className="p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-syne text-5xl lg:text-6xl font-bold gradient-text mb-6 leading-tight">
              {t('home.hero_title', { en: 'Find events and book tickets — intelligently', th: 'ค้นหาอีเวนต์และจองตั๋วอย่างเฉลียวฉลาด', ja: 'スマートにイベントを見つけてチケットを予約', zh: '智能搜索活动并预订门票', ko: '이벤트를 찾고 똑똑하게 티켓 예매' })}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {t('home.hero_sub', { en: 'An AI assistant that helps you discover concerts, events, and nearby hotels — all in one place.', th: 'ผู้ช่วย AI ที่ช่วยให้คุณค้นหาคอนเสิร์ต อีเวนต์และโรงแรมใกล้เคียง ทั้งหมดในที่เดียว', ja: 'コンサート、イベント、近隣ホテルをまとめて見つけるAIアシスタント', zh: '一站式 AI 助手:发现音乐会、活动和附近酒店', ko: '콘서트, 이벤트, 근처 호텔을 한곳에서 찾는 AI 어시스턴트' })}
            </p>
            <div className="flex gap-4">
              <Link to="/">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Zap className="w-5 h-5 mr-2" />
                  {t('home.cta_start_ai', { en: 'Start with AI Assistant', th: 'เริ่มใช้ AI Assistant', ja: 'AI アシスタントを開始', zh: '开始使用 AI 助手', ko: 'AI 어시스턴트 시작' })}
                </Button>
              </Link>
              <Link to="/events">
                <Button size="lg" variant="outline">
                  {t('home.cta_browse', { en: 'Browse events', th: 'ค้นหาอีเวนต์', ja: 'イベントを探す', zh: '浏览活动', ko: '이벤트 찾기' })}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right - Visual */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative h-96 hidden lg:flex items-center justify-center">
            <div className="absolute w-48 h-48 bg-primary/30 rounded-full blur-3xl"></div>
            <div className="absolute w-48 h-48 bg-accent/30 rounded-full blur-3xl -right-12"></div>
            <div className="relative z-10 text-6xl">🎵</div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="p-6 max-w-6xl mx-auto">
        <h2 className="font-syne text-4xl font-bold mb-12 text-center gradient-text">
          {t('home.what_you_can_do', { en: 'What can you do?', th: 'คุณสามารถทำอะไรได้บ้าง?', ja: '何ができますか?', zh: '你能做什么?', ko: '무엇을 할 수 있나요?' })}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={f.link}>
                <div className="glass rounded-2xl p-6 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors ${f.color}`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-syne font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-primary group-hover:translate-x-1 transition-transform">
                    <span className="text-sm font-medium">{t('home.visit', { en: 'Visit', th: 'เยี่ยมชม', ja: '訪問', zh: '前往', ko: '방문' })}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="p-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6 border border-border/30 text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="font-syne font-bold text-2xl gradient-text mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-6 max-w-6xl mx-auto">
        <div className="glass rounded-3xl border border-primary/30 p-12 text-center space-y-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <h2 className="font-syne text-3xl font-bold">{t('home.ready_title', { en: 'Ready to get started?', th: 'พร้อมเริ่มต้นหรือยัง?', ja: '始める準備はできましたか?', zh: '准备好开始了吗?', ko: '시작할 준비 되셨나요?' })}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('home.ready_sub', { en: 'Let the AI assistant find your favorite events and book tickets the moment they go on sale.', th: 'ให้ AI Assistant ช่วยคุณค้นหาอีเวนต์โปรดปรานและจองตั๋วได้ทันทีที่เปิดขาย', ja: 'AI アシスタントにお気に入りのイベントを見つけて、販売開始と同時にチケットを予約してもらいましょう', zh: '让 AI 助手为您查找喜爱的活动并在开售时立即预订门票', ko: 'AI 어시스턴트가 좋아하는 이벤트를 찾고 판매 시작과 동시에 티켓을 예매해 드립니다' })}
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 mx-auto">
              <Zap className="w-5 h-5 mr-2" />
              {t('home.go_to_ai', { en: 'Go to AI Assistant', th: 'ไปยัง AI Assistant', ja: 'AI アシスタントへ', zh: '前往 AI 助手', ko: 'AI 어시스턴트로' })}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
