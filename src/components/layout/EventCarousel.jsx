import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Ticket, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/I18nContext';

const ADS = [
  {
    id: '1',
    title: 'Coldplay: Music of the Spheres',
    artist: 'Coldplay',
    date: 'Dec 14, 2026',
    venue: 'Rajamangala Stadium, Bangkok',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
    badge: 'ON SALE',
    badgeClass: 'bg-green-500/80 text-white',
    price: '฿2,500',
  },
  {
    id: '2',
    title: 'BLACKPINK World Tour [BORN PINK]',
    artist: 'BLACKPINK',
    date: 'Nov 8, 2026',
    venue: 'Impact Arena, Bangkok',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
    badge: 'HOT',
    badgeClass: 'bg-accent/80 text-white',
    price: '฿4,500',
  },
  {
    id: '3',
    title: 'SUMMER SONIC BANGKOK 2026',
    artist: 'Various Artists',
    date: 'Aug 15, 2026',
    venue: 'Bitec Bangna, Bangkok',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200',
    badge: 'UPCOMING',
    badgeClass: 'bg-primary/80 text-white',
    price: '฿3,500',
  },
  {
    id: '4',
    title: 'EDC Thailand 2026',
    artist: 'Various DJs',
    date: 'Oct 22, 2026',
    venue: 'SHOW DC, Bangkok',
    image: 'https://images.unsplash.com/photo-1574155376612-bfa4e5a5b9d5?w=1200',
    badge: 'ON SALE',
    badgeClass: 'bg-green-500/80 text-white',
    price: '฿2,800',
  },
];

export default function EventCarousel() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % ADS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent(p => (p - 1 + ADS.length) % ADS.length);
  const next = () => setCurrent(p => (p + 1) % ADS.length);

  const ad = ADS[current];

  return (
    <div className="relative h-56 overflow-hidden rounded-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary" />
          <img
            src={ad.image}
            alt=""
            loading="eager"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center px-8 lg:px-12">
        <div className="max-w-lg">
          <Badge className={`text-[10px] mb-2 ${ad.badgeClass}`}>{ad.badge}</Badge>
          <h2 className="font-syne text-xl lg:text-2xl font-bold text-white leading-tight mb-1">{ad.title}</h2>
          <p className="text-white/70 text-sm mb-2">{ad.artist}</p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60 mb-4">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ad.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ad.venue}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gold font-bold text-lg">{t('events.start_from')} {ad.price}</span>
            <Link to="/events">
              <Button size="sm" className="text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Ticket className="w-3 h-3 mr-1" />{t('carousel.view_tickets', { en: 'View tickets', th: 'ดูตั๋ว', ja: 'チケットを見る', zh: '查看门票', ko: '티켓 보기' })}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {ADS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}