// Router kecil berbasis History API: hanya empat rute, tidak perlu pustaka.
import { useSyncExternalStore } from 'react';

const PERISTIWA = 'cs-rute';

function langganan(f: () => void) {
  window.addEventListener('popstate', f);
  window.addEventListener(PERISTIWA, f);
  return () => {
    window.removeEventListener('popstate', f);
    window.removeEventListener(PERISTIWA, f);
  };
}

export function pindah(jalur: string, ganti = false) {
  if (window.location.pathname === jalur) return;
  if (ganti) window.history.replaceState(null, '', jalur);
  else window.history.pushState(null, '', jalur);
  window.dispatchEvent(new Event(PERISTIWA));
  window.scrollTo(0, 0);
}

export function useJalur() {
  return useSyncExternalStore(langganan, () => window.location.pathname);
}
