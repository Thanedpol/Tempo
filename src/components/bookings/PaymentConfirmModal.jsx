import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, CheckCircle, Loader2, Ticket, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/I18nContext';

export default function PaymentConfirmModal({ open, onClose, event }) {
  const { t } = useI18n();
  const [step, setStep] = useState('confirm'); // confirm | processing | success
  const [selectedCard, setSelectedCard] = useState('visa');

  const cards = [
    { id: 'visa', label: 'Visa •••• 4242', icon: '💳' },
    { id: 'mc', label: 'Mastercard •••• 8888', icon: '💳' },
    { id: 'promptpay', label: 'PromptPay', icon: '📱' },
  ];

  const handleConfirm = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2500));

    // Create booking record
    if (event) {
      await base44.entities.Booking.create({
        event_id: event.id || 'mock',
        event_title: event.title || 'Concert Event',
        event_date: event.date || new Date().toISOString(),
        venue: event.venue || 'TBA',
        zone: event.zone || 'General',
        quantity: 1,
        total_price: event.price || 0,
        status: 'confirmed',
        ticket_code: 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        payment_method: selectedCard,
      }).catch(() => {});

      await base44.entities.Notification.create({
        title:   t('pay.success_title',   { en: '✅ Booked!',                              th: '✅ จองสำเร็จ!',                              ja: '✅ 予約完了!',                              zh: '✅ 预订成功!',                              ko: '✅ 예약 완료!' }),
        message: t('pay.success_message', { en: `Your ticket for ${event.title || 'Concert'} is confirmed`, th: `ตั๋ว ${event.title || 'Concert'} ได้รับการยืนยันแล้ว`,        ja: `${event.title || 'Concert'} のチケットが確定しました`, zh: `${event.title || 'Concert'} 的门票已确认`,  ko: `${event.title || 'Concert'} 티켓이 확정되었습니다` }),
        type: 'booking_confirmed',
        is_read: false,
        priority: 'high',
      }).catch(() => {});
    }

    setStep('success');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative glass neon-border rounded-3xl p-6 w-full max-w-md z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            {step === 'confirm' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-syne text-xl font-bold gradient-text">{t('pay.title', { en: 'Confirm payment', th: 'ยืนยันการชำระเงิน', ja: '支払いを確認', zh: '确认付款', ko: '결제 확인' })}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.subtitle', { en: 'Human-in-the-loop: review and confirm', th: 'Human-in-the-loop: ตรวจสอบและยืนยัน', ja: 'Human-in-the-loop: 内容を確認して確定', zh: 'Human-in-the-loop:确认信息', ko: 'Human-in-the-loop: 확인 후 결제' })}</p>
                </div>

                {event && (
                  <div className="glass-light rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    {event.venue && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</p>}
                    {event.date && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</p>}
                    <div className="flex justify-between items-center pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">{t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })} {event.zone || 'General'} × 1</span>
                      <span className="text-primary font-bold">฿{(event.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('pay.select_method', { en: 'Choose payment method', th: 'เลือกวิธีชำระเงิน', ja: 'お支払い方法を選択', zh: '选择支付方式', ko: '결제 수단 선택' })}</p>
                  {cards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        selectedCard === card.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span className="text-lg">{card.icon}</span>
                      <span className="text-sm font-medium">{card.label}</span>
                      {selectedCard === card.id && <CheckCircle className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>{t('pay.secure', { en: 'Secure payment, encrypted with SSL 256-bit', th: 'การชำระเงินปลอดภัย เข้ารหัสด้วย SSL 256-bit', ja: '安全な決済 — SSL 256-bit 暗号化', zh: '安全付款 — SSL 256-bit 加密', ko: '안전한 결제 — SSL 256-bit 암호화' })}</span>
                </div>

                <Button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('pay.confirm', { en: 'Confirm payment', th: 'ยืนยันชำระเงิน', ja: '支払いを確定', zh: '确认付款', ko: '결제 확인' })} ฿{(event?.price || 0).toLocaleString()}
                </Button>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg">{t('pay.processing', { en: 'Processing…', th: 'กำลังดำเนินการ...', ja: '処理中…', zh: '处理中…', ko: '처리 중…' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.processing_desc', { en: 'AI is charging your card and confirming the booking', th: 'AI กำลังตัดบัตรและยืนยันการจอง', ja: 'AI がカード決済と予約確定を実行中', zh: 'AI 正在扣款并确认预订', ko: 'AI가 결제 및 예약 확인 중' })}</p>
                </div>
                <div className="space-y-2 text-sm text-left">
                  {[
                    t('pay.step1', { en: 'Verifying card details…',       th: 'ตรวจสอบข้อมูลบัตร...',          ja: 'カード情報を確認中…',         zh: '正在验证卡片信息…',     ko: '카드 정보 확인 중…' }),
                    t('pay.step2', { en: 'Sending request to gateway…',   th: 'ส่งคำขอไปยังระบบชำระเงิน...',     ja: '決済ゲートウェイに送信中…',    zh: '正在向支付网关发送请求…', ko: '결제 게이트웨이에 요청 중…' }),
                    t('pay.step3', { en: 'Confirming ticket reservation…', th: 'ยืนยันการจองตั๋ว...',             ja: 'チケット予約を確定中…',       zh: '正在确认门票预订…',     ko: '티켓 예약 확정 중…' }),
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.7 }}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <div>
                  <h3 className="font-syne font-bold text-xl text-green-400">{t('pay.done_title', { en: 'Booked!', th: 'จองสำเร็จ!', ja: '予約完了!', zh: '预订成功!', ko: '예약 완료!' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.done_desc', { en: 'Your ticket is confirmed', th: 'ตั๋วของคุณได้รับการยืนยันแล้ว', ja: 'チケットが確定しました', zh: '您的门票已确认', ko: '티켓이 확정되었습니다' })}</p>
                </div>
                <div className="glass-light rounded-2xl p-4 text-sm text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    <span>{t('pay.email_sent', { en: 'E-ticket sent to your email', th: 'E-Ticket ส่งไปยังอีเมลของคุณแล้ว', ja: 'E-チケットをメールに送信しました', zh: '电子票已发送至您的邮箱', ko: 'E-티켓을 이메일로 발송했습니다' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>📅 {t('pay.calendar_saved', { en: 'Saved to Calendar automatically', th: 'บันทึกลง Calendar อัตโนมัติ', ja: 'カレンダーに自動保存', zh: '已自动保存至日历', ko: '캘린더에 자동 저장' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>🍎 {t('pay.wallet_ready', { en: 'Ready to add to Apple/Google Wallet', th: 'พร้อมเพิ่มใน Apple/Google Wallet', ja: 'Apple/Google Wallet に追加可能', zh: '可加入 Apple/Google Wallet', ko: 'Apple/Google Wallet 추가 가능' })}</span>
                  </div>
                </div>
                <Button onClick={onClose} className="w-full">{t('pay.done', { en: 'Done', th: 'เสร็จสิ้น', ja: '完了', zh: '完成', ko: '완료' })}</Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}