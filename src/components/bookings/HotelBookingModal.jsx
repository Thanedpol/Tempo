import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, MapPin, AlertTriangle, QrCode, Building2, BedDouble, Layers, Ruler, ArrowLeft, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/I18nContext';
import { PAYMENT_METHODS, getEnabledMethods, getDefaultMethod } from '@/lib/paymentPrefs';

const SERVICE_FEE = 0;
const BANKS = [
  { id: 'scb', label: 'SCB' }, { id: 'kbank', label: 'KBank' },
  { id: 'bbl', label: 'BBL' }, { id: 'krungthai', label: 'Krungthai' },
];

function uuid() { try { return crypto.randomUUID(); } catch { return 'idem-' + Math.random().toString(36).slice(2) + Date.now(); } }
function hashStr(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

// Deterministic mock room types for a hotel (demo). Floor / size / rooms-left.
function roomTypes(hotel) {
  const base = hotel?.price_per_night || 1500;
  let rng = hashStr(String(hotel?.id || hotel?.name || 'h')) || 1;
  const next = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff);
  const defs = [
    { key: 'standard', name: 'Standard', size: 28, mult: 1 },
    { key: 'deluxe', name: 'Deluxe', size: 36, mult: 1.4 },
    { key: 'suite', name: 'Suite', size: 54, mult: 2.2 },
  ];
  return defs.map((d, i) => {
    const lo = 3 + i * 5;
    return { ...d, price: Math.round((base * d.mult) / 10) * 10, floor: `${lo}-${lo + 4}`, left: 1 + (next() % 9) };
  });
}
function isoDate(offsetDays = 0) { return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10); }

export default function HotelBookingModal({ open, onClose, hotel }) {
  const { t } = useI18n();
  const [step, setStep] = useState('rooms'); // rooms | confirm | qr | connect | processing | success | error

  const rooms = roomTypes(hotel);
  const [roomKey, setRoomKey] = useState(rooms[0]?.key);
  const [nights, setNights] = useState(1);
  const room = rooms.find(r => r.key === roomKey) || rooms[0];

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

  const roomPrice = (room?.price || 0) * nights;
  const total = roomPrice + SERVICE_FEE;

  const methodLabel = (m, bank) => {
    const baseL = PAYMENT_METHODS.find(x => x.id === m)?.label || m;
    if (m === 'mobilebanking' && bank) return `${baseL} · ${BANKS.find(b => b.id === bank)?.label || bank}`;
    return baseL;
  };

  const reset = () => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    idemRef.current = null; setPayment(null); setErrorMsg(''); setNights(1); setStep('rooms');
  };
  const close = () => { reset(); onClose?.(); };
  const fail = (msg) => { setErrorMsg(msg || 'เกิดข้อผิดพลาด'); setStep('error'); };
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
    if (hotel) {
      await base44.entities.HotelBooking.create({
        hotel_name: hotel.name, hotel_image: hotel.image,
        check_in: isoDate(0), check_out: isoDate(nights),
        room_type: room?.name || 'Standard', price_per_night: room?.price || 0, total_price: total,
        distance_to_venue: hotel.distance || '', status: 'confirmed',
        source: hotel.source || '', source_url: hotel.source_url || '',
        address: hotel.address || '', rating: hotel.rating || 4,
        amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      }).catch(() => {});
      await base44.entities.Notification.create({
        title:   t('hotelpay.ok_title',   { en: '🏨 Hotel booked!', th: '🏨 จองโรงแรมสำเร็จ!', ja: '🏨 ホテル予約完了!', zh: '🏨 酒店预订成功!', ko: '🏨 호텔 예약 완료!' }),
        message: t('hotelpay.ok_msg',     { en: `${hotel.name} · ${nights} night(s) confirmed`, th: `${hotel.name} · ${nights} คืน ยืนยันแล้ว`, ja: `${hotel.name} · ${nights}泊 確定`, zh: `${hotel.name} · ${nights} 晚 已确认`, ko: `${hotel.name} · ${nights}박 확정` }),
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
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total, method, bank, idempotencyKey: idemRef.current,
          event: { title: hotel?.name, venue: hotel?.address, date: isoDate(0), zone: room?.name },
        }),
      });
      const p = await r.json();
      if (!r.ok || p.error) return fail(p.error || 'สร้างรายการชำระเงินไม่สำเร็จ');
      setPayment(p);
      if (p.status === 'paid') return onPaid(p);
      if (p.authorizeUri) { window.location.href = p.authorizeUri; return; }
      if (p.method === 'promptpay' && p.qrImage) { setStep('qr'); if (!p.demo) poll(p.id); return; }
      if (p.method === 'card') {
        if (p.demo) { await fetch(`/api/payments/${p.id}/confirm`, { method: 'POST', credentials: 'include' }); poll(p.id); }
        else fail('การชำระด้วยบัตรจริงกำลังพัฒนา (ใช้ PromptPay หรือโหมดสาธิตก่อน)');
        return;
      }
      setStep('connect');
      if (!p.demo) poll(p.id);
    } catch (e) { fail(e?.message); }
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-card text-card-foreground border border-primary/30 shadow-2xl rounded-3xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
            <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

            {/* ── Room selection ── */}
            {step === 'rooms' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-syne text-xl font-bold gradient-text">{t('hotelpay.choose_room', { en: 'Choose a room', th: 'เลือกห้องพัก', ja: '部屋を選択', zh: '选择房型', ko: '객실 선택' })}</h2>
                  {hotel?.name && <p className="text-sm text-muted-foreground mt-1 truncate">{hotel.name}</p>}
                </div>

                <div className="space-y-2">
                  {rooms.map(r => {
                    const active = r.key === roomKey;
                    return (
                      <button key={r.key} onClick={() => setRoomKey(r.key)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${active ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/40'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground"><BedDouble className="w-4 h-4 text-primary" />{r.name}</div>
                          <div className="text-gold font-semibold text-sm">฿{r.price.toLocaleString()}<span className="text-[10px] text-muted-foreground">/{t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</span></div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{t('hotelpay.floor', { en: 'Floor', th: 'ชั้น', ja: '階', zh: '楼层', ko: '층' })} {r.floor}</span>
                          <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{r.size} ตร.ม.</span>
                          <span className={r.left <= 3 ? 'text-amber-500' : ''}>{t('hotelpay.left', { en: `${r.left} rooms left`, th: `เหลือ ${r.left} ห้อง`, ja: `残り${r.left}室`, zh: `剩 ${r.left} 间`, ko: `${r.left}실 남음` })}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Nights */}
                <div className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{t('hotelpay.nights', { en: 'Nights', th: 'จำนวนคืน', ja: '泊数', zh: '晚数', ko: '박 수' })}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNights(n => Math.max(1, n - 1))} className="w-7 h-7 rounded-lg bg-secondary border border-border/60 flex items-center justify-center hover:border-primary/50"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-sm font-semibold w-6 text-center">{nights}</span>
                    <button onClick={() => setNights(n => Math.min(14, n + 1))} className="w-7 h-7 rounded-lg bg-secondary border border-border/60 flex items-center justify-center hover:border-primary/50"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-muted-foreground">
                    {room?.name} · {nights} {t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}
                    <div className="text-primary font-semibold text-sm">฿{total.toLocaleString()}</div>
                  </div>
                  <Button onClick={() => setStep('confirm')} className="bg-gradient-to-r from-primary to-accent flex-shrink-0">
                    {t('seat.continue', { en: 'Continue', th: 'ดำเนินการ', ja: '次へ', zh: '继续', ko: '계속' })} →
                  </Button>
                </div>
              </div>
            )}

            {/* ── Confirm / payment ── */}
            {step === 'confirm' && (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep('rooms')} className="text-muted-foreground hover:text-foreground" aria-label="Back to rooms"><ArrowLeft className="w-4 h-4" /></button>
                  <div>
                    <h2 className="font-syne text-xl font-bold gradient-text">{t('pay.title', { en: 'Confirm payment', th: 'ยืนยันการชำระเงิน', ja: '支払いを確認', zh: '确认付款', ko: '결제 확인' })}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('pay.subtitle', { en: 'Review and confirm', th: 'ตรวจสอบและยืนยัน', ja: '内容を確認して確定', zh: '确认信息', ko: '확인 후 결제' })}</p>
                  </div>
                </div>

                {hotel && (
                  <div className="bg-secondary/60 border border-border/40 rounded-2xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">{hotel.name}</h3>
                    {hotel.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{hotel.address}</p>}
                    <div className="pt-2 mt-1 border-t border-border/40 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{room?.name} · {nights} {t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</span>
                        <span className="text-foreground font-medium">฿{roomPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{t('hotelpay.floor', { en: 'Floor', th: 'ชั้น', ja: '階', zh: '楼层', ko: '층' })} {room?.floor} · {room?.size} ตร.ม.</div>
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
                        <button onClick={() => chooseMethod(m.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-foreground hover:border-primary/40'}`}>
                          <m.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium text-left flex-1">{m.label}</span>
                          {active && <CheckCircle className="w-4 h-4" />}
                        </button>
                        {m.id === 'mobilebanking' && active && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {BANKS.map(b => (
                              <button key={b.id} onClick={() => chooseBank(b.id)}
                                className={`py-2 rounded-lg border text-xs font-medium transition-all ${selectedBank === b.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40'}`}>
                                {b.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    {t('pay.demo_note', { en: 'Demo — no real charge. Tap "I’ve paid".', th: 'โหมดสาธิต — ไม่ตัดเงินจริง กด “ชำระแล้ว (จำลอง)”', ja: 'デモ — 実際の請求なし', zh: '演示模式 — 不会真实扣款', ko: '데모 — 실제 결제 없음' })}
                  </div>
                )}
                {payment.qrImage && <img src={payment.qrImage} alt="PromptPay QR" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />}
                <p className="text-sm text-muted-foreground">{t('pay.scan', { en: 'Scan with any banking app', th: 'สแกนด้วยแอปธนาคารใดก็ได้', ja: '銀行アプリでスキャン', zh: '用任意银行 App 扫码', ko: '은행 앱으로 스캔' })} · ฿{total.toLocaleString()}</p>
                {isDemo
                  ? <Button onClick={demoMarkPaid} className="w-full bg-gradient-to-r from-primary to-accent">{t('pay.demo_paid', { en: 'I’ve paid (simulate)', th: 'ชำระแล้ว (จำลอง)', ja: '支払い済み(デモ)', zh: '已支付(模拟)', ko: '결제함 (데모)' })}</Button>
                  : <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{t('pay.waiting', { en: 'Waiting for payment…', th: 'รอการชำระเงิน…', ja: '支払いを待っています…', zh: '等待付款…', ko: '결제 대기 중…' })}</div>}
              </div>
            )}

            {/* ── Connect (Mobile Banking / TrueMoney) ── */}
            {step === 'connect' && payment && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto"><Building2 className="w-7 h-7 text-primary" /></div>
                <h3 className="font-syne font-bold text-lg text-foreground">{t('pay.connecting', { en: 'Connect to', th: 'เชื่อมต่อกับ', ja: '接続', zh: '连接', ko: '연결' })} {methodLabel(payment.method, payment.bank)}</h3>
                {isDemo && (
                  <div className="bg-amber-500/15 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-2 text-left">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {t('pay.connect_demo', { en: 'Demo — no real charge.', th: 'โหมดสาธิต — ไม่ตัดเงินจริง กด “ชำระแล้ว (จำลอง)” เพื่อจำลองแอปธนาคาร', ja: 'デモ — 実際の請求なし', zh: '演示 — 不会真实扣款', ko: '데모 — 실제 결제 없음' })}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{t('pay.connect_desc', { en: 'You’ll be sent to your banking app to authorize ฿' + total.toLocaleString(), th: 'ระบบจะพาไปยังแอปธนาคารเพื่อยืนยันการชำระ ฿' + total.toLocaleString(), ja: '銀行アプリで承認します', zh: '将跳转到银行 App 授权', ko: '은행 앱에서 승인합니다' })}</p>
                {isDemo
                  ? <Button onClick={demoMarkPaid} className="w-full bg-gradient-to-r from-primary to-accent">{t('pay.demo_paid', { en: 'I’ve paid (simulate)', th: 'ชำระแล้ว (จำลอง)', ja: '支払い済み(デモ)', zh: '已支付(模拟)', ko: '결제함 (데모)' })}</Button>
                  : <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{t('pay.waiting', { en: 'Waiting for payment…', th: 'รอการชำระเงิน…', ja: '支払いを待っています…', zh: '等待付款…', ko: '결제 대기 중…' })}</div>}
              </div>
            )}

            {/* ── Processing ── */}
            {step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                <h3 className="font-syne font-bold text-lg text-foreground">{t('pay.processing', { en: 'Processing…', th: 'กำลังดำเนินการ...', ja: '処理中…', zh: '处理中…', ko: '처리 중…' })}</h3>
              </div>
            )}

            {/* ── Success ── */}
            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" /></motion.div>
                <div>
                  <h3 className="font-syne font-bold text-xl text-green-600 dark:text-green-400">{t('hotelpay.done', { en: 'Hotel booked!', th: 'จองโรงแรมสำเร็จ!', ja: 'ホテル予約完了!', zh: '酒店预订成功!', ko: '호텔 예약 완료!' })}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{hotel?.name} · {room?.name} · {nights} {t('hotel.per_night', { en: 'night', th: 'คืน', ja: '泊', zh: '晚', ko: '박' })}</p>
                </div>
                <div className="bg-secondary/60 border border-border/40 rounded-2xl p-4 text-sm text-left space-y-1 text-muted-foreground text-xs">
                  <div>📅 {t('hotelpay.checkin', { en: 'Check-in', th: 'เช็คอิน', ja: 'チェックイン', zh: '入住', ko: '체크인' })}: {isoDate(0)} → {isoDate(nights)}</div>
                  <div>📧 {t('pay.email_soon', { en: 'Voucher by email — coming soon', th: 'ส่ง Voucher ทางอีเมล — เร็ว ๆ นี้', ja: 'バウチャー — 近日', zh: '邮件凭证 — 即将推出', ko: '바우처 이메일 — 곧 제공' })}</div>
                </div>
                <Button onClick={close} className="w-full">{t('pay.done', { en: 'Done', th: 'เสร็จสิ้น', ja: '完了', zh: '完成', ko: '완료' })}</Button>
              </div>
            )}

            {/* ── Error ── */}
            {step === 'error' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
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
