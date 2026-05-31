import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Ticket, Zap, Music, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import PaymentConfirmModal from '@/components/bookings/PaymentConfirmModal';
import { useI18n } from '@/lib/I18nContext';
import { useFavorites, toggleFavorite } from '@/lib/favorites';

export default function EventDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const event = location.state?.event;
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const favs = useFavorites();
  const isFav = !!event && favs.some(f => String(f.id) === String(event.id));

  const statusMap = {
    on_sale:   { label: t('event.status.on_sale',   { en: 'On Sale',  th: 'เปิดขาย',  ja: '販売中',     zh: '开售中',   ko: '판매 중' }), class: 'bg-green-500/20 text-green-400 border-green-500/30' },
    upcoming:  { label: t('event.status.upcoming',  { en: 'Soon',     th: 'เร็วๆ นี้', ja: '近日',       zh: '即将开始', ko: '곧 시작' }), class: 'bg-primary/20 text-primary border-primary/30' },
    sold_out:  { label: t('event.status.sold_out',  { en: 'Sold Out', th: 'หมดแล้ว', ja: '完売',       zh: '已售罄',   ko: '매진' }),   class: 'bg-destructive/20 text-destructive border-destructive/30' },
    cancelled: { label: t('event.status.cancelled', { en: 'Cancelled',th: 'ยกเลิก',   ja: 'キャンセル', zh: '已取消',   ko: '취소됨' }), class: 'bg-secondary text-muted-foreground border-border' },
  };

  if (!event) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Music className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('event_detail.not_found', { en: 'Event not found', th: 'ไม่พบข้อมูลอีเวนต์', ja: 'イベントが見つかりません', zh: '未找到活动', ko: '이벤트를 찾을 수 없습니다' })}</p>
        <Button onClick={() => navigate('/events')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />{t('event_detail.back_to_list', { en: 'Back to Events', th: 'กลับไปหน้า Events', ja: 'イベント一覧へ戻る', zh: '返回活动列表', ko: '이벤트로 돌아가기' })}
        </Button>
      </div>
    );
  }

  const minPrice = event.zones?.reduce((min, z) => Math.min(min, z.price), Infinity) || 0;
  const status = statusMap[event.status] || statusMap.upcoming;
  const bookZone = selectedZone || event.zones?.[0];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/events')} className="text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back', { en: 'Back', th: 'กลับ', ja: '戻る', zh: '返回', ko: '뒤로' })}
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden h-72 md:h-96">
        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20">{event.source_platform}</Badge>
          <Badge className={status.class}>{status.label}</Badge>
        </div>
        <button
          onClick={() => toggleFavorite(event)}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <Heart className={`w-5 h-5 transition-colors ${isFav ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="font-syne font-bold text-white text-2xl md:text-3xl leading-tight">{event.title}</h1>
          <p className="text-white/70 text-base mt-1">{event.artist}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl border border-border/30 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{event.venue}, {event.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{event.date}{event.time ? ` · ${event.time}` : ''}</span>
          </div>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">{event.description}</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl border border-border/30 p-5 space-y-3">
        <h2 className="font-syne font-bold text-base">{t('event_detail.zones_title', { en: 'Zones & ticket prices', th: 'โซนและราคาบัตร', ja: 'ゾーンとチケット料金', zh: '区域和票价', ko: '구역 및 티켓 가격' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {event.zones?.map((zone, i) => (
            <button
              key={i}
              onClick={() => setSelectedZone(zone)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                selectedZone?.name === zone.name
                  ? 'border-primary/60 bg-primary/15 text-foreground'
                  : 'border-border/40 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <span className="font-medium text-sm">{zone.name}</span>
              <span className="font-bold text-gold text-sm">฿{zone.price.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl border border-border/30 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {bookZone
              ? `${t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })} ${bookZone.name}`
              : t('events.start_from')}
          </div>
          <div className="text-2xl font-bold text-gold">฿{(bookZone?.price || minPrice).toLocaleString()}</div>
        </div>
        <div className="flex gap-3">
          <Link to="/" state={{ prompt: t('event_detail.ai_book_prompt', { en: `Help me book a ticket for ${event.title}`, th: `ช่วยจองตั๋ว ${event.title}`, ja: `${event.title} のチケットを予約して`, zh: `帮我预订 ${event.title} 的门票`, ko: `${event.title} 티켓 예약 도와줘` }) }}>
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Zap className="w-4 h-4 mr-2" />{t('event_detail.ai_book', { en: 'Let AI book', th: 'ให้ AI จอง', ja: 'AI に予約させる', zh: '让 AI 预订', ko: 'AI에게 예약 맡기기' })}
            </Button>
          </Link>
          <Button
            onClick={() => setPaymentOpen(true)}
            disabled={event.status === 'sold_out' || event.status === 'cancelled'}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Ticket className="w-4 h-4 mr-2" />{t('card.book_now')}
          </Button>
        </div>
      </motion.div>

      <PaymentConfirmModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        event={event ? {
          title: event.title,
          venue: event.venue,
          date: event.date,
          price: bookZone?.price || minPrice,
          zone: bookZone?.name || 'General',
        } : null}
      />
    </div>
  );
}
