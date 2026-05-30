import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Zap, Bot, Ticket, Hotel, Bell } from 'lucide-react';
import { useI18n } from '@/lib/I18nContext';

function FAQItem({ q, a, isOpen, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="glass-light rounded-xl p-4 border border-border/30 hover:border-primary/50 transition-all">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-snug">{q}</h4>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform mt-0.5 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/20">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

export default function FAQs() {
  const { t } = useI18n();
  const [openStates, setOpenStates] = useState({});
  const toggleFAQ = (key) => setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));

  // Each item is built via t() with inline translations.
  // Keys are stable; the displayed strings change per language.
  const FAQS = [
    {
      icon: Bot, color: 'text-primary',
      category: t('faq.cat.ai',      { en: 'AI Assistant',       th: 'AI Assistant',         ja: 'AI アシスタント',  zh: 'AI 助手',       ko: 'AI 어시스턴트' }),
      items: [
        { q: t('faq.ai.q1', { en: 'What is the AI Assistant?',                     th: 'AI Assistant คืออะไร?',                   ja: 'AI アシスタントとは?',                         zh: 'AI 助手是什么?',                       ko: 'AI 어시스턴트가 무엇인가요?' }),
          a: t('faq.ai.a1', { en: 'A smart system that searches for and books concert tickets automatically 24/7, with configurable priorities and payment methods.', th: 'ระบบอัจฉริยะที่ช่วยค้นหาและจองตั๋วคอนเสิร์ตให้คุณอัตโนมัติ 24/7 โดยปรับลำดับความสำคัญและตัวจ่ายเงินได้', ja: 'コンサートチケットを 24 時間自動で検索・予約するスマートシステム。優先順位と支払い方法を設定可能。', zh: '24/7 自动搜索并预订音乐会门票的智能系统,优先级和支付方式可配置。', ko: '24/7 자동으로 콘서트 티켓을 검색·예매하는 스마트 시스템. 우선순위와 결제 수단 설정 가능.' }) },
        { q: t('faq.ai.q2', { en: 'Can it bypass CAPTCHA?',                        th: 'มันช่วยหลีกเลี่ยง CAPTCHA ได้ไหม?',         ja: 'CAPTCHA を回避できますか?',                     zh: '它能绕过 CAPTCHA 吗?',                  ko: 'CAPTCHA를 우회할 수 있나요?' }),
          a: t('faq.ai.a2', { en: 'Yes — with Browserbase or 2Captcha API we attempt automatic solving, but sometimes a human still needs to step in.',           th: 'ได้ค่ะ ถ้าใช้ Browserbase หรือ 2Captcha API ระบบจะพยายามแก้ CAPTCHA อัตโนมัติ แต่บางครั้งอาจต้องส่งให้มนุษย์แก้',                                              ja: 'Browserbase や 2Captcha API を使えば自動解決を試みますが、人の介入が必要な場合もあります。', zh: '是的 — 使用 Browserbase 或 2Captcha API 可尝试自动解决,但有时仍需人工介入。', ko: '예 — Browserbase 또는 2Captcha API를 사용하면 자동 해결을 시도하지만, 때때로 사람의 개입이 필요합니다.' }) },
        { q: t('faq.ai.q3', { en: 'How does the AI know when tickets go on sale?', th: 'AI จะรู้ได้ไงว่าตั๋วเปิดขาย?',                ja: 'AI はチケット販売開始をどう知るのですか?',       zh: 'AI 怎么知道门票何时开售?',              ko: 'AI는 티켓 판매 시작을 어떻게 알 수 있나요?' }),
          a: t('faq.ai.a3', { en: 'It checks ticket platforms (TTM, Ticketmelon, Eventpop) every 15 minutes and pulls each platform’s API for real-time updates.', th: 'ระบบจะตรวจ Ticket Platforms (TTM, Ticketmelon, Eventpop) ทุก 15 นาที และดึง API ของแต่ละแพลตฟอร์มแบบเรียลไทม์',                                            ja: '15 分ごとにチケットプラットフォーム(TTM、Ticketmelon、Eventpop)をチェックし、各 API でリアルタイムに更新します。', zh: '每 15 分钟检查 TTM、Ticketmelon、Eventpop 等票务平台,并通过各平台 API 实时更新。', ko: '15분마다 TTM, Ticketmelon, Eventpop 등 티켓 플랫폼을 확인하고 각 API에서 실시간 업데이트를 가져옵니다.' }) },
      ],
    },
    {
      icon: Ticket, color: 'text-gold',
      category: t('faq.cat.tickets', { en: 'Tickets & Bookings', th: 'ตั๋วและการจอง',        ja: 'チケットと予約',   zh: '门票与预订',   ko: '티켓 및 예약' }),
      items: [
        { q: t('faq.t.q1', { en: 'How do I book a ticket?',         th: 'จองตั๋วอย่างไร?',                 ja: 'チケットの予約方法は?',           zh: '如何预订门票?',           ko: '티켓 예매 방법은?' }),
          a: t('faq.t.a1', { en: 'Go to Events or use the AI Assistant, search for the event, pick a zone and quantity, then pay.', th: 'ไปที่ Events หรือใช้ AI Assistant ค้นหาเหตุการณ์ เลือก Zone และจำนวน จากนั้นชำระเงิน', ja: 'Events に行くか AI アシスタントでイベントを検索し、ゾーンと数量を選んで支払います。', zh: '前往 Events 或使用 AI 助手搜索活动,选择区域和数量,然后付款。', ko: 'Events로 가거나 AI 어시스턴트로 이벤트를 검색하고 구역과 수량을 선택한 후 결제하세요.' }) },
        { q: t('faq.t.q2', { en: 'Which payment methods are supported?', th: 'ชำระเงินตัวไหนได้บ้าง?',         ja: '対応している支払い方法は?',       zh: '支持哪些支付方式?',       ko: '어떤 결제 수단을 지원하나요?' }),
          a: t('faq.t.a2', { en: 'We support Stripe (Visa/MasterCard) and Omise (PromptPay / Thai cards). Add your API keys in the Admin panel.', th: 'รองรับ Stripe (Visa/MasterCard) และ Omise (PromptPay/บัตรไทย) โปรดเพิ่ม API Keys ใน Admin Panel', ja: 'Stripe(Visa / MasterCard)と Omise(PromptPay / タイのカード)に対応。Admin パネルから API キーを追加してください。', zh: '支持 Stripe(Visa / 万事达)和 Omise(PromptPay / 泰国卡)。请在 Admin 面板添加 API 密钥。', ko: 'Stripe(Visa/MasterCard)와 Omise(PromptPay/태국 카드)를 지원합니다. Admin 패널에서 API 키를 추가하세요.' }) },
        { q: t('faq.t.q3', { en: 'How and when will I receive my ticket?', th: 'ตั๋วจะมาไงและเมื่อไหร่?',         ja: 'チケットはいつどうやって届きますか?', zh: '门票什么时候、怎么送达?', ko: '티켓은 언제 어떻게 받나요?' }),
          a: t('faq.t.a3', { en: 'You get a QR code instantly. If you pick "Add to Calendar" it also syncs to Google Calendar.',                 th: 'รับ QR Code ทันที หากเลือก "เพิ่มลงปฏิทิน" จะซิงค์ไปที่ Google Calendar', ja: '即座に QR コードを受け取れます。「カレンダーに追加」を選ぶと Google Calendar に同期されます。', zh: '立即获取 QR 码。若选择「加入日历」也会同步到 Google Calendar。', ko: 'QR 코드를 즉시 받습니다. "캘린더에 추가"를 선택하면 Google Calendar에도 동기화됩니다.' }) },
        { q: t('faq.t.q4', { en: 'Can I cancel a booking?',           th: 'ยกเลิกการจองได้ไหม?',              ja: '予約をキャンセルできますか?',     zh: '可以取消预订吗?',         ko: '예약을 취소할 수 있나요?' }),
          a: t('faq.t.a4', { en: 'Yes — go to My Bookings. Cancellation rules follow each platform’s policy.',          th: 'ได้ค่ะ ไปที่ My Bookings และสามารถยกเลิกได้ตามนโยบายของแต่ละแพลตฟอร์ม',                                          ja: 'はい — My Bookings から、各プラットフォームのポリシーに従ってキャンセルできます。', zh: '可以 — 前往 My Bookings,按各平台政策取消。', ko: '예 — My Bookings에서 각 플랫폼의 정책에 따라 취소할 수 있습니다.' }) },
      ],
    },
    {
      icon: Hotel, color: 'text-neon-cyan',
      category: t('faq.cat.hotels',  { en: 'Hotels', th: 'โรงแรม', ja: 'ホテル', zh: '酒店', ko: '호텔' }),
      items: [
        { q: t('faq.h.q1', { en: 'How do I find hotels near the venue?',                   th: 'ค้นหาโรงแรมใกล้สถานที่จัดงานไงครับ?',     ja: '会場近くのホテルを見つけるには?',          zh: '怎么找场馆附近的酒店?',  ko: '공연장 근처 호텔을 어떻게 찾나요?' }),
          a: t('faq.h.a1', { en: 'Visit Hotels and filter by price / rating, or let the AI find nearby hotels automatically.', th: 'ไปที่เซกชั่น Hotels และกรองตามราคา/คะแนน หรือให้ AI ค้นหาโรงแรมใกล้เคียงให้',                                                              ja: 'Hotels セクションで価格・評価で絞り込むか、AI に近くのホテルを自動検索させましょう。', zh: '前往 Hotels 区按价格/评分筛选,或让 AI 自动查找附近酒店。', ko: 'Hotels에서 가격/평점으로 필터링하거나 AI가 자동으로 근처 호텔을 찾도록 하세요.' }) },
        { q: t('faq.h.q2', { en: 'Where does the data come from?',                          th: 'ดึงข้อมูลจากไหนครับ?',                  ja: 'データの出所は?',                          zh: '数据来自哪里?',            ko: '데이터는 어디서 가져오나요?' }),
          a: t('faq.h.a2', { en: 'From Agoda and Booking.com via their affiliate APIs — prices and reviews are shown.',                          th: 'ดึงจาก Agoda และ Booking.com ผ่าน Affiliate API เพื่อแสดงราคาและรีวิว',                                                                    ja: 'Agoda と Booking.com のアフィリエイト API から価格とレビューを表示します。', zh: '来自 Agoda 和 Booking.com 的联盟 API,展示价格和评论。', ko: 'Agoda와 Booking.com 제휴 API에서 가격과 리뷰를 가져옵니다.' }) },
        { q: t('faq.h.q3', { en: 'Can I book a room directly?',                              th: 'สั่งห้องได้ไหมโดยตรง?',                  ja: '直接予約できますか?',                       zh: '可以直接预订房间吗?',     ko: '직접 객실을 예약할 수 있나요?' }),
          a: t('faq.h.a3', { en: 'Right now we only show info and links. Click "Book hotel" to be sent to Agoda / Booking.com.',                  th: 'ปัจจุบันแสดงข้อมูลและลิงก์เท่านั้น กดปุ่ม "จองโรงแรม" เพื่อไป Agoda/Booking.com',                                                              ja: '現在は情報とリンクのみです。「予約する」をクリックして Agoda/Booking.com へ移動します。', zh: '目前仅展示信息和链接。点击「预订酒店」前往 Agoda/Booking.com。', ko: '현재는 정보와 링크만 제공합니다. "호텔 예약"을 누르면 Agoda/Booking.com으로 이동합니다.' }) },
      ],
    },
    {
      icon: Bell, color: 'text-accent',
      category: t('faq.cat.notif',   { en: 'Notifications', th: 'การแจ้งเตือน', ja: '通知', zh: '通知', ko: '알림' }),
      items: [
        { q: t('faq.n.q1', { en: 'How many notification types are there?',     th: 'แจ้งเตือนมีกี่ประเภท?',                ja: '通知の種類はいくつ?',          zh: '通知有多少种?',          ko: '알림 유형은 몇 가지인가요?' }),
          a: t('faq.n.a1', { en: '5 types: Event Found, Ticket Held, Payment Required, Booking Confirmed, Reminder.', th: '5 ประเภท: Event Found, Ticket Held, Payment Required, Booking Confirmed, Reminder', ja: '5 種類:Event Found, Ticket Held, Payment Required, Booking Confirmed, Reminder', zh: '5 种:Event Found、Ticket Held、Payment Required、Booking Confirmed、Reminder', ko: '5가지: Event Found, Ticket Held, Payment Required, Booking Confirmed, Reminder' }) },
        { q: t('faq.n.q2', { en: 'Can I sync with Google Calendar?',          th: 'ซิงค์กับ Google Calendar ได้ไหม?',     ja: 'Google Calendar と同期できますか?', zh: '可以同步到 Google Calendar 吗?', ko: 'Google Calendar와 동기화할 수 있나요?' }),
          a: t('faq.n.a2', { en: 'Yes — when a booking is confirmed, it can be added to your calendar automatically.', th: 'ได้ค่ะ เมื่อจองตั๋วสำเร็จ สามารถบันทึกลงปฏิทินอัตโนมัติได้', ja: 'はい — 予約確定時にカレンダーへ自動追加できます。', zh: '可以 — 预订确认时可自动添加到日历。', ko: '예 — 예약 확정 시 캘린더에 자동으로 추가할 수 있습니다.' }) },
      ],
    },
    {
      icon: Zap, color: 'text-amber-400',
      category: t('faq.cat.setup',   { en: 'System Setup', th: 'การตั้งค่าระบบ', ja: 'システム設定', zh: '系统设置', ko: '시스템 설정' }),
      items: [
        { q: t('faq.s.q1', { en: 'Do I need to set up API keys?',                                  th: 'ต้องตั้ง API Keys ไหม?',                         ja: 'API キーを設定する必要がありますか?', zh: '需要设置 API 密钥吗?', ko: 'API 키를 설정해야 하나요?' }),
          a: t('faq.s.a1', { en: 'Yes — go to Admin → API Keys and add OpenRouter / Ollama for AI, and Stripe for payments.', th: 'ใช่ค่ะ ไปที่ Admin → API Keys และเพิ่ม OpenRouter / Ollama สำหรับ AI, Stripe สำหรับการชำระเงิน', ja: 'はい — Admin → API Keys で OpenRouter / Ollama(AI 用)と Stripe(決済用)を追加します。', zh: '需要 — 前往 Admin → API Keys 添加 OpenRouter/Ollama(AI 用)和 Stripe(支付用)。', ko: '예 — Admin → API Keys에서 OpenRouter/Ollama(AI용)와 Stripe(결제용)을 추가하세요.' }) },
        { q: t('faq.s.q2', { en: 'How safe is it?',                                                 th: 'ความปลอดภัยเป็นไง?',                              ja: 'セキュリティはどうですか?',           zh: '安全性如何?',           ko: '보안은 어떤가요?' }),
          a: t('faq.s.a2', { en: 'In Demo mode, API keys are stored in localStorage only. For production, use environment variables / secrets manager.', th: 'ในโหมด Demo API Keys บันทึกใน localStorage เท่านั้น สำหรับ Production ควรใช้ Environment Variables / Secrets Manager', ja: 'デモモードでは API キーは localStorage にのみ保存されます。本番環境では環境変数 / シークレットマネージャーを使ってください。', zh: '在 Demo 模式下,API 密钥仅保存在 localStorage。生产环境请使用环境变量 / 密钥管理服务。', ko: 'Demo 모드에서는 API 키가 localStorage에만 저장됩니다. 프로덕션에서는 환경변수 / 시크릿 매니저를 사용하세요.' }) },
        { q: t('faq.s.q3', { en: 'Can I turn features off?',                                        th: 'สามารถปิดฟีเจอร์ได้ไหม?',                          ja: '機能をオフにできますか?',             zh: '可以关闭功能吗?',      ko: '기능을 끌 수 있나요?' }),
          a: t('faq.s.a3', { en: 'Yes — go to Admin → Feature Flags and toggle any feature on or off.', th: 'ได้ค่ะ ไปที่ Admin → Feature Flags ก็สามารถปิด/เปิดฟีเจอร์ต่าง ๆ ได้', ja: 'はい — Admin → Feature Flags で各機能を有効/無効に切り替えられます。', zh: '可以 — 前往 Admin → Feature Flags 切换功能开关。', ko: '예 — Admin → Feature Flags에서 각 기능을 켜고 끌 수 있습니다.' }) },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          <h1 className="font-syne text-3xl font-bold gradient-text">{t('nav.faqs')}</h1>
        </div>
        <p className="text-muted-foreground">{t('faq.subtitle', { en: 'Answers to common questions about the Agentic AI platform', th: 'ตอบคำถามถึงการใช้งานแพลตฟอร์ม Agentic AI', ja: 'Agentic AI プラットフォームに関するよくある質問', zh: '关于 Agentic AI 平台的常见问题', ko: 'Agentic AI 플랫폼에 관한 자주 묻는 질문' })}</p>
      </motion.div>

      <div className="space-y-8">
        {FAQS.map((category, catIdx) => (
          <motion.div key={category.category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.1 }} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-${category.color}/10 flex items-center justify-center`}>
                <category.icon className={`w-4 h-4 ${category.color}`} />
              </div>
              <h2 className="font-syne font-bold text-lg">{category.category}</h2>
            </div>
            <div className="space-y-2">
              {category.items.map((item, idx) => (
                <FAQItem
                  key={`${category.category}-${idx}`}
                  q={item.q} a={item.a}
                  isOpen={openStates[`${category.category}-${idx}`] || false}
                  onClick={() => toggleFAQ(`${category.category}-${idx}`)}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 border border-border/30 text-center space-y-3 mt-8">
        <p className="text-muted-foreground">{t('faq.contact_prompt', { en: 'Didn’t find what you’re looking for?', th: 'ไม่พบคำตอบหรือมีคำถาม?', ja: 'お探しの内容が見つかりませんか?', zh: '没找到答案?', ko: '원하는 답을 찾지 못하셨나요?' })}</p>
        <a href="mailto:support@agentic.ai" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium">
          {t('faq.contact_us', { en: 'Contact us', th: 'ติดต่อเรา', ja: 'お問い合わせ', zh: '联系我们', ko: '문의하기' })}
        </a>
      </div>
    </div>
  );
}
