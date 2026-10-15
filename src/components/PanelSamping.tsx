// Panel melayang: kartu di kanan pada layar >= 1024px, lembar geser dari bawah di bawahnya.
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { PEGAS } from '../lib/gerak';
import { useLayar } from '../lib/useLayar';
import { LembarGeser } from './LembarGeser';

interface PanelSampingProps {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  children: ReactNode;
}

export function PanelSamping({ terbuka, onTutup, judul, children }: PanelSampingProps) {
  // Hanya satu bentuk yang hidup: kartu samping di layar lebar, lembar geser di bawahnya.
  const lebar = useLayar('(min-width: 1024px)');
  useEffect(() => {
    if (!terbuka || !lebar) return undefined;
    const tekan = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    window.addEventListener('keydown', tekan);
    return () => window.removeEventListener('keydown', tekan);
  }, [terbuka, lebar, onTutup]);

  return (
    <>
      <AnimatePresence>
        {terbuka && lebar && (
          <motion.aside
            role="dialog"
            aria-label={judul}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={PEGAS}
            className="fixed bottom-4 right-4 top-4 z-40 flex w-[440px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_48px_-20px_rgba(39,39,42,0.35)] lg:flex"
          >
            <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-5">
              <h2 className="min-w-0 text-base font-medium">{judul}</h2>
              <button type="button" onClick={onTutup} aria-label="Tutup" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 active:scale-[0.98]">
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          </motion.aside>
        )}
      </AnimatePresence>
      <LembarGeser terbuka={terbuka && !lebar} onTutup={onTutup} judul={judul} kelasLayar="">
        {children}
      </LembarGeser>
    </>
  );
}
