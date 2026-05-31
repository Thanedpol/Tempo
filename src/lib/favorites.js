// Favorite concerts — stored in localStorage (demo). Survives reloads on the
// same browser. For cross-device favorites later, back this with a Supabase
// `favorites` table keyed by user_id (see roadmap).
import { useEffect, useState } from 'react';

const KEY = 'tempo_favorites';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('favorites-changed'));
}

export function getFavorites() { return read(); }
export function isFavorite(id) { return read().some(f => String(f.id) === String(id)); }

/** Add/remove an event. Returns true if it is now a favorite. */
export function toggleFavorite(ev) {
  if (!ev?.id) return false;
  const list = read();
  const i = list.findIndex(f => String(f.id) === String(ev.id));
  if (i >= 0) { list.splice(i, 1); write(list); return false; }
  list.unshift({ id: ev.id, title: ev.title, artist: ev.artist, venue: ev.venue, date: ev.date, image_url: ev.image_url });
  write(list);
  return true;
}

export function removeFavorite(id) {
  write(read().filter(f => String(f.id) !== String(id)));
}

/** Reactive hook — re-renders when favorites change (this tab or another). */
export function useFavorites() {
  const [list, setList] = useState(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener('favorites-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('favorites-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return list;
}
