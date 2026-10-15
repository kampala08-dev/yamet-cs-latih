// Tombol Benar/Salah per balasan bot + kolom koreksi di tempat. Menulis Log.label & Log.koreksi lewat aksi label.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCircle, X } from '@phosphor-icons/react';
import { api } from '../lib/api';
import type { Label } from '../lib/tipe';
import { Tombol } from './Tombol';
import { TerapkanPengetahuan } from './TerapkanPengetahuan';
import { PEGAS } from '../lib/gerak';


interface LabelGiliranProps {
  idGiliran: string;
  labelAwal?: string;
  koreksiAwal?: string;
  onBerubah?: (label: Label, koreksi: string) => void;
  // Hanya di halaman latih: koreksi bisa diterapkan ke tab Pengetahuan.
  terapkan?: { pengetahuanDipakai: string[]; pesanOrtu: string };
}

type Simpan = 'diam' | 'menyimpan' | 'tersimpan' | 'galat';

export function LabelGiliran({ idGiliran, labelAwal, koreksiAwal = '', onBerubah, terapkan }: LabelGiliranProps) {
  const [label, setLabel] = useState<Label | ''>(labelAwal === 'Benar' || labelAwal === 'Salah' ? labelAwal : '');
  const [koreksi, setKoreksi] = useState(koreksiAwal);
  const [status, setStatus] = useState<Simpan>('diam');
  const [statusKoreksi, setStatusKoreksi] = useState<Simpan>(koreksiAwal ? 'tersimpan' : 'diam');
  const [galat, setGalat] = useState('');

  async function kirim(l: Label, teksKoreksi = ''): Promise<boolean> {
    const untukKoreksi = Boolean(teksKoreksi);
    const setS = untukKoreksi ? setStatusKoreksi : setStatus;
    setS('menyimpan');
    setGalat('');
    try {
      await api.aksi('label', { id_giliran: idGiliran, label: l, koreksi: teksKoreksi });
      setS('tersimpan');
      onBerubah?.(l, teksKoreksi);
      return true;
    } catch (e) {
      setS('galat');
      setGalat(e instanceof Error ? e.message : String(e));
      return false;
    }
  }

  // Terapkan ke Pengetahuan selalu menulis label Salah + koreksi ke Log dulu (bila belum tersimpan).
  async function simpanLogDulu() {
    if (statusKoreksi === 'tersimpan') return true;
    return kirim('Salah', koreksi.trim());
  }

  function pilih(l: Label) {
    if (!idGiliran) return;
    setLabel(l);
    setStatusKoreksi('diam');
    void kirim(l);
  }

  const kelasPilihan = (l: Label) => {
    if (label !== l) return 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
    return l === 'Benar' ? 'border-lumut-600 bg-lumut-50 text-lumut-700' : 'border-bata-600 bg-bata-50 text-bata-700';
  };

  return (
    <div className="mt-2 w-full max-w-xl space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {(['Benar', 'Salah'] as const).map((l) => (
          <button
            key={l}
            type="button"
            disabled={!idGiliran || status === 'menyimpan'}
            onClick={() => pilih(l)}
            aria-pressed={label === l}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-[background-color,border-color,transform] active:scale-[0.98] disabled:opacity-50 ${kelasPilihan(l)}`}
          >
            {l === 'Benar' ? <Check size={20} /> : <X size={20} />}
            {l}
          </button>
        ))}
        <span className="font-mono text-[11px] text-zinc-500" aria-live="polite">
          {status === 'menyimpan' && 'menyimpan...'}
          {status === 'tersimpan' && 'tersimpan di Log'}
          {!idGiliran && 'tanpa id_giliran, tidak bisa dilabeli'}
        </span>
      </div>
      {status === 'galat' && <p className="text-[13px] text-bata-700">{galat} <button type="button" className="underline underline-offset-2" onClick={() => label && kirim(label)}>Coba lagi</button></p>}
      <AnimatePresence initial={false}>
        {label === 'Salah' && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={PEGAS} className="space-y-2">
            <label htmlFor={`koreksi-${idGiliran}`} className="block text-[13px] font-medium text-zinc-700">
              Jawaban yang seharusnya
            </label>
            <textarea
              id={`koreksi-${idGiliran}`}
              value={koreksi}
              onChange={(e) => { setKoreksi(e.target.value); setStatusKoreksi('diam'); }}
              rows={3}
              maxLength={2000}
              placeholder="Tulis balasan yang benar. Teks ini disimpan ke kolom koreksi di Log."
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Tombol
                ukuran="kecil"
                varian="gelap"
                disabled={!koreksi.trim() || statusKoreksi === 'menyimpan'}
                onClick={() => kirim('Salah', koreksi.trim())}
              >
                {statusKoreksi === 'menyimpan' ? 'Menyimpan...' : 'Simpan koreksi'}
              </Tombol>
              {statusKoreksi === 'tersimpan' && (
                <span className="inline-flex items-center gap-1 text-[13px] text-lumut-700"><CheckCircle size={20} /> Koreksi tersimpan</span>
              )}
              {terapkan && (
                <TerapkanPengetahuan koreksi={koreksi} pengetahuanDipakai={terapkan.pengetahuanDipakai} pesanOrtu={terapkan.pesanOrtu} simpanLog={simpanLogDulu} />
              )}
            </div>
            {statusKoreksi === 'galat' && <p className="text-[13px] text-bata-700">{galat}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
