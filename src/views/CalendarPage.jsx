import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, MapPin, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { useI18n } from '@/lib/I18nContext';

const MOCK_EVENTS = [
  { date: new Date(2026, 6, 20), title: 'Jazz at Riverside', color: 'bg-amber-500', type: 'concert' },
  { date: new Date(2026, 7, 15), title: 'Summer Sonic BKK', color: 'bg-green-500', type: 'festival' },
  { date: new Date(2026, 8, 12), title: 'Carabao Concert', color: 'bg-primary', type: 'concert' },
  { date: new Date(2026, 9, 22), title: 'EDC Thailand', color: 'bg-accent', type: 'festival' },
  { date: new Date(2026, 10, 8), title: 'BLACKPINK World Tour', color: 'bg-pink-500', type: 'concert' },
  { date: new Date(2026, 11, 14), title: 'Coldplay: Music of Spheres', color: 'bg-blue-500', type: 'concert' },
];

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1));
  const [bookings, setBookings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const dayHeaders = {
    en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    th: ['อา','จ','อ','พ','พฤ','ศ','ส'],
    ja: ['日','月','火','水','木','金','土'],
    zh: ['日','一','二','三','四','五','六'],
    ko: ['일','월','화','수','목','금','토'],
  };

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 50).then(setBookings).catch(() => {});
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = startOfMonth(currentMonth).getDay();

  const getEventsForDay = (day) => MOCK_EVENTS.filter(e => isSameDay(e.date, day));
  const getBookingsForDay = (day) => bookings.filter(b => {
    if (!b.event_date) return false;
    try { return isSameDay(new Date(b.event_date), day); } catch { return false; }
  });

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  const upcomingEvents = MOCK_EVENTS.filter(e => e.date >= new Date()).slice(0, 4);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">{t('nav.calendar')}</h1>
          <p className="text-muted-foreground mt-1">{t('cal.subtitle', { en: 'Events and concerts calendar', th: 'ปฏิทินอีเวนต์และคอนเสิร์ต', ja: 'イベントとコンサートのカレンダー', zh: '活动与音乐会日历', ko: '이벤트 및 콘서트 캘린더' })}</p>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs">
          <Plus className="w-4 h-4 mr-1" />Sync Calendar
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 border border-border/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-syne font-bold text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {(dayHeaders[lang] || dayHeaders.en).map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const events = getEventsForDay(day);
              const bks = getBookingsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const hasContent = events.length > 0 || bks.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected ? 'bg-primary text-white' :
                    isToday(day) ? 'bg-primary/20 text-primary' :
                    'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {hasContent && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 2).map((e, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : e.color}`} />
                      ))}
                      {bks.length > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gold'}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" />{t('cal.legend.concert',  { en: 'Concert',     th: 'คอนเสิร์ต',   ja: 'コンサート', zh: '音乐会', ko: '콘서트' })}</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold"    />{t('cal.legend.tickets',  { en: 'My tickets',  th: 'ตั๋วของฉัน',  ja: 'マイチケット', zh: '我的票', ko: '내 티켓' })}</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent"  />{t('cal.legend.festival', { en: 'Festival',    th: 'เทศกาล',     ja: 'フェス',     zh: '节日',   ko: '페스티벌' })}</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Selected Day Events */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-light rounded-2xl p-4 border border-primary/20 space-y-3"
            >
              <h3 className="font-syne font-bold text-sm text-primary">
                {format(selectedDay, 'd MMMM yyyy')}
              </h3>
              {selectedEvents.length === 0 && selectedBookings.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('cal.no_events_today', { en: 'No events today', th: 'ไม่มีอีเวนต์วันนี้', ja: '今日はイベントなし', zh: '今日没有活动', ko: '오늘 이벤트 없음' })}</p>
              )}
              {selectedEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.color}`} />
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <Badge className="text-[10px] mt-0.5 bg-secondary text-muted-foreground">{e.type}</Badge>
                  </div>
                </div>
              ))}
              {selectedBookings.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-gold flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{b.event_title}</div>
                    <div className="text-xs text-muted-foreground">{t('cal.legend.tickets')} · {b.zone}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Upcoming Events */}
          <div className="glass-light rounded-2xl p-4 border border-border/30 space-y-3">
            <h3 className="font-syne font-bold text-sm">{t('cal.upcoming', { en: 'Upcoming events', th: 'อีเวนต์ที่กำลังมา', ja: '今後のイベント', zh: '即将到来的活动', ko: '다가오는 이벤트' })}</h3>
            {upcomingEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${e.color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                  <Calendar className={`w-4 h-4 ${e.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{format(e.date, 'd MMM yyyy')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}