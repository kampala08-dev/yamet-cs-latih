import type { ReactNode } from 'react';
import { nadaStatus, normalStatus, type Nada } from '../lib/status';

const GAYA: Record<Nada, string> = {
  netral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  biru: 'bg-biru-50 text-biru-700 ring-biru-100',
  hijau: 'bg-lumut-50 text-lumut-700 ring-lumut-200',
  bata: 'bg-bata-50 text-bata-700 ring-bata-200',
  ambar: 'bg-ambar-50 text-ambar-700 ring-ambar-200',
  kuning: 'bg-kuning-100 text-zinc-900 ring-kuning-200',
  redup: 'bg-white text-zinc-500 ring-zinc-200',
};

export function Chip({ nada = 'netral', children }: { nada?: Nada; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 ring-inset ${GAYA[nada]}`}>
      {children}
    </span>
  );
}

export function ChipStatus({ status }: { status: string }) {
  const n = normalStatus(status || '-');
  return <Chip nada={nadaStatus(n)}>{n}</Chip>;
}
