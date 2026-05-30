// Drop-in replacement for the Base44 SDK.
// Same surface — base44.auth.me/logout, base44.entities.X.{list,create,update,delete,bulkCreate},
// base44.functions.invoke, base44.integrations.Core.UploadFile — but everything hits our
// own Next.js API routes (which talk to Supabase + AI providers behind the scenes).

import { supabase } from '@/lib/supabaseBrowser';

const ENTITY_PATH = {
  Event:         'events',
  Booking:       'bookings',
  HotelBooking:  'hotel_bookings',
  AISession:     'ai_sessions',
  Notification:  'notifications',
};

async function api(path, { method = 'GET', body, headers, isForm = false } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(headers || {}) },
  };
  if (body !== undefined) opts.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(path, opts);
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}
function safeJson(t) { try { return JSON.parse(t); } catch { return t; } }

// ---------------------------------------------------------------- entities
function entity(name) {
  const table = ENTITY_PATH[name];
  if (!table) throw new Error(`Unknown entity ${name}`);
  return {
    list: async (orderBy = '-created_date', limit = 100) => {
      const q = new URLSearchParams();
      if (orderBy) q.set('order', orderBy);
      if (limit)   q.set('limit', String(limit));
      const r = await api(`/api/entities/${table}?${q.toString()}`);
      return r?.data ?? [];
    },
    get:    (id)        => api(`/api/entities/${table}/${id}`).then(r => r?.data),
    create: (payload)   => api(`/api/entities/${table}`,         { method: 'POST',  body: payload }).then(r => r?.data),
    update: (id, patch) => api(`/api/entities/${table}/${id}`,   { method: 'PATCH', body: patch   }).then(r => r?.data),
    delete: (id)        => api(`/api/entities/${table}/${id}`,   { method: 'DELETE' }),
    bulkCreate: (items) => api(`/api/entities/${table}/bulk`,    { method: 'POST',  body: { items } }).then(r => r?.data ?? []),
  };
}
const entities = new Proxy({}, { get: (_, name) => entity(name) });

// ---------------------------------------------------------------- auth
const auth = {
  me: async () => {
    const r = await api('/api/auth/me');
    if (!r?.user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    return r.user;
  },
  logout: async (redirectUrl) => {
    try { await supabase.auth.signOut(); } catch {}
    if (redirectUrl && typeof window !== 'undefined') window.location.href = '/login';
  },
  redirectToLogin: (returnUrl) => {
    if (typeof window === 'undefined') return;
    const ret = encodeURIComponent(returnUrl || window.location.href);
    window.location.href = `/login?returnTo=${ret}`;
  },
};

// ---------------------------------------------------------------- functions
const functions = {
  invoke: (name, payload = {}) => api(`/api/functions/${name}`, { method: 'POST', body: payload }),
};

// ---------------------------------------------------------------- integrations
const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api('/api/integrations/uploadFile', { method: 'POST', body: fd, isForm: true });
      return r;       // { file_url }
    },
    InvokeLLM: async (payload) => api('/api/functions/invokeLLM', { method: 'POST', body: payload }),
  },
};

export const base44 = { auth, entities, functions, integrations };
