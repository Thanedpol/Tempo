import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Key, Ticket, Bell, Hotel, Globe, CreditCard, Calendar,
  Database, Activity, Eye, EyeOff, Save, Trash2, Plus, CheckCircle,
  AlertTriangle, Zap, Settings, Edit2, X, Music, MapPin, Upload, Trash, RefreshCw, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ModelPicker from '@/components/admin/ModelPicker';

// ─── API Key Groups ────────────────────────────────────────────────
const API_CONFIGS = [
  {
    group: 'OpenRouter', icon: Globe, color: 'text-primary', bg: 'bg-primary/10',
    description: 'เชื่อมต่อโมเดล AI หลายร้อยตัวผ่าน API เดียว',
    keys: [
      { id: 'openrouter_key', label: 'OpenRouter API Key', placeholder: 'sk-or-v1-...', hint: 'ใช้สำหรับ AI Assistant, Event Search และ Auto-booking', required: true, link: 'https://openrouter.ai/keys' },
      { id: 'openrouter_model', label: 'Default Model', placeholder: 'openai/gpt-4o-mini', hint: 'โมเดลเริ่มต้น เช่น openai/gpt-4o, anthropic/claude-3.5-sonnet', required: false, link: 'https://openrouter.ai/models' },
    ]
  },
  {
    group: 'Ollama (Local LLM)', icon: Database, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10',
    description: 'รันโมเดล AI บนเครื่องตัวเองแบบ Private',
    keys: [
      { id: 'ollama_url', label: 'Ollama Base URL', placeholder: 'http://localhost:11434', hint: 'URL ของ Ollama server', required: false, link: 'https://ollama.com' },
      { id: 'ollama_model', label: 'Ollama Model Name', placeholder: 'llama3.2', hint: 'เช่น llama3.2, mistral, gemma2, qwen2.5', required: false, link: 'https://ollama.com/library' },
    ]
  },
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
      { id: 'agoda_key', label: 'Agoda Affiliate API Key', placeholder: 'agoda_...', hint: 'สำหรับดึงข้อมูลโรงแรมจาก Agoda', required: false, link: 'https://partners.agoda.com' },
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

// ─── API Key Field ─────────────────────────────────────────────────
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

  if (config.id === 'openrouter_model' || config.id === 'ollama_model') {
    const isOllama = config.id === 'ollama_model';
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{config.label}</Label>
          {value && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-2.5 h-2.5 mr-1" />Set</Badge>}
        </div>
        <ModelPicker
          value={value || (isOllama ? 'ollama/llama3.2' : 'openai/gpt-4o-mini')}
          onChange={(v) => { setValue(v); localStorage.setItem(`api_${config.id}`, v); toast.success(`เลือกโมเดล: ${v}`); }}
          filterPrefix={isOllama ? 'ollama/' : null}
        />
        <p className="text-xs text-muted-foreground">{config.hint}</p>
      </div>
    );
  }

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
        <a href={config.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Get API Key →</a>
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

  useEffect(() => {
    base44.entities.Event.list('-created_date', 100)
      .then(setEvents)
      .finally(() => setLoadingEvents(false));
  }, []);

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
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">จัดการระบบ, อีเวนต์ และ API Keys</p>
        </div>
        <Badge className="ml-auto bg-destructive/20 text-destructive border-destructive/30">Admin Only</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
          <TabsTrigger value="events" className="gap-1.5"><Music className="w-3.5 h-3.5" />Events</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Ticket className="w-3.5 h-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="hotels" className="gap-1.5"><Hotel className="w-3.5 h-3.5" />Hotels</TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5"><Key className="w-3.5 h-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="sync" className="gap-1.5"><Download className="w-3.5 h-3.5" />Sync Events</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><Settings className="w-3.5 h-3.5" />Feature Flags</TabsTrigger>
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

        {/* ── Hotels Tab ── */}
        <TabsContent value="hotels" className="mt-5 space-y-4">
          {/* Hotel Sync Buttons */}
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
        </TabsContent>

        {/* ── API Keys Tab ── */}
        <TabsContent value="api" className="space-y-5 mt-5">
          <div className="glass-light rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">หมายเหตุด้านความปลอดภัย</p>
              <p className="text-xs text-muted-foreground mt-0.5">API Keys ถูกบันทึกใน localStorage สำหรับ demo นี้ ในระบบ Production ควรใช้ Secrets Manager หรือ Environment Variables บน Backend เท่านั้น</p>
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
        </TabsContent>

        {/* ── Sync Events Tab ── */}
        <TabsContent value="sync" className="mt-5 space-y-4">
          <div className="glass-light rounded-2xl p-4 border border-neon-cyan/20 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neon-cyan">Web Scraping — ดึงข้อมูลอีเวนต์อัตโนมัติ</p>
              <p className="text-xs text-muted-foreground mt-0.5">ใช้ AI ดึงข้อมูลคอนเสิร์ตจากเว็บไซต์จำหน่ายบัตรหลักในไทย แล้วเพิ่มเข้าระบบอัตโนมัติ (ใช้เวลา ~30 วินาที)</p>
            </div>
          </div>

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
        </TabsContent>

        {/* ── Feature Flags Tab ── */}
        <TabsContent value="features" className="mt-5">
          <div className="glass rounded-2xl border border-border/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h3 className="font-syne font-bold">Feature Flags & System Config</h3>
              <p className="text-xs text-muted-foreground mt-1">เปิด/ปิดฟีเจอร์ต่าง ๆ ของระบบ</p>
            </div>
            <div className="divide-y divide-border/30">
              {[
                { id: 'auto_queue', icon: Zap, label: 'Auto Queue System', desc: 'ให้ AI ต่อคิวซื้อตั๋วอัตโนมัติทันทีที่เปิดขาย', color: 'text-primary' },
                { id: 'captcha_forward', icon: AlertTriangle, label: 'CAPTCHA Human-in-the-loop', desc: 'ส่ง CAPTCHA ให้มนุษย์แก้เมื่อระบบตรวจจับได้', color: 'text-amber-400' },
                { id: 'hotel_search', icon: Hotel, label: 'Hotel Auto-Search', desc: 'ค้นหาโรงแรมใกล้สถานที่จัดงานอัตโนมัติ', color: 'text-neon-cyan' },
                { id: 'calendar_sync', icon: Calendar, label: 'Google Calendar Sync', desc: 'ซิงค์อีเวนต์ที่จองลงปฏิทินอัตโนมัติ', color: 'text-green-400' },
                { id: 'push_notif', icon: Bell, label: 'Push Notifications', desc: 'แจ้งเตือนเมื่อ AI พบงานใหม่หรือตั๋วใกล้หมด', color: 'text-accent' },
                { id: 'rpa_mode', icon: Globe, label: 'RPA Automation Mode', desc: 'เปิด headless browser สำหรับ auto-booking', color: 'text-amber-400' },
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