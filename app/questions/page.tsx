/* eslint-disable @next/next/no-html-link-for-pages -- intentional full-page <a> link: "/" boots the React-Router SPA, kept as a hard navigation from this standalone landing. */
// Public survey + registration landing — shareable without logging in.
// Submissions go to /api/questions → Google Apps Script → Google Sheet
// (1 row = 1 interested person, so the Sheet's row count = sign-up count).

import QuestionsForm from './QuestionsForm';

export const metadata = {
  title: 'Tempo — ร่วมตอบแบบสำรวจ + ลงทะเบียน',
  description: 'บอกความต้องการของคุณ แล้วร่วมเป็นคนแรกที่ได้ใช้ผู้ช่วย AI จองคอนเสิร์ต + ที่พักใกล้งาน',
};

export default function QuestionsPage() {
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
            📝 ใช้เวลาประมาณ 1 นาที
          </span>
          <h1 className="font-syne text-3xl md:text-4xl font-bold leading-tight">
            ช่วยบอกเราหน่อย — <span className="gradient-text">คุณอยากให้ AI จองตั๋วแบบไหน?</span>
          </h1>
          <p className="text-muted-foreground">
            Tempo กำลังสร้างผู้ช่วย AI ที่ค้นหา เปรียบเทียบ และช่วยจองตั๋วคอนเสิร์ต + ที่พักใกล้งานให้ในที่เดียว
            ตอบไม่กี่ข้อเพื่อบอกความต้องการ แล้วลงทะเบียนรับสิทธิ์ใช้งานก่อนใคร
          </p>
        </div>

        <QuestionsForm />

        <p className="text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground underline-offset-2 hover:underline">← กลับหน้าแรก / Back to app</a>
          {'  ·  Made in Thailand 🇹🇭'}
        </p>
      </div>
    </div>
  );
}
