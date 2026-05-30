import { MapPin, Calendar, Ticket, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/I18nContext';

export default function EventCardMini({ event, onBook }) {
  const { t } = useI18n();
  return (
    <div className="glass-light rounded-2xl p-4 flex gap-4 hover:border-primary/30 transition-all border border-border/30 group">
      <img
        src={event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200'}
        alt={event.title}
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-syne font-semibold text-foreground truncate">{event.title}</h4>
            <p className="text-xs text-muted-foreground">{event.artist}</p>
          </div>
          {event.platform && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 flex-shrink-0">
              {event.platform}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {event.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{event.venue}
            </span>
          )}
          {event.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />{event.date}
            </span>
          )}
          {event.price && (
            <span className="flex items-center gap-1 text-gold font-medium">
              <Ticket className="w-3 h-3" />฿{event.price?.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {event.available !== undefined && (
            <span className={`text-xs ${event.available < 10 ? 'text-destructive' : 'text-green-400'}`}>
              {event.available < 10
                ? t('card.seats_left',      { en: `⚡ ${event.available} left`,      th: `⚡ เหลือ ${event.available} ที่`,  ja: `⚡ 残り${event.available}席`,  zh: `⚡ 仅剩 ${event.available} 席`, ko: `⚡ ${event.available}석 남음` })
                : t('card.seats_available', { en: `✓ ${event.available} available`, th: `✓ ว่าง ${event.available} ที่`,   ja: `✓ ${event.available}席空き`,   zh: `✓ ${event.available} 席可订`,  ko: `✓ ${event.available}석 가능` })}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => onBook && onBook(event)}
            className="ml-auto text-xs h-7 px-3 bg-gradient-to-r from-primary/80 to-accent/80 hover:from-primary hover:to-accent"
          >
            <Zap className="w-3 h-3 mr-1" />{t('card.book_now', { en: 'Book now', th: 'จองเลย', ja: '今すぐ予約', zh: '立即预订', ko: '지금 예약' })}
          </Button>
        </div>
      </div>
    </div>
  );
}