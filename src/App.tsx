import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, GalatApi, PERISTIWA_SESI_HABIS } from './lib/api';
import { pindah, useJalur } from './lib/rute';
import { SesiContext } from './lib/sesi';
import type { InfoSesi } from './lib/tipe';
import { Shell } from './components/Shell';
import { GalatInline, Kerangka } from './components/Keadaan';
import { Masuk } from './pages/Masuk';
import { Latih } from './pages/Latih';
import { Ikhtisar } from './pages/Ikhtisar';
import { Pipeline } from './pages/Pipeline';
import { Jadwal } from './pages/Jadwal';
import { Percakapan } from './pages/Percakapan';
import { Eskalasi } from './pages/Eskalasi';
import { Klien } from './pages/Klien';
import { KartuKlien } from './pages/KartuKlien';
import { Pengaturan } from './pages/Pengaturan';

const HALAMAN: Record<string, () => JSX.Element> = {
  '/ikhtisar': Ikhtisar,
  '/pipeline': Pipeline,
  '/jadwal': Jadwal,
  '/percakapan': Percakapan,
  '/eskalasi': Eskalasi,
  '/klien': Klien,
  '/latih': Latih,
  '/pengaturan': Pengaturan,
};

type Keadaan = { jenis: 'memuat' } | { jenis: 'tamu' } | { jenis: 'masuk'; sesi: InfoSesi } | { jenis: 'galat'; pesan: string };

function KerangkaAwal() {
  return (
    <div className="min-h-[100dvh]" role="status" aria-label="Memuat">
      <div className="fixed inset-y-0 left-0 hidden w-60 bg-zinc-900 lg:block" />
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-5 px-4 py-6 lg:pl-68">
        {[0, 1, 2, 3].map((i) => <Kerangka key={i} className="col-span-12 h-32 rounded-3xl lg:col-span-6 xl:col-span-3" />)}
        <Kerangka className="col-span-12 h-72 rounded-3xl" />
      </div>
    </div>
  );
}

export function App() {
  const jalur = useJalur();
  const [keadaan, setKeadaan] = useState<Keadaan>({ jenis: 'memuat' });
  const [putaran, setPutaran] = useState(0);

  useEffect(() => {
    const pembatal = new AbortController();
    api
      .sesi(pembatal.signal)
      .then((sesi) => setKeadaan({ jenis: 'masuk', sesi }))
      .catch((e: unknown) => {
        if (pembatal.signal.aborted) return;
        if (e instanceof GalatApi && e.status === 401) setKeadaan({ jenis: 'tamu' });
        else setKeadaan({ jenis: 'galat', pesan: e instanceof Error ? e.message : String(e) });
      });
    return () => pembatal.abort();
  }, [putaran]);

  useEffect(() => {
    const habis = () => setKeadaan({ jenis: 'tamu' });
    window.addEventListener(PERISTIWA_SESI_HABIS, habis);
    return () => window.removeEventListener(PERISTIWA_SESI_HABIS, habis);
  }, []);

  useEffect(() => {
    if (keadaan.jenis === 'tamu' && jalur !== '/masuk') pindah('/masuk', true);
    if (keadaan.jenis === 'masuk' && !HALAMAN[jalur] && !jalur.startsWith('/klien/')) pindah('/ikhtisar', true);
  }, [keadaan.jenis, jalur]);

  const keluar = useCallback(() => {
    api.keluar().catch(() => undefined).finally(() => setKeadaan({ jenis: 'tamu' }));
  }, []);

  const nilaiSesi = useMemo(() => (keadaan.jenis === 'masuk' ? { sesi: keadaan.sesi, keluar } : null), [keadaan, keluar]);

  if (keadaan.jenis === 'memuat') return <KerangkaAwal />;
  if (keadaan.jenis === 'galat') {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <GalatInline pesan={keadaan.pesan} onCobaLagi={() => setPutaran((p) => p + 1)} />
      </main>
    );
  }
  if (keadaan.jenis === 'tamu' || !nilaiSesi) return <Masuk onMasuk={(sesi) => setKeadaan({ jenis: 'masuk', sesi })} />;
  const Halaman = jalur.startsWith('/klien/') ? KartuKlien : HALAMAN[jalur] ?? Ikhtisar;

  return (
    <SesiContext.Provider value={nilaiSesi}>
      <Shell>
        <Halaman />
      </Shell>
    </SesiContext.Provider>
  );
}
