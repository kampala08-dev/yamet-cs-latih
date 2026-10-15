import { useSyncExternalStore } from 'react';

// true bila media query cocok; ikut berubah saat jendela diubah ukurannya.
export function useLayar(query: string) {
  return useSyncExternalStore(
    (f) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', f);
      return () => m.removeEventListener('change', f);
    },
    () => window.matchMedia(query).matches,
  );
}
