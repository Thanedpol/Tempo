import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Wifi, Car, Coffee, Waves, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';
import { base44 } from '@/api/base44Client';
import HotelBookingModal from '@/components/bookings/HotelBookingModal';

const MOCK_HOTELS = [
  {
    id: '1', name: 'Centara Grand at Central World', rating: 5, price_per_night: 4200, distance: '0.5 กม.',
    address: 'Ratchaprasong, Bangkok', source: 'Agoda',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    amenities: ['wifi', 'pool', 'parking', 'breakfast'],
    event: 'Coldplay Concert - Rajamangala',
    available: true,
  },
  {
    id: '2', name: 'Novotel Bangkok Platinum', rating: 4, price_per_night: 2800, distance: '1.2 กม.',
    address: 'Pratunam, Bangkok', source: 'Booking.com',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    amenities: ['wifi', 'pool', 'breakfast'],
    event: 'BLACKPINK Concert - Impact',
    available: true,
  },
  {
    id: '3', name: 'Holiday Inn Express Bangkok', rating: 3, price_per_night: 1600, distance: '2.0 กม.',
    address: 'Sukhumvit, Bangkok', source: 'Agoda',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
    amenities: ['wifi', 'breakfast'],
    event: 'EDC Thailand - SHOW DC',
    available: true,
  },
  {
    id: '4', name: 'Bangkok Marriott Marquis Queen\'s Park', rating: 5, price_per_night: 6500, distance: '3.0 กม.',
    address: 'Sukhumvit, Bangkok', source: 'Booking.com',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    amenities: ['wifi', 'pool', 'parking', 'breakfast', 'spa'],
    event: 'Summer Sonic - Bitec Bangna',
    available: false,
  },
];

function HotelCard({ hotel, onDetail, onBook, t }) {
  const amenityIcons = {
    wifi:      { icon: Wifi,   label: 'Wi-Fi' },
    pool:      { icon: Waves,  label: t('hotel.amenity.pool',      { en: 'Pool',      th: 'สระว่ายน้ำ',  ja: 'プール',    zh: '泳池',     ko: '수영장' }) },
    parking:   { icon: Car,    label: t('hotel.amenity.parking',   { en: 'Parking',   th: 'ที่จอดรถ',     ja: '駐車場',     zh: '停车',     ko: '주차장' }) },
    breakfast: { icon: Coffee, label: t('hotel.amenity.breakfast', { en: 'Breakfast', th: 'อาหารเช้า',  ja: '朝食',       zh: '早餐',     ko: '조식' }) },
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => onDetail(hotel)}
      className="glass rounded-2xl overflow-hidden border border-border/30 hover:border-neon-cyan/30 transition-all group flex flex-col cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          {hotel.source_url ? (
            <a
              href={hotel.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white border border-white/20 rounded-md px-2 py-0.5 hover:bg-black/80 transition-colors"
            >
              {hotel.source} ↗
            </a>
          ) : (
            <Badge className="text-[10px] bg-black/50 backdrop-blur-sm text-white border-white/20">{hotel.source}</Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={`text-[10px] ${hotel.available ? 'bg-green-500/80 text-white' : 'bg-destructive/80 text-white'}`}>
            {hotel.available
              ? t('hotel.status.available', { en: 'Available', th: 'ว่าง', ja: '空きあり', zh: '有空房', ko: '예약 가능' })
              : t('hotel.status.full',      { en: 'Full',      th: 'เต็ม',  ja: '満室',     zh: '已满',    ko: '만실' })}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          {Array.from({ length: hotel.rating }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-gold text-gold" />
          ))}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-syne font-semibold min-h-[48px] flex items-start">{hotel.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />{hotel.address}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap min-h-[52px] content-start">
          {hotel.amenities.map(a => {
            const cfg = amenityIcons[a];
            if (!cfg) return null;
            return (
              <span key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-lg px-2 py-1 h-fit">
                <cfg.icon className="w-3 h-3" />{cfg.label}
              </span>
            );
          })}
        </div>
        <div className="min-h-[36px]">
          {hotel.event && (
            <p className="text-xs text-neon-cyan bg-neon-cyan/10 rounded-lg px-3 py-1.5">
              📍 {t('hotel.near', { en: 'Near', th: 'ใกล้', ja: '近く', zh: '邻近', ko: '근처' })}: {hotel.event} · {hotel.distance}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
          <div>
            <span className="text-xl font-bold text-neon-cyan">฿{hotel.price_per_night.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/{t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</span>
          </div>
          <Button
            size="sm"
            disabled={!hotel.available}
            onClick={(e) => { e.stopPropagation(); onBook(hotel); }}
            className="text-xs bg-gradient-to-r from-neon-cyan/80 to-primary/80 hover:from-neon-cyan hover:to-primary text-background font-semibold"
          >
            {t('hotel.book', { en: 'Book hotel', th: 'จองโรงแรม', ja: '予約する', zh: '预订酒店', ko: '호텔 예약' })}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Map a hotel_bookings catalogue row → the card shape.
function mapRow(r) {
  return {
    id: r.id,
    name: r.hotel_name || 'Hotel',
    image: r.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    price_per_night: r.price_per_night || 1500,
    distance: r.distance_to_venue || '',
    address: r.address || 'Bangkok',
    source: r.source || 'Agoda',
    source_url: r.source_url,
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    rating: r.rating || 4,
    available: r.status !== 'sold_out',
  };
}

export default function Hotels() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [hotels, setHotels] = useState(MOCK_HOTELS);
  const [loading, setLoading] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.HotelBooking.list('-created_date', 60);
      const catalogue = (rows || []).filter(r => r.hotel_name).map(mapRow);
      setHotels(catalogue.length ? catalogue : MOCK_HOTELS);   // fall back to samples when empty
    } catch {
      setHotels(MOCK_HOTELS);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = hotels
    .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'price' ? a.price_per_night - b.price_per_night : b.rating - a.rating);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">{t('hotel.title', { en: 'Hotels Nearby', th: 'โรงแรมใกล้สถานที่', ja: '近くのホテル', zh: '附近酒店', ko: '근처 호텔' })}</h1>
          <p className="text-muted-foreground mt-1">{t('hotel.subtitle', { en: 'Hotels near the venue, from Agoda & Booking.com', th: 'โรงแรมใกล้สถานที่จัดงาน จาก Agoda & Booking.com', ja: '会場近くのホテル — Agoda & Booking.com から', zh: '场馆附近的酒店,来自 Agoda & Booking.com', ko: 'Agoda & Booking.com에서 공연장 근처 호텔' })}</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 flex-shrink-0">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('hotel.refresh', { en: 'Update live', th: 'อัปเดตเรียลไทม์', ja: 'リアルタイム更新', zh: '实时更新', ko: '실시간 업데이트' })}
        </Button>
      </div>

      <div className="glass-light rounded-2xl p-4 border border-border/30 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('hotel.search_placeholder', { en: 'Search hotels…', th: 'ค้นหาโรงแรม…', ja: 'ホテルを検索…', zh: '搜索酒店…', ko: '호텔 검색…' })} className="pl-9 bg-transparent border-border/50" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="price">{t('hotel.sort.price',  { en: 'Lowest price', th: 'ราคาต่ำสุด',  ja: '価格が安い順', zh: '价格最低', ko: '가격 낮은순' })}</SelectItem>
            <SelectItem value="rating">{t('hotel.sort.rating', { en: 'Top rated',    th: 'คะแนนสูงสุด', ja: '評価が高い順', zh: '评分最高', ko: '평점 높은순' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {filtered.map(h => (
          <HotelCard
            key={h.id}
            hotel={h}
            t={t}
            onDetail={(hotel) => navigate(`/hotels/${hotel.id}`, { state: { hotel } })}
            onBook={(hotel) => setBookingHotel(hotel)}
          />
        ))}
      </div>

      <HotelBookingModal open={!!bookingHotel} onClose={() => setBookingHotel(null)} hotel={bookingHotel} />
    </div>
  );
}