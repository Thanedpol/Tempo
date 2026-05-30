import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/I18nContext';

export default function CaptchaModal({ open, onClose, onSuccess }) {
  const { t } = useI18n();
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (captchaInput.toUpperCase() === captchaCode) {
      onSuccess();
    } else {
      setError(t('captcha.invalid', { en: 'Incorrect CAPTCHA — please try again', th: 'CAPTCHA ไม่ถูกต้อง กรุณาลองใหม่', ja: 'CAPTCHA が違います、もう一度お試しください', zh: 'CAPTCHA 不正确,请重试', ko: 'CAPTCHA가 일치하지 않습니다. 다시 시도하세요' }));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative glass rounded-3xl p-6 w-full max-w-sm z-10 border border-amber-500/30"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-syne font-bold text-lg">Human Verification</h2>
                  <p className="text-xs text-muted-foreground">{t('captcha.subtitle', { en: 'The ticketing system needs to verify you', th: 'ระบบขายตั๋วขอยืนยันตัวตน', ja: 'チケットサイトが本人確認を要求しています', zh: '票务系统要求验证身份', ko: '티켓 시스템에서 본인 확인이 필요합니다' })}</p>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">{t('captcha.instruction', { en: 'Type the characters you see', th: 'กรุณาพิมพ์ตัวอักษรที่เห็น', ja: '表示されている文字を入力してください', zh: '请输入您看到的字符', ko: '보이는 문자를 입력하세요' })}</p>
                {/* CAPTCHA Display */}
                <div className="relative bg-secondary/70 rounded-2xl p-4 select-none overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute border border-muted-foreground"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          width: `${20 + Math.random() * 60}px`,
                          transform: `rotate(${Math.random() * 360}deg)`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center gap-1">
                    {captchaCode.split('').map((char, i) => (
                      <span
                        key={i}
                        className="text-2xl font-bold font-syne"
                        style={{
                          color: ['#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'][i % 6],
                          transform: `rotate(${(Math.random() - 0.5) * 20}deg) translateY(${(Math.random() - 0.5) * 8}px)`,
                          display: 'inline-block',
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <Input
                  value={captchaInput}
                  onChange={(e) => { setCaptchaInput(e.target.value); setError(''); }}
                  placeholder={t('captcha.placeholder', { en: 'Type the characters above', th: 'พิมพ์ตัวอักษรข้างบน', ja: '上の文字を入力', zh: '输入上方字符', ko: '위의 문자를 입력' })}
                  className="text-center text-lg tracking-widest bg-secondary/50 border-border/50 focus:border-amber-500/50"
                  maxLength={6}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={captchaInput.length !== 6}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('captcha.submit', { en: 'Submit CAPTCHA', th: 'ยืนยัน CAPTCHA', ja: 'CAPTCHA を送信', zh: '提交 CAPTCHA', ko: 'CAPTCHA 제출' })}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}