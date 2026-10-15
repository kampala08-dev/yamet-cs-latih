import { memo } from 'react';
import { motion } from 'framer-motion';

// Satu-satunya gerak berkelanjutan di aplikasi: titik status bot yang berdenyut pelan.
export const TitikAktif = memo(function TitikAktif({ aktif }: { aktif: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
      {aktif && (
        <motion.span
          className="absolute inset-0 rounded-full bg-lumut-600"
          initial={{ scale: 1, opacity: 0.45 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${aktif ? 'bg-lumut-600' : 'bg-zinc-400'}`} />
    </span>
  );
});
