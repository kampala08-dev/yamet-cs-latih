// Baris 1: empat ubin metrik dengan angka mono yang berhitung naik dan delta vs periode sebelumnya.
import { CalendarCheck, ChatsCircle, TrendDown, TrendUp, UserPlus, WarningCircle, type Icon } from '@phosphor-icons/react';
import { angka } from '../../lib/format';
import type { RingkasanV2 } from '../../lib/tipe';
import { AngkaNaik } from '../../components/AngkaNaik';
import { GalatInline, Kerangka } from '../../components/Keadaan';
import { Ubin } from '../../components/Ubin';

type Kunci = 'percakapan' | 'lead_baru' | 'eskalasi_terbuka' | 'observasi_dijadwalkan';

const METRIK: { kunci: Kunci; label: string; ikon: Icon; warnaIkon: string; dibalik?: boolean }[] = [
  { kunci: 'percakapan', label: 'Percakapan', ikon: ChatsCircle, warnaIkon: 'bg-biru-50 text-biru-600' },
  { kunci: 'lead_baru', label: 'Lead baru', ikon: UserPlus, warnaIkon: 'bg-zinc-100 text-zinc-700' },
  { kunci: 'eskalasi_terbuka', label: 'Eskalasi terbuka', ikon: WarningCircle, warnaIkon: 'bg-bata-50 text-bata-600', dibalik: true },
  { kunci: 'observasi_dijadwalkan', label: 'Observasi dijadwalkan', ikon: CalendarCheck, warnaIkon: 'bg-lumut-50 text-lumut-700' },
];

function Delta({ kini, lalu, dibalik }: { kini: number; lalu?: number; dibalik?: boolean }) {
  if (typeof lalu !== 'number') return <span className="text-[12px] text-zinc-400">tanpa pembanding</span>;
  const selisih = kini - lalu;
  if (selisih === 0) return <span className="font-mono text-[12px] text-zinc-500">sama dengan periode lalu</span>;
  const naik = selisih > 0;
  const baik = dibalik ? !naik : naik;
  const pct = lalu ? Math.abs((selisih / lalu) * 100) : null;
  const Ikon = naik ? TrendUp : TrendDown;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[12px] ${baik ? 'text-lumut-700' : 'text-bata-700'}`}>
      <Ikon size={20} />
      {naik ? '+' : '-'}{angka(Math.abs(selisih))}{pct !== null ? ` (${angka(pct, 1)}%)` : ''}
      <span className="font-sans text-zinc-400">vs lalu</span>
    </span>
  );
}

export function BarisMetrik({ data, memuat, galat, muatUlang }: { data: RingkasanV2 | null; memuat: boolean; galat: string; muatUlang: () => void }) {
  if (galat) {
    return <Ubin className="col-span-12"><GalatInline pesan={`Ringkasan tidak terbaca. ${galat}`} onCobaLagi={muatUlang} /></Ubin>;
  }
  return (
    <>
      {METRIK.map(({ kunci, label, ikon: Ikon, warnaIkon, dibalik }) => (
        <Ubin key={kunci} className="col-span-12 lg:col-span-6 xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] text-zinc-500">{label}</p>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${warnaIkon}`}><Ikon size={20} /></span>
          </div>
          {memuat && !data ? (
            <div className="mt-2 space-y-2" aria-hidden="true"><Kerangka className="h-9 w-20" /><Kerangka className="h-3 w-32" /></div>
          ) : data ? (
            <>
              <p className="mt-1 font-mono text-[34px] leading-none tracking-tight text-zinc-900"><AngkaNaik nilai={Number(data[kunci]) || 0} /></p>
              <p className="mt-3"><Delta kini={Number(data[kunci]) || 0} lalu={data.sebelumnya?.[kunci]} dibalik={dibalik} /></p>
            </>
          ) : null}
        </Ubin>
      ))}
    </>
  );
}
