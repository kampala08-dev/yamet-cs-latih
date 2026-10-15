// Eskalasi: daftar lengkap (aksi eskalasi_daftar, usulan U1.7) dengan status, admin, waktu selesai.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { INDUK_UBIN } from '../lib/gerak';
import { tanggalJam } from '../lib/format';
import { useAksi } from '../lib/useAksi';
import type { BarisEskalasi, PerluTindakan } from '../lib/tipe';
import { DaftarTindakan } from '../components/DaftarTindakan';
import { HeaderHalaman, IsiHalaman } from '../components/HeaderHalaman';
import { KeadaanData, Kosong } from '../components/Keadaan';
import { Ubin } from '../components/Ubin';

const FILTER = ['Semua', 'Terbuka', 'Diambil', 'Selesai'] as const;

export function Eskalasi() {
  const [filter, setFilter] = useState<(typeof FILTER)[number]>('Semua');
  const daftar = useAksi<BarisEskalasi[]>('eskalasi_daftar', { hari: 30 });
  const tindakan = useAksi<PerluTindakan>('perlu_tindakan');
  const baris = (Array.isArray(daftar.data) ? daftar.data : []).filter((e) => filter === 'Semua' || e.status === filter);

  return (
    <IsiHalaman>
      <HeaderHalaman judul="Eskalasi" keterangan="Percakapan yang diteruskan bot ke admin. Bot berhenti untuk nomor itu sampai status Selesai." />
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <Ubin judul="Perlu tindakan" className="col-span-12 xl:col-span-5">
          <KeadaanData memuat={tindakan.memuat} galat={tindakan.galat} adaData={Boolean(tindakan.data)} muatUlang={tindakan.muatUlang}>
            {tindakan.data && <DaftarTindakan data={tindakan.data} ganti={tindakan.ganti} />}
          </KeadaanData>
        </Ubin>
        <Ubin
          judul="Riwayat 30 hari"
          className="col-span-12 xl:col-span-7"
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
          <KeadaanData memuat={daftar.memuat} galat={daftar.galat} adaData={Boolean(daftar.data)} muatUlang={daftar.muatUlang}>
            {baris.length === 0 ? <Kosong judul="Tidak ada eskalasi dengan status ini." /> : (
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[34rem] text-left text-[13px]">
                  <thead className="text-[12px] text-zinc-500">
                    <tr className="border-b border-zinc-200">
                      <th className="py-2 pr-3 font-medium">Masuk</th>
                      <th className="py-2 pr-3 font-medium">Alasan</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Admin</th>
                      <th className="py-2 font-medium">Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {baris.map((e) => {
                      const terbuka = e.status === 'Terbuka';
                      return (
                        <tr key={e.id || e.waktu}>
                          <td className="py-3 pr-3 align-top font-mono text-[12px] text-zinc-500">{tanggalJam(e.waktu)}</td>
                          <td className="py-3 pr-3 align-top"><span className="text-zinc-900">{e.alasan}</span><span className="block text-[12px] text-zinc-500">prioritas {e.prioritas || '-'}</span></td>
                          <td className="py-3 pr-3 align-top"><span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ring-1 ring-inset ${terbuka ? 'bg-bata-50 text-bata-700 ring-bata-200' : e.status === 'Selesai' ? 'bg-lumut-50 text-lumut-700 ring-lumut-200' : 'bg-zinc-100 text-zinc-700 ring-zinc-200'}`}>{e.status}</span></td>
                          <td className="py-3 pr-3 align-top text-zinc-700">{e.admin || '-'}</td>
                          <td className="py-3 align-top font-mono text-[12px] text-zinc-500">{e.waktu_selesai ? tanggalJam(e.waktu_selesai) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </KeadaanData>
        </Ubin>
      </motion.div>
    </IsiHalaman>
  );
}
