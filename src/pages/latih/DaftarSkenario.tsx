// Daftar skenario dari uji/skenario-fase1.md + uji/red-team.md (disalin ke src/data lewat npm run skenario).
// Centang disimpan lokal di browser ini saja.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown, Check } from '@phosphor-icons/react';
import daftar from '../../data/skenario.json';
import type { Skenario } from '../../lib/tipe';
import { PEGAS } from '../../lib/gerak';

const SEMUA = daftar as Skenario[];
const KUNCI_CENTANG = 'cs-latih-centang';

function bacaCentang(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI_CENTANG) || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function Baris({ s, dicentang, onCentang, onPakai }: { s: Skenario; dicentang: boolean; onCentang: () => void; onPakai: (t: string) => void }) {
  const [buka, setBuka] = useState(false);
  return (
    <li className="py-1">
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={onCentang}
          role="checkbox"
          aria-checked={dicentang}
          aria-label={`Tandai ${s.id} sudah diuji`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl active:scale-[0.98]"
        >
          <span className={`grid h-5 w-5 place-items-center rounded-md border ${dicentang ? 'border-lumut-600 bg-lumut-600 text-white' : 'border-zinc-300 bg-white'}`}>
            {dicentang && <Check size={20} weight="bold" />}
          </span>
        </button>
        <button type="button" onClick={() => setBuka((b) => !b)} aria-expanded={buka} className="flex min-h-10 min-w-0 flex-1 items-start gap-2 py-2.5 text-left">
          <span className="w-8 shrink-0 font-mono text-[12px] leading-5 text-zinc-500">{s.id}</span>
          <span className={`min-w-0 flex-1 text-[13px] leading-5 ${dicentang ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-800'}`}>{s.judul}</span>
          <CaretDown size={20} className={`shrink-0 text-zinc-400 transition-transform ${buka ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {buka && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={PEGAS} className="space-y-2 pb-3 pl-11 text-[13px] leading-relaxed">
            <p><span className="text-lumut-700">Harus:</span> <span className="text-zinc-700">{s.harus}</span></p>
            {s.dilarang && <p><span className="text-bata-700">Dilarang:</span> <span className="text-zinc-700">{s.dilarang}</span></p>}
            {s.bisaDiketik ? (
              <div className="flex flex-wrap gap-2">
                {s.pesan.map((p) => (
                  <button key={p} type="button" onClick={() => onPakai(p)} className="min-h-9 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:border-zinc-300 active:scale-[0.98]">
                    Pakai: "{p}"
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">Tidak bisa diuji lewat teks di halaman ini (butuh suara, stiker, tautan, atau banyak pesan beruntun).</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function DaftarSkenario({ onPakai }: { onPakai: (teks: string) => void }) {
  const [tab, setTab] = useState<'fase' | 'red'>('fase');
  const [centang, setCentang] = useState<string[]>(bacaCentang);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_CENTANG, JSON.stringify(centang));
    } catch {
      // Penyimpanan lokal tidak tersedia (mode privat): centang hanya berlaku sampai halaman ditutup.
    }
    return undefined;
  }, [centang]);

  const tampil = SEMUA.filter((s) => (tab === 'fase' ? s.kelompok === 'Fase 1' : s.kelompok !== 'Fase 1'));
  const kelompok = [...new Set(tampil.map((s) => s.kelompok))];
  const jumlahCentang = SEMUA.filter((s) => centang.includes(s.id)).length;

  function alih(id: string) {
    setCentang((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Kelompok skenario">
          {([['fase', 'Fase 1'], ['red', 'Red-team']] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`h-9 rounded-lg px-3 text-[13px] font-medium active:scale-[0.98] ${tab === k ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.08)]' : 'text-zinc-600'}`}
            >
              {l} <span className="font-mono text-[11px] text-zinc-400">{SEMUA.filter((s) => (k === 'fase') === (s.kelompok === 'Fase 1')).length}</span>
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-zinc-500">
          {jumlahCentang}/{SEMUA.length} diuji
          {jumlahCentang > 0 && (
            <button type="button" onClick={() => setCentang([])} className="ml-2 font-sans text-[12px] underline underline-offset-2">hapus centang</button>
          )}
        </span>
      </div>
      {kelompok.map((k) => (
        <div key={k}>
          {tab === 'red' && <h4 className="pt-2 text-[12px] font-medium text-zinc-500">{k}</h4>}
          <ul className="divide-y divide-zinc-100">
            {tampil.filter((s) => s.kelompok === k).map((s) => (
              <Baris key={s.id} s={s} dicentang={centang.includes(s.id)} onCentang={() => alih(s.id)} onPakai={onPakai} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
