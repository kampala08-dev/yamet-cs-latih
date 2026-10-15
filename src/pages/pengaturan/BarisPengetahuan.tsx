// Satu baris tabel Pengetahuan + saklar "Jawab persis" (aksi pengetahuan_verbatim).
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { ANAK_DAFTAR } from '../../lib/gerak';
import { topikManusia } from '../../lib/format';
import type { BarisPengetahuan as Baris } from '../../lib/tipe';

interface Props {
  p: Baris;
  bolehUbah: boolean;
  onSunting: (p: Baris) => void;
}

export function BarisPengetahuan({ p, bolehUbah, onSunting }: Props) {
  const [persis, setPersis] = useState(p.verbatim === 'ya');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState('');

  async function alih() {
    const baru = !persis;
    setProses(true);
    setGalat('');
    try {
      await api.aksi('pengetahuan_verbatim', { id: p.id, verbatim: baru ? 'ya' : '' });
      setPersis(baru);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setProses(false);
    }
  }

  return (
    <motion.li variants={ANAK_DAFTAR} className="grid grid-cols-[1fr_auto] items-start gap-3 py-3">
      <button type="button" onClick={() => onSunting(p)} className="grid min-w-0 grid-cols-[3.5rem_1fr] gap-3 text-left hover:bg-zinc-50 active:scale-[0.995]">
        <span className="font-mono text-[13px] text-zinc-900">{p.id}</span>
        <span className="min-w-0">
          <span className="block text-[12px] text-zinc-500">{topikManusia(p.topik)} · {p.pertanyaan_variasi.split('|')[0]}</span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-zinc-800">{p.jawaban}</span>
          {galat && <span role="alert" className="mt-1 block text-[12px] text-bata-700">{galat}</span>}
        </span>
      </button>
      <label className={`flex h-10 cursor-pointer items-center gap-2 text-[12px] ${bolehUbah ? 'text-zinc-700' : 'cursor-not-allowed text-zinc-400'}`}>
        <span className="hidden sm:inline">Jawab persis</span>
        <button
          type="button"
          role="switch"
          aria-checked={persis}
          aria-label={`Jawab persis untuk ${p.id}`}
          disabled={!bolehUbah || proses}
          onClick={alih}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${persis ? 'bg-lumut-600' : 'bg-zinc-300'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${persis ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </label>
    </motion.li>
  );
}
