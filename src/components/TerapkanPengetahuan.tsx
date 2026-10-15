// "Terapkan ke Pengetahuan": koreksi dari tombol Salah ikut mengubah tab Pengetahuan, bukan hanya Log.
// Baris yang ditimpa = baris Pengetahuan pertama yang dipakai giliran itu; tanpa baris, formulir baris baru.
import { useState } from 'react';
import { BookOpen, CheckCircle } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { useSesi } from '../lib/sesi';
import type { BarisPengetahuan } from '../lib/tipe';
import { FormAksi, KOLOM_PENGETAHUAN } from './FormAksi';
import { GalatInline } from './Keadaan';
import { Tombol } from './Tombol';

interface TerapkanProps {
  koreksi: string;
  pengetahuanDipakai: string[];
  pesanOrtu: string;
  // Menulis label Salah + koreksi ke Log; dipanggil sebelum Pengetahuan ditimpa.
  simpanLog: () => Promise<boolean>;
}

type Tahap =
  | { jenis: 'diam' }
  | { jenis: 'memuat' }
  | { jenis: 'konfirmasi'; baris: BarisPengetahuan }
  | { jenis: 'baru' }
  | { jenis: 'menulis'; baris: BarisPengetahuan }
  | { jenis: 'selesai'; id: string };

const PESAN_SELESAI = (id: string) => `Diterapkan ke ${id} sebagai jawaban persis; bot memuat ulang maksimal 1 menit.`;

export function TerapkanPengetahuan({ koreksi, pengetahuanDipakai, pesanOrtu, simpanLog }: TerapkanProps) {
  const { sesi } = useSesi();
  const [tahap, setTahap] = useState<Tahap>({ jenis: 'diam' });
  const [galat, setGalat] = useState('');
  if (sesi.peran !== 'admin') return null;

  const idTarget = pengetahuanDipakai[0] || '';
  const teks = koreksi.trim();

  async function mulai() {
    setGalat('');
    if (!(await simpanLog())) return;
    if (!idTarget) return setTahap({ jenis: 'baru' });
    setTahap({ jenis: 'memuat' });
    try {
      const semua = await api.aksi<BarisPengetahuan[]>('pengetahuan_baca');
      const baris = (Array.isArray(semua) ? semua : []).find((p) => p.id === idTarget);
      setTahap(baris ? { jenis: 'konfirmasi', baris } : { jenis: 'baru' });
      if (!baris) setGalat(`${idTarget} tidak ditemukan di tab Pengetahuan. Isi sebagai baris baru.`);
    } catch (e) {
      setTahap({ jenis: 'diam' });
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }

  async function tulis(baris: BarisPengetahuan) {
    setTahap({ jenis: 'menulis', baris });
    setGalat('');
    try {
      // Topik dan variasi lama ikut dikirim supaya n8n tidak mengosongkannya; hanya jawaban yang berubah.
      const hasil = await api.aksi<{ id?: string }>('pengetahuan_tulis', { id: baris.id, topik: baris.topik, pertanyaan_variasi: baris.pertanyaan_variasi, jawaban: teks, verbatim: 'ya' });
      setTahap({ jenis: 'selesai', id: hasil?.id || baris.id });
    } catch (e) {
      setTahap({ jenis: 'konfirmasi', baris });
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }

  if (tahap.jenis === 'selesai') {
    return <p className="inline-flex items-center gap-1 text-[13px] text-lumut-700"><CheckCircle size={20} /> {PESAN_SELESAI(tahap.id)}</p>;
  }

  return (
    <div className="w-full space-y-2">
      {(tahap.jenis === 'diam' || tahap.jenis === 'memuat') && (
        <Tombol ukuran="kecil" varian="utama" disabled={!teks || tahap.jenis === 'memuat'} onClick={mulai} ikon={<BookOpen size={20} />}>
          {tahap.jenis === 'memuat' ? 'Membaca Pengetahuan...' : idTarget ? `Terapkan ke Pengetahuan (${idTarget})` : 'Terapkan ke Pengetahuan'}
        </Tombol>
      )}

      {(tahap.jenis === 'konfirmasi' || tahap.jenis === 'menulis') && (
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
          <p className="text-[13px] font-medium text-zinc-900">Timpa jawaban {tahap.baris.id}?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-2.5">
              <p className="text-[11px] font-medium text-zinc-500">Jawaban lama</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-600">{tahap.baris.jawaban || '(kosong)'}</p>
            </div>
            <div className="rounded-xl bg-lumut-50 p-2.5">
              <p className="text-[11px] font-medium text-lumut-700">Jawaban baru</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-900">{teks}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tombol ukuran="kecil" varian="utama" disabled={tahap.jenis === 'menulis' || !teks} onClick={() => tulis(tahap.baris)}>
              {tahap.jenis === 'menulis' ? 'Menulis...' : 'Ya, terapkan'}
            </Tombol>
            <Tombol ukuran="kecil" disabled={tahap.jenis === 'menulis'} onClick={() => setTahap({ jenis: 'diam' })}>Batal</Tombol>
          </div>
        </div>
      )}

      {tahap.jenis === 'baru' && (
        <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3">
          <p className="text-[13px] text-zinc-600">Giliran ini tidak memakai baris Pengetahuan. Simpan koreksi sebagai baris baru:</p>
          <FormAksi
            aksi="pengetahuan_tulis"
            kolom={KOLOM_PENGETAHUAN}
            awal={{ topik: 'umum', id: '', pertanyaan_variasi: pesanOrtu, jawaban: teks }}
            label="Simpan baris baru"
            tambahan={{ verbatim: 'ya' }}
            boleh
            pesanBerhasil="Tersimpan"
            onBerhasil={(isi, data) => setTahap({ jenis: 'selesai', id: String((data as { id?: string } | null)?.id || isi.id || 'baris baru') })}
          />
          <Tombol ukuran="kecil" onClick={() => setTahap({ jenis: 'diam' })}>Batal</Tombol>
        </div>
      )}

      {galat && <GalatInline pesan={galat} />}
    </div>
  );
}
