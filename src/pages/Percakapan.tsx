// Percakapan: daftar penuh + transkrip (label Benar/Salah + koreksi) + audit mingguan.
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { HARI_RENTANG } from '../lib/format';
import { INDUK_DAFTAR, INDUK_UBIN } from '../lib/gerak';
import { useAksi } from '../lib/useAksi';
import { useLayar } from '../lib/useLayar';
import type { BarisPercakapan, Rentang } from '../lib/tipe';
import { HeaderHalaman, IsiHalaman, PemilihRentang } from '../components/HeaderHalaman';
import { KeadaanData, Kosong } from '../components/Keadaan';
import { PanelSamping } from '../components/PanelSamping';
import { PilihJenis, cocokJenis, type FilterJenis } from '../components/PilihJenis';
import { Transkrip } from '../components/Transkrip';
import { Ubin } from '../components/Ubin';
import { BarisPercakapanItem } from './ikhtisar/BarisDua';
import { Audit } from './percakapan/Audit';

const FILTER = ['Semua', 'Bot', 'Admin', 'Eskalasi'] as const;

export function Percakapan() {
  const [rentang, setRentang] = useState<Rentang>('hari');
  const [filter, setFilter] = useState<(typeof FILTER)[number]>('Semua');
  const [dipilih, setDipilih] = useState<BarisPercakapan | null>(null);
  const [jenis, setJenis] = useState<FilterJenis>('semua');
  const tutup = useCallback(() => setDipilih(null), []);
  const { data, memuat, galat, muatUlang } = useAksi<BarisPercakapan[]>('percakapan', { hari: HARI_RENTANG[rentang] });
  const baris = (Array.isArray(data) ? data : []).filter((p) => (filter === 'Semua' || p.status === filter) && cocokJenis(p, jenis));
  // Di layar lebar transkrip tampil di kolom kanan; di HP sebagai lembar geser.
  const pilih = useCallback((p: BarisPercakapan) => setDipilih(p), []);
  const lebar = useLayar('(min-width: 1280px)');

  return (
    <IsiHalaman>
      <HeaderHalaman judul="Percakapan" keterangan="Semua percakapan per nomor. Ketuk untuk transkrip, label, dan ambil alih.">
        <PemilihRentang nilai={rentang} onUbah={setRentang} />
      </HeaderHalaman>
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <Ubin
          judul="Kotak masuk"
          keterangan={data ? `${baris.length} percakapan` : undefined}
          className="col-span-12 xl:col-span-5"
          aksi={
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Saring status">
              {FILTER.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`h-9 rounded-lg px-2.5 text-[12px] font-medium active:scale-[0.98] ${filter === f ? 'bg-zinc-900 text-zinc-50' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  {f}
                </button>
              ))}
            </div>
          }
        >
          <PilihJenis nilai={jenis} onUbah={setJenis} />
          <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
            {baris.length === 0 ? <Kosong judul="Tidak ada percakapan di rentang ini." /> : (
              <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="-mx-2 space-y-0.5">
                {baris.map((p) => <BarisPercakapanItem key={p.nomor_hash} p={p} onPilih={pilih} aktif={dipilih?.nomor_hash === p.nomor_hash} />)}
              </motion.ul>
            )}
          </KeadaanData>
        </Ubin>
        {lebar && (
          <Ubin judul={dipilih ? dipilih.nama || dipilih.nomor_samar : 'Transkrip'} className="col-span-12 xl:col-span-7">
            {dipilih ? <Transkrip key={dipilih.nomor_hash} p={dipilih} /> : <Kosong judul="Pilih percakapan di kiri." isi="Transkrip, tombol Ambil alih, dan label Benar/Salah per balasan bot muncul di sini." />}
          </Ubin>
        )}
        <Audit />
      </motion.div>
      <PanelSamping terbuka={Boolean(dipilih) && !lebar} onTutup={tutup} judul={dipilih?.nama || dipilih?.nomor_samar || 'Percakapan'}>
        {dipilih && <Transkrip key={dipilih.nomor_hash} p={dipilih} />}
      </PanelSamping>
    </IsiHalaman>
  );
}
