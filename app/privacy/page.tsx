/* eslint-disable @next/next/no-html-link-for-pages */
// Privacy Notice for the /questions survey (PDPA §23 disclosure).
// NOTE: This is a practical draft — replace the contact email and have it
// reviewed by your legal/DPO before relying on it for compliance.

export const metadata = {
  title: 'Tempo — นโยบายความเป็นส่วนตัว',
  description: 'Tempo เก็บและใช้ข้อมูลแบบสำรวจอย่างไร ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
};

// 👉 เปลี่ยนเป็นอีเมลติดต่อจริงของคุณก่อนใช้งานจริง
const CONTACT_EMAIL = 'privacy@tempo.app';
const LAST_UPDATED = '13 มิถุนายน 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-syne font-bold text-lg text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <a href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white text-lg">✦</span>
          </div>
          <span className="font-syne font-bold gradient-text">Agentic AI · Tempo</span>
        </a>

        <div className="space-y-2">
          <h1 className="font-syne text-3xl font-bold">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-xs text-muted-foreground">ปรับปรุงล่าสุด: {LAST_UPDATED}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          นโยบายนี้อธิบายว่า Tempo เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลที่คุณกรอกในแบบสำรวจ
          (หน้า <a href="/questions" className="text-primary hover:underline">/questions</a>) อย่างไร
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        </p>

        <div className="space-y-6">
          <Section title="1. ผู้ควบคุมข้อมูลส่วนบุคคล">
            <p>
              ทีมงาน Tempo (Agentic AI Entertain Assistant) เป็นผู้ควบคุมข้อมูล หากมีข้อสงสัยหรือ
              ต้องการใช้สิทธิ ติดต่อได้ที่{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </Section>

          <Section title="2. ข้อมูลที่เราเก็บ">
            <p>เฉพาะข้อมูลที่คุณกรอกในแบบสำรวจด้วยตนเอง ได้แก่:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ชื่อเล่น (ไม่บังคับ) และอีเมล</li>
              <li>ช่องทางติดต่อที่คุณให้ เช่น เบอร์โทร หรือ LINE ID (ไม่บังคับ)</li>
              <li>
                ข้อมูลความสนใจ เช่น กลุ่มที่คุณอยู่ ศิลปิน แนวเพลง ปัญหาที่เคยเจอ ความถี่ในการไปคอนเสิร์ต
                แพลตฟอร์มที่ใช้ งบประมาณ และความเห็นเพิ่มเติม
              </li>
            </ul>
            <p>เราไม่เก็บเลขบัตรประชาชน ข้อมูลการเงิน หรือข้อมูลอ่อนไหวอื่นใด</p>
          </Section>

          <Section title="3. วัตถุประสงค์ในการใช้">
            <ul className="list-disc list-inside space-y-1">
              <li>วิจัยและพัฒนาผลิตภัณฑ์ให้ตรงความต้องการผู้ใช้</li>
              <li>ประเมินความสนใจและจำนวนผู้สมัครก่อนเปิดให้บริการ</li>
              <li>ติดต่อกลับเพื่อแจ้งเตือนเมื่อเปิดให้ใช้งาน</li>
            </ul>
            <p>เราใช้ข้อมูลตาม “ความยินยอม” ที่คุณให้ในแบบฟอร์มเท่านั้น</p>
          </Section>

          <Section title="4. การเปิดเผยข้อมูล">
            <p>
              เราไม่ขายหรือส่งต่อข้อมูลของคุณให้บุคคลภายนอกเพื่อการตลาด ข้อมูลแบบสำรวจถูกจัดเก็บผ่าน
              บริการ Google (Google Sheets / Apps Script) ในฐานะผู้ประมวลผลข้อมูล ซึ่งเซิร์ฟเวอร์อาจ
              อยู่ต่างประเทศ โดยมีมาตรการคุ้มครองตามมาตรฐานของผู้ให้บริการ
            </p>
          </Section>

          <Section title="5. ระยะเวลาการเก็บ">
            <p>
              เราเก็บข้อมูลไว้ไม่เกิน 24 เดือนนับจากวันที่คุณส่งแบบฟอร์ม หรือจนกว่าคุณจะขอให้ลบ
              แล้วแต่อย่างใดถึงก่อน เมื่อพ้นกำหนดจะลบหรือทำให้ไม่สามารถระบุตัวตนได้
            </p>
          </Section>

          <Section title="6. สิทธิของคุณ">
            <p>คุณมีสิทธิตาม PDPA ได้แก่ ขอเข้าถึง ขอแก้ไข ขอลบ ขอระงับการใช้ คัดค้านการประมวลผล
              ขอโอนย้ายข้อมูล และถอนความยินยอมได้ทุกเมื่อ โดยติดต่อที่{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
              {' '}การถอนความยินยอมไม่กระทบการประมวลผลที่ทำไปก่อนหน้าโดยชอบด้วยกฎหมาย
            </p>
          </Section>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          <a href="/questions" className="hover:text-foreground underline-offset-2 hover:underline">← กลับไปหน้าแบบสำรวจ</a>
        </p>
      </div>
    </div>
  );
}
