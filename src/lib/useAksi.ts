import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

interface Keadaan<T> {
  data: T | null;
  galat: string;
  memuat: boolean;
}

// Memuat satu aksi baca dari /api/aksi; dibatalkan bersih saat komponen dilepas.
// aksi kosong = lewati (untuk data yang bergantung pada data lain).
export function useAksi<T>(aksi: string, isi: Record<string, unknown> = {}) {
  const kunciIsi = JSON.stringify(isi);
  const [putaran, setPutaran] = useState(0);
  const [keadaan, setKeadaan] = useState<Keadaan<T>>({ data: null, galat: '', memuat: true });

  useEffect(() => {
    if (!aksi) {
      setKeadaan({ data: null, galat: '', memuat: false });
      return undefined;
    }
    const pembatal = new AbortController();
    setKeadaan((k) => ({ ...k, galat: '', memuat: true }));
    api
      .aksi<T>(aksi, JSON.parse(kunciIsi), pembatal.signal)
      .then((data) => setKeadaan({ data, galat: '', memuat: false }))
      .catch((e: unknown) => {
        if (pembatal.signal.aborted) return;
        setKeadaan((k) => ({ ...k, galat: e instanceof Error ? e.message : String(e), memuat: false }));
      });
    return () => pembatal.abort();
  }, [aksi, kunciIsi, putaran]);

  const muatUlang = useCallback(() => setPutaran((p) => p + 1), []);
  const ganti = useCallback((f: (lama: T | null) => T | null) => setKeadaan((k) => ({ ...k, data: f(k.data) })), []);
  return { ...keadaan, muatUlang, ganti };
}
