import type { ReactNode } from 'react';
import type { Rentang } from '../lib/tipe';

export function HeaderHalaman({ judul, keterangan, children }: { judul: ReactNode; keterangan?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-900">{judul}</h1>
        {keterangan && <p className="mt-1 text-[14px] text-zinc-500">{keterangan}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

const PILIHAN: [Rentang, string][] = [['hari', 'Hari ini'], ['7', '7 hari'], ['30', '30 hari']];

export function PemilihRentang({ nilai, onUbah }: { nilai: Rentang; onUbah: (r: Rentang) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Rentang waktu">
      {PILIHAN.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={nilai === k}
          onClick={() => onUbah(k)}
          className={`h-9 rounded-lg px-3 text-[13px] font-medium active:scale-[0.98] ${nilai === k ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.08)]' : 'text-zinc-600'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// Ruang bawah untuk tab bar HP.
export function IsiHalaman({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>;
}
