import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle, Loader2, Ticket, MapPin, Calendar, AlertTriangle, QrCode, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/I18nContext';
import { PAYMENT_METHODS, getEnabledMethods, getDefaultMethod } from '@/lib/paymentPrefs';

// Platform service fee (kept explicit for price transparency — pain point #4).
const SERVICE_FEE = 0;

const BANKS = [
  { id: 'scb', label: 'SCB' },
  { id: 'kbank', label: 'KBank' },
  { id: 'bbl', label: 'BBL' },
  { id: 'krungthai', label: 'Krungthai' },
];

function uuid() {
  try { return crypto.randomUUID(); } catch { return 'idem-' + Math.random().toString(36).slice(2) + Date.now(); }
}

// Deterministic mock seat map (demo) — same event+zone always yields the same layout.
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function seatLayout(seed, count = 40, cols = 8) {
  let rng = seed || 1;
  const next = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff);
  const rowLetters = 'ABCDEFGHJKLMNPQR';
  const rows = Math.ceil(count / cols);
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    out.push({ id: rowLetters[r] + (c + 1), taken: next() % 100 < 35 });
  }
  return out;
}

export default function PaymentConfirmModal({ open, onClose, event }) {
  const { t } = useI18n();
  const [step, setStep] = useState('seats'); // seats | confirm | qr | connect | processing | success | error

  // Methods come from the user's Settings (Settings → payment methods).
  const enabledIds = getEnabledMethods();
  const methods = PAYMENT_METHODS.filter(m => enabledIds.includes(m.id));
  const [selectedMethod, setSelectedMethod] = useState(() => {
    const def = getDefaultMethod();
    return enabledIds.includes(def) ? def : (enabledIds[0] || 'promptpay');
  });
  const [selectedBank, setSelectedBank] = useState('scb');
  const [payment, setPayment] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const idemRef = useRef(null);
  const pollRef = useRef(null);

  // ── Zones + seat selection ──
  const zones = (event?.zones && event.zones.length)
    ? event.zones
    : [{ name: event?.zone || 'General', price: event?.price || 0 }];
  const [zoneName, setZoneName] = useState(() => event?.zone || zones[0]?.name);
  const [seats, setSeats] = useState([]); // selected seat ids, e.g. ['A3','A4']
  const zone = zones.find(z => z.name === zoneName) || zones[0];
  const layout = useMemo(
    () => seatLayout(hashStr((event?.title || '') + '|' + zoneName)),
    [event?.title, zoneName],
  );

  const qty = Math.max(1, seats.length);
  const ticketPrice = (zone?.price || 0) * qty;
  const total = ticketPrice + SERVICE_FEE;

  const chooseZone = (name) => { setZoneName(name); setSeats([]); idemRef.current = null; };
  const toggleSeat = (id) => {
    setSeats(prev => prev.includes(id) ? prev.filter(s => s !== id) : (prev.length >= 6 ? prev : [...prev, id]));
    idemRef.current = null;
  };

  const methodLabel = (m, bank) => {
    const base = PAYMENT_METHODS.find(x => x.id === m)?.label || m;
    if (m === 'mobilebanking' && bank) return `${base} · ${BANKS.find(b => b.id === bank)?.label || bank}`;
    return base;
  };

  const reset = () => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    idemRef.current = null;
    setPayment(null); setErrorMsg(''); setSeats([]); setStep('seats');
  };
  const close = () => { reset(); onClose?.(); };
  const fail = (msg) => { setErrorMsg(msg || 'เกิดข้อผิดพลาด'); setStep('error'); };

  // changing the method/bank starts a fresh attempt (new idempotency key)
  const chooseMethod = (id) => { setSelectedMethod(id); idemRef.current = null; };
  const chooseBank = (id) => { setSelectedBank(id); idemRef.current = null; };

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

  const onPaid = async (p) => {
    if (event) {
      await base44.entities.Booking.create({
        event_id: event.id || 'mock',
        event_title: event.title || 'Concert Event',
        event_date: event.date || new Date().toISOString(),
        venue: event.venue || 'TBA',
        zone: zoneName,
        quantity: qty,
        total_price: total,
        status: 'confirmed',
        ticket_code: p.ticketCode || ('TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
        payment_method: p.bank ? `${p.method}:${p.bank}` : p.method,
        notes: seats.length ? `Seats: ${seats.join(', ')}` : undefined,
      }).catch(() => {});
      await base44.entities.Notification.create({
        title:   t('pay.success_title',   { en: '✅ Booked!', th: '✅ จองสำเร็จ!', ja: '✅ 予約完了!', zh: '✅ 预订成功!', ko: '✅ 예약 완료!' }),
        message: t('pay.success_message', { en: `Your ticket for ${event.title || 'Concert'} is confirmed`, th: `ตั๋ว ${event.title || 'Concert'} ได้รับการยืนยันแล้ว`, ja: `${event.title || 'Concert'} のチケットが確定しました`, zh: `${event.title || 'Concert'} 的门票已确认`, ko: `${event.title || 'Concert'} 티켓이 확정되었습니다` }),
        type: 'booking_confirmed', is_read: false, priority: 'high',
      }).catch(() => {});
    }
    setPayment(p); setStep('success');
  };

  const handleConfirm = async () => {
    const method = selectedMethod;
    const bank = method === 'mobilebanking' ? selectedBank : undefined;
    if (!idemRef.current) idemRef.current = uuid();
    setStep('processing'); setErrorMsg('');
    try {
      const r = await fetch('/api/payments/create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total, method, bank, idempotencyKey: idemRef.current,
          event: { title: event?.title, venue: event?.venue, date: event?.date, zone: zoneName },
        }),
      });
      const p = await r.json();
      if (!r.ok || p.error) return fail(p.error || 'สร้างรายการชำระเงินไม่สำเร็จ');
      setPayment(p);

      if (p.status === 'paid') return onPaid(p);
      // Real provider: hand off to the bank app / 3DS page
      if (p.authorizeUri) { window.location.href = p.authorizeUri; return; }
      // PromptPay → QR
      if (p.method === 'promptpay' && p.qrImage) { setStep('qr'); if (!p.demo) poll(p.id); return; }
      // Card demo → confirm instantly
      if (p.method === 'card') {
        if (p.demo) { await fetch(`/api/payments/${p.id}/confirm`, { method: 'POST', credentials: 'include' }); poll(p.id); }
        else fail('การชำระด้วยบัตรจริงกำลังพัฒนา (ใช้ PromptPay หรือโหมดสาธิตก่อน)');
        return;
      }
      // Mobile banking / TrueMoney (demo) → connect step
      setStep('connect');
      if (!p.demo) poll(p.id);
    } catch (e) {
      fail(e?.message);
    }
  };

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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-card text-card-foreground border border-primary/30 shadow-2xl rounded-3xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto"
          >
            <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            {/* ── Seat selection ── */}
            {step === 'seats' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-syne text-xl font-bold gradient-text">{t('seat.title', { en: 'Choose your seats', th: 'เลือกที่นั่ง', ja: '座席を選択', zh: '选择座位', ko: '좌석 선택' })}</h2>
                  {event?.title && <p className="text-sm text-muted-foreground mt-1 truncate">{event.title}</p>}
                </div>

                {/* Zone boxes */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t('seat.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {zones.map(z => {
                      const avail = seatLayout(hashStr((event?.title || '') + '|' + z.name)).filter(s => !s.taken).length;
                      const active = z.name === zoneName;
                      return (
                        <button key={z.name} onClick={() => chooseZone(z.name)}
                          className={`text-left p-3 rounded-xl border transition-all ${active ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/40'}`}>
                          <div className="text-sm font-medium text-foreground">{z.name}</div>
                          <div className="text-xs text-gold font-semibold">฿{(z.price || 0).toLocaleString()}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{t('seat.left', { en: `${avail} seats left`, th: `เหลือ ${avail} ที่นั่ง`, ja: `残り${avail}席`, zh: `剩 ${avail} 座`, ko: `${avail}석 남음` })}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seat map */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{t('seat.map', { en: 'Seat map', th: 'แผนผังที่นั่ง', ja: '座席表', zh: '座位图', ko: '좌석도' })} · {zoneName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary border border-border/60" />{t('seat.free', { en: 'free', th: 'ว่าง', ja: '空', zh: '空', ko: '빈' })}</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" />{t('seat.picked', { en: 'picked', th: 'เลือก', ja: '選択', zh: '已选', ko: '선택' })}</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/40" />{t('seat.taken', { en: 'taken', th: 'เต็ม', ja: '満', zh: '已售', ko: '매진' })}</span>
                    </div>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3">
                    <div className="text-center text-[10px] text-muted-foreground mb-2 tracking-widest">🎤 {t('seat.stage', { en: 'STAGE', th: 'เวที', ja: 'ステージ', zh: '舞台', ko: '무대' })}</div>
                    <div className="grid grid-cols-8 gap-1.5">
                      {layout.map(s => {
                        const selected = seats.includes(s.id);
                        return (
                          <button key={s.id} disabled={s.taken} onClick={() => toggleSeat(s.id)} title={s.id}
                            className={`aspect-square rounded text-[9px] font-medium transition-colors ${
                              s.taken ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                                : selected ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary border border-border/60 text-muted-foreground hover:border-primary/50'}`}>
                            {s.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary + continue */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-muted-foreground min-w-0">
                    {seats.length
                      ? <>{t('seat.selected', { en: 'Selected', th: 'เลือก', ja: '選択', zh: '已选', ko: '선택' })} {seats.length}: <span className="text-foreground">{seats.join(', ')}</span></>
                      : t('seat.none', { en: 'No seat selected yet', th: 'ยังไม่ได้เลือกที่นั่ง', ja: '未選択', zh: '尚未选座', ko: '미선택' })}
                    <div className="text-primary font-semibold text-sm">฿{total.toLocaleString()}</div>
                  </div>
                  <Button onClick={() => setStep('confirm')} disabled={!seats.length} className="bg-gradient-to-r from-primary to-accent flex-shrink-0">
                    {t('seat.continue', { en: 'Continue', th: 'ดำเนินการ', ja: '次へ', zh: '继续', ko: '계속' })} →
                  </Button>
                </div>
              </div>
            )}

            {/* ── Confirm ── */}
            {step === 'confirm' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep('seats')} className="text-muted-foreground hover:text-foreground" aria-label="Back to seats">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="font-syne text-xl font-bold gradient-text">{t('pay.title', { en: 'Confirm payment', th: 'ยืนยันการชำระเงิน', ja: '支払いを確認', zh: '确认付款', ko: '결제 확인' })}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('pay.subtitle', { en: 'Review and confirm', th: 'ตรวจสอบและยืนยัน', ja: '内容を確認して確定', zh: '确认信息', ko: '확인 후 결제' })}</p>
                  </div>
                </div>

                {event && (
                  <div className="bg-secondary/60 border border-border/40 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">{event.title}</h3>
                    {event.venue && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</p>}
                    {event.date && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</p>}
                    <div className="pt-2 mt-1 border-t border-border/40 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('booking.zone', { en: 'Zone', th: 'โซน', ja: 'ゾーン', zh: '区域', ko: '구역' })} {zoneName} × {qty}</span>
                        <span className="text-foreground font-medium">฿{ticketPrice.toLocaleString()}</span>
                      </div>
                      {seats.length > 0 && (
                        <div className="text-[11px] text-muted-foreground">{t('seat.label', { en: 'Seats', th: 'ที่นั่ง', ja: '座席', zh: '座位', ko: '좌석' })}: {seats.join(', ')}</div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('pay.fee', { en: 'Service fee', th: 'ค่าบริการ', ja: '手数料', zh: '服务费', ko: '수수료' })}</span>
                        <span className="text-foreground font-medium">฿{SERVICE_FEE.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-semibold">
                        <span className="text-sm text-foreground">{t('pay.total', { en: 'Total', th: 'ยอดรวม', ja: '合計', zh: '总计', ko: '합계' })}</span>
                        <span className="text-primary text-base">฿{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t('pay.select_method', { en: 'Choose payment method', th: 'เลือกวิธีชำระเงิน', ja: 'お支払い方法を選択', zh: '选择支付方式', ko: '결제 수단 선택' })}</p>
                  {methods.map(m => {
                    const active = selectedMethod === m.id;
                    return (
                      <div key={m.id}>
                        <button
                          onClick={() => chooseMethod(m.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            active ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-foreground hover:border-primary/40'
                          }`}
                        >
                          <m.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium text-left flex-1">{m.label}</span>
                          {active && <CheckCircle className="w-4 h-4" />}
                        </button>
                        {m.id === 'mobilebanking' && active && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {BANKS.map(b => (
                              <button
                                key={b.id}
                                onClick={() => chooseBank(b.id)}
                                className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                                  selectedBank === b.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'
                                }`}
                              >
                                {b.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-500 dark:text-green-400" />
                  <span>{t('pay.secure', { en: 'Payment is processed by the provider, not stored by us', th: 'ดำเนินการผ่านผู้ให้บริการชำระเงิน เราไม่เก็บข้อมูลบัตร', ja: '決済は決済事業者が処理します', zh: '由支付服务商处理,我们不存储卡信息', ko: '결제는 결제사에서 처리됩니다' })}</span>
                </div>

                <Button onClick={handleConfirm} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary font-semibold">
                  {t('pay.confirm', { en: 'Pay', th: 'ชำระเงิน', ja: '支払う', zh: '付款', ko: '결제' })} ฿{total.toLocaleString()}
                </Button>
              </div>
            )}

            {/* ── QR (PromptPay) ── */}
            {step === 'qr' && payment && (
              <div className="text-center py-4 space-y-4">
                <h3 className="font-syne font-bold text-lg flex items-center justify-center gap-2 text-foreground"><QrCode className="w-5 h-5 text-primary" />PromptPay</h3>
                {isDemo && (
                  <div className="bg-amber-500/15 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-2">
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

            {/* ── Connect (Mobile Banking / TrueMoney) ── */}
            {step === 'connect' && payment && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-syne font-bold text-lg text-foreground">
                  {t('pay.connecting', { en: 'Connect to', th: 'เชื่อมต่อกับ', ja: '接続', zh: '连接', ko: '연결' })} {methodLabel(payment.method, payment.bank)}
                </h3>
                {isDemo && (
                  <div className="bg-amber-500/15 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {t('pay.connect_demo', { en: 'Demo — no real charge. Tap "I’ve paid" to simulate the bank app.', th: 'โหมดสาธิต — ไม่ตัดเงินจริง กด “ชำระแล้ว (จำลอง)” เพื่อจำลองการเปิดแอปธนาคาร', ja: 'デモ — 実際の請求なし', zh: '演示 — 不会真实扣款', ko: '데모 — 실제 결제 없음' })}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('pay.connect_desc', { en: 'You’ll be sent to your banking app to authorize ฿' + total.toLocaleString(), th: 'ระบบจะพาไปยังแอปธนาคารเพื่อยืนยันการชำระ ฿' + total.toLocaleString(), ja: '銀行アプリで承認します', zh: '将跳转到银行 App 授权', ko: '은행 앱에서 승인합니다' })}
                </p>
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
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-foreground">{t('pay.processing', { en: 'Processing…', th: 'กำลังดำเนินการ...', ja: '処理中…', zh: '处理中…', ko: '처리 중…' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.processing_desc2', { en: 'Confirming your payment with the provider', th: 'กำลังยืนยันการชำระเงินกับผู้ให้บริการ', ja: '決済事業者と確認中', zh: '正在与支付服务商确认', ko: '결제사와 확인 중' })}</p>
                </div>
              </div>
            )}

            {/* ── Success ── */}
            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
                </motion.div>
                <div>
                  <h3 className="font-syne font-bold text-xl text-green-600 dark:text-green-400">{t('pay.done_title', { en: 'Booked!', th: 'จองสำเร็จ!', ja: '予約完了!', zh: '预订成功!', ko: '예약 완료!' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('pay.done_desc', { en: 'Your ticket is confirmed', th: 'ตั๋วของคุณได้รับการยืนยันแล้ว', ja: 'チケットが確定しました', zh: '您的门票已确认', ko: '티켓이 확정되었습니다' })}</p>
                </div>
                <div className="bg-secondary/60 border border-border/40 rounded-2xl p-4 text-sm text-left space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
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
