// Tombol pilih tampilan "Corong | Tahap", diingat per lokasi di localStorage (kenyamanan per peramban saja).
import { useState } from 'react';

export type Tampilan = 'corong' | 'tahap';

function baca(kunci: string, bawaan: Tampilan): Tampilan {
  try {
    const v = localStorage.getItem(kunci);
    return v === 'corong' || v === 'tahap' ? v : bawaan;
  } catch {
    return bawaan;
  }
}

export function useTampilan(kunci: string, bawaan: Tampilan) {
  const [nilai, setNilai] = useState<Tampilan>(() => baca(kunci, bawaan));
  function ubah(v: Tampilan) {
    setNilai(v);
    try {
      localStorage.setItem(kunci, v);
    } catch {
      // Penyimpanan tidak tersedia (mode privat): pilihan berlaku sampai halaman ditutup.
    }
  }
  return [nilai, ubah] as const;
}

export function PilihTampilan({ nilai, onUbah }: { nilai: Tampilan; onUbah: (v: Tampilan) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Tampilan pipeline">
      {(['corong', 'tahap'] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={nilai === v}
          onClick={() => onUbah(v)}
          className={`h-9 rounded-lg px-3 text-[12px] font-medium capitalize active:scale-[0.98] ${nilai === v ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(24,24,27,0.08)]' : 'text-zinc-600'}`}
        >
          {v === 'corong' ? 'Corong' : 'Tahap'}
        </button>
      ))}
    </div>
  );
}
