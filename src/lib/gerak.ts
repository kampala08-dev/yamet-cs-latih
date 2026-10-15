// Satu sumber parameter gerak.
export const PEGAS = { type: 'spring', stiffness: 100, damping: 20 } as const;

export const INDUK_DAFTAR = {
  awal: {},
  tampil: { transition: { staggerChildren: 0.04 } },
};

export const ANAK_DAFTAR = {
  awal: { opacity: 0, y: 6 },
  tampil: { opacity: 1, y: 0, transition: PEGAS },
};

export const INDUK_UBIN = {
  awal: {},
  tampil: { transition: { staggerChildren: 0.05 } },
};

export const ANAK_UBIN = {
  awal: { opacity: 0, y: 12 },
  tampil: { opacity: 1, y: 0, transition: PEGAS },
};
