// Klien Aktif: daftar (aksi klien_aktif_baca, usulan U1.7), pencarian, formulir upsert per nama_anak.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CaretRight, MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';
import { ANAK_DAFTAR, INDUK_DAFTAR, INDUK_UBIN } from '../lib/gerak';
import { nomorUtuh, samarkanNomor } from '../lib/format';
import { pindah } from '../lib/rute';
import { useSesi } from '../lib/sesi';
import { useAksi } from '../lib/useAksi';
import type { BarisKlien } from '../lib/tipe';
import { Chip } from '../components/Chip';
import { FormAksi, KELAS_INPUT, KOLOM_KLIEN } from '../components/FormAksi';
import { HeaderHalaman, IsiHalaman } from '../components/HeaderHalaman';
import { KeadaanData, Kosong } from '../components/Keadaan';
import { Ubin } from '../components/Ubin';

const KOSONG = { nama_anak: '', nomor_ortu: '', nama_ortu: '', program: '', aktif: 'ya', tanggal_mulai: '', reevaluasi_terakhir: '' };

export function Klien() {
  const { sesi } = useSesi();
  const { data, memuat, galat, muatUlang } = useAksi<BarisKlien[]>('klien_aktif_baca');
  const [cari, setCari] = useState('');
  const [sunting, setSunting] = useState<BarisKlien | null>(null);
  const kata = cari.trim().toLowerCase();
  const baris = (Array.isArray(data) ? data : []).filter((k) => !kata || `${k.nama_anak} ${k.nama_ortu} ${k.program}`.toLowerCase().includes(kata));

  return (
    <IsiHalaman>
      <HeaderHalaman judul="Klien" keterangan="Tab Klien Aktif: dipakai bot untuk mengenali orang tua klien (izin, jam ganti)." />
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <Ubin judul="Klien Aktif" keterangan={data ? `${baris.length} anak` : undefined} className="col-span-12 xl:col-span-7">
          <div className="relative mb-3">
            <label htmlFor="cari-klien" className="sr-only">Cari klien</label>
            <MagnifyingGlass size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input id="cari-klien" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama anak, orang tua, atau program" className={`${KELAS_INPUT} h-11 pl-10`} />
          </div>
          <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
            {baris.length === 0 ? <Kosong judul={kata ? 'Tidak ada yang cocok.' : 'Belum ada klien aktif.'} /> : (
              <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
                {baris.map((k) => (
                  <motion.li key={k.nama_anak} variants={ANAK_DAFTAR} className="flex items-center gap-1">
                    <button type="button" onClick={() => pindah(`/klien/${encodeURIComponent(k.nama_anak)}`)} className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1.25rem] items-center gap-3 py-3 text-left hover:bg-zinc-50 active:scale-[0.995]">
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-zinc-900">{k.nama_anak}</span>
                        <span className="block truncate text-[12px] text-zinc-500">{k.nama_ortu || '-'} · {k.program || '-'} · <span className="font-mono">{samarkanNomor(k.nomor_ortu)}</span></span>
                      </span>
                      <Chip nada={k.aktif === 'ya' ? 'hijau' : 'redup'}>{k.aktif === 'ya' ? 'Aktif' : 'Tidak aktif'}</Chip>
                      <CaretRight size={20} className="text-zinc-400" />
                    </button>
                    <button type="button" onClick={() => setSunting(k)} aria-label={`Ubah ${k.nama_anak}`} title="Ubah data" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 active:scale-[0.98]">
                      <PencilSimple size={20} />
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </KeadaanData>
        </Ubin>
        <Ubin judul={sunting ? `Ubah ${sunting.nama_anak}` : 'Tambah klien'} keterangan="Nama anak yang sama menimpa baris lama." className="col-span-12 xl:col-span-5" aksi={sunting && <button type="button" onClick={() => setSunting(null)} className="h-9 rounded-lg px-2 text-[12px] font-medium text-biru-600 hover:bg-biru-50">Baru</button>}>
          <FormAksi
            key={sunting?.nama_anak || 'baru'}
            aksi="klien_aktif_tulis"
            kolom={KOLOM_KLIEN}
            awal={sunting ? { nama_anak: sunting.nama_anak, nomor_ortu: nomorUtuh(sunting.nomor_ortu) ? sunting.nomor_ortu : '', nama_ortu: sunting.nama_ortu || '', program: sunting.program || '', aktif: sunting.aktif || 'ya', tanggal_mulai: sunting.tanggal_mulai || '', reevaluasi_terakhir: sunting.reevaluasi_terakhir || '' } : KOSONG}
            label="Simpan klien"
            boleh={sesi.peran === 'admin'}
            pesanBerhasil="Tersimpan di Klien Aktif"
            onBerhasil={muatUlang}
            kosongkanSetelah={!sunting}
          />
        </Ubin>
      </motion.div>
    </IsiHalaman>
  );
}
