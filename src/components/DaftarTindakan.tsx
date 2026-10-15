// Perlu tindakan: eskalasi terbuka (Ambil alih/Selesai), follow-up jatuh tempo, jam ganti diajukan (Setujui/Tolak).
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { ANAK_DAFTAR, INDUK_DAFTAR } from '../lib/gerak';
import { samarkanNomor, umur } from '../lib/format';
import { bolehBukaWa, siapkanTabWa } from '../lib/wa';
import { useSesi } from '../lib/sesi';
import type { BarisEskalasi, BarisPercakapan, PerluTindakan } from '../lib/tipe';
import { Chip, ChipStatus } from './Chip';
import { Kosong } from './Keadaan';
import { Tombol } from './Tombol';
import { PanelSamping } from './PanelSamping';
import { Transkrip } from './Transkrip';

const BATAS_MENIT = 30;

export function idEskalasi(e: BarisEskalasi) {
  return e.id || `${e.waktu}|${e.nomor_hash || ''}`;
}

interface TombolAksiProps {
  pilihan: { label: string; aksi: string; isi: Record<string, string>; utama?: boolean; wa?: { nomor?: string; kanal?: string } }[];
  onSelesai: (aksi: string, isi: Record<string, string>, hasil: unknown) => void;
}

function TombolAksi({ pilihan, onSelesai }: TombolAksiProps) {
  const { sesi } = useSesi();
  const [proses, setProses] = useState('');
  const [galat, setGalat] = useState('');
  if (sesi.peran !== 'admin') return null;
  async function jalan(p: TombolAksiProps['pilihan'][number]) {
    // Tab WA dibuka sinkron saat klik (Ambil alih) supaya tidak diblokir; diarahkan setelah aksi sukses.
    const tab = siapkanTabWa(Boolean(p.wa) && bolehBukaWa(sesi.peran, p.wa?.nomor, p.wa?.kanal));
    setProses(p.label);
    setGalat('');
    try {
      const hasil = await api.aksi<{ nomor?: string }>(p.aksi, p.isi);
      tab.arahkan(hasil?.nomor || p.wa?.nomor);
      onSelesai(p.aksi, p.isi, hasil);
    } catch (e) {
      tab.batal();
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setProses('');
    }
  }
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex gap-2">
        {pilihan.map((p) => (
          <Tombol key={p.label} ukuran="kecil" varian={p.utama ? 'utama' : 'garis'} disabled={Boolean(proses)} onClick={() => jalan(p)}>
            {proses === p.label ? 'Menyimpan...' : p.label}
          </Tombol>
        ))}
      </div>
      {galat && <p role="alert" className="max-w-[16rem] text-[12px] text-bata-700">{galat}</p>}
    </div>
  );
}

export function DaftarTindakan({ data, ganti, ringkas = false }: { data: PerluTindakan; ganti: (f: (d: PerluTindakan | null) => PerluTindakan | null) => void; ringkas?: boolean }) {
  const { sesi } = useSesi();
  const [transkrip, setTranskrip] = useState<BarisPercakapan | null>(null);
  const total = data.eskalasi_terbuka.length + data.followup_jatuh_tempo.length + data.jam_ganti_diajukan.length;
  if (total === 0) return <Kosong judul="Tidak ada yang perlu ditindak." isi="Eskalasi, follow-up, dan pengajuan jam ganti yang menunggu muncul di sini." />;

  function selesai(aksi: string, isi: Record<string, string>) {
    // Setelah Ambil alih: buka transkrip percakapan itu (balas sebagai admin ada di sana).
    if (aksi === 'eskalasi_status' && isi.status === 'Diambil') {
      const e = data.eskalasi_terbuka.find((x) => idEskalasi(x) === isi.id);
      if (e?.nomor_hash) setTranskrip({ nomor_hash: e.nomor_hash, nomor_samar: samarkanNomor(e.nomor), nama: '', pesan_terakhir: e.alasan, waktu: e.waktu, status: 'Admin', id_eskalasi: idEskalasi(e), kanal: e.kanal, nomor: e.nomor });
    }
    ganti((d) => {
      if (!d) return d;
      if (aksi === 'eskalasi_status') {
        return { ...d, eskalasi_terbuka: d.eskalasi_terbuka.map((x) => (idEskalasi(x) === isi.id ? { ...x, status: isi.status, admin: sesi.nama } : x)).filter((x) => x.status !== 'Selesai') };
      }
      return { ...d, jam_ganti_diajukan: d.jam_ganti_diajukan.filter((j) => j.id !== isi.id) };
    });
  }

  const kelasBaris = ringkas ? 'grid gap-2 py-3' : 'grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start';
  return (
    <>
    <PanelSamping terbuka={Boolean(transkrip)} onTutup={() => setTranskrip(null)} judul={transkrip?.nomor_samar || 'Percakapan'}>
      {transkrip && <Transkrip key={transkrip.nomor_hash} p={transkrip} />}
    </PanelSamping>
    <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
      {data.eskalasi_terbuka.map((e) => {
        const id = idEskalasi(e);
        const lama = (e.umur_menit ?? 0) > BATAS_MENIT;
        return (
          <motion.li key={id} variants={ANAK_DAFTAR} className={kelasBaris}>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <ChipStatus status={e.status} />
                {typeof e.umur_menit === 'number' && <span className={`font-mono text-[12px] ${lama && e.status === 'Terbuka' ? 'text-bata-700' : 'text-zinc-500'}`}>{umur(e.umur_menit)}</span>}
                {e.prioritas && <span className="text-[12px] text-zinc-500">prioritas {e.prioritas}</span>}
              </div>
              <p className="text-[13px] font-medium text-zinc-900">{e.alasan}</p>
              <p className="font-mono text-[11px] text-zinc-400">{samarkanNomor(e.nomor)}{e.admin ? ` · ditangani ${e.admin}` : ''}</p>
            </div>
            <TombolAksi
              onSelesai={selesai}
              pilihan={[
                ...(e.status !== 'Diambil' ? [{ label: 'Ambil alih', aksi: 'eskalasi_status', isi: { id, status: 'Diambil' }, wa: { nomor: e.nomor, kanal: e.kanal } }] : []),
                { label: 'Selesai', aksi: 'eskalasi_status', isi: { id, status: 'Selesai' }, utama: true },
              ]}
            />
          </motion.li>
        );
      })}
      {data.followup_jatuh_tempo.map((l, i) => (
        <motion.li key={`fu-${l.waktu}-${i}`} variants={ANAK_DAFTAR} className="grid grid-cols-[auto_1fr] items-start gap-3 py-3">
          <Chip nada="ambar">Follow-up</Chip>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{l.nama_ortu || 'Tanpa nama'}</p>
            <p className="truncate text-[12px] text-zinc-500">{typeof l.umur_jam === 'number' ? `${l.umur_jam} jam` : 'lebih dari 24 jam'} tanpa balasan · {l.keluhan}</p>
          </div>
        </motion.li>
      ))}
      {data.jam_ganti_diajukan.map((j, i) => (
        <motion.li key={`jg-${j.id || i}`} variants={ANAK_DAFTAR} className={kelasBaris}>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2"><ChipStatus status={j.status || 'Diajukan'} /><span className="text-[12px] text-zinc-500">jam ganti</span></div>
            <p className="text-[13px] font-medium">{j.anak} <span className="font-normal text-zinc-500">· {j.program}</span></p>
            <p className="text-[12px] text-zinc-500"><span className="font-mono">{j.sesi_asal}</span> ke <span className="font-mono">{j.jam_diminta}</span>{j.alasan && ` · ${j.alasan}`}</p>
          </div>
          {j.id && (
            <TombolAksi
              onSelesai={selesai}
              pilihan={[
                { label: 'Tolak', aksi: 'jam_ganti_status', isi: { id: j.id, status: 'Ditolak' } },
                { label: 'Setujui', aksi: 'jam_ganti_status', isi: { id: j.id, status: 'Disetujui' }, utama: true },
              ]}
            />
          )}
        </motion.li>
      ))}
    </motion.ul>
    </>
  );
}
