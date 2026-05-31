import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Heart, CheckCircle, Trash2, MapPin, Calendar,
  ShieldCheck, ChevronRight, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/I18nContext';
import { PAYMENT_METHODS, usePaymentPrefs, setEnabledMethods, setDefaultMethod } from '@/lib/paymentPrefs';
import { useFavorites, removeFavorite } from '@/lib/favorites';

export default function Settings() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { enabled, def } = usePaymentPrefs();
  const favorites = useFavorites();

  const toggleMethod = (id) => {
    const next = enabled.includes(id) ? enabled.filter(m => m !== id) : [...enabled, id];
    if (next.length === 0) return;            // keep at least one method on
    setEnabledMethods(next);
    if (!next.includes(def)) setDefaultMethod(next[0]);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-syne text-3xl font-bold gradient-text">
            {t('settings.title', { en: 'Settings', th: 'การตั้งค่า', ja: '設定', zh: '设置', ko: '설정' })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('settings.user_sub', { en: 'Payment methods & favorite concerts', th: 'ช่องทางการชำระเงิน และคอนเสิร์ตที่ชื่นชอบ', ja: '支払い方法とお気に入り', zh: '支付方式与收藏', ko: '결제 수단 및 즐겨찾기' })}
          </p>
        </div>
      </div>

      {/* ── Payment methods ── */}
      <section className="glass rounded-2xl border border-border/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-sm">การเชื่อมต่อการชำระเงิน</h2>
            <p className="text-xs text-muted-foreground">เลือกช่องทางที่ต้องการใช้ และตั้งค่าเริ่มต้นตอนจ่ายเงิน</p>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {PAYMENT_METHODS.map((m) => {
            const on = enabled.includes(m.id);
            const isDefault = def === m.id;
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${on ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <m.icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {m.label}
                    {isDefault && on && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">ค่าเริ่มต้น</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
                {on && !isDefault && (
                  <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => setDefaultMethod(m.id)}>
                    ตั้งเป็นค่าเริ่มต้น
                  </Button>
                )}
                <Switch checked={on} onCheckedChange={() => toggleMethod(m.id)} />
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 text-xs text-muted-foreground bg-secondary/20">
          💡 ช่องทางที่เปิดไว้จะแสดงตอนกดจ่ายเงิน · ค่าเริ่มต้นจะถูกเลือกให้อัตโนมัติ
        </div>
      </section>

      {/* ── Favorite concerts ── */}
      <section className="glass rounded-2xl border border-border/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-pink-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-syne font-bold text-sm">คอนเสิร์ตที่ชื่นชอบ</h2>
            <p className="text-xs text-muted-foreground">รายการที่คุณกดหัวใจไว้</p>
          </div>
          <Badge className="text-[10px] bg-secondary text-muted-foreground">{favorites.length}</Badge>
        </div>

        {favorites.length === 0 ? (
          <div className="p-6 text-center">
            <Heart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">ยังไม่มีคอนเสิร์ตที่ชื่นชอบ</p>
            <Link to="/events">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-xs">
                ไปดูอีเวนต์ <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {favorites.map((f) => (
              <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-5 py-3">
                {f.image_url
                  ? <img src={f.image_url} alt={f.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-lg bg-secondary flex-shrink-0" />}
                <Link to={`/events/${f.id}`} state={{ event: f }} className="flex-1 min-w-0 group">
                  <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{f.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    {f.venue && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" />{f.venue}</span>}
                    {f.date && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{f.date}</span>}
                  </div>
                </Link>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFavorite(f.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Admin shortcut ── */}
      {user?.role === 'admin' && (
        <Link to="/admin" className="block glass rounded-2xl border border-destructive/20 hover:border-destructive/40 transition-colors px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Admin Panel</div>
              <div className="text-xs text-muted-foreground">จัดการระบบ · AI · แพลตฟอร์ม · API Keys</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      )}
    </div>
  );
}
