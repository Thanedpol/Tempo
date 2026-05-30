import { useState } from 'react';
import { Sparkles, Zap, Shield, Clock } from 'lucide-react';
import ChatInterface from '@/components/ai/ChatInterface';
import { useI18n } from '@/lib/I18nContext';

export default function AIAssistant() {
  const { t } = useI18n();
  const [sessionId] = useState(() => 'session-' + Date.now());

  const features = [
    { icon: Zap,    label: t('ai.feat.auto_queue',  { en: 'Auto Queue',     th: 'ต่อคิวอัตโนมัติ',           ja: '自動キューイング',     zh: '自动排队',            ko: '자동 대기열' }),       desc: t('ai.feat.auto_queue_d',  { en: 'Auto-queue for tickets (soon)',  th: 'ต่อคิวซื้อตั๋วอัตโนมัติ (เร็ว ๆ นี้)',   ja: 'チケット購入を自動で並ぶ(近日)',  zh: '自动排队购票(即将推出)',         ko: '자동으로 티켓 줄서기 (출시 예정)' }),  color: 'text-primary' },
    { icon: Shield, label: t('ai.feat.captcha',     { en: 'CAPTCHA Assist', th: 'ช่วยจัดการ CAPTCHA',            ja: 'CAPTCHA 補助',         zh: 'CAPTCHA 协助',         ko: 'CAPTCHA 지원' }),     desc: t('ai.feat.captcha_d',     { en: 'Notify when human is needed', th: 'แจ้งเตือนเมื่อต้องการมนุษย์', ja: '人手が必要なときに通知', zh: '需要人工时通知', ko: '사람이 필요할 때 알림' }), color: 'text-amber-400' },
    { icon: Clock,  label: t('ai.feat.realtime',    { en: 'Real-time',      th: 'เรียลไทม์',                   ja: 'リアルタイム',         zh: '实时',                  ko: '실시간' }),             desc: t('ai.feat.realtime_d',    { en: 'Track status live',       th: 'ติดตามสถานะแบบ Live',     ja: 'ステータスをライブ追跡', zh: '实时跟踪状态',         ko: '실시간 상태 추적' }),     color: 'text-neon-cyan' },
  ];

  return (
    <div className="flex flex-col h-screen lg:h-screen max-h-screen">
      {/* Two-row header on narrow desktop so the title doesn't get squeezed by feature chips */}
      <div className="glass border-b border-border/50 px-6 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 xl:gap-6 flex-shrink-0">
        {/* Row 1 — Brand + status (always on one line) */}
        <div className="flex items-center justify-between xl:justify-start gap-3 xl:flex-1 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-syne font-bold text-lg gradient-text truncate">
                {t('ai.title', { en: 'AI Entertain Assistant', th: 'AI Entertain Assistant', ja: 'AI エンターテインメントアシスタント', zh: 'AI 娱乐助手', ko: 'AI 엔터테인먼트 어시스턴트' })}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {t('ai.subtitle', { en: 'Smart assistant for tickets and stays', th: 'ผู้ช่วยอัจฉริยะจองตั๋วและที่พัก', ja: 'チケットと宿泊のスマートアシスタント', zh: '票务和住宿的智能助手', ko: '티켓과 숙박을 위한 스마트 어시스턴트' })}
              </p>
            </div>
          </div>
          {/* Status pill — stays on row 1 next to brand */}
          <span className="flex items-center gap-1.5 text-xs text-green-400 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t('ai.online', { en: 'AI Online', th: 'AI ออนไลน์', ja: 'AI オンライン', zh: 'AI 在线', ko: 'AI 온라인' })}
          </span>
        </div>

        {/* Row 2 — Feature chips (own row on lg, inline on xl+). Hidden on small screens. */}
        <div className="hidden md:flex items-center gap-5 xl:gap-6 xl:flex-shrink-0">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <f.icon className={`w-4 h-4 ${f.color} flex-shrink-0`} />
              <div>
                <div className="font-medium text-foreground leading-tight">{f.label}</div>
                <div className="text-muted-foreground leading-tight">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface sessionId={sessionId} />
      </div>
    </div>
  );
}
