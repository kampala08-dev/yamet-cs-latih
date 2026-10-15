// Audit mingguan: giliran acak minggu ini yang belum berlabel (aksi audit) + label Benar/Salah + koreksi.
import { motion } from 'framer-motion';
import { ArrowClockwise } from '@phosphor-icons/react';
import { ANAK_DAFTAR, INDUK_DAFTAR } from '../../lib/gerak';
import { tanggalJam, topikManusia } from '../../lib/format';
import { useAksi } from '../../lib/useAksi';
import type { BarisAudit } from '../../lib/tipe';
import { KeadaanData, Kosong } from '../../components/Keadaan';
import { LabelGiliran } from '../../components/LabelGiliran';
import { Tombol } from '../../components/Tombol';
import { Ubin } from '../../components/Ubin';

export function Audit() {
  const { data, memuat, galat, muatUlang } = useAksi<BarisAudit[]>('audit');
  const baris = Array.isArray(data) ? data : [];
  return (
    <Ubin
      judul="Audit mingguan"
      keterangan="Giliran acak minggu ini yang belum berlabel. Label dan koreksi ditulis ke tab Log."
      className="col-span-12"
      aksi={<Tombol ukuran="kecil" onClick={muatUlang} ikon={<ArrowClockwise size={20} />}><span className="hidden sm:inline">Sampel baru</span></Tombol>}
    >
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {baris.length === 0 ? <Kosong judul="Semua giliran minggu ini sudah berlabel." /> : (
          <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
            {baris.map((r) => (
              <motion.li key={r.id_giliran} variants={ANAK_DAFTAR} className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[7rem_1fr_minmax(0,22rem)]">
                <div className="flex items-center gap-2 md:block">
                  <span className="font-mono text-[12px] text-zinc-500">{tanggalJam(r.waktu)}</span>
                  {r.topik && <span className="block text-[12px] text-zinc-500 md:mt-1">{topikManusia(r.topik)}</span>}
                </div>
                <div className="min-w-0 space-y-1.5 text-[13px] leading-relaxed">
                  <p className="text-zinc-900"><span className="mr-1.5 font-mono text-[11px] text-zinc-400">ortu</span>{r.pesan}</p>
                  {r.balasan && <p className="text-zinc-600"><span className="mr-1.5 font-mono text-[11px] text-zinc-400">bot</span>{r.balasan}</p>}
                </div>
                <LabelGiliran idGiliran={r.id_giliran} labelAwal={r.label} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </KeadaanData>
    </Ubin>
  );
}
