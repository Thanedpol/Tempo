'use client';

// Tempo-themed public survey + registration form. Submits to /api/questions
// (same-origin), which forwards the row to a Google Apps Script → Google Sheet.
// Uses controlled state + a small zod check on submit (matches the lightweight
// form style elsewhere in the app rather than the full react-hook-form wrapper).
//
// PDPA: name is OPTIONAL (avoid forcing PII), consent covers research + contact
// and links to /privacy, and a short privacy notice sits above the submit button.

import { useState } from 'react';
import { z } from 'zod';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const SEGMENTS = [
  { value: 'gen_z', label: 'Gen Z' },
  { value: 'gen_y', label: 'Gen Y' },
  { value: 'kpop_tpop', label: 'แฟน K-Pop / T-Pop' },
  { value: 'event_tourist', label: 'สายเที่ยวตามคอนเสิร์ต' },
];

const GENRES = ['K-Pop', 'T-Pop', 'Pop', 'Rock', 'Hip-Hop', 'EDM', 'Jazz', 'อินดี้', 'ลูกทุ่ง/หมอลำ', 'คลาสสิก'];

// The 7 ticket-buying pain points Tempo targets.
const PAIN_POINTS = [
  'ระบบล่ม / หลุดหน้าจ่ายเงิน',
  'ตัดเงินแล้วแต่ไม่ได้ตั๋ว',
  'บอทกวาดตั๋ว / โดนโก่งราคาตลาดรอง',
  'ราคาไม่โปร่งใส มีค่าธรรมเนียมแฝง',
  'ระบบกันบอท (CAPTCHA/คิว) ยุ่งยาก',
  'เงื่อนไขเลื่อน/ยกเลิกงาน & สิทธิ์พรีเซล',
  'ส่งตั๋วช้า / ซัพพอร์ตแย่',
];

const FREQUENCIES = ['ยังไม่เคย / ครั้งแรก', '1–2 ครั้ง/ปี', '3–5 ครั้ง/ปี', 'มากกว่า 5 ครั้ง/ปี'];

const PLATFORMS = ['Thai Ticket Major', 'Ticketmelon', 'TheConcert', 'Eventpop', 'ตลาดรอง / ซื้อต่อจากคนอื่น', 'อื่นๆ'];

const STAY_OPTIONS = [
  { value: 'high', label: 'สนใจมาก' },
  { value: 'maybe', label: 'เฉย ๆ' },
  { value: 'no', label: 'ไม่สนใจ' },
];

const BUDGETS = [
  'ต่ำกว่า 2,000 บาท',
  '2,000 – 5,000 บาท',
  '5,000 – 10,000 บาท',
  '10,000 – 20,000 บาท',
  'มากกว่า 20,000 บาท',
];

const INTENTS = [
  { value: 'yes', label: 'ลองแน่นอน' },
  { value: 'probably', label: 'น่าจะลอง' },
  { value: 'unsure', label: 'ไม่แน่ใจ' },
  { value: 'no', label: 'คงไม่ลอง' },
];

// Only email + consent are required; name is intentionally optional (PDPA).
const Schema = z.object({
  email: z.string().trim().email('อีเมลไม่ถูกต้อง'),
  consent: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับเพื่อให้เราติดต่อกลับและใช้ข้อมูลเพื่อพัฒนาผลิตภัณฑ์' }) }),
});

type Errors = Partial<Record<'email' | 'consent', string>>;
type Status = 'idle' | 'submitting' | 'success' | 'error' | 'not_configured';

const labelCls = 'text-sm font-medium text-foreground';
const inputCls = 'bg-background/60 border-border/40';
const chipBase = 'text-sm rounded-full border px-3 py-1.5 transition-colors';
const cardBtnBase = 'text-sm rounded-xl border px-3 py-2.5 text-left transition-colors';

export default function QuestionsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [artists, setArtists] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [painOther, setPainOther] = useState('');
  const [frequency, setFrequency] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [stayInterest, setStayInterest] = useState('');
  const [budget, setBudget] = useState('');
  const [intent, setIntent] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Full literal class strings per color — Tailwind can't compile `border-${color}`.
  const chipCls = (on: boolean, color: 'primary' | 'accent') => {
    if (color === 'primary') {
      return `${chipBase} ${on ? 'border-primary bg-primary/15 text-foreground' : 'border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40'}`;
    }
    return `${chipBase} ${on ? 'border-accent bg-accent/15 text-foreground' : 'border-border/40 bg-background/40 text-muted-foreground hover:border-accent/40'}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = Schema.safeParse({ email, consent });
    if (!result.success) {
      const f = result.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], consent: f.consent?.[0] });
      return;
    }
    setErrors({});
    setStatus('submitting');
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, contact, segments, artists, genres,
          painPoints, painOther, frequency, platforms,
          stayInterest, budget, intent, city, comment, consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setStatus('success');
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      } else if (data?.reason === 'not_configured') {
        setStatus('not_configured');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="glass rounded-2xl p-8 border border-primary/30 text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="font-syne font-bold text-xl gradient-text">ขอบคุณที่ร่วมตอบ!</h2>
        <p className="text-sm text-muted-foreground">
          เราบันทึกข้อมูลของคุณแล้ว และจะแจ้งเตือนทันทีที่ Tempo เปิดให้ใช้งาน
        </p>
        <a href="/" className="inline-block text-sm text-primary hover:underline underline-offset-2 mt-2">
          ← กลับหน้าแรก
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ---- ลงทะเบียน ---- */}
      <section className="glass rounded-2xl p-5 border border-border/30 space-y-4">
        <h2 className="font-syne font-bold text-lg">ข้อมูลติดต่อ</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name" className={labelCls}>ชื่อเล่น <span className="text-muted-foreground font-normal">(ไม่บังคับ · ไม่ต้องใช้ชื่อจริง)</span></Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="เช่น มิว" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className={labelCls}>อีเมล <span className="text-destructive">*</span></Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact" className={labelCls}>เบอร์โทร หรือ LINE ID <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span></Label>
          <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} className={inputCls} placeholder="081-xxx-xxxx หรือ @lineid" />
        </div>
      </section>

      {/* ---- สำรวจความต้องการ ---- */}
      <section className="glass rounded-2xl p-5 border border-border/30 space-y-5">
        <h2 className="font-syne font-bold text-lg">บอกเราเกี่ยวกับคุณ</h2>

        <div className="space-y-2">
          <Label className={labelCls}>คุณคือใคร? <span className="text-muted-foreground font-normal">(เลือกได้หลายอัน)</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {SEGMENTS.map((s) => {
              const on = segments.includes(s.value);
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => toggle(segments, setSegments, s.value)}
                  className={`${cardBtnBase} ${
                    on
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="artists" className={labelCls}>ศิลปิน / คอนเสิร์ตที่อยากให้ Tempo ช่วยตามตั๋ว</Label>
          <Input id="artists" value={artists} onChange={(e) => setArtists(e.target.value)} className={inputCls} placeholder="พิมพ์ชื่อศิลปินที่อยากให้เราตาม..." />
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>แนวเพลงที่ชอบ <span className="text-muted-foreground font-normal">(เลือกได้หลายอัน)</span></Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button type="button" key={g} onClick={() => toggle(genres, setGenres, g)} className={chipCls(genres.includes(g), 'accent')}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>คุณไปคอนเสิร์ตบ่อยแค่ไหน?</Label>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map((f) => (
              <button type="button" key={f} onClick={() => setFrequency(frequency === f ? '' : f)} className={chipCls(frequency === f, 'primary')}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>ปกติซื้อตั๋วที่ไหน? <span className="text-muted-foreground font-normal">(เลือกได้หลายอัน)</span></Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button type="button" key={p} onClick={() => toggle(platforms, setPlatforms, p)} className={chipCls(platforms.includes(p), 'accent')}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>ปัญหาที่เคยเจอตอนซื้อตั๋ว <span className="text-muted-foreground font-normal">(เลือกได้หลายข้อ)</span></Label>
          <div className="space-y-2">
            {PAIN_POINTS.map((p) => (
              <label key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={painPoints.includes(p)}
                  onCheckedChange={() => toggle(painPoints, setPainPoints, p)}
                  className="mt-0.5"
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
          <Input
            value={painOther}
            onChange={(e) => setPainOther(e.target.value)}
            className={`${inputCls} mt-1`}
            placeholder="อื่นๆ (ระบุ)..."
          />
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>สนใจแพ็ก “ตั๋ว + ที่พักใกล้งาน” ไหม?</Label>
          <div className="flex flex-wrap gap-2">
            {STAY_OPTIONS.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setStayInterest(stayInterest === o.value ? '' : o.value)}
                className={`text-sm rounded-xl border px-4 py-2 transition-colors ${
                  stayInterest === o.value
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>งบต่อรอบ (รวมที่พักถ้ามี)</Label>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button type="button" key={b} onClick={() => setBudget(budget === b ? '' : b)} className={chipCls(budget === b, 'accent')}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelCls}>ถ้า Tempo พร้อมใช้วันนี้ คุณจะลองใช้ไหม?</Label>
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setIntent(intent === o.value ? '' : o.value)}
                className={`text-sm rounded-xl border px-4 py-2 transition-colors ${
                  intent === o.value
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city" className={labelCls}>เมือง / จังหวัด <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span></Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="เช่น กรุงเทพฯ, เชียงใหม่" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comment" className={labelCls}>อยากให้ Tempo ช่วยอะไรเพิ่ม? <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span></Label>
          <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} className={inputCls} rows={3} placeholder="บอกเราได้เลย..." />
        </div>
      </section>

      {/* ---- consent + privacy notice + submit ---- */}
      <section className="space-y-4">
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span>
            ยินดีให้ Tempo ใช้ข้อมูลเพื่อพัฒนาผลิตภัณฑ์และติดต่อกลับเมื่อเปิดให้ใช้งาน ตาม{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline underline-offset-2"
            >
              นโยบายความเป็นส่วนตัว
            </a>{' '}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {errors.consent && <p className="text-xs text-destructive -mt-2">{errors.consent}</p>}

        {/* Short PDPA notice */}
        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 border border-border/30 rounded-xl px-4 py-3">
          🔒 เราเก็บเฉพาะข้อมูลที่คุณกรอก (เช่น ชื่อเล่น อีเมล ความสนใจ) เพื่อพัฒนาผลิตภัณฑ์และติดต่อกลับเรื่องการเปิดให้ใช้งานเท่านั้น
          เก็บไว้ไม่เกิน 24 เดือนหรือจนกว่าคุณจะขอลบ และไม่ส่งต่อให้บุคคลภายนอกเพื่อการตลาด ·{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">อ่านนโยบายความเป็นส่วนตัว</a>
        </p>

        {status === 'error' && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
            ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </div>
        )}
        {status === 'not_configured' && (
          <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-3">
            ฟอร์มทำงานปกติ แต่ยังไม่ได้ตั้งค่าปลายทาง — เพิ่ม{' '}
            <code className="font-mono">GOOGLE_SHEETS_WEBHOOK_URL</code> ใน env แล้ว restart เพื่อบันทึกลง Google Sheets
          </div>
        )}

        <Button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-gradient-to-r from-primary to-accent text-white font-semibold py-6 text-base hover:opacity-90"
        >
          {status === 'submitting' ? 'กำลังส่ง...' : 'ส่งคำตอบ · ร่วมเป็นคนแรก ✦'}
        </Button>
      </section>
    </form>
  );
}
