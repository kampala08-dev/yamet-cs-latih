import { memo, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import { angka } from '../lib/format';

// Angka metrik berhitung naik sekali saat muat. Diperbarui lewat ref, bukan state React.
export const AngkaNaik = memo(function AngkaNaik({ nilai, desimal = 0 }: { nilai: number; desimal?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const kendali = animate(0, nilai, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = angka(v, desimal); },
    });
    return () => kendali.stop();
  }, [nilai, desimal]);
  return <span ref={ref}>{angka(nilai, desimal)}</span>;
});
