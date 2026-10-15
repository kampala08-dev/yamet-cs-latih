// Formulir umum yang mengirim satu aksi tulis. Label di atas, galat di bawah kolom.
import { useState, type FormEvent } from 'react';
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { GalatInline } from './Keadaan';
import { Tombol } from './Tombol';

export const KELAS_INPUT = 'w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 disabled:bg-zinc-100 disabled:text-zinc-500 aria-[invalid=true]:border-bata-600';

export interface Kolom {
  nama: string;
  label: string;
  bantu?: string;
  jenis?: 'teks' | 'tel' | 'area' | 'pilih';
  pilihan?: readonly string[];
  wajib?: boolean;
  maks?: number;
  pola?: RegExp;
  pesanPola?: string;
  lebar?: 'penuh';
}

interface FormAksiProps {
  aksi: string;
  kolom: Kolom[];
  awal: Record<string, string>;
  label: string;
  boleh: boolean;
  tambahan?: Record<string, string>;
  pesanBerhasil?: string;
  onBerhasil?: (isi: Record<string, string>, data: unknown) => void;
  kosongkanSetelah?: boolean;
}

export function FormAksi({ aksi, kolom, awal, label, boleh, tambahan = {}, pesanBerhasil = 'Tersimpan', onBerhasil, kosongkanSetelah }: FormAksiProps) {
  const [isi, setIsi] = useState<Record<string, string>>(awal);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'diam' | 'menyimpan' | 'ok'>('diam');

  function ubah(k: string, v: string) {
    setIsi((x) => ({ ...x, [k]: v }));
    setStatus('diam');
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    const g: Record<string, string> = {};
    for (const k of kolom) {
      const v = (isi[k.nama] || '').trim();
      if (k.wajib && !v) g[k.nama] = `${k.label} wajib diisi.`;
      else if (v && k.pola && !k.pola.test(v)) g[k.nama] = k.pesanPola || 'Format tidak sah.';
    }
    setGalat(g);
    if (Object.keys(g).length) return;
    setStatus('menyimpan');
    const bersih = Object.fromEntries(Object.entries(isi).map(([k, v]) => [k, v.trim()]));
    try {
      const data = await api.aksi(aksi, { ...bersih, ...tambahan });
      setStatus('ok');
      onBerhasil?.(bersih, data);
      if (kosongkanSetelah) setIsi(awal);
    } catch (er) {
      setStatus('diam');
      setGalat({ umum: er instanceof Error ? er.message : String(er) });
    }
  }

  return (
    <form onSubmit={kirim} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {kolom.map((k) => {
          const id = `${aksi}-${k.nama}`;
          const umum = { id, value: isi[k.nama] ?? '', disabled: !boleh, 'aria-invalid': Boolean(galat[k.nama]) };
          return (
            <div key={k.nama} className={`flex flex-col gap-2 ${k.lebar === 'penuh' || k.jenis === 'area' ? 'sm:col-span-2' : ''}`}>
              <label htmlFor={id} className="text-sm font-medium text-zinc-700">{k.label}</label>
              {k.jenis === 'area' ? (
                <textarea {...umum} rows={4} maxLength={k.maks} onChange={(e) => ubah(k.nama, e.target.value)} className={`${KELAS_INPUT} resize-y py-2 leading-relaxed`} />
              ) : k.jenis === 'pilih' ? (
                <select {...umum} onChange={(e) => ubah(k.nama, e.target.value)} className={`${KELAS_INPUT} h-11`}>
                  {(k.pilihan || []).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input {...umum} maxLength={k.maks} inputMode={k.jenis === 'tel' ? 'tel' : undefined} onChange={(e) => ubah(k.nama, e.target.value)} className={`${KELAS_INPUT} h-11`} />
              )}
              {galat[k.nama] ? <p className="text-[13px] text-bata-700">{galat[k.nama]}</p> : k.bantu && <p className="text-[12px] text-zinc-500">{k.bantu}</p>}
            </div>
          );
        })}
      </div>
      {galat.umum && <GalatInline pesan={galat.umum} />}
      {!boleh && <p className="text-[13px] text-zinc-500">Hanya peran admin yang bisa menyimpan.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Tombol type="submit" varian="utama" disabled={!boleh || status === 'menyimpan'} ikon={<FloppyDisk size={20} />}>
          {status === 'menyimpan' ? 'Menyimpan...' : label}
        </Tombol>
        {status === 'ok' && <span className="inline-flex items-center gap-1 text-[13px] text-lumut-700"><CheckCircle size={20} /> {pesanBerhasil}</span>}
      </div>
    </form>
  );
}

const POLA_NOMOR = /^[0-9+\-\s]{8,20}$/;
const PESAN_NOMOR = 'Isi nomor WA, hanya angka, spasi, + atau -.';

export const KOLOM_KLIEN: Kolom[] = [
  { nama: 'nama_anak', label: 'Nama anak', wajib: true, maks: 80, bantu: 'Kunci upsert: nama yang sama menimpa baris lama.' },
  { nama: 'nomor_ortu', label: 'Nomor WA orang tua', jenis: 'tel', wajib: true, maks: 20, pola: POLA_NOMOR, pesanPola: PESAN_NOMOR },
  { nama: 'nama_ortu', label: 'Nama orang tua', maks: 80 },
  { nama: 'program', label: 'Program', maks: 120, bantu: 'Mis. Terapi Wicara.' },
  { nama: 'aktif', label: 'Aktif', jenis: 'pilih', pilihan: ['ya', 'tidak'] },
  { nama: 'tanggal_mulai', label: 'Mulai terapi', maks: 10, pola: /^\d{4}-\d{2}-\d{2}$/, pesanPola: 'Bentuk 2026-10-20.' },
  { nama: 'reevaluasi_terakhir', label: 'Re-evaluasi terakhir', maks: 10, pola: /^\d{4}-\d{2}-\d{2}$/, pesanPola: 'Bentuk 2026-10-20.', bantu: 'Dipakai sinyal re-evaluasi (lebih dari 150 hari).' },
];

export const KOLOM_LEAD: Kolom[] = [
  { nama: 'nama_ortu', label: 'Nama orang tua', wajib: true, maks: 80 },
  { nama: 'nomor', label: 'Nomor WA', jenis: 'tel', wajib: true, maks: 20, pola: POLA_NOMOR, pesanPola: PESAN_NOMOR },
  { nama: 'usia_anak', label: 'Usia anak', maks: 40, bantu: 'Mis. 3 tahun 2 bulan.' },
  { nama: 'status', label: 'Tahap', jenis: 'pilih', pilihan: ['Baru', 'Dihubungi', 'Observasi dijadwalkan'] },
  { nama: 'tanggal_observasi', label: 'Tanggal observasi', maks: 16, pola: /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/, pesanPola: 'Bentuk 2026-10-20 atau 2026-10-20 09:00.', bantu: 'Isi bila tahap Observasi dijadwalkan.' },
  { nama: 'keluhan', label: 'Keluhan', jenis: 'area', maks: 500 },
  { nama: 'catatan_admin', label: 'Catatan admin', jenis: 'area', maks: 500 },
];

export const TOPIK_PENGETAHUAN = ['layanan', 'lokasi_jam', 'pendaftaran', 'biaya', 'observasi_asesmen', 'klien_aktif', 'umum', 'batas'] as const;

export const KOLOM_PENGETAHUAN: Kolom[] = [
  { nama: 'topik', label: 'Topik', jenis: 'pilih', pilihan: TOPIK_PENGETAHUAN },
  { nama: 'id', label: 'ID', maks: 8, pola: /^P\d{3,4}$/, pesanPola: 'Bentuk P001. Kosongkan untuk baris baru.', bantu: 'Kosong = baris baru, id dibuat n8n.' },
  { nama: 'pertanyaan_variasi', label: 'Variasi pertanyaan', jenis: 'area', maks: 1000, bantu: 'Pisahkan dengan |' },
  { nama: 'jawaban', label: 'Jawaban', jenis: 'area', wajib: true, maks: 2000, bantu: 'Bot memuat ulang Pengetahuan paling lambat 1 menit.' },
];
