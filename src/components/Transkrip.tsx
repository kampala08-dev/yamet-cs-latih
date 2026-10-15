// Transkrip satu percakapan dari aksi log_sesi (per nomor_hash).
import { useState, type FormEvent } from 'react';
import { HandGrabbing, PaperPlaneRight } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { jam } from '../lib/format';
import { useSesi } from '../lib/sesi';
import { useAksi } from '../lib/useAksi';
import { bolehBukaWa, siapkanTabWa } from '../lib/wa';
import type { BarisLog, BarisPercakapan } from '../lib/tipe';
import { Chip } from './Chip';
import { GalatInline, Kerangka } from './Keadaan';
import { LabelGiliran } from './LabelGiliran';
import { Tombol } from './Tombol';

interface HasilEskalasi { nomor?: string; kanal?: string }
interface HasilBalas { waktu?: string; status?: string }

// Baris Log arah keluar dengan tool "admin:<nama>" = balasan admin, bukan bot.
export function namaAdmin(r: BarisLog) {
  const alat = Array.isArray(r.tool_dipanggil) ? r.tool_dipanggil.join(',') : String(r.tool_dipanggil ?? '');
  const m = alat.match(/admin:([^,]+)/);
  return r.arah === 'keluar' && m ? m[1].trim() : '';
}

function tertunda(status?: string) {
  return Boolean(status && /tertunda/i.test(status));
}

function AmbilAlih({ p }: { p: BarisPercakapan }) {
  const { sesi } = useSesi();
  const [status, setStatus] = useState<'diam' | 'proses' | 'ok'>(p.status === 'Admin' ? 'ok' : 'diam');
  const [galat, setGalat] = useState('');
  // Sesi latih tidak punya orang tua sungguhan: tidak ada yang perlu diambil alih.
  if (sesi.peran !== 'admin' || p.kanal === 'latih') return null;
  async function ambil() {
    const tab = siapkanTabWa(bolehBukaWa(sesi.peran, p.nomor, p.kanal));
    setStatus('proses');
    setGalat('');
    try {
      const hasil = await api.aksi<HasilEskalasi>('eskalasi_status', p.id_eskalasi ? { id: p.id_eskalasi, status: 'Diambil' } : { nomor_hash: p.nomor_hash, status: 'Diambil' });
      tab.arahkan(hasil?.nomor || p.nomor);
      setStatus('ok');
    } catch (e) {
      tab.batal();
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

function BalasAdmin({ p, onTerkirim }: { p: BarisPercakapan; onTerkirim: (r: BarisLog) => void }) {
  const { sesi } = useSesi();
  const [teks, setTeks] = useState('');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState('');
  if (sesi.peran !== 'admin' || p.kanal === 'latih' || !p.nomor_hash) return null;
  async function kirim(e: FormEvent) {
    e.preventDefault();
    const isi = teks.trim();
    if (!isi) return;
    setProses(true);
    setGalat('');
    try {
      const hasil = await api.aksi<HasilBalas>('balas_admin', { nomor_hash: p.nomor_hash, teks: isi });
      onTerkirim({ waktu: hasil?.waktu || '', arah: 'keluar', pesan: isi, tool_dipanggil: `admin:${sesi.nama}`, status: hasil?.status || '' });
      setTeks('');
    } catch (er) {
      setGalat(er instanceof Error ? er.message : String(er));
    } finally {
      setProses(false);
    }
  }
  return (
    <form onSubmit={kirim} className="space-y-2 border-t border-zinc-200 pt-3">
      <label htmlFor={`balas-${p.nomor_hash}`} className="text-[13px] font-medium text-zinc-700">Balas sebagai admin</label>
      <div className="flex items-end gap-2">
        <textarea
          id={`balas-${p.nomor_hash}`}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Tulis balasan untuk orang tua"
          className="min-h-11 flex-1 resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-zinc-400"
        />
        <Tombol type="submit" varian="utama" disabled={proses || !teks.trim()} aria-label="Kirim balasan admin" ikon={<PaperPlaneRight size={20} />}>
          <span className="hidden sm:inline">{proses ? 'Mengirim...' : 'Kirim'}</span>
        </Tombol>
      </div>
      {galat && <GalatInline pesan={galat} />}
    </form>
  );
}

export function Transkrip({ p }: { p: BarisPercakapan }) {
  const { data, memuat, galat, muatUlang } = useAksi<BarisLog[]>('log_sesi', { nomor_hash: p.nomor_hash });
  const [baruAdmin, setBaruAdmin] = useState<BarisLog[]>([]);
  const baris = [...(Array.isArray(data) ? data : []), ...baruAdmin];
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
          const admin = namaAdmin(r);
          let gaya = 'rounded-bl-md bg-zinc-50 text-zinc-900 ring-1 ring-zinc-200';
          if (masuk) gaya = 'rounded-br-md bg-zinc-900 text-zinc-50';
          else if (admin) gaya = 'rounded-bl-md bg-kuning-50 text-zinc-900 ring-1 ring-kuning-200';
          return (
            <li key={`${r.id_giliran}-${i}`} className={`flex flex-col ${masuk ? 'items-end' : 'items-start'}`}>
              {admin && <span className="mb-1 text-[11px] font-medium text-zinc-600">Admin · {admin}</span>}
              <p className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${gaya}`}>{r.pesan}</p>
              <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                {jam(r.waktu)}
                {admin && tertunda(r.status) && <Chip nada="netral">tertunda: kredensial WA</Chip>}
              </span>
              {!masuk && !admin && r.id_giliran && <LabelGiliran idGiliran={r.id_giliran} labelAwal={r.label} koreksiAwal={r.koreksi} />}
            </li>
          );
        })}
      </ol>
      <BalasAdmin p={p} onTerkirim={(r) => setBaruAdmin((x) => [...x, r])} />
    </div>
  );
}
