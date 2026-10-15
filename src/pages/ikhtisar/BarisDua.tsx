// Baris 2 (5/4/3): Jadwal hari ini, Kotak masuk percakapan, Perlu tindakan.
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ANAK_DAFTAR, INDUK_DAFTAR } from '../../lib/gerak';
import { inisial, umurDari } from '../../lib/format';
import { useAksi } from '../../lib/useAksi';
import type { BarisJadwal, BarisPercakapan, PerluTindakan } from '../../lib/tipe';
import { Chip } from '../../components/Chip';
import { DaftarTindakan } from '../../components/DaftarTindakan';
import { KeadaanData, Kosong } from '../../components/Keadaan';
import { PanelSamping } from '../../components/PanelSamping';
import { PilihJenis, cocokJenis, type FilterJenis } from '../../components/PilihJenis';
import { Transkrip } from '../../components/Transkrip';
import { Ubin } from '../../components/Ubin';

function tanggalLokal(offsetHari: number) {
  const d = new Date(Date.now() + offsetHari * 86_400_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function BarisJadwalItem({ j }: { j: BarisJadwal }) {
  return (
    <motion.li variants={ANAK_DAFTAR} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 py-3">
      <span className="font-mono text-[14px] text-zinc-900">{j.jam ? j.jam.replace(':', '.') : '--.--'}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-zinc-900">{j.nama_anak || j.nama_ortu}</span>
        <span className="block truncate text-[12px] text-zinc-500">{j.jenis}{j.nama_anak ? ` · ${j.nama_ortu}` : ''}</span>
      </span>
      {j.terlewat ? <Chip nada="netral">Terlewat</Chip> : <Chip nada={j.pengingat === 'terkirim' ? 'hijau' : 'redup'}>{j.pengingat === 'terkirim' ? 'Pengingat terkirim' : 'Pengingat belum'}</Chip>}
    </motion.li>
  );
}

function UbinJadwal() {
  const { data, memuat, galat, muatUlang } = useAksi<BarisJadwal[]>('jadwal', { hari_ke_depan: 2 });
  const baris = Array.isArray(data) ? data : [];
  const grup: [string, BarisJadwal[]][] = [
    ['Hari ini', baris.filter((j) => j.tanggal === tanggalLokal(0))],
    ['Besok', baris.filter((j) => j.tanggal === tanggalLokal(1))],
  ];
  return (
    <Ubin judul="Jadwal hari ini" keterangan="Observasi dan asesmen hari ini dan besok" lihatSemua="/jadwal" className="col-span-12 lg:col-span-6 xl:col-span-5">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {baris.length === 0 ? (
          <Kosong judul="Belum ada observasi terjadwal." isi="Lead berstatus Observasi dijadwalkan dengan tanggal observasi muncul di sini." />
        ) : (
          grup.map(([judul, isi]) => (
            <div key={judul} className="mb-2 last:mb-0">
              <h3 className="text-[12px] font-medium text-zinc-500">{judul} <span className="font-mono text-zinc-400">{isi.length}</span></h3>
              {isi.length === 0 ? <p className="py-3 text-[13px] text-zinc-400">Tidak ada jadwal.</p> : (
                <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="divide-y divide-zinc-100">
                  {isi.map((j) => <BarisJadwalItem key={j.id} j={j} />)}
                </motion.ul>
              )}
            </div>
          ))
        )}
      </KeadaanData>
    </Ubin>
  );
}

export function BarisPercakapanItem({ p, onPilih, aktif = false }: { p: BarisPercakapan; onPilih: (p: BarisPercakapan) => void; aktif?: boolean }) {
  const nada = p.status === 'Bot' ? 'biru' : p.status === 'Eskalasi' ? 'bata' : 'netral';
  return (
    <motion.li variants={ANAK_DAFTAR}>
      <button type="button" onClick={() => onPilih(p)} aria-pressed={aktif} className={`grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-zinc-50 active:scale-[0.99] ${aktif ? 'bg-kuning-50 ring-1 ring-kuning-200' : ''}`}>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 font-mono text-[12px] text-zinc-600">{p.nama ? inisial(p.nama) : '#'}</span>
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-zinc-900">{p.nama || <span className="font-mono">{p.nomor_samar}</span>}</span>
            {p.jenis === 'klien' && <Chip nada="hijau">Klien</Chip>}
          </span>
          <span className="block truncate text-[12px] text-zinc-500">{p.pesan_terakhir}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="font-mono text-[11px] text-zinc-400">{umurDari(p.waktu)}</span>
          <Chip nada={nada}>{p.status}</Chip>
        </span>
      </button>
    </motion.li>
  );
}

function UbinKotakMasuk() {
  const { data, memuat, galat, muatUlang } = useAksi<BarisPercakapan[]>('percakapan', { hari: 1 });
  const [dipilih, setDipilih] = useState<BarisPercakapan | null>(null);
  const [jenis, setJenis] = useState<FilterJenis>('semua');
  const tutup = useCallback(() => setDipilih(null), []);
  const baris = (Array.isArray(data) ? data : []).filter((p) => cocokJenis(p, jenis)).slice(0, 8);
  return (
    <Ubin judul="Kotak masuk" keterangan="8 percakapan terakhir" lihatSemua="/percakapan" className="col-span-12 lg:col-span-6 xl:col-span-4">
      <PilihJenis nilai={jenis} onUbah={setJenis} />
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {baris.length === 0 ? <Kosong judul={jenis === 'semua' ? 'Belum ada percakapan hari ini.' : 'Tidak ada percakapan jenis ini hari ini.'} /> : (
          <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="-mx-2 space-y-0.5">
            {baris.map((p) => <BarisPercakapanItem key={p.nomor_hash} p={p} onPilih={setDipilih} />)}
          </motion.ul>
        )}
      </KeadaanData>
      <PanelSamping terbuka={Boolean(dipilih)} onTutup={tutup} judul={dipilih?.nama || dipilih?.nomor_samar || 'Percakapan'}>
        {dipilih && <Transkrip key={dipilih.nomor_hash} p={dipilih} />}
      </PanelSamping>
    </Ubin>
  );
}

function UbinTindakan() {
  const { data, memuat, galat, muatUlang, ganti } = useAksi<PerluTindakan>('perlu_tindakan');
  return (
    <Ubin judul="Perlu tindakan" lihatSemua="/eskalasi" className="col-span-12 xl:col-span-3">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        {data && <DaftarTindakan data={data} ganti={ganti} ringkas />}
      </KeadaanData>
    </Ubin>
  );
}

export function BarisDua() {
  return (
    <>
      <UbinJadwal />
      <UbinKotakMasuk />
      <UbinTindakan />
    </>
  );
}
