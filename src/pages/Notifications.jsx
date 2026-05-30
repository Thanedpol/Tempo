import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Ticket, Hotel, AlertTriangle, Music, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/lib/I18nContext';

export default function Notifications() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const typeConfig = {
    event_found:        { icon: Music,         color: 'text-primary',     bg: 'bg-primary/10',     label: t('notif.event_found',        { en: 'Event found',         th: 'พบอีเวนต์',         ja: 'イベント発見',     zh: '发现活动',     ko: '이벤트 발견' }) },
    ticket_held:        { icon: Ticket,        color: 'text-gold',        bg: 'bg-gold/10',        label: t('notif.ticket_held',        { en: 'Ticket held',         th: 'จับจองตั๋ว',         ja: 'チケット確保',     zh: '门票已锁定',   ko: '티켓 확보' }) },
    payment_required:   { icon: Ticket,        color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: t('notif.payment_required',   { en: 'Payment required',    th: 'รอชำระเงิน',         ja: '支払い待ち',       zh: '待付款',       ko: '결제 대기' }) },
    captcha_required:   { icon: AlertTriangle, color: 'text-amber-500',   bg: 'bg-amber-500/10',   label: t('notif.captcha_required',   { en: 'CAPTCHA needed',      th: 'ต้องการ CAPTCHA',    ja: 'CAPTCHA が必要',   zh: '需要 CAPTCHA', ko: 'CAPTCHA 필요' }) },
    booking_confirmed:  { icon: CheckCheck,    color: 'text-green-400',   bg: 'bg-green-400/10',   label: t('notif.booking_confirmed',  { en: 'Booking confirmed',   th: 'ยืนยันการจอง',       ja: '予約確定',         zh: '预订确认',     ko: '예약 확정' }) },
    reminder:           { icon: Calendar,      color: 'text-neon-cyan',   bg: 'bg-neon-cyan/10',   label: t('notif.reminder',           { en: 'Reminder',            th: 'เตือนความจำ',         ja: 'リマインダー',      zh: '提醒',         ko: '알림' }) },
    alert:              { icon: Bell,          color: 'text-destructive', bg: 'bg-destructive/10', label: t('notif.alert',              { en: 'Alert',               th: 'แจ้งเตือน',           ja: 'アラート',          zh: '警报',         ko: '경보' }) },
  };

  useEffect(() => {
    base44.entities.Notification.list('-created_date', 50)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">{t('nav.notifications')}</h1>
          {unreadCount > 0 ? (
            <p className="text-muted-foreground mt-1">
              {t('notif.unread_count', { en: `${unreadCount} unread`, th: `${unreadCount} รายการยังไม่อ่าน`, ja: `未読 ${unreadCount} 件`, zh: `${unreadCount} 条未读`, ko: `읽지 않음 ${unreadCount}건` })}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-normal text-muted-foreground/70">
              <Check className="w-3.5 h-3.5 text-green-500/70" strokeWidth={2.5} />
              <span>{t('notif.all_read', { en: 'All caught up', th: 'อ่านครบแล้ว', ja: 'すべて確認済み', zh: '已全部阅读', ko: '모두 확인함' })}</span>
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-primary text-xs">
            <CheckCheck className="w-4 h-4 mr-1" />
            {t('notif.mark_all_read', { en: 'Mark all read', th: 'อ่านทั้งหมด', ja: 'すべて既読にする', zh: '全部已读', ko: '모두 읽음' })}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-20 shimmer" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="font-syne font-bold text-xl mb-2">{t('notif.empty_title', { en: 'No notifications', th: 'ไม่มีการแจ้งเตือน', ja: '通知はありません', zh: '没有通知', ko: '알림 없음' })}</h3>
          <p className="text-muted-foreground">{t('notif.empty_sub', { en: 'AI notifications will appear here', th: 'การแจ้งเตือนจาก AI จะปรากฏที่นี่', ja: 'AI の通知はここに表示されます', zh: 'AI 通知将在此显示', ko: 'AI 알림이 여기에 표시됩니다' })}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const cfg = typeConfig[notif.type] || typeConfig.alert;
            const TypeIcon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`glass-light rounded-2xl p-4 border transition-all cursor-pointer hover:border-primary/20 ${
                  !notif.is_read ? 'border-primary/30' : 'border-border/30 opacity-70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{notif.title}</h3>
                          {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                      <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-transparent flex-shrink-0`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    {notif.created_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
