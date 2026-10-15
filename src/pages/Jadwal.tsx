import { motion } from 'framer-motion';
import { INDUK_DAFTAR, INDUK_UBIN } from '../lib/gerak';
import { useAksi } from '../lib/useAksi';
import type { BarisJadwal } from '../lib/tipe';
import { HeaderHalaman, IsiHalaman } from '../components/HeaderHalaman';
import { KeadaanData, Kosong } from '../components/Keadaan';
import { Ubin } from '../components/Ubin';
import { BarisJadwalItem } from './ikhtisar/BarisDua';

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function judulTanggal(t: string) {
  const [y, m, d] = t.split('-').map(Number);
  const tgl = new Date(y, m - 1, d);
  return Number.isFinite(tgl.getTime()) ? `${NAMA_HARI[tgl.getDay()]}, ${d} ${NAMA_BULAN[m - 1]}` : t;
}

export function Jadwal() {
  const { data, memuat, galat, muatUlang } = useAksi<BarisJadwal[]>('jadwal', { hari_ke_depan: 7 });
  const baris = Array.isArray(data) ? data : [];
  const tanggal = [...new Set(baris.map((j) => j.tanggal))].sort();
  return (
    <IsiHalaman>
      <HeaderHalaman judul="Jadwal" keterangan="Observasi dan asesmen 7 hari ke depan, beserta status pengingat H-3 dan H-1." />
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
          {baris.length === 0 && <Ubin className="col-span-12"><Kosong judul="Belum ada jadwal 7 hari ke depan." isi="Ubah tahap lead menjadi Observasi dijadwalkan dan isi tanggal observasi di tab Lead." /></Ubin>}
          {tanggal.map((t) => {
            const isi = baris.filter((j) => j.tanggal === t);
            return (
              <Ubin key={t} judul={judulTanggal(t)} keterangan={`${isi.length} jadwal`} className="col-span-12 lg:col-span-6 xl:col-span-4">
                <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
                  {isi.map((j) => <BarisJadwalItem key={j.id} j={j} />)}
                </motion.ul>
              </Ubin>
            );
          })}
        </KeadaanData>
      </motion.div>
    </IsiHalaman>
  );
}
