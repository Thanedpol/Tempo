import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Ticket, Hotel, Bell, Calendar, TrendingUp, Zap, Clock, CheckCircle, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';

function StatCard({ icon: Icon, label, value, color, sub }) {
  // Icon is passed as prop and used below
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light rounded-2xl p-5 border border-border/30 hover:border-primary/20 transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-syne font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-primary mt-1">{sub}</div>}
    </motion.div>
  );
}

function BookingCard({ booking, t }) {
  const statusColor = {
    confirmed: 'text-green-400 bg-green-400/10 border-green-400/20',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    payment_required: 'text-primary bg-primary/10 border-primary/20',
    cancelled: 'text-destructive bg-destructive/10 border-destructive/20',
    used: 'text-muted-foreground bg-secondary border-border',
  };

  const statusLabel = {
    confirmed:        t('booking.status.confirmed',        { en: 'Confirmed',        th: 'ยืนยันแล้ว',     ja: '確定',         zh: '已确认',       ko: '확정됨' }),
    pending:          t('booking.status.pending',          { en: 'Pending',          th: 'รอดำเนินการ',     ja: '処理中',       zh: '处理中',       ko: '대기 중' }),
    payment_required: t('booking.status.payment_required', { en: 'Awaiting payment', th: 'รอชำระเงิน',      ja: '支払い待ち',    zh: '待付款',       ko: '결제 대기' }),
    cancelled:        t('booking.status.cancelled',        { en: 'Cancelled',        th: 'ยกเลิก',          ja: 'キャンセル',    zh: '已取消',       ko: '취소됨' }),
    used:             t('booking.status.used',             { en: 'Used',             th: 'ใช้แล้ว',          ja: '使用済み',      zh: '已使用',       ko: '사용됨' }),
  };

  return (
    <div className="glass-light rounded-2xl p-4 border border-border/30 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-semibold text-sm truncate">{booking.event_title || 'Concert Event'}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
            {booking.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.venue}</span>}
            {booking.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.event_date}</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-xs ${statusColor[booking.status] || statusColor.pending}`}>
              {statusLabel[booking.status] || statusLabel.pending}
            </Badge>
            {booking.zone && <span className="text-xs text-muted-foreground">{t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })} {booking.zone}</span>}
            {booking.total_price && <span className="text-xs text-gold font-medium">฿{booking.total_price.toLocaleString()}</span>}
          </div>
        </div>
        {booking.ticket_code && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Ticket</div>
            <div className="text-xs font-mono text-primary">{booking.ticket_code}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 10),
      base44.entities.Notification.list('-created_date', 5),
    ]).then(([b, n]) => {
      setBookings(b);
      setNotifications(n);
    }).finally(() => setLoading(false));
  }, []);

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'payment_required').length;
  const totalSpend = bookings.reduce((s, b) => s + (b.total_price || 0), 0);

  const upcomingEvents = [
    {
      title: 'Coldplay: Music of the Spheres',
      artist: 'Coldplay',
      date: 'Dec 14, 2026',
      venue: 'Rajamangala Stadium, Bangkok',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300',
      status: 'on_sale',
      price: 4500,
      platform: 'Ticketmelon',
    },
    {
      title: 'BLACKPINK World Tour',
      artist: 'BLACKPINK',
      date: 'Nov 8, 2026',
      venue: 'Impact Arena, Bangkok',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
      status: 'upcoming',
      price: 3800,
      platform: 'TTM',
    },
    {
      title: 'Electronic Music Festival',
      artist: 'Various Artists',
      date: 'Oct 22, 2026',
      venue: 'Thunder Dome',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300',
      status: 'on_sale',
      price: 2500,
      platform: 'Eventpop',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-syne text-3xl font-bold gradient-text">{t('dash.title', { en: 'Smart Dashboard', th: 'แดชบอร์ดอัจฉริยะ', ja: 'スマートダッシュボード', zh: '智能仪表板', ko: '스마트 대시보드' })}</h1>
        <p className="text-muted-foreground mt-1">{t('dash.subtitle', { en: 'Your bookings and events at a glance', th: 'ภาพรวมการจองและอีเวนต์ของคุณ', ja: '予約とイベントの概要', zh: '您的预订与活动概览', ko: '예약과 이벤트 한눈에 보기' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket}      label={t('dash.total_bookings',  { en: 'Total bookings',  th: 'การจองทั้งหมด',  ja: '予約数',           zh: '总预订数',     ko: '전체 예약' })}       value={bookings.length}                                          color="bg-primary"   sub={t('dash.confirmed_n', { en: `${confirmedCount} confirmed`, th: `${confirmedCount} ยืนยันแล้ว`, ja: `${confirmedCount} 件確定`, zh: `${confirmedCount} 已确认`, ko: `${confirmedCount}건 확정` })} />
        <StatCard icon={Clock}       label={t('dash.pending',         { en: 'Pending',         th: 'รอดำเนินการ',     ja: '保留中',           zh: '处理中',       ko: '대기 중' })}          value={pendingCount}                                             color="bg-amber-500" sub={t('dash.please_check', { en: 'Please review', th: 'กรุณาตรวจสอบ', ja: 'ご確認ください', zh: '请检查', ko: '확인 바랍니다' })} />
        <StatCard icon={TrendingUp}  label={t('dash.total_spend',     { en: 'Total spend',     th: 'ยอดใช้จ่ายรวม',   ja: '合計支出',         zh: '总支出',       ko: '총 지출' })}          value={`฿${totalSpend.toLocaleString()}`}                       color="bg-green-600" />
        <StatCard icon={Bell}        label={t('nav.notifications')}                                                                                                                                                              value={notifications.filter(n => !n.is_read).length}            color="bg-accent"    sub={t('dash.unread', { en: 'Unread', th: 'ยังไม่อ่าน', ja: '未読', zh: '未读', ko: '읽지 않음' })} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-syne font-bold text-lg">{t('dash.popular_events', { en: 'Popular events', th: 'อีเวนต์ยอดนิยม', ja: '人気のイベント', zh: '热门活动', ko: '인기 이벤트' })}</h2>
            <Link to="/events" className="text-xs text-primary hover:underline">{t('common.view_all', { en: 'View all', th: 'ดูทั้งหมด', ja: 'すべて見る', zh: '查看全部', ko: '모두 보기' })} →</Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-light rounded-2xl p-4 border border-border/30 hover:border-primary/20 transition-all flex gap-4"
              >
                <img src={event.image} alt={event.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                    <Badge className={`text-[10px] flex-shrink-0 ${event.status === 'on_sale' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-secondary text-muted-foreground'}`}>
                      {event.status === 'on_sale'
                        ? t('event.status.on_sale',  { en: 'On Sale', th: 'เปิดขาย', ja: '販売中', zh: '开售中', ko: '판매 중' })
                        : t('event.status.upcoming', { en: 'Soon',    th: 'เร็วๆ นี้', ja: '近日',  zh: '即将开始', ko: '곧 시작' })}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.date} · {event.venue}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-gold">฿{event.price.toLocaleString()}</span>
                    <Link to="/">
                      <Button size="sm" className="text-xs h-7 px-3 bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent">
                        <Zap className="w-3 h-3 mr-1" />{t('dash.book_with_ai', { en: 'Book with AI', th: 'จองกับ AI', ja: 'AI で予約', zh: 'AI 预订', ko: 'AI로 예약' })}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* My Bookings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-syne font-bold text-lg">{t('nav.my_bookings')}</h2>
            <Link to="/bookings" className="text-xs text-primary hover:underline">{t('common.view_all', { en: 'View all', th: 'ดูทั้งหมด', ja: 'すべて見る', zh: '查看全部', ko: '모두 보기' })} →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-light rounded-2xl p-4 border border-border/30 h-20 shimmer" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass-light rounded-2xl p-8 border border-border/30 text-center">
              <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('dash.no_bookings', { en: 'No bookings yet', th: 'ยังไม่มีการจอง', ja: 'まだ予約はありません', zh: '暂无预订', ko: '아직 예약이 없습니다' })}</p>
              <Link to="/">
                <Button size="sm" className="mt-3 bg-primary hover:bg-primary/90">{t('dash.start_booking', { en: 'Start booking', th: 'เริ่มจองตั๋ว', ja: '予約を始める', zh: '开始预订', ko: '예약 시작' })}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <BookingCard booking={booking} t={t} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-syne font-bold text-lg">{t('dash.recent_notifications', { en: 'Recent notifications', th: 'การแจ้งเตือนล่าสุด', ja: '最近の通知', zh: '最近通知', ko: '최근 알림' })}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notifications.slice(0, 3).map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-light rounded-2xl p-4 border transition-all ${
                  !notif.is_read ? 'border-primary/30' : 'border-border/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{
                    notif.type === 'event_found' ? '🎵' :
                    notif.type === 'booking_confirmed' ? '✅' :
                    notif.type === 'captcha_required' ? '⚠️' : '🔔'
                  }</span>
                  <div>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1 ml-auto" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}