import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Ticket, Download, Calendar, MapPin, QrCode, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';

function TicketCard({ booking, t }) {
  const [showQR, setShowQR] = useState(false);

  const statusConfig = {
    confirmed:        { label: t('booking.status.confirmed',        { en: 'Confirmed',        th: 'ยืนยันแล้ว',     ja: '確定',         zh: '已确认',     ko: '확정됨' }),     icon: CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    pending:          { label: t('booking.status.pending',          { en: 'Pending',          th: 'รอดำเนินการ',     ja: '処理中',       zh: '处理中',     ko: '대기 중' }),    icon: Clock,       color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    payment_required: { label: t('booking.status.payment_required', { en: 'Awaiting payment', th: 'รอชำระเงิน',      ja: '支払い待ち',   zh: '待付款',     ko: '결제 대기' }),  icon: Clock,       color: 'text-primary bg-primary/10 border-primary/20' },
    cancelled:        { label: t('booking.status.cancelled',        { en: 'Cancelled',        th: 'ยกเลิก',          ja: 'キャンセル',   zh: '已取消',     ko: '취소됨' }),     icon: XCircle,     color: 'text-destructive bg-destructive/10 border-destructive/20' },
    used:             { label: t('booking.status.used',             { en: 'Used',             th: 'ใช้แล้ว',          ja: '使用済み',     zh: '已使用',     ko: '사용됨' }),     icon: CheckCircle, color: 'text-muted-foreground bg-secondary border-border' },
  };
  const config = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden border border-border/30 hover:border-primary/20 transition-all">
      <div className="relative p-5 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-syne font-bold line-clamp-2 leading-snug">{booking.event_title || 'Concert Event'}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {booking.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.venue}</span>}
              {booking.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.event_date}</span>}
            </div>
          </div>
          <Badge className={`text-xs ${config.color} flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />{config.label}
          </Badge>
        </div>
      </div>

      <div className="relative flex items-center">
        <div className="w-5 h-5 rounded-full bg-background absolute -left-2.5 border-r border-border/50" />
        <div className="flex-1 border-t border-dashed border-border/50 mx-2" />
        <div className="w-5 h-5 rounded-full bg-background absolute -right-2.5 border-l border-border/50" />
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">{t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })}</div>
            <div className="font-semibold mt-0.5">{booking.zone || 'General'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('booking.qty', { en: 'Qty', th: 'จำนวน', ja: '数量', zh: '数量', ko: '수량' })}</div>
            <div className="font-semibold mt-0.5">{booking.quantity || 1} {t('booking.tickets', { en: 'tix', th: 'ใบ', ja: '枚', zh: '张', ko: '매' })}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('booking.total', { en: 'Total', th: 'ราคารวม', ja: '合計', zh: '总价', ko: '총액' })}</div>
            <div className="font-semibold text-gold mt-0.5">฿{(booking.total_price || 0).toLocaleString()}</div>
          </div>
        </div>

        {booking.ticket_code && (
          <div className="flex items-center justify-between glass-light rounded-xl p-3">
            <div>
              <div className="text-xs text-muted-foreground">Ticket Code</div>
              <div className="font-mono font-bold text-primary text-lg tracking-widest">{booking.ticket_code}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowQR(!showQR)} className="text-muted-foreground hover:text-primary">
              <QrCode className="w-5 h-5" />
            </Button>
          </div>
        )}

        {showQR && booking.ticket_code && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center gap-3 p-4 glass-light rounded-xl">
            <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center">
              <div className="grid grid-cols-8 gap-0.5 p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('booking.qr_hint', { en: 'Show this QR at the entrance', th: 'แสดง QR Code นี้ที่ประตูงาน', ja: '入口でこの QR コードを提示', zh: '在入口处出示此二维码', ko: '입구에서 이 QR 코드를 보여주세요' })}</p>
          </motion.div>
        )}

        <div className="space-y-2">
          {booking.status === 'payment_required' && (
            <Button size="sm" className="w-full text-xs bg-gradient-to-r from-primary to-accent">
              {t('booking.pay_now', { en: 'Pay now', th: 'ชำระเงิน', ja: '今すぐ支払う', zh: '立即付款', ko: '지금 결제' })} →
            </Button>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs border-border/50" disabled={booking.status !== 'confirmed'}>
              <Download className="w-3 h-3 mr-1" />{t('booking.download', { en: 'Download', th: 'ดาวน์โหลด', ja: 'ダウンロード', zh: '下载', ko: '다운로드' })}
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs border-border/50" disabled={booking.status !== 'confirmed'}>
              <Wallet className="w-3 h-3 mr-1" />{t('booking.add_wallet', { en: 'Add to Wallet', th: 'เพิ่มใน Wallet', ja: 'ウォレットに追加', zh: '加入 Wallet', ko: 'Wallet에 추가' })}
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs border-border/50" disabled={booking.status !== 'confirmed'}>
              <Calendar className="w-3 h-3 mr-1" />{t('nav.calendar')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Bookings() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 50)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all' ? bookings :
    bookings.filter(b => activeTab === 'active' ? ['confirmed', 'payment_required', 'pending'].includes(b.status) : b.status === activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold gradient-text">{t('nav.my_bookings')}</h1>
        <p className="text-muted-foreground mt-1">{t('booking.subtitle', { en: 'Your e-tickets and all bookings', th: 'E-Tickets และการจองทั้งหมดของคุณ', ja: '電子チケットとすべての予約', zh: '电子票务和所有预订', ko: 'E-티켓 및 모든 예약' })}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">{t('common.all')} ({bookings.length})</TabsTrigger>
          <TabsTrigger value="active">{t('booking.tab.active',    { en: 'Active',    th: 'ใช้งานได้',    ja: '有効',     zh: '可用',       ko: '활성' })}</TabsTrigger>
          <TabsTrigger value="confirmed">{t('booking.status.confirmed', { en: 'Confirmed', th: 'ยืนยันแล้ว', ja: '確定', zh: '已确认', ko: '확정됨' })}</TabsTrigger>
          <TabsTrigger value="used">{t('booking.status.used', { en: 'Used', th: 'ใช้แล้ว', ja: '使用済み', zh: '已使用', ko: '사용됨' })}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-64 shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-syne font-bold text-xl mb-2">{t('booking.empty_title', { en: 'No tickets yet', th: 'ยังไม่มีตั๋ว', ja: 'チケットなし', zh: '暂无门票', ko: '티켓이 없습니다' })}</h3>
              <p className="text-muted-foreground mb-4">{t('booking.empty_sub', { en: 'Let AI find and book tickets for you', th: 'ลองให้ AI ช่วยหาและจองตั๋วให้คุณ', ja: 'AI にチケットを探して予約してもらいましょう', zh: '让 AI 帮您查找并预订门票', ko: 'AI에게 티켓 검색과 예약을 맡겨보세요' })}</p>
              <Link to="/">
                <Button className="bg-gradient-to-r from-primary to-accent">
                  {t('booking.start_with_ai', { en: 'Start with AI', th: 'เริ่มจองกับ AI', ja: 'AI で始める', zh: '使用 AI 开始', ko: 'AI로 시작' })}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(b => <TicketCard key={b.id} booking={b} t={t} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
