/* eslint-disable @next/next/no-html-link-for-pages -- intentional full-page <a> links: "/" boots the React-Router SPA (catch-all page), kept as a hard navigation from this standalone landing. */
// Public beta-waitlist landing — shareable on Pantip / X without logging in.
// Sign-ups are collected by an EXTERNAL form (Tally / Google Form); the count
// is read from that form's responses dashboard (admin only).
//   NEXT_PUBLIC_WAITLIST_EMBED_URL → embed the form inline (iframe)
//   NEXT_PUBLIC_WAITLIST_URL       → otherwise show a button that opens the form

export const metadata = {
  title: 'Tempo — ร่วม Waitlist / Join the Waitlist',
  description: 'ผู้ช่วย AI จองคอนเสิร์ต + ที่พักใกล้สถานที่จัดงาน — ลงชื่อรับสิทธิ์ใช้งานก่อนใคร',
};

const PROPS = [
  { icon: '🤖', en: 'AI does the hunting', th: 'AI ช่วยค้นหา/แนะนำให้' },
  { icon: '💸', en: 'Transparent pricing', th: 'ราคาโปร่งใส เห็นยอดก่อนจ่าย' },
  { icon: '🎫', en: 'Ticket + stay in one place', th: 'ตั๋ว + ที่พักใกล้งาน จบที่เดียว' },
  { icon: '🔔', en: 'On-sale alerts', th: 'เตือนรอบเปิดขาย ไม่พลาดตั๋ว' },
];

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Brand */}
        <a href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white text-lg">✦</span>
          </div>
          <span className="font-syne font-bold gradient-text">Agentic AI · Tempo</span>
        </a>

        {/* Hero */}
        <div className="space-y-3">
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
            🚀 Coming soon · เปิดให้ใช้เร็ว ๆ นี้
          </span>
          <h1 className="font-syne text-3xl md:text-4xl font-bold leading-tight">
            ผู้ช่วย <span className="gradient-text">AI จองคอนเสิร์ต</span> + ที่พักใกล้งาน<br className="hidden md:block" />
            <span className="text-foreground">ร่วม Waitlist รับสิทธิ์ก่อนใคร</span>
          </h1>
          <p className="text-muted-foreground">
            บอกความต้องการเป็นภาษาคน แล้วให้ AI ค้นหา เปรียบเทียบ และช่วยจองตั๋ว + ที่พักใกล้สถานที่จัดงานให้ในที่เดียว ·
            <span className="block mt-1 text-sm">Tell the AI what you want — it finds, compares, and books tickets + a nearby stay, all in one place.</span>
          </p>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-2 gap-3">
          {PROPS.map(p => (
            <div key={p.en} className="glass rounded-2xl p-4 border border-border/30">
              <div className="text-2xl">{p.icon}</div>
              <div className="text-sm font-medium mt-1.5">{p.th}</div>
              <div className="text-xs text-muted-foreground">{p.en}</div>
            </div>
          ))}
        </div>

        {/* Sign-up CTA → custom Tempo-themed /questions survey */}
        <div className="glass rounded-2xl p-5 border border-primary/20">
          <h2 className="font-syne font-bold text-lg mb-1">ลงชื่อรับสิทธิ์ · Join the waitlist</h2>
          <p className="text-xs text-muted-foreground mb-4">ใช้เวลาไม่ถึง 1 นาที · ตอบไม่กี่ข้อเพื่อบอกความต้องการ แล้วเราจะแจ้งเตือนทันทีที่เปิดให้ใช้งาน (ไม่สแปม)</p>

          <a
            href="/questions"
            className="block text-center w-full rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold py-3 hover:opacity-90 transition-opacity"
          >
            ร่วม Waitlist เลย → / Join now
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground underline-offset-2 hover:underline">← กลับหน้าแรก / Back to app</a>
          {'  ·  Made in Thailand 🇹🇭'}
        </p>
      </div>
    </div>
  );
}
