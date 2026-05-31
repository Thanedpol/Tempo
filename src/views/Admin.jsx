import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Key, Ticket, Bell, Hotel, Globe, CreditCard, Calendar,
  Database, Eye, EyeOff, Save, Trash2, Plus, CheckCircle,
  AlertTriangle, Zap, Settings, Edit2, X, Music, MapPin, Upload, Trash, RefreshCw, Download,
  Bot, Link2, RotateCcw, Loader2, AlertCircle, Building2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── AI Provider options (backend-driven, single source of truth) ──
const PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter',     hint: 'Multi-model gateway · Llama / GPT / Claude / Gemini' },
  { value: 'openai',     label: 'OpenAI',         hint: 'GPT-4o / GPT-4o-mini / o1' },
  { value: 'anthropic',  label: 'Anthropic',      hint: 'Claude Opus / Sonnet / Haiku' },
  { value: 'gemini',     label: 'Google Gemini',  hint: 'gemini-2.0-flash / 1.5-pro' },
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

// ─── API Key Groups (localStorage — demo only) ─────────────────────
// NOTE: AI provider keys/models live in the "AI" tab (backend + .env),
// so OpenRouter / Ollama are intentionally NOT in this list anymore.
const API_CONFIGS = [
  {
    group: 'Ticket Platforms', icon: Ticket, color: 'text-gold', bg: 'bg-gold/10',
    keys: [
      { id: 'ttm_api_key', label: 'TTM (ThaiTicketMajor) API Key', placeholder: 'ttm_live_...', hint: 'สำหรับดึงข้อมูลคอนเสิร์ตจาก TTM', required: false, link: 'https://www.thaiticketmajor.com' },
      { id: 'ticketmelon_key', label: 'Ticketmelon API Key', placeholder: 'tm_...', hint: 'สำหรับ Ticketmelon integration', required: false, link: 'https://www.ticketmelon.com' },
      { id: 'eventpop_key', label: 'Eventpop API Key', placeholder: 'ep_...', hint: 'สำหรับ Eventpop integration', required: false, link: 'https://www.eventpop.me' },
    ]
  },
  {
    group: 'Payment Gateway', icon: CreditCard, color: 'text-green-400', bg: 'bg-green-400/10',
    keys: [
      { id: 'stripe_key', label: 'Stripe Secret Key', placeholder: 'sk_live_...', hint: 'สำหรับตัดบัตรเครดิตอัตโนมัติ', required: true, link: 'https://dashboard.stripe.com/apikeys' },
      { id: 'stripe_webhook', label: 'Stripe Webhook Secret', placeholder: 'whsec_...', hint: 'สำหรับรับ webhook จาก Stripe', required: false, link: 'https://dashboard.stripe.com/webhooks' },
      { id: 'omise_public', label: 'Omise Public Key (ไทย)', placeholder: 'pkey_...', hint: 'สำหรับ PromptPay / Thai cards', required: false, link: 'https://dashboard.omise.co' },
      { id: 'omise_secret', label: 'Omise Secret Key', placeholder: 'skey_...', hint: 'Omise secret key', required: false, link: 'https://dashboard.omise.co' },
    ]
  },
  {
    group: 'Travel & Hotel', icon: Hotel, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10',
    keys: [
      { id: 'agoda_key', label: 'Agoda Affiliate API Key', placeholder: 'agoda_...', hint: 'สำหรับดึงข้อมูลโรงแรม/คอนโดจาก Agoda', required: false, link: 'https://partners.agoda.com' },
      { id: 'booking_key', label: 'Booking.com Affiliate API Key', placeholder: 'bdc_...', hint: 'สำหรับ Booking.com integration', required: false, link: 'https://www.booking.com/affiliate-program' },
    ]
  },
  {
    group: 'Calendar & Notification', icon: Calendar, color: 'text-accent', bg: 'bg-accent/10',
    keys: [
      { id: 'google_calendar_key', label: 'Google Calendar API Key', placeholder: 'AIza...', hint: 'สำหรับ sync Google Calendar', required: false, link: 'https://console.cloud.google.com' },
      { id: 'google_client_id', label: 'Google OAuth Client ID', placeholder: '*.apps.googleusercontent.com', hint: 'OAuth2 Client ID สำหรับ Google Login', required: false, link: 'https://console.cloud.google.com/apis/credentials' },
      { id: 'firebase_key', label: 'Firebase Web API Key', placeholder: 'AIza...', hint: 'สำหรับ Push Notifications', required: false, link: 'https://console.firebase.google.com' },
    ]
  },
  {
    group: 'RPA & Automation', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10',
    keys: [
      { id: 'browserbase_key', label: 'Browserbase / Playwright API Key', placeholder: 'bb_...', hint: 'สำหรับ RPA auto-queuing system', required: false, link: 'https://www.browserbase.com' },
      { id: 'twocaptcha_key', label: '2Captcha API Key', placeholder: '...', hint: 'สำหรับ fallback CAPTCHA solving', required: false, link: 'https://2captcha.com' },
    ]
  },
  {
    group: 'Custom API (อื่นๆ)', icon: Zap, color: 'text-neon-pink', bg: 'bg-neon-pink/10',
    description: 'ใส่ API Key จากบริการอื่นๆ ที่ไม่ได้อยู่ในรายการข้างต้น',
    keys: [
      { id: 'custom_api_key_1', label: 'Custom API Key #1', placeholder: 'ชื่อบริการ: key_...', hint: 'API Key จากบริการภายนอกที่ต้องการ', required: false, link: '' },
      { id: 'custom_api_key_2', label: 'Custom API Key #2', placeholder: 'ชื่อบริการ: key_...', hint: 'API Key จากบริการภายนอกที่ต้องการ', required: false, link: '' },
      { id: 'custom_api_url_1', label: 'Custom Base URL #1', placeholder: 'https://api.example.com/v1', hint: 'Base URL ของ API endpoint ที่ต้องการเชื่อมต่อ', required: false, link: '' },
      { id: 'custom_api_url_2', label: 'Custom Base URL #2', placeholder: 'https://api.example.com/v1', hint: 'Base URL ของ API endpoint ที่ต้องการเชื่อมต่อ', required: false, link: '' },
    ]
  },
];

// ─── API Key Field (localStorage) ──────────────────────────────────
function ApiKeyField({ config }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`api_${config.id}`);
    if (stored) setValue(stored);
  }, [config.id]);

  const handleSave = () => {
    if (!value.trim()) return;
    localStorage.setItem(`api_${config.id}`, value);
    setSaved(true);
    toast.success(`บันทึก ${config.label} สำเร็จ`);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{config.label}</Label>
        {config.required && <Badge className="text-[10px] bg-destructive/20 text-destructive border-destructive/30">Required</Badge>}
        {value && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-2.5 h-2.5 mr-1" />Set</Badge>}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={config.placeholder}
            className="pr-10 bg-secondary/50 border-border/50 focus:border-primary/50 font-mono text-sm"
          />
          <button onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button onClick={handleSave} disabled={!value.trim()} size="sm" className={saved ? 'bg-green-600 hover:bg-green-600' : ''}>
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{config.hint}</p>
        {config.link && <a href={config.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Get API Key →</a>}
      </div>
    </div>
  );
}

// ─── Mock Events Data ──────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    title: 'Coldplay: Music of the Spheres',
    artist: 'Coldplay',
    venue: 'Rajamangala Stadium',
    city: 'Bangkok',
    date: '2026-12-14',
    genre: 'pop',
    status: 'on_sale',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
    source_platform: 'Ticketmelon',
    zones: [
      { name: 'VIP', price: 8000 },
      { name: 'Standing', price: 3500 },
      { name: 'Seated', price: 2500 },
    ],
  },
  {
    title: 'BLACKPINK World Tour [BORN PINK]',
    artist: 'BLACKPINK',
    venue: 'Impact Arena',
    city: 'Bangkok',
    date: '2026-11-08',
    genre: 'k-pop',
    status: 'on_sale',
    image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&h=300&fit=crop',
    source_platform: 'TTM',
    zones: [
      { name: 'VIP', price: 12000 },
      { name: 'VIP 2', price: 8000 },
      { name: 'Standing', price: 4500 },
    ],
  },
  {
    title: 'SUMMER SONIC BANGKOK 2026',
    artist: 'Various Artists',
    venue: 'Bitec Bangna',
    city: 'Bangkok',
    date: '2026-08-15',
    genre: 'pop',
    status: 'on_sale',
    image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop',
    source_platform: 'Eventpop',
    zones: [
      { name: 'Day Pass', price: 3500 },
      { name: '2-Day Pass', price: 6000 },
    ],
  },
  {
    title: 'EDC Thailand 2026',
    artist: 'Various DJs',
    venue: 'Muang Thong Thani',
    city: 'Bangkok',
    date: '2026-05-16',
    genre: 'electronic',
    status: 'upcoming',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=300&fit=crop',
    source_platform: 'Eventpop',
    zones: [
      { name: 'General Admission', price: 2500 },
      { name: 'VIP', price: 5500 },
    ],
  },
  {
    title: 'Iron Maiden: Legacy of the Beast Tour',
    artist: 'Iron Maiden',
    venue: 'Bangkok International Trade & Exhibition Centre',
    city: 'Bangkok',
    date: '2026-09-22',
    genre: 'metal',
    status: 'upcoming',
    image_url: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&h=300&fit=crop',
    source_platform: 'TTM',
    zones: [
      { name: 'Standing', price: 2000 },
      { name: 'Seated', price: 3500 },
      { name: 'VIP', price: 6000 },
    ],
  },
];

// ─── Event Form ────────────────────────────────────────────────────
const EMPTY_EVENT = { title: '', artist: '', venue: '', city: 'Bangkok', date: '', genre: 'pop', status: 'upcoming', image_url: '', description: '', zones: [] };

function EventForm({ event, onSave, onCancel }) {
  const [form, setForm] = useState(event || EMPTY_EVENT);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('image_url', file_url);
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    } catch (err) {
      toast.error('อัปโหลดรูปภาพล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const addZone = () => {
    const zones = form.zones || [];
    zones.push({ name: '', price: 0 });
    set('zones', [...zones]);
  };

  const removeZone = (idx) => {
    const zones = (form.zones || []).filter((_, i) => i !== idx);
    set('zones', zones);
  };

  const updateZone = (idx, field, value) => {
    const zones = [...(form.zones || [])];
    zones[idx] = { ...zones[idx], [field]: value };
    set('zones', zones);
  };

  return (
    <div className="glass rounded-2xl border border-primary/20 p-5 space-y-4">
      <h3 className="font-syne font-bold text-sm">{event ? 'แก้ไขอีเวนต์' : 'เพิ่มอีเวนต์ใหม่'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ชื่องาน *</Label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="ชื่ออีเวนต์" className="bg-secondary/50 border-border/50 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ศิลปิน *</Label>
          <Input value={form.artist} onChange={e => set('artist', e.target.value)} placeholder="ชื่อศิลปิน" className="bg-secondary/50 border-border/50 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">สถานที่</Label>
          <Input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="สถานที่จัดงาน" className="bg-secondary/50 border-border/50 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">วันที่</Label>
          <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="bg-secondary/50 border-border/50 text-sm" />
        </div>
        <div className="space-y-1 md:col-span-2">
           <Label className="text-xs">รูปภาพ</Label>
           <div className="flex gap-2">
             <div className="flex-1">
               <Input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." className="bg-secondary/50 border-border/50 text-sm" />
             </div>
             <label className="flex items-center">
               <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
               <Button type="button" size="sm" variant="outline" disabled={uploading} className="text-xs">
                 <Upload className="w-3.5 h-3.5 mr-1" />{uploading ? 'กำลังอัป...' : 'อัปโหลด'}
               </Button>
             </label>
           </div>
           {form.image_url && <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-lg object-cover mt-1" />}
         </div>
        <div className="space-y-1">
          <Label className="text-xs">สถานะ</Label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full h-9 rounded-md border border-border/50 bg-secondary/50 px-3 text-sm text-foreground">
            <option value="upcoming">เร็วๆ นี้</option>
            <option value="on_sale">เปิดขาย</option>
            <option value="sold_out">หมดแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
        </div>

        {/* Ticket Zones */}
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">ราคาบัตร (โซน)</Label>
          <Button type="button" size="sm" variant="ghost" onClick={addZone} className="text-xs text-primary">
            <Plus className="w-3 h-3 mr-1" />เพิ่มโซน
          </Button>
        </div>
        {(form.zones || []).map((zone, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                value={zone.name}
                onChange={e => updateZone(idx, 'name', e.target.value)}
                placeholder="ชื่อโซน (VIP, Standing, ...)"
                className="bg-secondary/50 border-border/50 text-sm"
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                value={zone.price}
                onChange={e => updateZone(idx, 'price', parseFloat(e.target.value) || 0)}
                placeholder="ราคา"
                className="bg-secondary/50 border-border/50 text-sm"
              />
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => removeZone(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
              <Trash className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        </div>

        <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}><X className="w-3.5 h-3.5 mr-1" />ยกเลิก</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || !form.artist} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Save className="w-3.5 h-3.5 mr-1" />บันทึก
        </Button>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────
export default function Admin() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [features, setFeatures] = useState({
    auto_queue: true, captcha_forward: true, hotel_search: true,
    calendar_sync: false, push_notif: true, rpa_mode: false,
  });
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discounts, setDiscounts] = useState([]);
  const [hotelName, setHotelName] = useState('');
  const [hotelPrice, setHotelPrice] = useState('');
  const [hotelRating, setHotelRating] = useState('');
  const [hotels, setHotels] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ ttm: null, ticketmelon: null, theconcert: null });
  const [hotelSyncStatus, setHotelSyncStatus] = useState({ agoda: null, booking: null });

  // Stay sub-view: 'hotels' | 'condos'
  const [stayView, setStayView] = useState('hotels');
  const [condoName, setCondoName] = useState('');
  const [condoPrice, setCondoPrice] = useState('');
  const [condoBedrooms, setCondoBedrooms] = useState('');
  const [condos, setCondos] = useState([]);

  // Backend runtime settings (AI / crawler / affiliate / env) — single source of truth
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    base44.entities.Event.list('-created_date', 100)
      .then(setEvents)
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/settings', { credentials: 'include' });
        if (r.ok) setSettings(await r.json());
      } catch { /* settings tab will show a loader */ }
    })();
  }, []);

  // ── Backend settings handlers ──
  const patch = (section, values) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai: settings.ai, crawler: settings.crawler, affiliate: settings.affiliate }),
      });
      if (r.ok) { setSettings(await r.json()); toast.success('บันทึกการตั้งค่าแล้ว'); }
      else toast.error('บันทึกการตั้งค่าล้มเหลว');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveApiKey = async () => {
    if (!settings || !apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: { [settings.ai.provider]: apiKeyInput.trim() } }),
      });
      if (r.ok) { setSettings(await r.json()); setApiKeyInput(''); toast.success('บันทึก API Key แล้ว'); }
      else toast.error('บันทึก API Key ล้มเหลว');
    } finally {
      setSavingKey(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('รีเซ็ตการตั้งค่า AI / Crawler / Affiliate เป็นค่าเริ่มต้น?')) return;
    const r = await fetch('/api/admin/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    if (r.ok) { setSettings(await r.json()); toast.success('รีเซ็ตเรียบร้อย'); }
  };

  const testLlm = async () => {
    if (!settings) return;
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch('/api/admin/test-llm', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settings.ai.provider, model: settings.ai.model }),
      });
      setTestResult(await r.json());
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const clearCache = async () => {
    try {
      const r = await fetch('/api/admin/cache', { method: 'DELETE', credentials: 'include' });
      const data = await r.json();
      if (data.ok) toast.success(data.message || 'ล้างแคชแล้ว');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLoadMockData = async () => {
    try {
      const created = await base44.entities.Event.bulkCreate(MOCK_EVENTS);
      setEvents(prev => [...created, ...prev]);
      toast.success(`เพิ่มข้อมูลจำลอง ${MOCK_EVENTS.length} รายการแล้ว`);
    } catch (err) {
      toast.error('เพิ่มข้อมูลจำลองล้มเหลว');
    }
  };

  const handleSaveEvent = async (form) => {
    if (editingEvent) {
      const updated = await base44.entities.Event.update(editingEvent.id, form);
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      toast.success('อัปเดตอีเวนต์แล้ว');
    } else {
      const created = await base44.entities.Event.create(form);
      setEvents(prev => [created, ...prev]);
      toast.success('เพิ่มอีเวนต์แล้ว');
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (id) => {
    await base44.entities.Event.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success('ลบอีเวนต์แล้ว');
  };

  const handleHotelSync = async (source) => {
    const fnMap = { agoda: 'scrapeAgoda', booking: 'scrapeBookingCom' };
    setHotelSyncStatus(prev => ({ ...prev, [source]: 'loading' }));
    try {
      const res = await base44.functions.invoke(fnMap[source], {});
      const data = res.data;
      if (data.success) {
        setHotelSyncStatus(prev => ({ ...prev, [source]: `✅ ${data.message}` }));
        toast.success(data.message);
      } else {
        setHotelSyncStatus(prev => ({ ...prev, [source]: `⚠️ ${data.message}` }));
        toast.error(data.message);
      }
    } catch (err) {
      setHotelSyncStatus(prev => ({ ...prev, [source]: `❌ ${err.message}` }));
      toast.error(err.message);
    }
  };

  const handleSync = async (source) => {
    const fnMap = { ttm: 'scrapeTTM', ticketmelon: 'scrapeTicketmelon', theconcert: 'scrapeTheConcert' };
    setSyncStatus(prev => ({ ...prev, [source]: 'loading' }));
    try {
      const res = await base44.functions.invoke(fnMap[source], {});
      const data = res.data;
      if (data.success) {
        setSyncStatus(prev => ({ ...prev, [source]: `✅ ${data.message}` }));
        const updated = await base44.entities.Event.list('-created_date', 100);
        setEvents(updated);
        toast.success(data.message);
      } else {
        setSyncStatus(prev => ({ ...prev, [source]: `⚠️ ${data.message}` }));
        toast.error(data.message);
      }
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, [source]: `❌ ${err.message}` }));
      toast.error(err.message);
    }
  };

  const statusMap = {
    on_sale: 'bg-green-500/20 text-green-400',
    upcoming: 'bg-primary/20 text-primary',
    sold_out: 'bg-destructive/20 text-destructive',
    cancelled: 'bg-secondary text-muted-foreground',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">จัดการระบบ, อีเวนต์, แพลตฟอร์ม และ API Keys</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetSettings} disabled={!settings} className="border-border/50">
            <RotateCcw className="w-4 h-4 mr-1.5" />รีเซ็ต
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={!settings || savingSettings} className="bg-gradient-to-r from-primary to-accent">
            {savingSettings ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}บันทึก
          </Button>
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">Admin Only</Badge>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-3">
        ปุ่ม “บันทึก / รีเซ็ต” ด้านบนใช้กับแท็บ <b>AI</b>, <b>Tickets & Concerts</b> (auto-sync) และ <b>Affiliate</b> ที่เก็บค่าฝั่ง backend — แท็บอื่นบันทึกทันทีในตัว
      </p>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
          <TabsTrigger value="events" className="gap-1.5"><Music className="w-3.5 h-3.5" />Events</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Ticket className="w-3.5 h-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5"><Download className="w-3.5 h-3.5" />Tickets & Concerts</TabsTrigger>
          <TabsTrigger value="stay" className="gap-1.5"><Hotel className="w-3.5 h-3.5" />Stay</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Bot className="w-3.5 h-3.5" />AI</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><Key className="w-3.5 h-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5"><Settings className="w-3.5 h-3.5" />System</TabsTrigger>
        </TabsList>

        {/* ── Events Tab ── */}
        <TabsContent value="events" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{events.length} อีเวนต์ในระบบ</p>
            <Button
              size="sm"
              onClick={() => { setEditingEvent(null); setShowForm(true); }}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />เพิ่มอีเวนต์
            </Button>
          </div>

          {showForm && (
            <EventForm
              event={editingEvent}
              onSave={handleSaveEvent}
              onCancel={() => { setShowForm(false); setEditingEvent(null); }}
            />
          )}

          {events.length === 0 && !showForm && (
            <div className="glass rounded-2xl border border-primary/30 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">ยังไม่มีอีเวนต์ในระบบ</p>
              <Button size="sm" onClick={handleLoadMockData} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />เพิ่มข้อมูลจำลอง
              </Button>
            </div>
          )}

          {loadingEvents ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="glass rounded-xl h-16 shimmer" />)}</div>
          ) : events.length === 0 ? null : (
            <div className="space-y-2">
              {events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-light rounded-2xl p-4 border border-border/30 flex items-center gap-3"
                >
                  {event.image_url && (
                    <img src={event.image_url} alt={event.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{event.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{event.artist}</span>
                      {event.venue && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{event.venue}</span>}
                      {event.date && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{event.date}</span>}
                    </div>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 ${statusMap[event.status] || 'bg-secondary text-muted-foreground'}`}>
                    {event.status}
                  </Badge>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => { setEditingEvent(event); setShowForm(true); setActiveTab('events'); }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Discounts Tab ── */}
        <TabsContent value="discounts" className="mt-5 space-y-4">
          <div className="glass rounded-2xl border border-primary/20 p-5 space-y-4">
            <h3 className="font-syne font-bold text-sm">เพิ่มโค้ดส่วนลด</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">รหัสโค้ด</Label>
                <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="เช่น SUMMER2026" className="bg-secondary/50 border-border/50 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ส่วนลด (%)</Label>
                <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="0-100" className="bg-secondary/50 border-border/50 text-sm" />
              </div>
              <div className="flex items-end">
                <Button onClick={() => {
                  if (discountCode && discountPercent) {
                    setDiscounts([...discounts, { code: discountCode, percent: parseFloat(discountPercent) }]);
                    setDiscountCode('');
                    setDiscountPercent('');
                    toast.success('เพิ่มโค้ดส่วนลดแล้ว');
                  }
                }} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="w-3.5 h-3.5 mr-1" />เพิ่ม
                </Button>
              </div>
            </div>
          </div>
          {discounts.length > 0 && (
            <div className="space-y-2">
              {discounts.map((d, i) => (
                <div key={i} className="glass-light rounded-2xl p-4 border border-border/30 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{d.code}</div>
                    <div className="text-xs text-muted-foreground">ส่วนลด {d.percent}%</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setDiscounts(discounts.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tickets & Concerts Tab ── */}
        <TabsContent value="tickets" className="mt-5 space-y-4">
          <div className="glass-light rounded-2xl p-4 border border-neon-cyan/20 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neon-cyan">แพลตฟอร์มตั๋ว & คอนเสิร์ต — ดึงข้อมูลอัตโนมัติ</p>
              <p className="text-xs text-muted-foreground mt-0.5">ใช้ AI ดึงข้อมูลคอนเสิร์ตจากเว็บไซต์จำหน่ายบัตรหลักในไทย แล้วเพิ่มเข้าระบบอัตโนมัติ (ใช้เวลา ~30 วินาที)</p>
            </div>
          </div>

          {/* Sync now — base44 scrapers */}
          {[
            {
              key: 'ttm',
              label: 'ThaiTicketMajor (TTM)',
              desc: 'ดึงคอนเสิร์ตและอีเวนต์จาก thaiticketmajor.com',
              url: 'https://www.thaiticketmajor.com',
              color: 'text-gold',
              bg: 'bg-gold/10',
              border: 'border-gold/20',
              btnClass: 'border-gold/30 text-gold hover:bg-gold/10',
            },
            {
              key: 'ticketmelon',
              label: 'Ticketmelon',
              desc: 'ดึงคอนเสิร์ตและอีเวนต์จาก ticketmelon.com',
              url: 'https://www.ticketmelon.com',
              color: 'text-green-400',
              bg: 'bg-green-400/10',
              border: 'border-green-400/20',
              btnClass: 'border-green-400/30 text-green-400 hover:bg-green-400/10',
            },
            {
              key: 'theconcert',
              label: 'TheConcert.com',
              desc: 'ดึงคอนเสิร์ตและอีเวนต์จาก theconcert.com',
              url: 'https://www.theconcert.com/concert',
              color: 'text-neon-cyan',
              bg: 'bg-neon-cyan/10',
              border: 'border-neon-cyan/20',
              btnClass: 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10',
            },
          ].map((src) => (
            <div key={src.key} className={`glass rounded-2xl border ${src.border} p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${src.bg} flex items-center justify-center`}>
                    <Globe className={`w-4 h-4 ${src.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{src.label}</div>
                    <div className="text-xs text-muted-foreground">{src.desc}</div>
                  </div>
                </div>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline hidden sm:block">
                  {src.url.replace('https://', '')} →
                </a>
              </div>

              {syncStatus[src.key] && syncStatus[src.key] !== 'loading' && (
                <div className="glass-light rounded-xl px-3 py-2 text-xs text-muted-foreground">
                  {syncStatus[src.key]}
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                disabled={syncStatus[src.key] === 'loading'}
                onClick={() => handleSync(src.key)}
                className={`w-full ${src.btnClass}`}
              >
                {syncStatus[src.key] === 'loading' ? (
                  <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />กำลัง Sync...</>
                ) : (
                  <><Download className="w-3.5 h-3.5 mr-2" />Sync {src.label}</>
                )}
              </Button>
            </div>
          ))}

          {/* Auto-sync schedule — backend settings */}
          {settings ? (
            <SectionCard icon={RefreshCw} title="ตั้งเวลา Auto-sync" desc="รีเฟรชข้อมูลอีเวนต์อัตโนมัติตามช่วงเวลา (เก็บค่าฝั่ง backend — กด “บันทึก” ด้านบน)">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>ช่วงเวลา sync</Label>
                  <Select value={String(settings.crawler.autoSyncMinutes)} onValueChange={v => patch('crawler', { autoSyncMinutes: parseInt(v, 10) })}>
                    <SelectTrigger className="bg-secondary/30 mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">ปิด (manual)</SelectItem>
                      <SelectItem value="10">10 นาที</SelectItem>
                      <SelectItem value="30">30 นาที</SelectItem>
                      <SelectItem value="60">1 ชั่วโมง</SelectItem>
                      <SelectItem value="360">6 ชั่วโมง</SelectItem>
                      <SelectItem value="1440">24 ชั่วโมง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cache TTL (นาที)</Label>
                  <Input type="number" min={1} max={1440} value={settings.crawler.cacheTtlMinutes}
                    onChange={e => patch('crawler', { cacheTtlMinutes: parseInt(e.target.value || '0', 10) })}
                    className="bg-secondary/30 mt-1.5 font-mono text-xs" />
                </div>
                <div>
                  <Label>จำนวนสูงสุด/source</Label>
                  <Input type="number" min={10} max={500} value={settings.crawler.maxPerSource}
                    onChange={e => patch('crawler', { maxPerSource: parseInt(e.target.value || '0', 10) })}
                    className="bg-secondary/30 mt-1.5 font-mono text-xs" />
                </div>
              </div>
              <div>
                <Label>กรองเมือง (คั่นด้วย “,” ว่าง = ทุกเมือง)</Label>
                <Input value={settings.crawler.cityFilter.join(', ')}
                  onChange={e => patch('crawler', { cityFilter: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="bg-secondary/30 mt-1.5 text-xs" placeholder="Bangkok, Chiang Mai, Phuket" />
              </div>
            </SectionCard>
          ) : <SettingsLoader />}
        </TabsContent>

        {/* ── Stay Tab (Hotels / Condos) ── */}
        <TabsContent value="stay" className="mt-5 space-y-4">
          {/* Two buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={stayView === 'hotels' ? 'default' : 'outline'}
              onClick={() => setStayView('hotels')}
              className={stayView === 'hotels' ? 'bg-gradient-to-r from-primary to-accent' : 'border-border/50'}
            >
              <Hotel className="w-3.5 h-3.5 mr-1.5" />โรงแรม
            </Button>
            <Button
              size="sm"
              variant={stayView === 'condos' ? 'default' : 'outline'}
              onClick={() => setStayView('condos')}
              className={stayView === 'condos' ? 'bg-gradient-to-r from-primary to-accent' : 'border-border/50'}
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />คอนโด
            </Button>
          </div>

          {/* Hotels view */}
          {stayView === 'hotels' && (
            <div className="space-y-4">
              <div className="glass-light rounded-2xl p-4 border border-neon-cyan/20 flex items-start gap-3">
                <Hotel className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neon-cyan">Sync โรงแรมจากแพลตฟอร์มภายนอก</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">ใช้ AI ดึงข้อมูลโรงแรมในกรุงเทพฯ จาก Agoda และ Booking.com เข้าระบบอัตโนมัติ</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'agoda', label: 'Agoda', url: 'https://www.agoda.com', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', btnClass: 'border-red-400/30 text-red-400 hover:bg-red-400/10' },
                      { key: 'booking', label: 'Booking.com', url: 'https://www.booking.com', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', btnClass: 'border-blue-400/30 text-blue-400 hover:bg-blue-400/10' },
                    ].map((src) => (
                      <div key={src.key} className={`glass rounded-xl border ${src.border} p-3 space-y-2`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${src.bg} flex items-center justify-center`}>
                            <Globe className={`w-3.5 h-3.5 ${src.color}`} />
                          </div>
                          <span className="text-sm font-medium">{src.label}</span>
                        </div>
                        {hotelSyncStatus[src.key] && hotelSyncStatus[src.key] !== 'loading' && (
                          <div className="text-xs text-muted-foreground px-2 py-1 glass-light rounded-lg">
                            {hotelSyncStatus[src.key]}
                          </div>
                        )}
                        <Button size="sm" variant="outline" disabled={hotelSyncStatus[src.key] === 'loading'} onClick={() => handleHotelSync(src.key)} className={`w-full text-xs ${src.btnClass}`}>
                          {hotelSyncStatus[src.key] === 'loading' ? (
                            <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />กำลัง Sync...</>
                          ) : (
                            <><Download className="w-3 h-3 mr-1.5" />Sync {src.label}</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl border border-primary/20 p-5 space-y-4">
                <h3 className="font-syne font-bold text-sm">เพิ่มโรงแรม</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อโรงแรม</Label>
                    <Input value={hotelName} onChange={e => setHotelName(e.target.value)} placeholder="ชื่อโรงแรม" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ราคาต่อคืน (บาท)</Label>
                    <Input type="number" value={hotelPrice} onChange={e => setHotelPrice(e.target.value)} placeholder="0" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">คะแนน (1-5)</Label>
                    <Input type="number" value={hotelRating} onChange={e => setHotelRating(e.target.value)} placeholder="4.5" min="1" max="5" step="0.1" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                </div>
                <Button onClick={() => {
                  if (hotelName && hotelPrice && hotelRating) {
                    setHotels([...hotels, { name: hotelName, price_per_night: parseFloat(hotelPrice), rating: parseFloat(hotelRating) }]);
                    setHotelName('');
                    setHotelPrice('');
                    setHotelRating('');
                    toast.success('เพิ่มโรงแรมแล้ว');
                  }
                }} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="w-3.5 h-3.5 mr-1" />เพิ่มโรงแรม
                </Button>
              </div>
              {hotels.length > 0 && (
                <div className="space-y-2">
                  {hotels.map((h, i) => (
                    <div key={i} className="glass-light rounded-2xl p-4 border border-border/30 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{h.name}</div>
                        <div className="text-xs text-muted-foreground">฿{h.price_per_night.toLocaleString()}/คืน ⭐ {h.rating}</div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setHotels(hotels.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Condos view */}
          {stayView === 'condos' && (
            <div className="space-y-4">
              <div className="glass-light rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Sync คอนโด/ที่พักรายวัน — เร็ว ๆ นี้</p>
                  <p className="text-xs text-muted-foreground mt-0.5">การดึงข้อมูลคอนโดอัตโนมัติจากแพลตฟอร์มภายนอก (เช่น Agoda Homes, Airbnb) กำลังอยู่ระหว่างพัฒนา — ตอนนี้เพิ่มเองได้ด้านล่าง</p>
                </div>
              </div>

              <div className="glass rounded-2xl border border-primary/20 p-5 space-y-4">
                <h3 className="font-syne font-bold text-sm">เพิ่มคอนโด</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อคอนโด</Label>
                    <Input value={condoName} onChange={e => setCondoName(e.target.value)} placeholder="ชื่อคอนโด/โครงการ" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ราคาต่อคืน (บาท)</Label>
                    <Input type="number" value={condoPrice} onChange={e => setCondoPrice(e.target.value)} placeholder="0" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">จำนวนห้องนอน</Label>
                    <Input type="number" value={condoBedrooms} onChange={e => setCondoBedrooms(e.target.value)} placeholder="1" min="0" max="10" step="1" className="bg-secondary/50 border-border/50 text-sm" />
                  </div>
                </div>
                <Button onClick={() => {
                  if (condoName && condoPrice) {
                    setCondos([...condos, { name: condoName, price_per_night: parseFloat(condoPrice), bedrooms: parseInt(condoBedrooms || '0', 10) }]);
                    setCondoName('');
                    setCondoPrice('');
                    setCondoBedrooms('');
                    toast.success('เพิ่มคอนโดแล้ว');
                  }
                }} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="w-3.5 h-3.5 mr-1" />เพิ่มคอนโด
                </Button>
              </div>
              {condos.length > 0 && (
                <div className="space-y-2">
                  {condos.map((c, i) => (
                    <div key={i} className="glass-light rounded-2xl p-4 border border-border/30 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">฿{c.price_per_night.toLocaleString()}/คืน · {c.bedrooms} ห้องนอน</div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setCondos(condos.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── AI Tab (backend — single source of truth) ── */}
        <TabsContent value="ai" className="mt-5 space-y-5">
          {settings ? (
            <>
              <SectionCard icon={Bot} title="AI Provider" desc="เลือก LLM ที่ขับเคลื่อนแชต assistant — เก็บค่าฝั่ง backend ที่เดียว (กด “บันทึก” ด้านบน)">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>ผู้ให้บริการ</Label>
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
                    <Label>โมเดล</Label>
                    <Input value={settings.ai.model} onChange={e => patch('ai', { model: e.target.value })}
                      className="bg-secondary/30 mt-1.5 font-mono text-xs" list="model-suggestions" />
                    <datalist id="model-suggestions">
                      {(POPULAR_MODELS[settings.ai.provider] || []).map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                </div>

                {settings.ai.provider === 'ollama' && (
                  <div>
                    <Label>Ollama Base URL</Label>
                    <Input value={settings.ai.ollamaUrl} onChange={e => patch('ai', { ollamaUrl: e.target.value })}
                      className="bg-secondary/30 mt-1.5 font-mono text-xs" placeholder="http://localhost:11434" />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Temperature<span className="ml-2 text-muted-foreground font-mono">{settings.ai.temperature.toFixed(2)}</span></Label>
                    <Slider value={[settings.ai.temperature]} min={0} max={2} step={0.05}
                      onValueChange={v => patch('ai', { temperature: v[0] })} className="mt-3" />
                  </div>
                  <div>
                    <Label>Max tokens</Label>
                    <Input type="number" min={256} max={8192} step={64} value={settings.ai.maxTokens}
                      onChange={e => patch('ai', { maxTokens: parseInt(e.target.value || '0', 10) })}
                      className="bg-secondary/30 mt-1.5 font-mono text-xs" />
                  </div>
                </div>

                <div>
                  <Label>System prompt (เพิ่มเติม)</Label>
                  <Textarea rows={4} value={settings.ai.systemPrompt}
                    onChange={e => patch('ai', { systemPrompt: e.target.value })}
                    placeholder="You are a helpful concert assistant…"
                    className="bg-secondary/30 mt-1.5 text-xs font-mono" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button size="sm" variant="outline" onClick={testLlm} disabled={testing} className="border-primary/30 text-primary">
                    {testing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
                    {testing ? 'กำลังทดสอบ…' : 'ทดสอบการเชื่อมต่อ'}
                  </Button>
                  {testResult && <TestPill r={testResult} />}
                </div>

                {/* Editable API key for the selected provider — saved to backend runtime */}
                {(() => {
                  const ENV_NAME = { openrouter: 'OPENROUTER_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY' };
                  const envName = ENV_NAME[settings.ai.provider];
                  if (!envName) return null; // ollama needs no key
                  const isSet = !!settings.env?.[envName];
                  return (
                    <div className="space-y-1.5 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">{envName}</Label>
                        {isSet
                          ? <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-2.5 h-2.5 mr-1" />ตั้งค่าแล้ว</Badge>
                          : <Badge className="text-[10px] bg-destructive/20 text-destructive border-destructive/30">ยังไม่ตั้งค่า</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKey ? 'text' : 'password'}
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                            placeholder={settings.ai.provider === 'openrouter' ? 'sk-or-v1-...' : 'วาง API key ที่นี่'}
                            className="pr-10 bg-secondary/30 border-border/50 font-mono text-sm"
                          />
                          <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button size="sm" onClick={saveApiKey} disabled={!apiKeyInput.trim() || savingKey} className="bg-gradient-to-r from-primary to-accent">
                          {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        วาง key แล้วกดบันทึกเพื่อใช้งานทันที (ไม่ต้อง redeploy) · เพื่อความถาวร แนะนำตั้ง <span className="font-mono">{envName}</span> ใน Vercel env ด้วย
                      </p>
                    </div>
                  );
                })()}
              </SectionCard>

              <SectionCard icon={ShieldCheck} title="API Keys (อ่านอย่างเดียว)" desc="กรอกใน .env.local / Vercel env แล้ว restart — หรือใช้ช่องด้านบนกรอกชั่วคราว">
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <KeyStatus label="OPENROUTER_API_KEY" value={settings.env.OPENROUTER_API_KEY} />
                  <KeyStatus label="OPENAI_API_KEY"     value={settings.env.OPENAI_API_KEY} />
                  <KeyStatus label="ANTHROPIC_API_KEY"  value={settings.env.ANTHROPIC_API_KEY} />
                  <KeyStatus label="GEMINI_API_KEY"     value={settings.env.GEMINI_API_KEY} />
                </div>
              </SectionCard>
            </>
          ) : <SettingsLoader />}
        </TabsContent>

        {/* ── API Keys Tab (localStorage — non-AI) ── */}
        <TabsContent value="api" className="space-y-5 mt-5">
          <div className="glass-light rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">หมายเหตุด้านความปลอดภัย</p>
              <p className="text-xs text-muted-foreground mt-0.5">API Keys เหล่านี้ถูกบันทึกใน localStorage สำหรับ demo · คีย์ AI (OpenRouter/OpenAI/Anthropic/Gemini) ย้ายไปจัดการที่แท็บ <b>AI</b> + ไฟล์ .env แล้ว · ในระบบ Production ควรใช้ Secrets Manager หรือ Environment Variables บน Backend เท่านั้น</p>
            </div>
          </div>
          {API_CONFIGS.map((group) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl border border-border/30 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${group.bg} flex items-center justify-center`}>
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-sm">{group.group}</h3>
                  {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                </div>
                <Badge className="text-[10px] bg-secondary text-muted-foreground ml-auto">{group.keys.length} keys</Badge>
              </div>
              <div className="p-5 space-y-5">
                {group.keys.map(k => <ApiKeyField key={k.id} config={k} />)}
              </div>
            </motion.div>
          ))}

          {/* Affiliate IDs — backend */}
          {settings ? (
            <SectionCard icon={Link2} title="Affiliate IDs" desc="ลิงก์ออกจะแนบโค้ดติดตามอัตโนมัติ — เก็บค่าฝั่ง backend (กด “บันทึก” ด้านบน)">
              <AffiliateField label="Agoda CID" commission="3-7%" signupUrl="https://partners.agoda.com"
                value={settings.affiliate.agodaCid} onChange={v => patch('affiliate', { agodaCid: v })}
                preview={settings.affiliate.agodaCid && `https://www.agoda.com/...?cid=${settings.affiliate.agodaCid}`} />
              <AffiliateField label="Booking.com AID" commission="~4%" signupUrl="https://www.booking.com/affiliate-program/v2/index.html"
                value={settings.affiliate.bookingAid} onChange={v => patch('affiliate', { bookingAid: v })}
                preview={settings.affiliate.bookingAid && `https://www.booking.com/...?aid=${settings.affiliate.bookingAid}`} />
              <AffiliateField label="Klook AID" commission="3-5%" signupUrl="https://affiliate.klook.com"
                value={settings.affiliate.klookAid} onChange={v => patch('affiliate', { klookAid: v })}
                preview={settings.affiliate.klookAid && `https://www.klook.com/...?aid=${settings.affiliate.klookAid}`} />
            </SectionCard>
          ) : <SettingsLoader />}
        </TabsContent>

        {/* ── System Tab ── */}
        <TabsContent value="system" className="mt-5 space-y-5">
          {settings ? (
            <>
              <SectionCard icon={ShieldCheck} title="การยืนยันตัวตน" desc="สถานะอ่านอย่างเดียวจาก .env.local">
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <KeyStatus label="DEV_BYPASS_AUTH" value={settings.env.DEV_BYPASS_AUTH ? 'ON (fake admin)' : 'OFF (real Supabase auth)'} good={!settings.env.DEV_BYPASS_AUTH} />
                  <KeyStatus label="NEXT_PUBLIC_SUPABASE_URL" value={settings.env.SUPABASE_URL ? 'configured' : null} />
                  <KeyStatus label="NEXT_PUBLIC_SUPABASE_ANON_KEY" value={settings.env.SUPABASE_ANON_KEY ? 'configured' : null} />
                  <KeyStatus label="SUPABASE_SERVICE_ROLE_KEY" value={settings.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : null} />
                </div>
              </SectionCard>

              <SectionCard icon={Trash2} title="แคช" desc="หน่วยความจำใน process ล้างแล้วจะดึงใหม่">
                <Button size="sm" variant="outline" onClick={clearCache} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1.5" />ล้างแคชทั้งหมด
                </Button>
              </SectionCard>
            </>
          ) : <SettingsLoader />}

          {/* Feature Flags */}
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h3 className="font-syne font-bold">Feature Flags & System Config</h3>
              <p className="text-xs text-muted-foreground mt-1">เปิด/ปิดฟีเจอร์ต่าง ๆ ของระบบ</p>
            </div>
            <div className="divide-y divide-border/30">
              {[
                { id: 'auto_queue', icon: Zap, label: 'Auto Queue System', desc: 'ให้ AI ต่อคิวซื้อตั๋วอัตโนมัติทันทีที่เปิดขาย (เร็ว ๆ นี้)', color: 'text-primary' },
                { id: 'captcha_forward', icon: AlertTriangle, label: 'CAPTCHA Human-in-the-loop', desc: 'ส่ง CAPTCHA ให้มนุษย์แก้เมื่อระบบตรวจจับได้ (เร็ว ๆ นี้)', color: 'text-amber-400' },
                { id: 'hotel_search', icon: Hotel, label: 'Hotel Auto-Search', desc: 'ค้นหาโรงแรมใกล้สถานที่จัดงานอัตโนมัติ (เร็ว ๆ นี้)', color: 'text-neon-cyan' },
                { id: 'calendar_sync', icon: Calendar, label: 'Google Calendar Sync', desc: 'ซิงค์อีเวนต์ที่จองลงปฏิทินอัตโนมัติ (เร็ว ๆ นี้)', color: 'text-green-400' },
                { id: 'push_notif', icon: Bell, label: 'Push Notifications', desc: 'แจ้งเตือนเมื่อ AI พบงานใหม่หรือตั๋วใกล้หมด (เร็ว ๆ นี้)', color: 'text-accent' },
                { id: 'rpa_mode', icon: Globe, label: 'RPA Automation Mode', desc: 'เปิด headless browser สำหรับ auto-booking (เร็ว ๆ นี้)', color: 'text-amber-400' },
              ].map((f) => (
                <div key={f.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                    <div>
                      <div className="text-sm font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground">{f.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={features[f.id]}
                    onCheckedChange={(v) => { setFeatures(prev => ({ ...prev, [f.id]: v })); toast.success(`${f.label}: ${v ? 'เปิด' : 'ปิด'}`); }}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================== sub-components

function SettingsLoader() {
  return (
    <div className="glass rounded-2xl border border-border/30 p-8 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="ml-2 text-sm text-muted-foreground">กำลังโหลดการตั้งค่า…</span>
    </div>
  );
}

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
        <span className="truncate max-w-[20ch]">"{(r.response || '').trim()}"</span>
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
