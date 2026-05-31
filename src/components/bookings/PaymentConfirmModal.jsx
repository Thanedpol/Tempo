import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, CheckCircle, Loader2, Ticket, MapPin, Calendar, AlertTriangle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/I18nContext';
import { getDefaultMethod } from '@/lib/paymentPrefs';

// Platform service fee (kept explicit for price transparency — pain point #4).
// 0 for now; surface it so the user always sees the full breakdown before paying.
const SERVICE_FEE = 0;

function uuid() {
  try { return crypto.randomUUID(); } catch { return 'idem-' + Math.random().toString(36).slice(2) + Date.now(); }
}

export default function PaymentConfirmModal({ open, onClose, event }) {
  const { t } = useI18n();
  const [step, setStep] = useState('confirm'); // confirm | qr | processing | success | error
  // Default to the user's preferred method from Settings (promptpay vs card).
  const [selectedCard, setSelectedCard] = useState(() => (getDefaultMethod() === 'promptpay' ? 'promptpay' : 'visa'));
  const [payment, setPayment] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const idemRef = useRef(null);
  const pollRef = useRef(null);

  const ticketPrice = event?.price || 0;
  const total = ticketPrice + SERVICE_FEE;

  const cards = [
    { id: 'promptpay', label: 'PromptPay', icon: '📱', method: 'promptpay' },
    { id: 'visa', label: 'Visa / Mastercard', icon: '💳', method: 'card' },
  ];

  const reset = () => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    idemRef.current = null;
    setPayment(null);
    setErrorMsg('');
    setStep('confirm');
  };

  const close = () => { reset(); onClose?.(); };

  const fail = (msg) => { setErrorMsg(msg || 'เกิดข้อผิดพลาด'); setStep('error'); };

  // Poll the real status endpoint until paid / failed.
  const poll = (id, tries = 0) => {
    pollRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/payments/${id}`, { credentials: 'include' });
        const p = await r.json();
        if (p.status === 'paid') return onPaid(p);
        if (p.status === 'failed' || p.status === 'expired') return fail('การชำระเงินไม่สำเร็จ');
        if (tries > 40) return fail('หมดเวลารอการชำระเงิน');
        poll(id, tries + 1);
      } catch {
        if (tries > 40) return fail('เชื่อมต่อระบบชำระเงินไม่ได้');
        poll(id, tries + 1);
      }
    }, 1500);
  };

  // Once paid → create the booking + notification (client-visible "My Bookings").
  const onPaid = async (p) => {
    if (event) {
      await base44.entities.Booking.create({
        event_id: event.id || 'mock',
        event_title: event.title || 'Concert Event',
        event_date: event.date || new Date().toISOString(),
        venue: event.venue || 'TBA',
        zone: event.zone || 'General',
        quantity: 1,
        total_price: total,
        status: 'confirmed',
        ticket_code: p.ticketCode || ('TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
        payment_method: p.method,
      }).catch(() => {});

      await base44.entities.Notification.create({
        title:   t('pay.success_title',   { en: '✅ Booked!', th: '✅ จองสำเร็จ!', ja: '✅ 予約完了!', zh: '✅ 预订成功!', ko: '✅ 예약 완료!' }),
        message: t('pay.success_message', { en: `Your ticket for ${event.title || 'Concert'} is confirmed`, th: `ตั๋ว ${event.title || 'Concert'} ได้รับการยืนยันแล้ว`, ja: `${event.title || 'Concert'} のチケットが確定しました`, zh: `${event.title || 'Concert'} 的门票已确认`, ko: `${event.title || 'Concert'} 티켓이 확정되었습니다` }),
        type: 'booking_confirmed',
        is_read: false,
        priority: 'high',
      }).catch(() => {});
    }
    setPayment(p);
    setStep('success');
  };

  const handleConfirm = async () => {
    const method = cards.find(c => c.id === selectedCard)?.method || 'card';
    if (!idemRef.current) idemRef.current = uuid();   // reused on retry → no double charge
    setStep('processing');
    setErrorMsg('');
    try {
      const r = await fetch('/api/payments/create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          method,
          idempotencyKey: idemRef.current,
          event: { title: event?.title, venue: event?.venue, date: event?.date, zone: event?.zone },
        }),
      });
      const p = await r.json();
      if (!r.ok || p.error) return fail(p.error || 'สร้างรายการชำระเงินไม่สำเร็จ');
      setPayment(p);

      if (p.status === 'paid') return onPaid(p);

      // PromptPay → show QR, then wait for confirmation (demo = button; real = auto-poll)
      if (p.method === 'promptpay' && p.qrImage) {
        setStep('qr');
        if (!p.demo) poll(p.id);
        return;
      }

      // Card: demo confirms instantly; real Stripe/Omise card needs client SDK (next phase)
      if (p.demo) {
        await fetch(`/api/payments/${p.id}/confirm`, { method: 'POST', credentials: 'include' });
        poll(p.id);
      } else {
        fail('การชำระด้วยบัตรจริงกำลังพัฒนา (ใช้ PromptPay หรือโหมดสาธิตก่อน)');
      }
    } catch (e) {
      fail(e?.message);
    }
  };

  // Demo: user taps "I've paid" → confirm through the real state machine, then poll.
  const demoMarkPaid = async () => {
    if (!payment) return;
    setStep('processing');
    await fetch(`/api/payments/${payment.id}/confirm`, { method: 'POST', credentials: 'include' }).catch(() => {});
    poll(payment.id);
  };

  const isDemo = payment?.demo ?? true;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative glass neon-border rounded-3xl p-6 w-full max-w-md z-10"
          >
            <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            {/* ── Confirm ── */}
            {step === 'confirm' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-syne text-xl font-bold gradient-text">{t('pay.title', { en: 'Confirm payment', th: 'ยืนยันการชำระเงิน', ja: '支払いを確認', zh: '确认付款', ko: '결제 확인' })}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.subtitle', { en: 'Review and confirm', th: 'ตรวจสอบและยืนยัน', ja: '内容を確認して確定', zh: '确认信息', ko: '확인 후 결제' })}</p>
                </div>

                {event && (
                  <div className="glass-light rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    {event.venue && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</p>}
                    {event.date && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</p>}
                    {/* Transparent price breakdown (pain point #4) */}
                    <div className="pt-2 mt-1 border-t border-border/30 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })} {event.zone || 'General'} × 1</span>
                        <span>฿{ticketPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('pay.fee', { en: 'Service fee', th: 'ค่าบริการ', ja: '手数料', zh: '服务费', ko: '수수료' })}</span>
                        <span>฿{SERVICE_FEE.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-semibold">
                        <span className="text-sm">{t('pay.total', { en: 'Total', th: 'ยอดรวม', ja: '合計', zh: '总计', ko: '합계' })}</span>
                        <span className="text-primary">฿{total.toLocaleString()}</span>
                      </div>
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
                        selectedCard === card.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'
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
                  <span>{t('pay.secure', { en: 'Payment is processed by the provider, not stored by us', th: 'ดำเนินการผ่านผู้ให้บริการชำระเงิน เราไม่เก็บข้อมูลบัตร', ja: '決済は決済事業者が処理します', zh: '由支付服务商处理,我们不存储卡信息', ko: '결제는 결제사에서 처리됩니다' })}</span>
                </div>

                <Button onClick={handleConfirm} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary font-semibold">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('pay.confirm', { en: 'Pay', th: 'ชำระเงิน', ja: '支払う', zh: '付款', ko: '결제' })} ฿{total.toLocaleString()}
                </Button>
              </div>
            )}

            {/* ── QR (PromptPay) ── */}
            {step === 'qr' && payment && (
              <div className="text-center py-4 space-y-4">
                <h3 className="font-syne font-bold text-lg flex items-center justify-center gap-2"><QrCode className="w-5 h-5 text-primary" />PromptPay</h3>
                {isDemo && (
                  <div className="glass-light rounded-xl px-3 py-2 text-xs text-amber-400 border border-amber-500/30 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {t('pay.demo_note', { en: 'Demo mode — no real charge. Tap "I’ve paid" to simulate.', th: 'โหมดสาธิต — ไม่มีการตัดเงินจริง กด “ชำระแล้ว (จำลอง)” เพื่อจำลอง', ja: 'デモ — 実際の請求なし', zh: '演示模式 — 不会真实扣款', ko: '데모 — 실제 결제 없음' })}
                  </div>
                )}
                {payment.qrImage && <img src={payment.qrImage} alt="PromptPay QR" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />}
                <p className="text-sm text-muted-foreground">{t('pay.scan', { en: 'Scan with any banking app', th: 'สแกนด้วยแอปธนาคารใดก็ได้', ja: '銀行アプリでスキャン', zh: '用任意银行 App 扫码', ko: '은행 앱으로 스캔' })} · ฿{total.toLocaleString()}</p>
                {isDemo ? (
                  <Button onClick={demoMarkPaid} className="w-full bg-gradient-to-r from-primary to-accent">{t('pay.demo_paid', { en: 'I’ve paid (simulate)', th: 'ชำระแล้ว (จำลอง)', ja: '支払い済み(デモ)', zh: '已支付(模拟)', ko: '결제함 (데모)' })}</Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{t('pay.waiting', { en: 'Waiting for payment…', th: 'รอการชำระเงิน…', ja: '支払いを待っています…', zh: '等待付款…', ko: '결제 대기 중…' })}</div>
                )}
              </div>
            )}

            {/* ── Processing ── */}
            {step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg">{t('pay.processing', { en: 'Processing…', th: 'กำลังดำเนินการ...', ja: '処理中…', zh: '处理中…', ko: '처리 중…' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.processing_desc2', { en: 'Confirming your payment with the provider', th: 'กำลังยืนยันการชำระเงินกับผู้ให้บริการ', ja: '決済事業者と確認中', zh: '正在与支付服务商确认', ko: '결제사와 확인 중' })}</p>
                </div>
              </div>
            )}

            {/* ── Success ── */}
            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <div>
                  <h3 className="font-syne font-bold text-xl text-green-400">{t('pay.done_title', { en: 'Booked!', th: 'จองสำเร็จ!', ja: '予約完了!', zh: '预订成功!', ko: '예약 완료!' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.done_desc', { en: 'Your ticket is confirmed', th: 'ตั๋วของคุณได้รับการยืนยันแล้ว', ja: 'チケットが確定しました', zh: '您的门票已确认', ko: '티켓이 확정되었습니다' })}</p>
                </div>
                <div className="glass-light rounded-2xl p-4 text-sm text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    <span className="font-mono">{payment?.ticketCode || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>📧 {t('pay.email_soon', { en: 'E-ticket by email — coming soon', th: 'ส่ง E-Ticket ทางอีเมล — เร็ว ๆ นี้', ja: 'メールで E-チケット — 近日', zh: '邮件电子票 — 即将推出', ko: '이메일 E-티켓 — 곧 제공' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span>📅 {t('pay.calendar_soon', { en: 'Add to calendar — coming soon', th: 'เพิ่มลงปฏิทิน — เร็ว ๆ นี้', ja: 'カレンダー追加 — 近日', zh: '加入日历 — 即将推出', ko: '캘린더 추가 — 곧 제공' })}</span>
                  </div>
                </div>
                <Button onClick={close} className="w-full">{t('pay.done', { en: 'Done', th: 'เสร็จสิ้น', ja: '完了', zh: '完成', ko: '완료' })}</Button>
              </div>
            )}

            {/* ── Error ── */}
            {step === 'error' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-destructive">{t('pay.error_title', { en: 'Payment failed', th: 'ชำระเงินไม่สำเร็จ', ja: '決済に失敗', zh: '付款失败', ko: '결제 실패' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={close} className="flex-1">{t('pay.cancel', { en: 'Cancel', th: 'ยกเลิก', ja: 'キャンセル', zh: '取消', ko: '취소' })}</Button>
                  <Button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-primary to-accent">{t('pay.retry', { en: 'Try again', th: 'ลองใหม่', ja: '再試行', zh: '重试', ko: '다시 시도' })}</Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
