import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, Database, Link2, ShieldCheck, RefreshCw, Trash2,
  Check, X, AlertCircle, Loader2, Eye, EyeOff, Save, RotateCcw, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';

// ---------------------------------------------------------------------- data
const PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter',  hint: 'Multi-model gateway · Llama / GPT / Claude / Gemini' },
  { value: 'openai',     label: 'OpenAI',      hint: 'GPT-4o / GPT-4o-mini / o1' },
  { value: 'anthropic',  label: 'Anthropic',   hint: 'Claude Opus / Sonnet / Haiku' },
  { value: 'gemini',     label: 'Google Gemini', hint: 'gemini-2.0-flash / 1.5-pro' },
  { value: 'ollama',     label: 'Ollama (local)', hint: 'Self-hosted · llama3.2 / qwen2.5' },
];

const POPULAR_MODELS = {
  openrouter: [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'qwen/qwen-2.5-72b-instruct:free',
  ],
  openai:    ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini'],
  anthropic: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  gemini:    ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  ollama:    ['llama3.2', 'llama3.1', 'qwen2.5', 'mistral'],
};

const SOURCES = [
  { id: 'ticketmelon',     label: 'Ticketmelon',     type: 'events', status: 'live',    note: 'Public API · no key needed' },
  { id: 'thaiticketmajor', label: 'Thai Ticket Major', type: 'events', status: 'stub',   note: 'Playwright scraper (not implemented)' },
  { id: 'eventpop',        label: 'Eventpop',        type: 'events', status: 'stub',    note: 'Needs partner API or JSON-LD scrape' },
  { id: 'agoda',           label: 'Agoda Hotels',    type: 'hotels', status: 'stub',    note: 'Needs Agoda Partner approval' },
  { id: 'bookingcom',      label: 'Booking.com',     type: 'hotels', status: 'stub',    note: 'Needs Demand API approval' },
];

// ----------------------------------------------------------------- component
export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [settings, setSettings]   = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);
  const [testing,  setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncing,  setSyncing]    = useState(null);    // source id being synced
  const [syncResult, setSyncResult] = useState(null);
  const [toast,    setToast]      = useState(null);

  // Redirect non-admin
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  // Load
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/settings', { credentials: 'include' });
      if (r.ok) setSettings(await r.json());
      setLoading(false);
    })();
  }, []);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  // ------------------------------------------- handlers
  const patch = (section, values) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));
  };
  const patchSource = (id, enabled) => {
    setSettings(prev => ({
      ...prev,
      crawler: { ...prev.crawler, enabledSources: { ...prev.crawler.enabledSources, [id]: enabled } },
    }));
  };

  const save = async () => {
    setSaving(true);
    const r = await fetch('/api/admin/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai: settings.ai, crawler: settings.crawler, affiliate: settings.affiliate }),
    });
    setSaving(false);
    if (r.ok) { setSettings(await r.json()); showToast(t('settings.saved', { en: 'Settings saved', th: 'บันทึกการตั้งค่าแล้ว', ja: '設定を保存しました', zh: '设置已保存', ko: '설정이 저장되었습니다' })); }
    else      { showToast('Save failed', 'error'); }
  };

  const reset = async () => {
    if (!confirm(t('settings.reset_confirm', { en: 'Reset all settings to defaults?', th: 'รีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น?', ja: 'すべての設定を初期値に戻しますか?', zh: '将所有设置重置为默认值?', ko: '모든 설정을 기본값으로 초기화하시겠습니까?' }))) return;
    const r = await fetch('/api/admin/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    if (r.ok) { setSettings(await r.json()); showToast(t('settings.reset_done', { en: 'Reset to defaults', th: 'รีเซ็ตเรียบร้อย', ja: '初期値に戻しました', zh: '已重置', ko: '초기화됨' })); }
  };

  const testLlm = async () => {
    setTesting(true); setTestResult(null);
    const r = await fetch('/api/admin/test-llm', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: settings.ai.provider, model: settings.ai.model }),
    });
    const data = await r.json();
    setTesting(false);
    setTestResult(data);
  };

  const syncSource = async (id) => {
    setSyncing(id); setSyncResult(null);
    const r = await fetch('/api/admin/sync', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: id }),
    });
    const data = await r.json();
    setSyncing(null);
    setSyncResult({ id, ...data });
    if (data.ok) showToast(t('settings.sync_ok', { en: `Synced ${data.count} items in ${data.latencyMs}ms`, th: `ดึงข้อมูล ${data.count} รายการ ใน ${data.latencyMs}ms`, ja: `${data.count}件を${data.latencyMs}msで同期`, zh: `已同步 ${data.count} 项,用时 ${data.latencyMs}ms`, ko: `${data.count}개를 ${data.latencyMs}ms에 동기화` }));
    else            showToast(data.error || 'Sync failed', 'error');
  };

  const clearCache = async () => {
    const r = await fetch('/api/admin/cache', { method: 'DELETE', credentials: 'include' });
    const data = await r.json();
    if (data.ok) showToast(data.message);
  };

  if (loading || !settings) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // -------------------------------------------------------------- UI
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">
            {t('settings.title', { en: 'Settings', th: 'การตั้งค่า', ja: '設定', zh: '设置', ko: '설정' })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('settings.subtitle', { en: 'Configure AI, crawlers, affiliates, and system.', th: 'ตั้งค่า AI, crawler, affiliate และระบบ', ja: 'AI・クローラー・アフィリエイト・システムの設定', zh: '配置 AI、爬虫、联盟与系统', ko: 'AI · 크롤러 · 어필리에이트 · 시스템 설정' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="border-border/50">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            {t('settings.reset', { en: 'Reset', th: 'รีเซ็ต', ja: 'リセット', zh: '重置', ko: '재설정' })}
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-accent">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {t('settings.save', { en: 'Save', th: 'บันทึก', ja: '保存', zh: '保存', ko: '저장' })}
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`glass rounded-xl p-3 border flex items-center gap-2 text-sm ${
          toast.kind === 'error' ? 'border-destructive/40 text-destructive' : 'border-green-500/40 text-green-400'
        }`}>
          {toast.kind === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="ai">
            <Bot className="w-4 h-4 mr-1.5" />
            {t('settings.tab.ai', { en: 'AI Provider', th: 'AI Provider', ja: 'AI プロバイダー', zh: 'AI 提供商', ko: 'AI 제공자' })}
          </TabsTrigger>
          <TabsTrigger value="crawler">
            <Database className="w-4 h-4 mr-1.5" />
            {t('settings.tab.crawler', { en: 'Crawler', th: 'Crawler', ja: 'クローラー', zh: '爬虫', ko: '크롤러' })}
          </TabsTrigger>
          <TabsTrigger value="affiliate">
            <Link2 className="w-4 h-4 mr-1.5" />
            {t('settings.tab.affiliate', { en: 'Affiliate', th: 'Affiliate', ja: 'アフィリエイト', zh: '联盟', ko: '어필리에이트' })}
          </TabsTrigger>
          <TabsTrigger value="system">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {t('settings.tab.system', { en: 'System', th: 'ระบบ', ja: 'システム', zh: '系统', ko: '시스템' })}
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== AI */}
        <TabsContent value="ai" className="space-y-5">
          <SectionCard
            icon={Bot}
            title={t('settings.ai.title', { en: 'AI Provider', th: 'AI Provider', ja: 'AI プロバイダー', zh: 'AI 提供商', ko: 'AI 제공자' })}
            desc={t('settings.ai.desc', { en: 'Choose which LLM powers the chat assistant.', th: 'เลือก LLM ที่ขับเคลื่อนแชต assistant', ja: 'チャット用 LLM を選択', zh: '选择驱动聊天的 LLM', ko: '챗봇 LLM 선택' })}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('settings.ai.provider', { en: 'Provider', th: 'ผู้ให้บริการ', ja: 'プロバイダー', zh: '提供商', ko: '제공자' })}</Label>
                <Select value={settings.ai.provider} onValueChange={v => patch('ai', { provider: v, model: POPULAR_MODELS[v]?.[0] || '' })}>
                  <SelectTrigger className="bg-secondary/30 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('settings.ai.model', { en: 'Model', th: 'โมเดล', ja: 'モデル', zh: '模型', ko: '모델' })}</Label>
                <Input value={settings.ai.model} onChange={e => patch('ai', { model: e.target.value })}
                  className="bg-secondary/30 mt-1.5 font-mono text-xs" list="model-suggestions" />
                <datalist id="model-suggestions">
                  {(POPULAR_MODELS[settings.ai.provider] || []).map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            {settings.ai.provider === 'ollama' && (
              <div>
                <Label>{t('settings.ai.ollama_url', { en: 'Ollama Base URL', th: 'Ollama Base URL', ja: 'Ollama ベース URL', zh: 'Ollama 基础 URL', ko: 'Ollama 기본 URL' })}</Label>
                <Input value={settings.ai.ollamaUrl} onChange={e => patch('ai', { ollamaUrl: e.target.value })}
                  className="bg-secondary/30 mt-1.5 font-mono text-xs" placeholder="http://localhost:11434" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>
                  {t('settings.ai.temp', { en: 'Temperature', th: 'Temperature', ja: '温度', zh: '温度', ko: '온도' })}
                  <span className="ml-2 text-muted-foreground font-mono">{settings.ai.temperature.toFixed(2)}</span>
                </Label>
                <Slider value={[settings.ai.temperature]} min={0} max={2} step={0.05}
                  onValueChange={v => patch('ai', { temperature: v[0] })} className="mt-3" />
              </div>
              <div>
                <Label>{t('settings.ai.max_tokens', { en: 'Max tokens', th: 'Max tokens', ja: '最大トークン', zh: '最大 token', ko: '최대 토큰' })}</Label>
                <Input type="number" min={256} max={8192} step={64} value={settings.ai.maxTokens}
                  onChange={e => patch('ai', { maxTokens: parseInt(e.target.value || '0', 10) })}
                  className="bg-secondary/30 mt-1.5 font-mono text-xs" />
              </div>
            </div>

            <div>
              <Label>{t('settings.ai.sys_prompt', { en: 'System prompt (optional override)', th: 'System prompt (เพิ่มเติม)', ja: 'システムプロンプト(オプション)', zh: 'System prompt(可选覆盖)', ko: '시스템 프롬프트(선택)' })}</Label>
              <Textarea rows={4} value={settings.ai.systemPrompt}
                onChange={e => patch('ai', { systemPrompt: e.target.value })}
                placeholder="You are a helpful concert assistant…"
                className="bg-secondary/30 mt-1.5 text-xs font-mono" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={testLlm} disabled={testing}
                className="border-primary/30 text-primary">
                {testing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
                {testing
                  ? t('settings.testing', { en: 'Testing…', th: 'กำลังทดสอบ…', ja: 'テスト中…', zh: '测试中…', ko: '테스트 중…' })
                  : t('settings.test_connection', { en: 'Test connection', th: 'ทดสอบการเชื่อมต่อ', ja: '接続テスト', zh: '测试连接', ko: '연결 테스트' })}
              </Button>
              {testResult && <TestPill r={testResult} />}
            </div>
          </SectionCard>

          {/* Env key status */}
          <SectionCard
            icon={ShieldCheck}
            title={t('settings.ai.keys_title', { en: 'API Keys (read-only)', th: 'API Keys (อ่านอย่างเดียว)', ja: 'API キー(読み取り専用)', zh: 'API 密钥(只读)', ko: 'API 키(읽기 전용)' })}
            desc={t('settings.ai.keys_desc', { en: 'Set these in .env.local then restart the server.', th: 'กรอกใน .env.local แล้ว restart server', ja: '.env.local に設定後、サーバーを再起動してください', zh: '在 .env.local 中设置后重启服务器', ko: '.env.local에 설정 후 서버 재시작' })}
          >
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <KeyStatus label="OPENROUTER_API_KEY"  value={settings.env.OPENROUTER_API_KEY} />
              <KeyStatus label="OPENAI_API_KEY"      value={settings.env.OPENAI_API_KEY} />
              <KeyStatus label="ANTHROPIC_API_KEY"   value={settings.env.ANTHROPIC_API_KEY} />
              <KeyStatus label="GEMINI_API_KEY"      value={settings.env.GEMINI_API_KEY} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========================================================= CRAWLER */}
        <TabsContent value="crawler" className="space-y-5">
          <SectionCard
            icon={Database}
            title={t('settings.crawler.sources', { en: 'Data Sources', th: 'แหล่งข้อมูล', ja: 'データソース', zh: '数据来源', ko: '데이터 소스' })}
            desc={t('settings.crawler.sources_desc', { en: 'Toggle which sites to sync. Manual sync button on each.', th: 'เปิด/ปิดเว็บที่จะดึงข้อมูล กดปุ่ม Sync เพื่อดึงทันที', ja: '同期するサイトを切り替え。各サイトの「Sync」で手動同期', zh: '切换要同步的网站,点击 Sync 立即同步', ko: '동기화할 사이트 켜기/끄기, Sync 버튼으로 즉시 동기화' })}
          >
            <div className="space-y-2">
              {SOURCES.map(s => {
                const enabled = !!settings.crawler.enabledSources[s.id];
                return (
                  <div key={s.id} className="glass-light rounded-xl p-3 flex items-center gap-3 border border-border/30">
                    <Switch checked={enabled} onCheckedChange={(v) => patchSource(s.id, v)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.label}</span>
                        <Badge className={`text-[10px] ${s.status === 'live' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                          {s.status === 'live' ? 'LIVE' : 'STUB'}
                        </Badge>
                        <Badge className="text-[10px] bg-secondary text-muted-foreground">{s.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.note}</div>
                    </div>
                    <Button size="sm" variant="outline" disabled={!enabled || syncing === s.id || s.status !== 'live'}
                      onClick={() => syncSource(s.id)}
                      className="border-border/50 text-xs">
                      {syncing === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                      {syncing === s.id ? '…' : 'Sync'}
                    </Button>
                  </div>
                );
              })}
              {syncResult && (
                <div className={`text-xs px-3 py-2 rounded-lg ${syncResult.ok ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                  {syncResult.ok
                    ? `✓ ${syncResult.source}: ${syncResult.count} items · ${syncResult.latencyMs}ms`
                    : `✗ ${syncResult.source}: ${syncResult.error}`}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={RefreshCw}
            title={t('settings.crawler.schedule', { en: 'Auto-sync', th: 'ตั้งเวลา Auto-sync', ja: '自動同期', zh: '自动同步', ko: '자동 동기화' })}
            desc={t('settings.crawler.schedule_desc', { en: 'Refresh data automatically at this interval.', th: 'รีเฟรชข้อมูลอัตโนมัติตามช่วงเวลา', ja: '指定間隔で自動更新', zh: '按间隔自动刷新数据', ko: '지정된 간격으로 자동 갱신' })}
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>{t('settings.crawler.interval', { en: 'Sync interval', th: 'ช่วงเวลา sync', ja: '同期間隔', zh: '同步间隔', ko: '동기화 간격' })}</Label>
                <Select value={String(settings.crawler.autoSyncMinutes)} onValueChange={v => patch('crawler', { autoSyncMinutes: parseInt(v, 10) })}>
                  <SelectTrigger className="bg-secondary/30 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off (manual)</SelectItem>
                    <SelectItem value="10">10 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('settings.crawler.cache_ttl', { en: 'Cache TTL (min)', th: 'Cache TTL (นาที)', ja: 'キャッシュ TTL(分)', zh: '缓存 TTL(分钟)', ko: '캐시 TTL(분)' })}</Label>
                <Input type="number" min={1} max={1440} value={settings.crawler.cacheTtlMinutes}
                  onChange={e => patch('crawler', { cacheTtlMinutes: parseInt(e.target.value || '0', 10) })}
                  className="bg-secondary/30 mt-1.5 font-mono text-xs" />
              </div>
              <div>
                <Label>{t('settings.crawler.max', { en: 'Max items / source', th: 'จำนวนสูงสุด/source', ja: '最大件数 / ソース', zh: '每个来源最大数', ko: '소스당 최대 항목' })}</Label>
                <Input type="number" min={10} max={500} value={settings.crawler.maxPerSource}
                  onChange={e => patch('crawler', { maxPerSource: parseInt(e.target.value || '0', 10) })}
                  className="bg-secondary/30 mt-1.5 font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label>{t('settings.crawler.cities', { en: 'City filter (comma-separated, empty = all)', th: 'กรองเมือง (คั่นด้วย ลูกน้ำ, ว่าง = ทุกเมือง)', ja: '都市フィルター(カンマ区切り、空白=すべて)', zh: '城市筛选(逗号分隔,留空=全部)', ko: '도시 필터(쉼표 구분, 비우면 모두)' })}</Label>
              <Input value={settings.crawler.cityFilter.join(', ')}
                onChange={e => patch('crawler', { cityFilter: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                className="bg-secondary/30 mt-1.5 text-xs" placeholder="Bangkok, Chiang Mai, Phuket" />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ======================================================= AFFILIATE */}
        <TabsContent value="affiliate" className="space-y-5">
          <SectionCard
            icon={Link2}
            title={t('settings.aff.title', { en: 'Affiliate IDs', th: 'Affiliate IDs', ja: 'アフィリエイト ID', zh: '联盟 ID', ko: '어필리에이트 ID' })}
            desc={t('settings.aff.desc', { en: 'Outbound links auto-append these tracking codes.', th: 'ลิงก์ออกจะแนบโค้ดติดตามอัตโนมัติ', ja: '外部リンクに自動でトラッキングコードを追加', zh: '外链将自动附加追踪代码', ko: '외부 링크에 자동으로 추적 코드 추가' })}
          >
            <div className="space-y-4">
              <AffiliateField
                label="Agoda CID"
                value={settings.affiliate.agodaCid}
                onChange={v => patch('affiliate', { agodaCid: v })}
                signupUrl="https://partners.agoda.com"
                preview={settings.affiliate.agodaCid && `https://www.agoda.com/...?cid=${settings.affiliate.agodaCid}`}
                commission="3-7%"
              />
              <AffiliateField
                label="Booking.com AID"
                value={settings.affiliate.bookingAid}
                onChange={v => patch('affiliate', { bookingAid: v })}
                signupUrl="https://www.booking.com/affiliate-program/v2/index.html"
                preview={settings.affiliate.bookingAid && `https://www.booking.com/...?aid=${settings.affiliate.bookingAid}`}
                commission="~4%"
              />
              <AffiliateField
                label="Klook AID"
                value={settings.affiliate.klookAid}
                onChange={v => patch('affiliate', { klookAid: v })}
                signupUrl="https://affiliate.klook.com"
                preview={settings.affiliate.klookAid && `https://www.klook.com/...?aid=${settings.affiliate.klookAid}`}
                commission="3-5%"
              />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ========================================================== SYSTEM */}
        <TabsContent value="system" className="space-y-5">
          <SectionCard
            icon={ShieldCheck}
            title={t('settings.sys.auth', { en: 'Authentication', th: 'การยืนยันตัวตน', ja: '認証', zh: '认证', ko: '인증' })}
            desc={t('settings.sys.auth_desc', { en: 'Read-only status from .env.local.', th: 'สถานะอ่านอย่างเดียวจาก .env.local', ja: '.env.local からの読み取り専用ステータス', zh: '从 .env.local 读取的只读状态', ko: '.env.local에서 읽기 전용 상태' })}
          >
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <KeyStatus label="DEV_BYPASS_AUTH"           value={settings.env.DEV_BYPASS_AUTH ? 'ON (fake admin)' : 'OFF (real Supabase auth)'} good={!settings.env.DEV_BYPASS_AUTH} />
              <KeyStatus label="NEXT_PUBLIC_SUPABASE_URL"  value={settings.env.SUPABASE_URL ? 'configured' : null} />
              <KeyStatus label="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={settings.env.SUPABASE_ANON_KEY ? 'configured' : null} />
              <KeyStatus label="SUPABASE_SERVICE_ROLE_KEY" value={settings.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : null} />
            </div>
          </SectionCard>

          <SectionCard
            icon={Trash2}
            title={t('settings.sys.cache', { en: 'Cache', th: 'แคช', ja: 'キャッシュ', zh: '缓存', ko: '캐시' })}
            desc={t('settings.sys.cache_desc', { en: 'In-process data store. Clearing forces a fresh fetch.', th: 'หน่วยความจำใน process ล้างแล้วจะดึงใหม่', ja: 'プロセス内ストア。クリアすると再取得', zh: '进程内存储,清除后会重新获取', ko: '프로세스 내 저장소. 비우면 다시 가져옴' })}
          >
            <Button size="sm" variant="outline" onClick={clearCache} className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1.5" />
              {t('settings.sys.clear_cache', { en: 'Clear all caches', th: 'ล้างแคชทั้งหมด', ja: 'すべてのキャッシュを削除', zh: '清除所有缓存', ko: '모든 캐시 지우기' })}
            </Button>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================== sub-components

function SectionCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="glass rounded-2xl p-5 border border-border/30 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <Separator className="bg-border/30" />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function KeyStatus({ label, value, good }) {
  const ok = good !== undefined ? good : !!value;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/20">
      {ok
        ? <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        : <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
      <span className="text-xs font-mono text-muted-foreground truncate">{label}</span>
      <span className={`text-xs ml-auto ${ok ? 'text-green-400' : 'text-amber-400'} truncate font-mono`}>
        {value || 'not set'}
      </span>
    </div>
  );
}

function TestPill({ r }) {
  if (r.ok) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-1.5">
        <Check className="w-3.5 h-3.5" />
        <span className="font-mono">{r.latencyMs}ms</span>
        <span className="text-muted-foreground">·</span>
        <span className="truncate max-w-[20ch]">"{r.response.trim()}"</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5 max-w-md">
      <X className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{r.error}</span>
    </div>
  );
}

function AffiliateField({ label, value, onChange, signupUrl, preview, commission }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label} <Badge className="ml-1 text-[10px] bg-gold/10 text-gold border-gold/20">~{commission}</Badge></Label>
        <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
          Sign up ↗
        </a>
      </div>
      <div className="flex gap-2 mt-1.5">
        <Input type={show ? 'text' : 'password'} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="paste your ID here…" className="bg-secondary/30 font-mono text-xs flex-1" />
        <Button size="icon" variant="outline" onClick={() => setShow(!show)} className="border-border/50">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
      {preview && (
        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono truncate">→ {preview}</p>
      )}
    </div>
  );
}
