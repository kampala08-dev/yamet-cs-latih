// Corong lead (SVG sendiri): tingkat trapesium per tahap, lebar ~ jumlah lead yang pernah mencapai tahap itu (kumulatif).
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PEGAS } from '../lib/gerak';
import { angka, msDariWaktu } from '../lib/format';
import type { DataPipeline, TahapPipeline } from '../lib/tipe';

const TINGGI = 56;
const LEBAR_MIN = 30; // % — agar nama tahap tetap terbaca pada tingkat kecil
// Bertingkat tanpa gradient CSS; tingkat terakhir hijau.
const WARNA = [
  { isi: 'var(--color-zinc-200)', teks: 'text-zinc-900' },
  { isi: 'var(--color-biru-100)', teks: 'text-zinc-900' },
  { isi: 'var(--color-biru-200)', teks: 'text-zinc-900' },
  { isi: 'var(--color-biru-400)', teks: 'text-zinc-900' },
  { isi: 'var(--color-biru-600)', teks: 'text-white' },
  { isi: 'var(--color-lumut-600)', teks: 'text-white' },
];

const INDUK = { awal: {}, tampil: { transition: { staggerChildren: 0.06 } } };
const BARIS = { awal: { opacity: 0, y: -8 }, tampil: { opacity: 1, y: 0, transition: PEGAS } };
const BENTUK = { awal: { scaleX: 0 }, tampil: { scaleX: 1, transition: PEGAS } };

interface Tingkat {
  status: string;
  kumulatif: number;
  konversi: number | null;
  pertama: boolean;
  medianJam: number | null;
}

function median(a: number[]) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

// Bila n8n belum mengirim `kumulatif`, dihitung dari jumlah per status dengan asumsi urutan tahap
// (lead di tahap lebih lanjut pernah melewati semua tahap sebelumnya). Lihat uji/U1.7-laporan.md.
export function susunTingkat(tahap: TahapPipeline[], sekarang = Date.now()): Tingkat[] {
  const kum = tahap.map((t, i) => (typeof t.kumulatif === 'number' ? t.kumulatif : tahap.slice(i).reduce((a, x) => a + (x.jumlah || 0), 0)));
  return tahap.map((t, i) => {
    const dariLead = (t.teratas || []).map((l) => (sekarang - msDariWaktu(l.status_diubah || '')) / 3_600_000).filter((x) => Number.isFinite(x) && x >= 0);
    return {
      status: t.status,
      kumulatif: kum[i],
      // konversi_pct = dari tahap sebelumnya; bila belum dikirim, dihitung dari kumulatif.
      konversi: typeof t.konversi_pct === 'number' ? t.konversi_pct : i === 0 || !kum[i - 1] ? null : (kum[i] / kum[i - 1]) * 100,
      pertama: i === 0,
      medianJam: typeof t.umur_median_jam === 'number' ? t.umur_median_jam : median(dariLead),
    };
  });
}

function teksUmur(jam: number | null) {
  if (jam === null) return 'umur -';
  return jam < 24 ? `median ${Math.round(jam)} jam` : `median ${angka(jam / 24, 1)} hr`;
}

export function GrafikCorong({ data }: { data: DataPipeline }) {
  const [sorot, setSorot] = useState(-1);
  const tingkat = susunTingkat(data.tahap || []);
  const maks = Math.max(1, ...tingkat.map((t) => t.kumulatif));
  const lebar = (n: number) => LEBAR_MIN + (100 - LEBAR_MIN) * (n / maks);

  // Tata letak mengikuti lebar wadah (container query), bukan lebar layar: ubin Ikhtisar dan halaman Pipeline beda lebar.
  return (
    <div className="@container">
      <motion.ol variants={INDUK} initial="awal" animate="tampil" className="space-y-1.5" onMouseLeave={() => setSorot(-1)}>
        {tingkat.map((t, i) => {
          const atas = lebar(t.kumulatif);
          const bawah = i < tingkat.length - 1 ? lebar(tingkat[i + 1].kumulatif) : atas * 0.82;
          const tepiKanan = 50 + (atas + bawah) / 4;
          const w = WARNA[i] ?? WARNA[WARNA.length - 1];
          const aktif = sorot === i;
          return (
            <motion.li key={t.status} variants={BARIS} onMouseEnter={() => setSorot(i)} className="grid gap-2 @xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @xl:items-center @xl:gap-0">
              <div className="relative" style={{ height: TINGGI }}>
                <motion.div variants={BENTUK} className="absolute inset-0 origin-center">
                  <svg viewBox={`0 0 100 ${TINGGI}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                    <polygon
                      points={`${50 - atas / 2},0 ${50 + atas / 2},0 ${50 + bawah / 2},${TINGGI} ${50 - bawah / 2},${TINGGI}`}
                      fill={w.isi}
                      stroke={aktif ? 'var(--color-zinc-900)' : 'none'}
                      strokeWidth={aktif ? 0.6 : 0}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </motion.div>
                <span className={`absolute inset-0 flex items-center justify-center gap-2 px-2 text-[13px] ${w.teks}`}>
                  <span className="truncate font-medium">{t.status}</span>
                  <span className="font-mono">{angka(t.kumulatif)}</span>
                </span>
                <span className="absolute top-1/2 hidden border-t border-dashed border-zinc-300 @xl:block" style={{ left: `${tepiKanan}%`, right: 0 }} aria-hidden="true" />
              </div>
              <div>
                <span
                  className={`flex w-full flex-wrap items-center gap-x-3 gap-y-0.5 rounded-2xl border px-4 py-2 @3xl:rounded-full text-[12px] transition-colors @xl:inline-flex @xl:w-auto ${aktif ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-white'}`}
                >
                  <span className="hidden font-medium text-zinc-900 @xl:inline">{t.status}</span>
                  <span className="font-mono text-zinc-600">{t.pertama ? 'titik masuk' : t.konversi === null ? 'konversi -' : `${angka(t.konversi, 1)}% dari sebelumnya`}</span>
                  <span className="font-mono text-zinc-400">{teksUmur(t.medianJam)}</span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
      <p className="mt-4 text-[12px] text-zinc-500">
        Hilang: <span className="font-mono text-zinc-700">{angka(data.hilang?.jumlah ?? 0)}</span>
        {data.hilang?.alasan_terbanyak ? <>, alasan terbanyak: {data.hilang.alasan_terbanyak}</> : null}
        <span className="text-zinc-400"> · lebar tingkat = lead yang pernah mencapai tahap itu</span>
      </p>
    </div>
  );
}
