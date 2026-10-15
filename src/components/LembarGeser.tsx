// Lembar geser dari bawah untuk layar < 768px. Tarik ke bawah atau ketuk latar untuk menutup.
import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { PEGAS } from '../lib/gerak';

const AMBANG_TUTUP_PX = 120;

interface LembarGeserProps {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  children: ReactNode;
  kelasLayar?: string;
}

export function LembarGeser({ terbuka, onTutup, judul, children, kelasLayar = 'md:hidden' }: LembarGeserProps) {
  useEffect(() => {
    if (!terbuka) return;
    const tekan = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', tekan);
    return () => {
      window.removeEventListener('keydown', tekan);
      document.body.style.overflow = overflowLama;
    };
  }, [terbuka, onTutup]);

  function lepasTarik(_: unknown, info: PanInfo) {
    if (info.offset.y > AMBANG_TUTUP_PX || info.velocity.y > 600) onTutup();
  }

  return (
    <AnimatePresence>
      {terbuka && (
        <div className={`fixed inset-0 z-40 ${kelasLayar}`}>
          <motion.div
            className="absolute inset-0 bg-zinc-900/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onTutup}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={judul}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-[0_-12px_40px_-12px_rgba(24,24,27,0.18)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={PEGAS}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={lepasTarik}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-zinc-300" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-base font-medium">{judul}</h2>
              <button
                type="button"
                onClick={onTutup}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 active:scale-[0.98] hover:bg-zinc-100"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
