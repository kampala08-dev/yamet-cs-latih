// Baris Konfigurasi non-rahasia yang bisa disunting satu per satu (aksi konfigurasi_tulis).
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { ANAK_DAFTAR } from '../../lib/gerak';
import type { BarisKonfig } from '../../lib/tipe';
import { KELAS_INPUT } from '../../components/FormAksi';
import { Tombol } from '../../components/Tombol';

export function BarisKonfigurasi({ r, bolehUbah }: { r: BarisKonfig; bolehUbah: boolean }) {
  const [nilai, setNilai] = useState(r.nilai);
  const [tersimpan, setTersimpan] = useState(r.nilai);
  const [status, setStatus] = useState<'diam' | 'menyimpan' | 'ok' | 'galat'>('diam');
  const [galat, setGalat] = useState('');
  const berubah = nilai !== tersimpan;

  async function simpan() {
    setStatus('menyimpan');
    setGalat('');
    try {
      await api.aksi('konfigurasi_tulis', { kunci: r.kunci, nilai });
      setTersimpan(nilai);
      setStatus('ok');
    } catch (e) {
      setStatus('galat');
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <motion.li variants={ANAK_DAFTAR} className="grid gap-2 py-3 md:grid-cols-[14rem_1fr_auto] md:items-center md:gap-4">
      <div className="min-w-0">
        <label htmlFor={`k-${r.kunci}`} className="block break-all font-mono text-[13px] text-zinc-900">{r.kunci}</label>
        {r.keterangan && <p className="text-[12px] text-zinc-500">{r.keterangan}</p>}
      </div>
      <div className="min-w-0">
        <input id={`k-${r.kunci}`} value={nilai} disabled={!bolehUbah} maxLength={500} onChange={(e) => { setNilai(e.target.value); setStatus('diam'); }} className={`${KELAS_INPUT} h-11`} />
        {status === 'galat' && <p role="alert" className="mt-1 text-[13px] text-bata-700">{galat}</p>}
      </div>
      <div className="flex h-11 items-center">
        {status === 'ok' && !berubah ? (
          <span className="inline-flex items-center gap-1 text-[13px] text-lumut-700"><CheckCircle size={20} /> Tersimpan</span>
        ) : (
          bolehUbah && (
            <Tombol ukuran="sedang" disabled={!berubah || status === 'menyimpan'} onClick={simpan} ikon={<FloppyDisk size={20} />}>
              {status === 'menyimpan' ? 'Menyimpan...' : 'Simpan'}
            </Tombol>
          )
        )}
      </div>
    </motion.li>
  );
}
