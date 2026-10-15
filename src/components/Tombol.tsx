import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Varian = 'utama' | 'garis' | 'hantu' | 'gelap';
type Ukuran = 'kecil' | 'sedang' | 'besar';

interface TombolProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian;
  ukuran?: Ukuran;
  ikon?: ReactNode;
}

const GAYA: Record<Varian, string> = {
  utama: 'bg-kuning-400 text-zinc-900 hover:bg-kuning-200 border border-kuning-600/30',
  gelap: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 border border-zinc-900',
  garis: 'bg-white text-zinc-800 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
  hantu: 'bg-transparent text-zinc-700 border border-transparent hover:bg-zinc-100',
};

const UKURAN: Record<Ukuran, string> = {
  kecil: 'h-9 px-3 text-[13px] gap-1.5',
  sedang: 'h-10 px-4 text-sm gap-2',
  besar: 'h-11 px-5 text-sm gap-2',
};

export function Tombol({ varian = 'garis', ukuran = 'sedang', ikon, className = '', children, type = 'button', ...lain }: TombolProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-xl font-medium transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${GAYA[varian]} ${UKURAN[ukuran]} ${className}`}
      {...lain}
    >
      {ikon}
      {children}
    </button>
  );
}
