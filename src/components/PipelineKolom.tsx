// Pipeline lead: kolom horizontal per tahap. Bisa digeser di dalam ubinnya sendiri; halaman tidak ikut melebar.
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { ANAK_DAFTAR, INDUK_DAFTAR } from '../lib/gerak';
import { angka } from '../lib/format';
import { normalStatus } from '../lib/status';
import type { LeadV2 } from '../lib/tipe';
import { Chip } from './Chip';

export interface KolomData {
  status: string;
  jumlah: number;
  konversi_ke_berikut: number | null;
  lead: LeadV2[];
}

function umurLead(l: LeadV2) {
  if (typeof l.umur_jam !== 'number') return '';
  return l.umur_jam < 24 ? `${l.umur_jam} jam` : `${Math.floor(l.umur_jam / 24)} hr`;
}

function Kartu({ l, onPilih }: { l: LeadV2; onPilih: (l: LeadV2) => void }) {
  return (
    <motion.li variants={ANAK_DAFTAR}>
      <button type="button" onClick={() => onPilih(l)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 text-left transition-colors hover:border-zinc-300 hover:bg-white active:scale-[0.98]">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-zinc-900">{l.nama_ortu || 'Tanpa nama'}</span>
          <span className="shrink-0 font-mono text-[11px] text-zinc-400">{umurLead(l)}</span>
        </span>
        <span className="mt-1 line-clamp-2 text-[12px] leading-snug text-zinc-500">{l.keluhan || '-'}</span>
        {normalStatus(l.status) === 'Follow-up' && <span className="mt-2 block"><Chip nada="ambar">Follow-up</Chip></span>}
      </button>
    </motion.li>
  );
}

export function PipelineKolom({ kolom, hilang, onPilih, sisa = true }: { kolom: KolomData[]; hilang: KolomData; onPilih: (l: LeadV2) => void; sisa?: boolean }) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-2">
      <div className="grid auto-cols-[minmax(8.75rem,1fr)] grid-flow-col gap-3">
        {kolom.map((k, i) => (
          <section key={k.status} className="flex min-w-0 flex-col">
            <header className="mb-3 border-b border-zinc-200 pb-2">
              <h3 className="text-[12px] font-medium text-zinc-500">{k.status}</h3>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-2xl tracking-tight text-zinc-900">{angka(k.jumlah)}</span>
                {i < kolom.length - 1 && k.konversi_ke_berikut !== null && (
                  <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-zinc-500" title="Konversi ke tahap berikutnya">
                    <ArrowRight size={20} className="text-zinc-300" />{angka(k.konversi_ke_berikut, 1)}%
                  </span>
                )}
              </div>
            </header>
            <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="space-y-2">
              {k.lead.map((l, j) => <Kartu key={l.id || `${l.waktu}-${j}`} l={l} onPilih={onPilih} />)}
            </motion.ul>
            {sisa && k.jumlah > k.lead.length && <p className="mt-2 text-[12px] text-zinc-400">+{k.jumlah - k.lead.length} lainnya</p>}
            {k.jumlah === 0 && <p className="text-[12px] text-zinc-400">Kosong</p>}
          </section>
        ))}
        <section className="flex min-w-0 flex-col opacity-80">
          <header className="mb-3 border-b border-dashed border-zinc-300 pb-2">
            <h3 className="text-[12px] font-medium text-zinc-400">Hilang</h3>
            <span className="mt-1 block font-mono text-2xl tracking-tight text-zinc-400">{angka(hilang.jumlah)}</span>
          </header>
          <motion.ul variants={INDUK_DAFTAR} initial="awal" animate="tampil" className="space-y-2">
            {hilang.lead.map((l, j) => <Kartu key={l.id || `${l.waktu}-${j}`} l={l} onPilih={onPilih} />)}
          </motion.ul>
        </section>
      </div>
    </div>
  );
}
