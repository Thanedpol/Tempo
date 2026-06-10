import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Loader2, Bot, User, Zap, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AIMessage from './AIMessage';
import { useI18n } from '@/lib/I18nContext';

const SUGGESTIONS_BY_LANG = {
  en: [
    'Book BTS concert tickets end of year, VIP zone, with hotel',
    'Find a rock gig in Bangkok, budget 3,000 THB',
    'K-POP concert tickets next week, standing zone',
    'Electronic events next month, recommend nearby hotels',
  ],
  th: [
    'จองตั๋วคอนเสิร์ต BTS ปลายปีนี้ โซน VIP พร้อมโรงแรม',
    'หางานดนตรีร็อคในกรุงเทพ งบ 3,000 บาท',
    'ตั๋วคอนเสิร์ต K-POP สัปดาห์หน้า โซนยืน',
    'อีเวนต์ Electronic เดือนหน้า แนะนำโรงแรมใกล้ๆ',
  ],
  ja: [
    '年末の BTS コンサートチケットを VIP 席で、ホテル付きで予約',
    'バンコクのロックライブを探す、予算 3,000 バーツ',
    '来週の K-POP コンサート、スタンディング席',
    '来月のエレクトロニックイベント、近くのホテルもおすすめ',
  ],
  zh: [
    '帮我预订年底 BTS 演唱会 VIP 票 + 酒店',
    '在曼谷找摇滚演出,预算 3000 泰铢',
    '下周的 K-POP 演唱会站票',
    '下个月的电子音乐活动,推荐附近的酒店',
  ],
  ko: [
    '연말 BTS 콘서트 VIP 티켓과 호텔 같이 예약해줘',
    '방콕에서 록 공연 찾기, 예산 3,000 바트',
    '다음 주 K-POP 콘서트 스탠딩 티켓',
    '다음 달 일렉트로닉 이벤트, 근처 호텔도 추천해줘',
  ],
};

const WELCOME_BY_LANG = {
  en: 'Hi! I’m the **Agentic AI Entertain Assistant** 🎵\n\nI can help you find concerts, compare ticket options, and suggest places to stay. _(Demo: results are samples — booking & payment aren’t live yet.)_\n\nTry something like *"Find end-of-year rock concert tickets, standing, ~5,000 THB, with a nearby hotel"*',
  th: 'สวัสดีครับ! ผมคือ **Agentic AI Entertain Assistant** 🎵\n\nผมช่วยคุณค้นหาคอนเสิร์ต เปรียบเทียบตัวเลือกตั๋ว และแนะนำที่พักได้ _(โหมดสาธิต: ผลลัพธ์เป็นตัวอย่าง ยังจอง/จ่ายเงินจริงไม่ได้)_\n\nลองพิมพ์เช่น *"หาตั๋ววงร็อคสากลปลายปี โซนยืน งบ 5,000 พร้อมโรงแรมใกล้ๆ"*',
  ja: 'こんにちは!**Agentic AI エンターテインメントアシスタント** 🎵 です\n\nコンサート検索、チケット予約、宿泊先まで一括でサポートします。\n\n例:*「年末の海外ロックバンド、スタンディング、5,000 バーツ、近くのホテル付きで予約」*',
  zh: '你好!我是 **Agentic AI 娱乐助手** 🎵\n\n我可以为你查找音乐会、预订门票并找到合适的住宿,一站搞定。\n\n试试 *「帮我预订年底国际摇滚演唱会站票,预算 5,000 泰铢,附近酒店一起」*',
  ko: '안녕하세요! 저는 **Agentic AI 엔터테인먼트 어시스턴트** 🎵 입니다\n\n콘서트 검색, 티켓 예매, 숙박까지 한 번에 도와드려요.\n\n예: *"연말 해외 록밴드 콘서트, 스탠딩, 5,000 바트 예산, 근처 호텔과 함께 예약해줘"*',
};

export default function ChatInterface({ sessionId, onSessionUpdate }) {
  const { t, lang } = useI18n();
  const SUGGESTIONS = SUGGESTIONS_BY_LANG[lang] || SUGGESTIONS_BY_LANG.en;
  const WELCOME = WELCOME_BY_LANG[lang] || WELCOME_BY_LANG.en;

  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: WELCOME, type: 'greeting', timestamp: new Date().toISOString() }
  ]);

  // Keep the welcome message in sync with language changes (only when the user hasn't sent anything yet).
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], content: WELCOME }];
      }
      return prev;
    });
  }, [WELCOME]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const lastUserMessageRef = useRef('');
  const abortControllerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const message = text || input.trim();
    if (!message || isProcessing) return;

    setInput('');
    lastUserMessageRef.current = message;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    // Add thinking message
    const thinkingId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '',
      type: 'thinking',
      timestamp: new Date().toISOString(),
    }]);

    try {
       const langName = ({ en: 'English', th: 'Thai', ja: 'Japanese', zh: 'Simplified Chinese', ko: 'Korean' })[lang] || 'English';
       const prompt = `You are the Agentic AI Entertain Assistant — a smart concierge for concert tickets and entertainment events in Thailand.

    IMPORTANT: The user's UI language is **${langName}**. Write the "response" field and any human-readable text values (titles, artist names, venue notes) in ${langName}.

    User message: "${message}"


    Analyze the message and reply with JSON in this exact shape:
    {
    "response": "A friendly reply in ${langName} explaining what you will do next",
    "action": "search_events | hold_ticket | find_hotel | confirm_payment | set_reminder | general",
    "parameters": {
    "genre": "ประเภทเพลง (ถ้ามี)",
    "budget": ตัวเลขงบประมาณ (ถ้ามี),
    "zone": "โซน (ถ้ามี)",
    "date_preference": "ช่วงเวลา (ถ้ามี)",
    "need_hotel": true/false,
    "quantity": จำนวนตั๋ว
    },
    "mock_events": [
    {
      "title": "ชื่อคอนเสิร์ต",
      "artist": "ชื่อศิลปิน",
      "venue": "สถานที่",
      "date": "วันที่",
      "price": ราคา,
      "zone": "โซน",
      "available": จำนวนที่นั่งว่าง,
      "platform": "TTM/Ticketmelon/Eventpop",
      "image_url": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
    }
    ],
    "mock_hotels": [
    {
      "name": "ชื่อโรงแรม",
      "price_per_night": ราคา,
      "rating": คะแนน,
      "distance": "ระยะทาง"
    }
    ],
    "needs_captcha": false,
    "needs_payment_confirm": false,
    "status": "processing | found | waiting_user | completed"
    }

    สร้างข้อมูลตัวอย่างที่เหมาะสม 2-3 รายการสำหรับการค้นหาและแนะนำ ตอบเป็น JSON เท่านั้น`;

       // AI config mirrored from Admin → AI tab (carried per-request because backend
       // runtime state isn't shared across serverless instances).
       const keys = {};
       ['openrouter', 'openai', 'anthropic', 'gemini', 'poe'].forEach(p => {
         const k = localStorage.getItem('ai_key_' + p);
         if (k) keys[p] = k;
       });
       const provider = localStorage.getItem('ai_provider') || undefined;
       const model = localStorage.getItem('ai_model') || undefined;
       const system = localStorage.getItem('ai_system_prompt') || undefined;
       const ollamaUrl = localStorage.getItem('api_ollama_url') || undefined;

       // Routes to whichever provider the admin configured (OpenRouter/OpenAI/Anthropic/Gemini/Ollama)
       const response = await base44.functions.invoke('chat', {
         prompt,
         provider,
         model,
         system,
         keys,
         ollamaUrl,
         response_json_schema: {
           type: "object",
           properties: {
             response: { type: "string" },
             action: { type: "string" },
             parameters: { type: "object" },
             mock_events: { type: "array" },
             mock_hotels: { type: "array" },
             needs_captcha: { type: "boolean" },
             needs_payment_confirm: { type: "boolean" },
             status: { type: "string" }
           }
         }
       });

      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      const responseData = response.data?.response || response.response;
      const aiMsg = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseData?.response || t('ai.processing', { en: 'Processing…', th: 'กำลังดำเนินการ...', ja: '処理中…', zh: '处理中…', ko: '처리 중…' }),
        type: responseData?.action || 'general',
        data: responseData,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);

      // Create notification if relevant
      if (responseData?.mock_events?.length > 0) {
        await base44.entities.Notification.create({
          title:   t('ai.notif.events_title',   { en: '🎵 Matching events found!', th: '🎵 พบอีเวนต์ที่ตรงสเปค!', ja: '🎵 一致するイベントが見つかりました!', zh: '🎵 找到匹配的活动!', ko: '🎵 일치하는 이벤트 발견!' }),
          message: t('ai.notif.events_message', { en: `AI found ${responseData.mock_events.length} events matching your request`, th: `AI พบ ${responseData.mock_events.length} งาน ตรงกับที่คุณต้องการ`, ja: `AI がご要望に合うイベントを ${responseData.mock_events.length} 件見つけました`, zh: `AI 找到 ${responseData.mock_events.length} 个符合您要求的活动`, ko: `AI가 요청에 맞는 이벤트 ${responseData.mock_events.length}개를 찾았습니다` }),
          type: 'event_found',
          is_read: false,
          priority: 'high',
        }).catch(() => {});
      }

      if (onSessionUpdate) onSessionUpdate(responseData);

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('ai.stopped', { en: 'Stopped.', th: 'หยุดการดำเนินการแล้วครับ', ja: '停止しました。', zh: '已停止。', ko: '중지되었습니다.' }),
          type: 'general',
          timestamp: new Date().toISOString(),
        }]);
      } else {
        console.error('API Error:', error);
        const errorMsg = error?.message || t('ai.error', { en: 'Sorry, something went wrong. Please try again.', th: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งครับ', ja: '申し訳ありません、エラーが発生しました。もう一度お試しください。', zh: '抱歉,出错了。请重试。', ko: '죄송합니다, 오류가 발생했습니다. 다시 시도해 주세요.' });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMsg,
          type: 'error',
          timestamp: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setMessages(prev => prev.filter(m => m.type !== 'thinking'));
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('ai.stopped', { en: 'Stopped.', th: 'หยุดการดำเนินการแล้วครับ', ja: '停止しました。', zh: '已停止。', ko: '중지되었습니다.' }),
      type: 'general',
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages — inner wrapper uses min-h-full + justify-end so a single
          welcome message naturally sits next to the input instead of
          floating at the top with a huge empty area below. */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="min-h-full flex flex-col justify-end p-4 md:p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AIMessage
                  message={msg}
                  onAction={(text) => {
                    if (!text) {
                      handleSend(lastUserMessageRef.current);
                    } else {
                      handleSend(text);
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 md:px-6 pb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">💡 {t('ai.try_asking', { en: 'Try asking:', th: 'ลองถามแบบนี้:', ja: 'こう聞いてみて:', zh: '试着这样问:', ko: '이렇게 물어보세요:' })}</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 glass-light rounded-full text-primary hover:bg-primary/20 transition-colors border border-primary/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-border/50">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.input_placeholder', { en: 'Type a command, e.g. "Book K-POP concert tickets, VIP zone, 5,000 THB budget…"', th: 'พิมพ์คำสั่ง เช่น "จองตั๋วคอนเสิร์ต K-POP โซน VIP งบ 5,000 บาท..."', ja: 'コマンドを入力(例:「K-POP コンサート VIP 席、予算 5,000 バーツ…」)', zh: '输入指令,例如「订 K-POP 演唱会 VIP 票,预算 5,000 泰铢…」', ko: '명령 입력 (예: "K-POP 콘서트 VIP 5,000 바트 예산…")' })}
              className="resize-none bg-secondary/50 border-border/50 focus:border-primary/50 rounded-2xl pr-12 min-h-[52px] max-h-32 text-sm"
              rows={1}
              disabled={isProcessing}
            />
            <div className="absolute right-3 bottom-3 text-muted-foreground">
              <Mic className="w-4 h-4 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          {isProcessing ? (
            <Button
              onClick={handleStop}
              className="rounded-2xl w-[52px] h-[52px] bg-destructive hover:bg-destructive/80 flex-shrink-0"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="rounded-2xl w-[52px] h-[52px] bg-gradient-to-br from-primary to-accent hover:opacity-90 glow-primary flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {t('ai.agentic_note', { en: 'AI searches & recommends automatically · Demo — no real booking/payment yet', th: 'AI ค้นหาและแนะนำให้อัตโนมัติ · โหมดสาธิต — ยังไม่จอง/จ่ายเงินจริง', ja: 'AI が自動で検索・提案 · デモ — 実際の予約・決済はまだ', zh: 'AI 自动搜索与推荐 · 演示 — 暂不进行真实预订/付款', ko: 'AI 자동 검색·추천 · 데모 — 실제 예약/결제 미지원' })}
          </span>
          <span className="hidden sm:inline text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1 text-muted-foreground/70">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-[10px] font-mono">↵</kbd>
            <span>{t('ai.kbd.send', { en: 'send', th: 'ส่ง', ja: '送信', zh: '发送', ko: '보내기' })}</span>
            <span className="text-muted-foreground/40">·</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-[10px] font-mono">⇧↵</kbd>
            <span>{t('ai.kbd.newline', { en: 'new line', th: 'ขึ้นบรรทัด', ja: '改行', zh: '换行', ko: '줄바꿈' })}</span>
          </span>
        </div>
      </div>
    </div>
  );
}