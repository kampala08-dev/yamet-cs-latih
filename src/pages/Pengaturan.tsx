// Pengaturan: Konfigurasi non-rahasia + Pengetahuan (cari, sunting → pengetahuan_tulis).
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { INDUK_DAFTAR, INDUK_UBIN } from '../lib/gerak';
import { normalKonfig } from '../lib/format';
import { useSesi } from '../lib/sesi';
import { useAksi } from '../lib/useAksi';
import type { BarisPengetahuan as DataPengetahuan } from '../lib/tipe';
import { FormAksi, KELAS_INPUT, KOLOM_PENGETAHUAN } from '../components/FormAksi';
import { HeaderHalaman, IsiHalaman } from '../components/HeaderHalaman';
import { KeadaanData, KerangkaBaris } from '../components/Keadaan';
import { PanelSamping } from '../components/PanelSamping';
import { Tombol } from '../components/Tombol';
import { Ubin } from '../components/Ubin';
import { BarisKonfigurasi } from './pengaturan/BarisKonfigurasi';
import { BarisPengetahuan } from './pengaturan/BarisPengetahuan';

const BATAS_TAMPIL = 40;

function Konfigurasi() {
  const { sesi } = useSesi();
  const { data, memuat, galat, muatUlang } = useAksi<unknown>('konfigurasi_baca');
  const baris = normalKonfig(data).filter((r) => !/(_SECRET|_KEY|_TOKEN)$/i.test(r.kunci));
  return (
    <Ubin judul="Konfigurasi" keterangan="Hanya kunci non-rahasia yang sudah ada." className="col-span-12 xl:col-span-5">
      <KeadaanData memuat={memuat} galat={galat} adaData={data !== null} muatUlang={muatUlang} kerangka={<KerangkaBaris jumlah={5} kolom="grid-cols-[8rem_1fr_4rem]" />}>
        <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
          {baris.map((r) => <BarisKonfigurasi key={r.kunci} r={r} bolehUbah={sesi.peran === 'admin'} />)}
        </motion.ul>
        <p className="mt-3 text-[12px] text-zinc-500">Perubahan berlaku pada bot paling lama 1 menit.</p>
      </KeadaanData>
    </Ubin>
  );
}

function Pengetahuan() {
  const { sesi } = useSesi();
  const { data, memuat, galat, muatUlang } = useAksi<DataPengetahuan[]>('pengetahuan_baca');
  const [cari, setCari] = useState('');
  const [sunting, setSunting] = useState<DataPengetahuan | 'baru' | null>(null);
  const tutup = useCallback(() => setSunting(null), []);
  const kata = cari.trim().toLowerCase();
  const semua = Array.isArray(data) ? data : [];
  const cocok = semua.filter((p) => !kata || `${p.id} ${p.topik} ${p.pertanyaan_variasi} ${p.jawaban}`.toLowerCase().includes(kata));
  const judulPanel = sunting === null ? '' : sunting === 'baru' ? 'Baris Pengetahuan baru' : `Sunting ${sunting.id}`;
  const awal = sunting && sunting !== 'baru' ? { ...sunting } : { topik: 'umum', id: '', pertanyaan_variasi: '', jawaban: '' };

  return (
    <Ubin
      judul="Pengetahuan"
      keterangan={data ? `${semua.length} baris. Bot memuat ulang paling lambat 1 menit setelah disimpan.` : undefined}
      className="col-span-12 xl:col-span-7"
      aksi={<Tombol ukuran="kecil" varian="utama" onClick={() => setSunting('baru')} ikon={<Plus size={20} />}>Tambah</Tombol>}
    >
      <p className="mb-3 text-[12px] text-zinc-500">Jawab persis: bila pertanyaan orang tua sama dengan salah satu variasi, jawaban dikirim persis tanpa model. Tulis [[SALAM]] di awal jawaban untuk membalas salam sesuai salam orang tua.</p>
      <div className="relative mb-3">
        <label htmlFor="cari-pengetahuan" className="sr-only">Cari Pengetahuan</label>
        <MagnifyingGlass size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input id="cari-pengetahuan" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari id, topik, pertanyaan, atau jawaban" className={`${KELAS_INPUT} h-11 pl-10`} />
      </div>
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
          {cocok.slice(0, BATAS_TAMPIL).map((p) => (
            <BarisPengetahuan key={`${p.id}-${p.verbatim ?? ''}`} p={p} bolehUbah={sesi.peran === 'admin'} onSunting={setSunting} />
          ))}
        </motion.ul>
        {cocok.length > BATAS_TAMPIL && <p className="pt-3 text-[12px] text-zinc-500">Menampilkan {BATAS_TAMPIL} dari {cocok.length}. Persempit pencarian.</p>}
        {data && cocok.length === 0 && <p className="py-4 text-[13px] text-zinc-500">Tidak ada baris yang cocok.</p>}
      </KeadaanData>
      <PanelSamping terbuka={sunting !== null} onTutup={tutup} judul={judulPanel}>
        {sunting !== null && (
          <FormAksi
            key={sunting === 'baru' ? 'baru' : sunting.id}
            aksi="pengetahuan_tulis"
            kolom={KOLOM_PENGETAHUAN}
            awal={awal}
            label="Simpan baris"
            boleh={sesi.peran === 'admin'}
            pesanBerhasil="Tersimpan di Pengetahuan"
            onBerhasil={muatUlang}
          />
        )}
      </PanelSamping>
    </Ubin>
  );
}

export function Pengaturan() {
  return (
    <IsiHalaman>
      <HeaderHalaman judul="Pengaturan" keterangan="Nilai yang bisa berubah ada di sheet CS Bot YAMET. Kunci rahasia tidak pernah tampil di sini." />
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <Pengetahuan />
        <Konfigurasi />
      </motion.div>
    </IsiHalaman>
  );
}
