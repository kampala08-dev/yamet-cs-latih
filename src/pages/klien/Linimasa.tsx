// Linimasa gabungan satu anak, urut waktu terbaru di atas.
import { motion } from 'framer-motion';
import { ArrowsClockwise, CalendarX, ChatsCircle, Star, WarningCircle, type Icon } from '@phosphor-icons/react';
import { ANAK_DAFTAR, INDUK_DAFTAR } from '../../lib/gerak';
import { tanggalJam } from '../../lib/format';
import type { BarisEskalasi, BarisJamGanti, BarisLog, BarisUmpanBalik } from '../../lib/tipe';
import { Chip } from '../../components/Chip';
import type { Nada } from '../../lib/status';

interface Peristiwa {
  kunci: string;
  waktu: string;
  ikon: Icon;
  warnaIkon: string;
  judul: string;
  isi: string;
  chip?: { teks: string; nada: Nada };
}

export function susunLinimasa(log: BarisLog[], jamGanti: BarisJamGanti[], eskalasi: BarisEskalasi[], umpanBalik: BarisUmpanBalik[]): Peristiwa[] {
  const hasil: Peristiwa[] = [];
  // Percakapan biasa dikelompokkan per tanggal supaya linimasa tidak penuh pesan satu per satu.
  const perTanggal = new Map<string, BarisLog[]>();
  for (const r of log) {
    if (r.topik === 'izin') continue;
    const t = r.waktu.slice(0, 10);
    perTanggal.set(t, [...(perTanggal.get(t) || []), r]);
  }
  for (const [t, baris] of perTanggal) {
    const masuk = baris.filter((r) => r.arah === 'masuk');
    const akhir = baris[baris.length - 1];
    hasil.push({ kunci: `p-${t}`, waktu: akhir.waktu, ikon: ChatsCircle, warnaIkon: 'bg-biru-50 text-biru-600', judul: `Percakapan · ${baris.length} pesan`, isi: (masuk[masuk.length - 1] || akhir).pesan });
  }
  log.filter((r) => r.topik === 'izin' && r.arah === 'masuk').forEach((r, i) =>
    hasil.push({ kunci: `i-${i}-${r.waktu}`, waktu: r.waktu, ikon: CalendarX, warnaIkon: 'bg-zinc-100 text-zinc-700', judul: 'Izin', isi: r.pesan }),
  );
  jamGanti.forEach((j, i) =>
    hasil.push({
      kunci: `j-${j.id || i}`, waktu: j.waktu, ikon: ArrowsClockwise, warnaIkon: 'bg-zinc-100 text-zinc-700', judul: `Jam ganti ${j.program || ''}`.trim(),
      isi: `${j.sesi_asal} ke ${j.jam_diminta}${j.alasan ? ` · ${j.alasan}` : ''}`,
      chip: { teks: j.status, nada: j.status === 'Selesai' || j.status === 'Disetujui' ? 'hijau' : j.status === 'Ditolak' ? 'redup' : 'netral' },
    }),
  );
  eskalasi.forEach((e, i) =>
    hasil.push({
      kunci: `e-${e.id || i}`, waktu: e.waktu, ikon: WarningCircle, warnaIkon: e.status === 'Selesai' ? 'bg-zinc-100 text-zinc-700' : 'bg-bata-50 text-bata-600', judul: 'Eskalasi',
      isi: `${e.alasan}${e.admin ? ` · ditangani ${e.admin}` : ''}`,
      chip: { teks: e.status, nada: e.status === 'Selesai' ? 'hijau' : 'bata' },
    }),
  );
  umpanBalik.forEach((u, i) =>
    hasil.push({
      kunci: `u-${i}-${u.waktu}`, waktu: u.waktu, ikon: Star, warnaIkon: 'bg-zinc-100 text-zinc-700', judul: `Umpan balik · skor ${u.skor}`,
      isi: u.komentar || 'tanpa komentar', chip: { teks: `skor ${u.skor}`, nada: Number(u.skor) <= 3 ? 'bata' : 'hijau' },
    }),
  );
  return hasil.sort((a, b) => b.waktu.localeCompare(a.waktu));
}

export function Linimasa({ peristiwa }: { peristiwa: Peristiwa[] }) {
  if (!peristiwa.length) return <p className="py-4 text-[13px] text-zinc-500">Belum ada riwayat untuk anak ini.</p>;
  return (
    <motion.ol variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="relative space-y-1">
      <span className="absolute bottom-4 left-5 top-4 w-px bg-zinc-200" aria-hidden="true" />
      {peristiwa.map((p) => {
        const Ikon = p.ikon;
        return (
          <motion.li key={p.kunci} variants={ANAK_DAFTAR} className="relative grid grid-cols-[2.5rem_1fr] gap-3 py-2">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ring-4 ring-white ${p.warnaIkon}`}><Ikon size={20} /></span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-zinc-900">{p.judul}</span>
                {p.chip && <Chip nada={p.chip.nada}>{p.chip.teks}</Chip>}
                <span className="ml-auto font-mono text-[11px] text-zinc-400">{tanggalJam(p.waktu)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-zinc-600">{p.isi}</p>
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
