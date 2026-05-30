import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, Ticket, MapPin, Calendar, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import PaymentConfirmModal from '@/components/bookings/PaymentConfirmModal';
import { useI18n } from '@/lib/I18nContext';

const ALL_KEY = '__all__';
const GENRE_VALUES = ['rock', 'pop', 'k-pop', 'electronic', 'jazz', 'indie', 'hip-hop'];
const PLATFORM_VALUES = ['TTM', 'Ticketmelon', 'Eventpop'];


function EventCard({ event, onBook, onNavigate, t }) {
  const statusMap = {
    on_sale:   { label: t('event.status.on_sale',   { en: 'On Sale',  th: 'เปิดขาย',  ja: '販売中',     zh: '开售中',   ko: '판매 중' }), class: 'bg-green-500/20 text-green-400 border-green-500/30' },
    upcoming:  { label: t('event.status.upcoming',  { en: 'Soon',     th: 'เร็วๆ นี้', ja: '近日',       zh: '即将开始', ko: '곧 시작' }), class: 'bg-primary/20 text-primary border-primary/30' },
    sold_out:  { label: t('event.status.sold_out',  { en: 'Sold Out', th: 'หมดแล้ว', ja: '完売',       zh: '已售罄',   ko: '매진' }),   class: 'bg-destructive/20 text-destructive border-destructive/30' },
    cancelled: { label: t('event.status.cancelled', { en: 'Cancelled',th: 'ยกเลิก',   ja: 'キャンセル', zh: '已取消',   ko: '취소됨' }), class: 'bg-secondary text-muted-foreground border-border' },
  };

  const minPrice = event.zones?.reduce((min, z) => Math.min(min, z.price), Infinity) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => onNavigate(event)}
      className="glass rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all group flex flex-col cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0 bg-secondary">
        <img
          src={event.image_url}
          alt={event.title}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Stronger bottom gradient guarantees title is readable on any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {event.source_platform && (
            <Badge className="text-[10px] bg-black/60 backdrop-blur-sm text-white border-white/20">
              {event.source_platform}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={`text-[10px] ${statusMap[event.status]?.class || statusMap.upcoming.class}`}>
            {statusMap[event.status]?.label || statusMap.upcoming.label}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-syne font-bold text-white text-sm leading-tight drop-shadow-md">{event.title}</h3>
          <p className="text-white/85 text-xs drop-shadow">{event.artist}</p>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{event.venue}, {event.city}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0" />{event.date}</span>
        </div>
        <div className="flex flex-wrap gap-1 min-h-[44px] content-start">
          {event.zones?.slice(0, 3).map((zone, i) => (
            <Badge key={i} className="text-[10px] bg-secondary text-muted-foreground h-fit">
              {zone.name}: ฿{zone.price.toLocaleString()}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
          <div>
            <div className="text-xs text-muted-foreground">{t('events.start_from')}</div>
            <div className="text-lg font-bold text-gold">฿{minPrice.toLocaleString()}</div>
          </div>
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            <Link to="/">
              <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary hover:bg-primary/10 px-2">
                <Zap className="w-3 h-3 mr-1" />AI
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => onBook(event)}
              disabled={event.status === 'sold_out' || event.status === 'cancelled'}
              className="text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 px-2"
            >
              <Ticket className="w-3 h-3 mr-1" />{t('common.book')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState(ALL_KEY);
  const [platform, setPlatform] = useState(ALL_KEY);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.Event.list('-created_date', 100);
        setEvents(data);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === ALL_KEY || e.genre === genre;
    const matchPlatform = platform === ALL_KEY || e.source_platform === platform;
    return matchSearch && matchGenre && matchPlatform;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await base44.entities.Event.list('-created_date', 100);
      setEvents(data);
    } catch (err) {
      console.error('Failed to refresh events:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">{t('events.title', { en: 'Events & Concerts', th: 'อีเวนต์และคอนเสิร์ต', ja: 'イベント＆コンサート', zh: '活动与音乐会', ko: '이벤트 & 콘서트' })}</h1>
          <p className="text-muted-foreground mt-1">{t('events.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('common.loading') : t('events.realtime_update')}
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-light rounded-2xl p-4 border border-border/30 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('events.search_placeholder', { en: 'Search artists, events…', th: 'ค้นหาศิลปิน, อีเวนต์...', ja: 'アーティストやイベントを検索…', zh: '搜索艺人、活动…', ko: '아티스트, 이벤트 검색…' })}
            className="pl-9 bg-transparent border-border/50"
          />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-40 bg-transparent border-border/50">
            <SelectValue placeholder={t('events.genre', { en: 'Genre', th: 'แนวดนตรี', ja: 'ジャンル', zh: '风格', ko: '장르' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_KEY}>{t('common.all')}</SelectItem>
            {GENRE_VALUES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-40 bg-transparent border-border/50">
            <SelectValue placeholder={t('events.platform', { en: 'Platform', th: 'แพลตฟอร์ม', ja: 'プラットフォーム', zh: '平台', ko: '플랫폼' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_KEY}>{t('common.all')}</SelectItem>
            {PLATFORM_VALUES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{t('events.found')} {filtered.length} {t('events.count_suffix')}</p>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass rounded-2xl h-96 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{t('events.no_results')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              t={t}
              onNavigate={(e) => navigate(`/events/${e.id}`, { state: { event: e } })}
              onBook={(e) => { setSelectedEvent(e); setPaymentOpen(true); }}
            />
          ))}
        </div>
      )}

      <PaymentConfirmModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        event={selectedEvent ? {
          title: selectedEvent.title,
          venue: selectedEvent.venue,
          date: selectedEvent.date,
          price: selectedEvent.zones?.[0]?.price || 0,
          zone: selectedEvent.zones?.[0]?.name || 'General',
        } : null}
      />
    </div>
  );
}