// Transkrip satu percakapan (aksi log_sesi per nomor_hash) + Ambil alih + label per balasan bot.
import { useState } from 'react';
import { HandGrabbing } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { jam } from '../lib/format';
import { useSesi } from '../lib/sesi';
import { useAksi } from '../lib/useAksi';
import type { BarisLog, BarisPercakapan } from '../lib/tipe';
import { Chip } from './Chip';
import { GalatInline, Kerangka } from './Keadaan';
import { LabelGiliran } from './LabelGiliran';
import { Tombol } from './Tombol';

function AmbilAlih({ p }: { p: BarisPercakapan }) {
  const { sesi } = useSesi();
  const [status, setStatus] = useState<'diam' | 'proses' | 'ok'>(p.status === 'Admin' ? 'ok' : 'diam');
  const [galat, setGalat] = useState('');
  // Sesi latih tidak punya orang tua sungguhan: tidak ada yang perlu diambil alih.
  if (sesi.peran !== 'admin' || p.kanal === 'latih') return null;
  async function ambil() {
    setStatus('proses');
    setGalat('');
    try {
      await api.aksi('eskalasi_status', p.id_eskalasi ? { id: p.id_eskalasi, status: 'Diambil' } : { nomor_hash: p.nomor_hash, status: 'Diambil' });
      setStatus('ok');
    } catch (e) {
      setStatus('diam');
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div className="space-y-2">
      {status === 'ok' ? (
        <p className="rounded-xl bg-zinc-100 px-3 py-2 text-[13px] text-zinc-700">Ditangani admin. Bot berhenti untuk nomor ini sampai Selesai.</p>
      ) : (
        <Tombol varian="utama" className="w-full" disabled={status === 'proses'} onClick={ambil} ikon={<HandGrabbing size={20} />}>
          {status === 'proses' ? 'Menyimpan...' : 'Ambil alih percakapan'}
        </Tombol>
      )}
      {galat && <GalatInline pesan={galat} />}
    </div>
  );
}

export function Transkrip({ p }: { p: BarisPercakapan }) {
  const { data, memuat, galat, muatUlang } = useAksi<BarisLog[]>('log_sesi', { nomor_hash: p.nomor_hash });
  const baris = Array.isArray(data) ? data : [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-500">
        <span className="font-mono">{p.nomor_samar}</span>
        <Chip nada={p.status === 'Bot' ? 'biru' : p.status === 'Eskalasi' ? 'bata' : 'netral'}>{p.status}</Chip>
      </div>
      <AmbilAlih p={p} />
      {memuat && !data && <div className="space-y-3" role="status" aria-label="Memuat"><Kerangka className="h-12 w-3/4" /><Kerangka className="ml-auto h-10 w-2/3" /><Kerangka className="h-16 w-4/5" /></div>}
      {galat && <GalatInline pesan={`Transkrip tidak terbaca. ${galat}`} onCobaLagi={muatUlang} />}
      {data && baris.length === 0 && <p className="text-[13px] text-zinc-500">Belum ada baris Log untuk nomor ini.</p>}
      <ol className="space-y-3">
        {baris.map((r, i) => {
          const masuk = r.arah === 'masuk';
          return (
            <li key={`${r.id_giliran}-${i}`} className={`flex flex-col ${masuk ? 'items-end' : 'items-start'}`}>
              <p className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${masuk ? 'rounded-br-md bg-zinc-900 text-zinc-50' : 'rounded-bl-md bg-zinc-50 text-zinc-900 ring-1 ring-zinc-200'}`}>
                {r.pesan}
              </p>
              <span className="mt-1 font-mono text-[11px] text-zinc-400">{jam(r.waktu)}</span>
              {!masuk && r.id_giliran && <LabelGiliran idGiliran={r.id_giliran} labelAwal={r.label} koreksiAwal={r.koreksi} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
