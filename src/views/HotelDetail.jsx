import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Wifi, Car, Coffee, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/I18nContext';
import HotelBookingModal from '@/components/bookings/HotelBookingModal';

export default function HotelDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const hotel = state?.hotel;
  const [booking, setBooking] = useState(false);

  const amenityIcons = {
    wifi:      { icon: Wifi,   label: 'Wi-Fi' },
    pool:      { icon: Waves,  label: t('hotel.amenity.pool',      { en: 'Pool',      th: 'สระว่ายน้ำ',  ja: 'プール',    zh: '泳池',     ko: '수영장' }) },
    parking:   { icon: Car,    label: t('hotel.amenity.parking',   { en: 'Parking',   th: 'ที่จอดรถ',     ja: '駐車場',     zh: '停车',     ko: '주차장' }) },
    breakfast: { icon: Coffee, label: t('hotel.amenity.breakfast', { en: 'Breakfast', th: 'อาหารเช้า',  ja: '朝食',       zh: '早餐',     ko: '조식' }) },
  };

  if (!hotel) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-muted-foreground">{t('hotel_detail.not_found', { en: 'Hotel not found', th: 'ไม่พบข้อมูลโรงแรม', ja: 'ホテルが見つかりません', zh: '未找到酒店', ko: '호텔을 찾을 수 없습니다' })}</p>
        <Button variant="outline" onClick={() => navigate('/hotels')}>
          {t('hotel_detail.back_to_list', { en: 'Back to Hotels', th: 'กลับหน้าโรงแรม', ja: 'ホテル一覧へ戻る', zh: '返回酒店列表', ko: '호텔 목록으로' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/hotels')} className="text-muted-foreground hover:text-foreground gap-2">
        <ArrowLeft className="w-4 h-4" />{t('common.back', { en: 'Back', th: 'กลับ', ja: '戻る', zh: '返回', ko: '뒤로' })}
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden border border-border/30">
        <div className="relative h-64 overflow-hidden">
          <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-black/50 backdrop-blur-sm text-white border-white/20">{hotel.source}</Badge>
            <Badge className={hotel.available ? 'bg-green-500/80 text-white' : 'bg-destructive/80 text-white'}>
              {hotel.available
                ? t('hotel.status.available', { en: 'Available', th: 'ว่าง', ja: '空きあり', zh: '有空房', ko: '예약 가능' })
                : t('hotel.status.full',      { en: 'Full',      th: 'เต็ม',  ja: '満室',     zh: '已满',    ko: '만실' })}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-1">
            {Array.from({ length: hotel.rating }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-gold text-gold" />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h1 className="font-syne text-2xl font-bold">{hotel.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-primary" />{hotel.address}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">{t('hotel_detail.amenities', { en: 'Amenities', th: 'สิ่งอำนวยความสะดวก', ja: 'アメニティ', zh: '设施', ko: '편의시설' })}</p>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map(a => {
                const cfg = amenityIcons[a];
                if (!cfg) return null;
                return (
                  <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary rounded-xl px-3 py-1.5">
                    <cfg.icon className="w-4 h-4" />{cfg.label}
                  </span>
                );
              })}
            </div>
          </div>

          {hotel.event && (
            <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-neon-cyan">📍</span>
              <div>
                <p className="text-sm text-neon-cyan font-medium">{t('hotel.near', { en: 'Near', th: 'ใกล้', ja: '近く', zh: '邻近', ko: '근처' })}: {hotel.event}</p>
                <p className="text-xs text-muted-foreground">{t('hotel_detail.distance_label', { en: 'Distance', th: 'ระยะทาง', ja: '距離', zh: '距离', ko: '거리' })} {hotel.distance}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div>
              <p className="text-xs text-muted-foreground">{t('hotel_detail.price_per_night', { en: 'Per night', th: 'ราคาต่อคืน', ja: '1 泊', zh: '每晚', ko: '1박' })}</p>
              <span className="text-3xl font-bold text-neon-cyan">฿{hotel.price_per_night.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/{t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</span>
            </div>
            <Button disabled={!hotel.available} onClick={() => setBooking(true)} className="bg-gradient-to-r from-neon-cyan/80 to-primary/80 hover:from-neon-cyan hover:to-primary text-background font-semibold px-6">
              {t('hotel.book', { en: 'Book hotel', th: 'จองโรงแรม', ja: '予約する', zh: '预订酒店', ko: '호텔 예약' })}
            </Button>
          </div>
        </div>
      </motion.div>

      <HotelBookingModal open={booking} onClose={() => setBooking(false)} hotel={hotel} />
    </div>
  );
}
