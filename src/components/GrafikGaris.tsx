// Grafik garis biru tanpa gradien, SVG sendiri. Titik tertinggi diberi label.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { angka } from '../lib/format';

const TINGGI = 180;
const TEPI = { kiri: 8, kanan: 8, atas: 28, bawah: 24 };

function useLebar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [lebar, setLebar] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const pengamat = new ResizeObserver(([e]) => setLebar(Math.round(e.contentRect.width)));
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);
  return [ref, lebar] as const;
}

export function GrafikGaris({ deret }: { deret: { label: string; percakapan: number }[] }) {
  const [ref, lebar] = useLebar<HTMLDivElement>();
  const n = deret.length;
  const maks = Math.max(1, ...deret.map((d) => d.percakapan));
  const iMaks = deret.findIndex((d) => d.percakapan === maks);
  const x = (i: number) => TEPI.kiri + (n <= 1 ? 0 : (i / (n - 1)) * (lebar - TEPI.kiri - TEPI.kanan));
  const y = (v: number) => TEPI.atas + (1 - v / maks) * (TINGGI - TEPI.atas - TEPI.bawah);
  const jalur = deret.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.percakapan).toFixed(1)}`).join(' ');
  const langkahLabel = Math.max(1, Math.ceil(n / 6));

  return (
    <div ref={ref} className="w-full" role="img" aria-label={`Grafik percakapan, tertinggi ${maks} pada ${deret[iMaks]?.label ?? '-'}`}>
      {lebar > 0 && n > 0 && (
        <motion.svg width={lebar} height={TINGGI} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block overflow-visible">
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={TEPI.kiri} x2={lebar - TEPI.kanan} y1={y(maks * f)} y2={y(maks * f)} stroke="var(--color-zinc-200)" strokeDasharray={f ? '3 4' : undefined} />
          ))}
          <path d={jalur} fill="none" stroke="var(--color-biru-600)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {deret.map((d, i) => (
            <circle key={d.label} cx={x(i)} cy={y(d.percakapan)} r={i === iMaks ? 4 : 2.5} fill={i === iMaks ? 'var(--color-biru-600)' : 'white'} stroke="var(--color-biru-600)" strokeWidth={1.5} />
          ))}
          {iMaks >= 0 && (
            <g transform={`translate(${Math.min(Math.max(x(iMaks), 40), lebar - 40)}, ${y(maks) - 12})`}>
              <text textAnchor="middle" className="fill-zinc-900 font-mono text-[11px]">{angka(maks)} · {deret[iMaks].label}</text>
            </g>
          )}
          {deret.map((d, i) => (i % langkahLabel === 0 || i === n - 1) && (
            <text key={`l-${d.label}`} x={x(i)} y={TINGGI - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-zinc-400 font-mono text-[10px]">
              {d.label}
            </text>
          ))}
        </motion.svg>
      )}
    </div>
  );
}
