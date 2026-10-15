import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Info } from '@phosphor-icons/react';
import { angka, detik } from '../../lib/format';
import type { JawabanChat, Label } from '../../lib/tipe';
import { LabelGiliran } from '../../components/LabelGiliran';
import { PEGAS } from '../../lib/gerak';


export interface Pesan {
  id: string;
  dari: 'ortu' | 'bot';
  teks: string;
  bukti?: JawabanChat;
  label?: Label;
  koreksi?: string;
}

// Tautan hanya http(s); React tetap meng-escape seluruh teks.
function denganTautan(teks: string): ReactNode[] {
  return teks.split(/(https?:\/\/[^\s)]+)/g).map((bagian, i) =>
    /^https?:\/\//.test(bagian) ? (
      <a key={i} href={bagian} target="_blank" rel="noopener noreferrer" className="break-all underline decoration-zinc-400 underline-offset-2">
        {bagian}
      </a>
    ) : (
      bagian
    ),
  );
}

interface GelembungProps {
  pesan: Pesan;
  terpilih: boolean;
  onPilih: (id: string) => void;
  onLabel: (id: string, l: Label, koreksi: string) => void;
  animasi: boolean;
}

export const Gelembung = memo(function Gelembung({ pesan, terpilih, onPilih, onLabel, animasi }: GelembungProps) {
  // Pesan yang dipulihkan dari sessionStorage tidak dianimasikan ulang.
  const awal = animasi ? { opacity: 0, y: 8 } : false;
  if (pesan.dari === 'ortu') {
    return (
      <motion.li initial={awal} animate={{ opacity: 1, y: 0 }} transition={PEGAS} className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-[15px] leading-relaxed text-zinc-50">
          {pesan.teks}
        </p>
      </motion.li>
    );
  }
  const b = pesan.bukti;
  const dilewati = b?.dilewati;
  return (
    <motion.li initial={awal} animate={{ opacity: 1, y: 0 }} transition={PEGAS} className="flex flex-col items-start">
      <button
        type="button"
        onClick={() => onPilih(pesan.id)}
        aria-pressed={terpilih}
        className={`max-w-[92%] rounded-2xl rounded-bl-md px-4 py-2.5 text-left text-[15px] leading-relaxed transition-[box-shadow] ${dilewati ? 'border border-dashed border-zinc-300 bg-zinc-50 italic text-zinc-500' : 'bg-white text-zinc-900'} ${terpilih ? 'ring-2 ring-kuning-400' : 'ring-1 ring-zinc-200'}`}
      >
        <span className="whitespace-pre-wrap break-words">
          {dilewati ? `Bot tidak membalas: ${b?.alasan || 'dilewati penyaring'}` : denganTautan(pesan.teks)}
        </span>
      </button>
      {b && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 font-mono text-[11px] text-zinc-500">
          <span>{detik(b.latensi_ms)}</span>
          <span>{angka(b.token_in + b.token_out)} token</span>
          {b.pengetahuan_dipakai.length > 0 && <span>{b.pengetahuan_dipakai.join(' ')}</span>}
          {b.tool_dipanggil.length > 0 && <span>{b.tool_dipanggil.length} alat</span>}
          <button type="button" onClick={() => onPilih(pesan.id)} className="inline-flex h-9 items-center gap-1 rounded-md px-1.5 font-sans text-[12px] text-zinc-600 underline-offset-2 hover:underline">
            <Info size={20} />
            Bukti
          </button>
        </div>
      )}
      {b && <LabelGiliran idGiliran={b.id_giliran} labelAwal={pesan.label} koreksiAwal={pesan.koreksi} onBerubah={(l, k) => onLabel(pesan.id, l, k)} />}
    </motion.li>
  );
});
