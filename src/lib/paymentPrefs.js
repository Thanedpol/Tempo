// User payment preferences — which methods to offer + the default. localStorage (demo).
import { useEffect, useState } from 'react';
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

export const PAYMENT_METHODS = [
  { id: 'promptpay',     label: 'PromptPay',            icon: Smartphone,  desc: 'สแกน QR พร้อมเพย์' },
  { id: 'card',          label: 'บัตรเครดิต/เดบิต',     icon: CreditCard,  desc: 'Visa / Mastercard / JCB' },
  { id: 'mobilebanking', label: 'Mobile Banking',       icon: Building2,   desc: 'SCB · KBank · BBL · Krungthai' },
  { id: 'truemoney',     label: 'TrueMoney / e-Wallet', icon: Wallet,      desc: 'กระเป๋าเงินอิเล็กทรอนิกส์' },
];

const ENABLED_KEY = 'tempo_payment_methods';
const DEFAULT_KEY = 'tempo_payment_default';
const DEFAULT_ENABLED = ['promptpay', 'card'];

function readEnabled() {
  try {
    const v = JSON.parse(localStorage.getItem(ENABLED_KEY) || 'null');
    return Array.isArray(v) && v.length ? v : DEFAULT_ENABLED;
  } catch { return DEFAULT_ENABLED; }
}

export function getEnabledMethods() { return readEnabled(); }
export function setEnabledMethods(list) {
  localStorage.setItem(ENABLED_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('payprefs-changed'));
}
export function getDefaultMethod() {
  const def = localStorage.getItem(DEFAULT_KEY);
  const enabled = readEnabled();
  return def && enabled.includes(def) ? def : enabled[0] || 'promptpay';
}
export function setDefaultMethod(id) {
  localStorage.setItem(DEFAULT_KEY, id);
  window.dispatchEvent(new Event('payprefs-changed'));
}

/** Reactive hook for the Settings UI. */
export function usePaymentPrefs() {
  const [enabled, setEnabled] = useState(readEnabled);
  const [def, setDef] = useState(getDefaultMethod);
  useEffect(() => {
    const sync = () => { setEnabled(readEnabled()); setDef(getDefaultMethod()); };
    window.addEventListener('payprefs-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('payprefs-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { enabled, def };
}
