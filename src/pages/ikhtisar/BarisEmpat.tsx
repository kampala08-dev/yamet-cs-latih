// Baris 4 (4/4/4): Layanan paling ditanya, Pertanyaan tidak terjawab, Alur otomatis.
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRinging, CalendarCheck, ChatCircleDots, PaperPlaneTilt, Sparkle, UserPlus, type Icon } from '@phosphor-icons/react';
import { ANAK_DAFTAR, INDUK_DAFTAR, PEGAS } from '../../lib/gerak';
import { angka, umurDari } from '../../lib/format';
import { useSesi } from '../../lib/sesi';
import { useAksi } from '../../lib/useAksi';
import type { BarisLayanan, Pertanyaan, RingkasanV2 } from '../../lib/tipe';
import { FormAksi, KOLOM_PENGETAHUAN } from '../../components/FormAksi';
import { KeadaanData, Kosong } from '../../components/Keadaan';
import { PanelSamping } from '../../components/PanelSamping';
import { Ubin } from '../../components/Ubin';

function UbinLayanan({ hari }: { hari: number }) {
  const { data, memuat, galat, muatUlang } = useAksi<BarisLayanan[]>('layanan', { hari });
  const baris = (Array.isArray(data) ? data : []).slice(0, 5);
  const maks = Math.max(1, ...baris.map((b) => b.jumlah));
  return (
    <Ubin judul="Layanan paling ditanya" keterangan="Dari baris Pengetahuan topik layanan" className="col-span-12 lg:col-span-6 xl:col-span-4">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {baris.length === 0 ? <Kosong judul="Belum ada data layanan." /> : (
          <motion.ol variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="space-y-3.5">
            {baris.map((b) => (
              <motion.li key={b.id} variants={ANAK_DAFTAR} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate text-zinc-800">{b.nama} <span className="font-mono text-[11px] text-zinc-400">{b.id}</span></span>
                  <span className="font-mono text-zinc-900">{angka(b.jumlah)}</span>
                </div>
                <span className="relative block h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <motion.span className="absolute inset-0 origin-left rounded-full bg-biru-500" initial={{ scaleX: 0 }} animate={{ scaleX: b.jumlah / maks }} transition={PEGAS} />
                </span>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </KeadaanData>
    </Ubin>
  );
}

function UbinTakTerjawab({ hari }: { hari: number }) {
  const { sesi } = useSesi();
  const { data, memuat, galat, muatUlang } = useAksi<Pertanyaan>('pertanyaan', { hari });
  const [pesan, setPesan] = useState<string | null>(null);
  const tutup = useCallback(() => setPesan(null), []);
  const baris = (data?.tidak_terjawab ?? []).slice(0, 5);
  return (
    <Ubin judul="Pertanyaan tidak terjawab" keterangan="Tidak ada baris Pengetahuan yang cocok" className="col-span-12 lg:col-span-6 xl:col-span-4">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {baris.length === 0 ? <Kosong judul="Semua pertanyaan terjawab dari Pengetahuan." /> : (
          <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
            {baris.map((t, i) => (
              <motion.li key={`${t.waktu}-${i}`} variants={ANAK_DAFTAR} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-zinc-800">"{t.pesan}"</span>
                  <span className="font-mono text-[11px] text-zinc-400">{umurDari(t.waktu)} lalu</span>
                </span>
                <button type="button" onClick={() => setPesan(t.pesan)} className="h-9 shrink-0 rounded-lg px-2 text-[12px] font-medium text-biru-600 hover:bg-biru-50 active:scale-[0.98]">
                  Jadikan baris
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </KeadaanData>
      <PanelSamping terbuka={pesan !== null} onTutup={tutup} judul="Jadikan baris Pengetahuan">
        {pesan !== null && (
          <FormAksi
            key={pesan}
            aksi="pengetahuan_tulis"
            kolom={KOLOM_PENGETAHUAN}
            awal={{ topik: 'umum', id: '', pertanyaan_variasi: pesan, jawaban: '' }}
            label="Simpan ke Pengetahuan"
            boleh={sesi.peran === 'admin'}
            pesanBerhasil="Tersimpan. Bot memakai paling lambat 5 menit."
          />
        )}
      </PanelSamping>
    </Ubin>
  );
}

type KunciAlur = keyof NonNullable<RingkasanV2['alur']>;
const LANGKAH: [KunciAlur, string, Icon][] = [
  ['pesan_masuk', 'Pesan masuk', ChatCircleDots],
  ['dijawab_bot', 'Dijawab bot', Sparkle],
  ['lead_tercatat', 'Lead tercatat', UserPlus],
  ['observasi_dijadwalkan', 'Observasi dijadwalkan', CalendarCheck],
  ['followup_terkirim', 'Follow-up terkirim', PaperPlaneTilt],
  ['pengingat_terkirim', 'Pengingat terkirim', BellRinging],
];

function UbinAlur({ ringkasan }: { ringkasan: RingkasanV2 | null }) {
  return (
    <Ubin judul="Alur otomatis" keterangan="Angka periode dari sheet" className="col-span-12 xl:col-span-4">
      <motion.ol variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="relative space-y-1">
        <span className="absolute bottom-5 left-5 top-5 w-px bg-zinc-200" aria-hidden="true" />
        {LANGKAH.map(([kunci, label, Ikon]) => {
          const nilai = ringkasan?.alur?.[kunci];
          const aktif = typeof nilai === 'number';
          return (
            <motion.li key={kunci} variants={ANAK_DAFTAR} className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-1.5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ring-4 ring-white ${aktif ? (kunci === 'dijawab_bot' ? 'bg-kuning-100 text-zinc-900' : 'bg-zinc-100 text-zinc-700') : 'bg-zinc-50 text-zinc-300'}`}>
                <Ikon size={20} />
              </span>
              <span className={`text-[13px] ${aktif ? 'text-zinc-800' : 'text-zinc-400'}`}>{label}</span>
              <span className={`font-mono text-[14px] ${aktif ? 'text-zinc-900' : 'text-[12px] text-zinc-400'}`}>{aktif ? angka(nilai) : 'belum aktif'}</span>
            </motion.li>
          );
        })}
      </motion.ol>
    </Ubin>
  );
}

export function BarisEmpat({ hari, ringkasan }: { hari: number; ringkasan: RingkasanV2 | null }) {
  return (
    <>
      <UbinLayanan hari={hari} />
      <UbinTakTerjawab hari={hari} />
      <UbinAlur ringkasan={ringkasan} />
    </>
  );
}
