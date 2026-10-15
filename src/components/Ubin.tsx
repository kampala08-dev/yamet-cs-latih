import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { ANAK_UBIN } from '../lib/gerak';
import { pindah } from '../lib/rute';

interface UbinProps {
  judul?: string;
  keterangan?: string;
  lihatSemua?: string;
  aksi?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Ubin({ judul, keterangan, lihatSemua, aksi, className = '', children }: UbinProps) {
  return (
    <motion.section
      variants={ANAK_UBIN}
      className={`min-w-0 rounded-3xl border border-zinc-200/60 bg-white p-5 shadow-[0_20px_40px_-24px_rgba(39,39,42,0.12)] sm:p-6 ${className}`}
    >
      {(judul || aksi || lihatSemua) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {judul && <h2 className="text-[15px] font-medium tracking-tight text-zinc-900">{judul}</h2>}
            {keterangan && <p className="mt-0.5 text-[12px] text-zinc-500">{keterangan}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {aksi}
            {lihatSemua && (
              <a
                href={lihatSemua}
                onClick={(e) => { e.preventDefault(); pindah(lihatSemua); }}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-biru-600 hover:bg-biru-50 active:scale-[0.98]"
              >
                Lihat semua <ArrowRight size={20} />
              </a>
            )}
          </div>
        </div>
      )}
      {children}
    </motion.section>
  );
}
