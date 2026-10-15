// Saring percakapan: Semua | Lead | Klien aktif (bidang `jenis` dari aksi percakapan).
import type { BarisPercakapan } from '../lib/tipe';

export type FilterJenis = 'semua' | 'lead' | 'klien';

const PILIHAN: [FilterJenis, string][] = [['semua', 'Semua'], ['lead', 'Lead'], ['klien', 'Klien aktif']];

export function cocokJenis(p: BarisPercakapan, f: FilterJenis) {
  return f === 'semua' || (p.jenis ?? 'lead') === f;
}

export function PilihJenis({ nilai, onUbah }: { nilai: FilterJenis; onUbah: (f: FilterJenis) => void }) {
  return (
    <div className="mb-3 inline-flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Jenis percakapan">
      {PILIHAN.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={nilai === k}
          onClick={() => onUbah(k)}
          className={`h-9 rounded-lg px-3 text-[12px] font-medium active:scale-[0.98] ${nilai === k ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.08)]' : 'text-zinc-600'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
