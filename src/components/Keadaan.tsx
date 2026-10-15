// Tiga keadaan wajib: kerangka (memuat), kosong, galat inline.
import type { ReactNode } from 'react';
import { ArrowClockwise, WarningCircle } from '@phosphor-icons/react';
import { Tombol } from './Tombol';

export function Kerangka({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-zinc-200/70 ${className}`} aria-hidden="true">
      <div className="absolute inset-y-0 left-0 w-1/3 animate-kilau bg-white/45" />
    </div>
  );
}

// Baris kerangka seukuran baris daftar nyata (tinggi ~56px).
export function KerangkaBaris({ jumlah = 4, kolom = 'grid-cols-[3.5rem_1fr_5rem]' }: { jumlah?: number; kolom?: string }) {
  return (
    <div className="divide-y divide-zinc-200" role="status" aria-label="Memuat">
      {Array.from({ length: jumlah }, (_, i) => (
        <div key={i} className={`grid ${kolom} items-center gap-4 py-4`}>
          <Kerangka className="h-3.5" />
          <div className="space-y-2">
            <Kerangka className="h-3.5 w-2/5" />
            <Kerangka className="h-3 w-4/5" />
          </div>
          <Kerangka className="h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function GalatInline({ pesan, onCobaLagi }: { pesan: string; onCobaLagi?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-bata-200 bg-bata-50 px-4 py-3 text-sm text-bata-700 sm:flex-row sm:items-center">
      <WarningCircle size={20} className="shrink-0" />
      <p className="min-w-0 flex-1 leading-relaxed">{pesan}</p>
      {onCobaLagi && (
        <Tombol ukuran="kecil" onClick={onCobaLagi} ikon={<ArrowClockwise size={20} />}>
          Coba lagi
        </Tombol>
      )}
    </div>
  );
}

export function Kosong({ judul, isi, aksi }: { judul: string; isi?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 border-y border-dashed border-zinc-300 py-8">
      <p className="text-sm font-medium text-zinc-800">{judul}</p>
      {isi && <div className="max-w-[60ch] text-sm leading-relaxed text-zinc-500">{isi}</div>}
      {aksi}
    </div>
  );
}

// Pembungkus keadaan data satu ubin: kerangka saat memuat pertama, galat inline, lalu isi.
export function KeadaanData({ memuat, galat, adaData, muatUlang, kerangka, children }: {
  memuat: boolean;
  galat: string;
  adaData: boolean;
  muatUlang: () => void;
  kerangka?: ReactNode;
  children: ReactNode;
}) {
  if (galat) return <GalatInline pesan={galat} onCobaLagi={muatUlang} />;
  if (memuat && !adaData) return <>{kerangka ?? <KerangkaBaris jumlah={3} />}</>;
  return <>{children}</>;
}
