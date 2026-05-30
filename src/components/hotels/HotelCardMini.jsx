import { MapPin, Star, Hotel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/I18nContext';

export default function HotelCardMini({ hotel }) {
  const { t } = useI18n();
  return (
    <div className="glass-light rounded-2xl p-4 flex gap-3 border border-border/30 hover:border-neon-cyan/30 transition-all">
      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Hotel className="w-6 h-6 text-neon-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold truncate">{hotel.name}</h4>
            {hotel.distance && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{hotel.distance} {t('hotel.from_venue', { en: 'from venue', th: 'จากสถานที่จัดงาน', ja: '会場から', zh: '距离场馆', ko: '공연장에서' })}
              </p>
            )}
          </div>
          {hotel.rating && (
            <Badge className="text-[10px] bg-gold/10 text-gold border-gold/20 flex-shrink-0">
              <Star className="w-3 h-3 mr-1" />{hotel.rating}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-neon-cyan">
            ฿{hotel.price_per_night?.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/{t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</span>
          </span>
          <Button size="sm" variant="outline" className="text-xs h-7 px-3 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
            {t('common.view_details', { en: 'View details', th: 'ดูรายละเอียด', ja: '詳細を見る', zh: '查看详情', ko: '자세히 보기' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
