// Bukti bahwa giliran, label, dan koreksi benar-benar tercatat di tab Log (aksi log_sesi).
import { useEffect, useState } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { jam } from '../../lib/format';
import type { BarisLog } from '../../lib/tipe';
import { GalatInline, KerangkaBaris } from '../../components/Keadaan';
import { Tombol } from '../../components/Tombol';

export function LogSesi({ nomor }: { nomor: string }) {
  const [baris, setBaris] = useState<BarisLog[] | null>(null);
  const [galat, setGalat] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [putaran, setPutaran] = useState(0);

  useEffect(() => {
    if (putaran === 0) return undefined;
    const pembatal = new AbortController();
    setMemuat(true);
    setGalat('');
    api
      .aksi<BarisLog[]>('log_sesi', { nomor }, pembatal.signal)
      .then((d) => setBaris(Array.isArray(d) ? d : []))
      .catch((e: unknown) => !pembatal.signal.aborted && setGalat(e instanceof Error ? e.message : String(e)))
      .finally(() => !pembatal.signal.aborted && setMemuat(false));
    return () => pembatal.abort();
  }, [putaran, nomor]);

  const muat = () => setPutaran((p) => p + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] leading-snug text-zinc-500">Baris tab Log untuk nomor sesi ini, termasuk label dan koreksi.</p>
        <Tombol ukuran="kecil" onClick={muat} disabled={memuat} ikon={<ArrowClockwise size={20} />}>
          {baris ? 'Muat ulang' : 'Muat Log'}
        </Tombol>
      </div>
      {memuat && <KerangkaBaris jumlah={3} kolom="grid-cols-[3rem_1fr_3.5rem]" />}
      {galat && <GalatInline pesan={galat} onCobaLagi={muat} />}
      {!memuat && baris && baris.length === 0 && <p className="text-[13px] text-zinc-500">Belum ada baris Log untuk {nomor}.</p>}
      {!memuat && baris && baris.length > 0 && (
        <ul className="divide-y divide-zinc-200">
          {baris.map((r, i) => (
            <li key={`${r.id_giliran}-${r.arah}-${i}`} className="grid grid-cols-[3rem_1fr] gap-3 py-2.5 text-[13px]">
              <span className="font-mono text-[12px] text-zinc-500">{jam(r.waktu)}</span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-zinc-800">
                  <span className="mr-1.5 font-mono text-[11px] text-zinc-400">{r.arah === 'masuk' ? 'ortu' : 'bot'}</span>
                  {r.pesan}
                </p>
                {(r.label || r.koreksi) && (
                  <p className="mt-1 text-[12px]">
                    {r.label && <span className={r.label === 'Benar' ? 'text-lumut-700' : 'text-bata-700'}>{r.label}</span>}
                    {r.koreksi && <span className="text-zinc-600"> · koreksi: {r.koreksi}</span>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
