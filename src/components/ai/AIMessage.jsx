import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Loader2, MapPin, Calendar, DollarSign, Ticket, Hotel, ChevronDown, ChevronUp, Zap, AlertTriangle, CheckCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCardMini from '../events/EventCardMini';
import HotelCardMini from '../hotels/HotelCardMini';
import PaymentConfirmModal from '../bookings/PaymentConfirmModal';
import CaptchaModal from '../bookings/CaptchaModal';
import { useI18n } from '@/lib/I18nContext';

export default function AIMessage({ message, onAction }) {
  const { t } = useI18n();
  const [showEvents, setShowEvents] = useState(true);
  const [showHotels, setShowHotels] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isUser = message.role === 'user';
  const isThinking = message.type === 'thinking';
  const isError = message.type === 'error';

  const events = message.data?.mock_events || [];
  const hotels = message.data?.mock_hotels || [];
  const needsCaptcha = message.data?.needs_captcha;
  const needsPayment = message.data?.needs_payment_confirm;

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%] chat-bubble-user rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">{t('ai.thinking', { en: 'AI is thinking…', th: 'AI กำลังประมวลผล...', ja: 'AI 処理中…', zh: 'AI 思考中…', ko: 'AI 처리 중…' })}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 space-y-2 max-w-[90%]">
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-destructive">{message.content}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onAction && onAction('')}
          >
            <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            {t('ai.retry', { en: 'Try again', th: 'ลองใหม่', ja: '再試行', zh: '重试', ko: '다시 시도' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 glow-primary">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-3 max-w-[90%]">
        {/* Message */}
        <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3">
          <ReactMarkdown
            className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-neon-cyan not-italic font-medium">{children}</em>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Action Tags */}
        {message.data?.action && message.data.action !== 'general' && (
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              {message.data.action === 'search_events'   && t('ai.action.search_events',   { en: 'Search events',   th: 'ค้นหาอีเวนต์',         ja: 'イベント検索',     zh: '搜索活动',     ko: '이벤트 검색' })}
              {message.data.action === 'hold_ticket'     && t('ai.action.hold_ticket',     { en: 'Hold ticket',     th: 'จับจองตั๋ว',           ja: 'チケット確保',     zh: '锁定门票',     ko: '티켓 잡기' })}
              {message.data.action === 'find_hotel'      && t('ai.action.find_hotel',      { en: 'Find hotel',      th: 'ค้นหาโรงแรม',          ja: 'ホテル検索',       zh: '搜索酒店',     ko: '호텔 검색' })}
              {message.data.action === 'confirm_payment' && t('ai.action.confirm_payment', { en: 'Confirm payment', th: 'ยืนยันการชำระเงิน',     ja: '支払い確認',       zh: '确认付款',     ko: '결제 확인' })}
            </Badge>
            {message.data.parameters?.genre && (
              <Badge className="bg-secondary text-muted-foreground text-xs">{message.data.parameters.genre}</Badge>
            )}
            {message.data.parameters?.budget && (
              <Badge className="bg-secondary text-muted-foreground text-xs">
                <DollarSign className="w-3 h-3 mr-1" />฿{message.data.parameters.budget.toLocaleString()}
              </Badge>
            )}
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              <Ticket className="w-4 h-4" />
              {t('events.found')} {events.length} {t('events.count_suffix')}
              {showEvents ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showEvents && (
              <div className="space-y-2">
                {events.map((event, i) => (
                  <EventCardMini
                    key={i}
                    event={event}
                    onBook={(e) => {
                      setSelectedEvent(e);
                      if (needsCaptcha) setCaptchaOpen(true);
                      else setPaymentOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hotels */}
        {hotels.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHotels(!showHotels)}
              className="flex items-center gap-2 text-sm font-medium text-neon-cyan"
            >
              <Hotel className="w-4 h-4" />
              {t('ai.suggested_hotels', { en: `${hotels.length} suggested hotels`, th: `โรงแรมแนะนำ ${hotels.length} แห่ง`, ja: `おすすめホテル ${hotels.length} 件`, zh: `推荐酒店 ${hotels.length} 家`, ko: `추천 호텔 ${hotels.length}개` })}
              {showHotels ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showHotels && (
              <div className="space-y-2">
                {hotels.map((hotel, i) => (
                  <HotelCardMini key={i} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAPTCHA Alert */}
        {needsCaptcha && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">{t('ai.captcha.title', { en: 'Help needed: CAPTCHA', th: 'ต้องการความช่วยเหลือ: CAPTCHA', ja: 'CAPTCHA で人の助けが必要', zh: '需要协助:CAPTCHA', ko: '도움 필요: CAPTCHA' })}</p>
              <p className="text-xs text-muted-foreground">{t('ai.captcha.desc', { en: 'The ticketing site is asking for a CAPTCHA', th: 'ระบบตรวจจับว่าเว็บขายตั๋วขอ CAPTCHA', ja: 'チケットサイトが CAPTCHA を要求しています', zh: '票务网站要求 CAPTCHA', ko: '티켓 사이트가 CAPTCHA를 요구합니다' })}</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black text-xs"
              onClick={() => setCaptchaOpen(true)}
            >
              {t('ai.captcha.solve', { en: 'Solve CAPTCHA', th: 'แก้ CAPTCHA', ja: 'CAPTCHA を解く', zh: '解决 CAPTCHA', ko: 'CAPTCHA 풀기' })}
            </Button>
          </div>
        )}

        {/* Payment Alert */}
        {needsPayment && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">{t('ai.payment.title', { en: 'Ticket ready for payment', th: 'ตั๋วพร้อมชำระเงิน', ja: 'チケットの支払い準備完了', zh: '门票准备付款', ko: '결제 준비 완료' })}</p>
              <p className="text-xs text-muted-foreground">{t('ai.payment.desc', { en: 'AI has reserved the seat — please confirm payment', th: 'AI ได้ล็อคที่นั่งไว้แล้ว กรุณายืนยันการจ่าย', ja: 'AI が席を確保しました — 支払いを確認してください', zh: 'AI 已锁定座位,请确认付款', ko: 'AI가 좌석을 확보했습니다 — 결제를 확인하세요' })}</p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-accent text-white text-xs glow-primary"
              onClick={() => setPaymentOpen(true)}
            >
              {t('ai.payment.confirm', { en: 'Confirm payment', th: 'ยืนยันจ่าย', ja: '支払いを確認', zh: '确认付款', ko: '결제 확인' })}
            </Button>
          </div>
        )}

        {/* Modals */}
        <PaymentConfirmModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          event={selectedEvent || events[0]}
        />
        <CaptchaModal
          open={captchaOpen}
          onClose={() => setCaptchaOpen(false)}
          onSuccess={() => {
            setCaptchaOpen(false);
            setPaymentOpen(true);
          }}
        />
      </div>
    </div>
  );
}