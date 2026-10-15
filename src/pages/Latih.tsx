import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowCounterClockwise, ListChecks, PaperPlaneRight } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { sesiBaru } from '../lib/format';
import type { Label } from '../lib/tipe';
import daftarSkenario from '../data/skenario.json';
import type { Skenario } from '../lib/tipe';
import { GalatInline, Kerangka } from '../components/Keadaan';
import { LembarGeser } from '../components/LembarGeser';
import { Tombol } from '../components/Tombol';
import { Gelembung, type Pesan } from './latih/Gelembung';
import { PanelBukti } from './latih/PanelBukti';
import { DaftarSkenario } from './latih/DaftarSkenario';
import { LogSesi } from './latih/LogSesi';

const KUNCI_SESI = 'cs-latih-sesi';
const SARAN = (daftarSkenario as Skenario[]).filter((s) => s.kelompok === 'Fase 1' && s.bisaDiketik).slice(0, 4);

interface SesiLatih {
  nomor: string;
  pesan: Pesan[];
}

function bacaSesi(): SesiLatih {
  try {
    const v = JSON.parse(sessionStorage.getItem(KUNCI_SESI) || 'null');
    if (v && typeof v.nomor === 'string' && /^latih-[a-z0-9]{4,32}$/.test(v.nomor) && Array.isArray(v.pesan)) return v;
  } catch {
    // Penyimpanan sesi tidak tersedia; mulai baru.
  }
  return { nomor: sesiBaru(), pesan: [] };
}

function idLokal() {
  return Math.random().toString(36).slice(2, 10);
}

function IsiPanel({ bukti, nomor, onPakai }: { bukti: Pesan['bukti'] | null; nomor: string; onPakai: (t: string) => void }) {
  return (
    <div className="divide-y divide-zinc-200">
      <section className="space-y-3 pb-5">
        <h2 className="text-[15px] font-medium">Bukti balasan</h2>
        <PanelBukti bukti={bukti ?? null} />
      </section>
      <section className="space-y-3 py-5">
        <h2 className="text-[15px] font-medium">Skenario uji</h2>
        <DaftarSkenario onPakai={onPakai} />
      </section>
      <section className="space-y-3 pt-5">
        <h2 className="text-[15px] font-medium">Log sesi</h2>
        <LogSesi key={nomor} nomor={nomor} />
      </section>
    </div>
  );
}

export function Latih() {
  const [sesi, setSesi] = useState<SesiLatih>(bacaSesi);
  const [teks, setTeks] = useState('');
  const [menunggu, setMenunggu] = useState(false);
  const [galatKirim, setGalatKirim] = useState<{ pesan: string; teks: string } | null>(null);
  const [terpilih, setTerpilih] = useState<string>('');
  const [lembar, setLembar] = useState(false);
  const ujungRef = useRef<HTMLDivElement>(null);
  const masukanRef = useRef<HTMLTextAreaElement>(null);
  const [idAwal] = useState(() => new Set(sesi.pesan.map((p) => p.id)));

  useEffect(() => {
    try {
      sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));
    } catch {
      // Abaikan: percakapan tetap ada sampai halaman dimuat ulang.
    }
    return undefined;
  }, [sesi]);

  useEffect(() => {
    const id = requestAnimationFrame(() => ujungRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }));
    return () => cancelAnimationFrame(id);
  }, [sesi.pesan.length, menunggu]);

  const kirimKeBot = useCallback(async (isi: string, nomor: string) => {
    setMenunggu(true);
    setGalatKirim(null);
    try {
      const bukti = await api.chat(nomor, isi);
      const id = idLokal();
      setSesi((s) => (s.nomor !== nomor ? s : { ...s, pesan: [...s.pesan, { id, dari: 'bot', teks: bukti.balasan, bukti }] }));
      setTerpilih(id);
    } catch (e) {
      setGalatKirim({ pesan: e instanceof Error ? e.message : String(e), teks: isi });
    } finally {
      setMenunggu(false);
    }
  }, []);

  function kirim(e?: FormEvent) {
    e?.preventDefault();
    const isi = teks.trim();
    if (!isi || menunggu) return;
    setSesi((s) => ({ ...s, pesan: [...s.pesan, { id: idLokal(), dari: 'ortu', teks: isi }] }));
    setTeks('');
    void kirimKeBot(isi, sesi.nomor);
  }

  function tekanTombol(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      kirim();
    }
  }

  function mulaiUlang() {
    setSesi({ nomor: sesiBaru(), pesan: [] });
    setTerpilih('');
    setGalatKirim(null);
    setTeks('');
  }

  const pakai = useCallback((t: string) => {
    setTeks(t);
    setLembar(false);
    requestAnimationFrame(() => masukanRef.current?.focus());
  }, []);

  const pilih = useCallback((id: string) => {
    setTerpilih(id);
    if (window.matchMedia('(max-width: 767px)').matches) setLembar(true);
  }, []);

  const beriLabel = useCallback((id: string, l: Label, koreksi: string) => {
    setSesi((s) => ({ ...s, pesan: s.pesan.map((p) => (p.id === id ? { ...p, label: l, koreksi } : p)) }));
  }, []);

  const tutupLembar = useCallback(() => setLembar(false), []);
  const pesanBot = sesi.pesan.filter((p) => p.dari === 'bot');
  const buktiTerpilih = (sesi.pesan.find((p) => p.id === terpilih) ?? pesanBot[pesanBot.length - 1])?.bukti ?? null;

  return (
    <main className="mx-auto grid max-w-[1400px] gap-6 px-4 pb-24 pt-5 md:grid-cols-[1.4fr_1fr] md:gap-8 lg:px-8 lg:pb-8 lg:pt-8">
      <section className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-tight">Latih</h1>
            <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-zinc-500">
              Kirim pesan sebagai orang tua. Balasan datang dari workflow 07 lewat kanal latih dan tercatat di tab Log.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-[12px] text-zinc-600" title="Nomor sesi latih">{sesi.nomor}</span>
            <Tombol ukuran="kecil" onClick={mulaiUlang} ikon={<ArrowCounterClockwise size={20} />}>
              Mulai ulang
            </Tombol>
            <Tombol ukuran="kecil" className="md:hidden" onClick={() => setLembar(true)} ikon={<ListChecks size={20} />}>
              Bukti
            </Tombol>
          </div>
        </div>

        <ol className="flex-1 space-y-5 py-5" aria-live="polite">
          {sesi.pesan.length === 0 && !menunggu && (
            <li className="space-y-3 border-y border-dashed border-zinc-300 py-6">
              <p className="text-sm font-medium text-zinc-800">Belum ada percakapan di sesi ini.</p>
              <p className="text-[13px] text-zinc-500">Mulai dari skenario yang disarankan:</p>
              <div className="flex flex-wrap gap-2">
                {SARAN.map((s) => (
                  <button key={s.id} type="button" onClick={() => pakai(s.pesan[0])} className="min-h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-[13px] hover:border-zinc-300 active:scale-[0.98]">
                    <span className="mr-2 font-mono text-[11px] text-zinc-400">{s.id}</span>
                    {s.pesan[0]}
                  </button>
                ))}
              </div>
            </li>
          )}
          {sesi.pesan.map((p) => (
            <Gelembung key={p.id} pesan={p} terpilih={p.id === terpilih} onPilih={pilih} onLabel={beriLabel} animasi={!idAwal.has(p.id)} />
          ))}
          {menunggu && (
            <li className="flex flex-col gap-2" role="status" aria-label="Bot sedang membalas">
              <div className="w-[min(22rem,80%)] space-y-2 rounded-2xl rounded-bl-md bg-white p-4 ring-1 ring-zinc-200">
                <Kerangka className="h-3.5 w-11/12" />
                <Kerangka className="h-3.5 w-3/5" />
              </div>
              <span className="pl-1 font-mono text-[11px] text-zinc-400">menunggu n8n...</span>
            </li>
          )}
        </ol>

        <form onSubmit={kirim} className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t border-zinc-200 bg-zinc-50/95 px-4 pb-3 pt-3 backdrop-blur md:mx-0 lg:bottom-4 md:rounded-2xl md:border md:bg-white md:p-3 md:shadow-[0_12px_32px_-16px_rgba(63,63,70,0.25)]">
          <label htmlFor="pesan-latih" className="sr-only">Pesan sebagai orang tua</label>
          <div className="flex items-end gap-2">
            <textarea
              id="pesan-latih"
              ref={masukanRef}
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              onKeyDown={tekanTombol}
              rows={2}
              maxLength={2000}
              placeholder="Tulis seperti orang tua di WhatsApp, mis. alamatnya dimana?"
              className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-zinc-400 focus:border-zinc-400 md:border-0 md:px-1"
            />
            <button
              type="submit"
              disabled={!teks.trim() || menunggu}
              aria-label="Kirim"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-kuning-600/30 bg-kuning-400 text-sm font-medium text-zinc-900 transition-[background-color,transform] hover:bg-kuning-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 md:w-auto md:px-5"
            >
              <PaperPlaneRight size={20} className="shrink-0" />
              <span className="hidden md:inline">Kirim</span>
            </button>
          </div>
          {galatKirim && (
            <div className="mt-3">
              <GalatInline pesan={galatKirim.pesan} onCobaLagi={() => kirimKeBot(galatKirim.teks, sesi.nomor)} />
            </div>
          )}
        </form>
        <div ref={ujungRef} />
      </section>

      <aside className="hidden md:block" aria-label="Panel bukti">
        <div className="sticky top-6 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-[0_20px_40px_-24px_rgba(39,39,42,0.12)] lg:max-h-[calc(100dvh-3rem)]">
          <IsiPanel bukti={buktiTerpilih} nomor={sesi.nomor} onPakai={pakai} />
        </div>
      </aside>

      <LembarGeser terbuka={lembar} onTutup={tutupLembar} judul="Bukti dan skenario">
        <IsiPanel bukti={buktiTerpilih} nomor={sesi.nomor} onPakai={pakai} />
      </LembarGeser>
    </main>
  );
}
