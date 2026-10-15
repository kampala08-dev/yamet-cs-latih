import { createContext, useContext } from 'react';
import type { InfoSesi } from './tipe';

interface NilaiSesi {
  sesi: InfoSesi;
  keluar: () => void;
}

export const SesiContext = createContext<NilaiSesi | null>(null);

export function useSesi(): NilaiSesi {
  const n = useContext(SesiContext);
  if (!n) throw new Error('useSesi dipakai di luar SesiContext');
  return n;
}
