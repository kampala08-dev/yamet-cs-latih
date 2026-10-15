// Kartu anak (/klien/:nama): data Klien Aktif, sinyal risiko, linimasa gabungan, WA dan Ambil alih.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HandGrabbing, WhatsappLogo } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { INDUK_UBIN } from '../lib/gerak';
import { normalKonfig, nomorUtuh, samarkanNomor, tautanWa } from '../lib/format';
import { pindah, useJalur } from '../lib/rute';
import { useSesi } from '../lib/sesi';
import { hitungSinyal } from '../lib/sinyal';
import { useAksi } from '../lib/useAksi';
import type { BarisEskalasi, BarisJamGanti, BarisKlien, BarisLog, BarisUmpanBalik } from '../lib/tipe';
import { Chip } from '../components/Chip';
import { HeaderHalaman, IsiHalaman } from '../components/HeaderHalaman';
import { GalatInline, Kerangka, KeadaanData, Kosong } from '../components/Keadaan';
import { Tombol } from '../components/Tombol';
import { Ubin } from '../components/Ubin';
import { Linimasa, susunLinimasa } from './klien/Linimasa';

const BERLAKU_BAWAAN = 90;

function AksiKlien({ k, idTerbuka }: { k: BarisKlien; idTerbuka?: string }) {
  const { sesi } = useSesi();
  const [status, setStatus] = useState<'diam' | 'proses' | 'ok'>('diam');
  const [galat, setGalat] = useState('');
  if (sesi.peran !== 'admin') return null;
  async function ambil() {
    setStatus('proses');
    setGalat('');
    try {
      await api.aksi('eskalasi_status', idTerbuka ? { id: idTerbuka, status: 'Diambil' } : { nomor_hash: k.nomor_hash, status: 'Diambil' });
      setStatus('ok');
    } catch (e) {
      setStatus('diam');
      setGalat(e instanceof Error ? e.message : String(e));
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {nomorUtuh(k.nomor_ortu) && (
        <a href={tautanWa(k.nomor_ortu)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 active:scale-[0.98]">
          <WhatsappLogo size={20} /> WhatsApp
        </a>
      )}
      {k.nomor_hash && (
        <Tombol varian="utama" disabled={status !== 'diam'} onClick={ambil} ikon={<HandGrabbing size={20} />}>
          {status === 'ok' ? 'Ditangani admin' : status === 'proses' ? 'Menyimpan...' : 'Ambil alih'}
        </Tombol>
      )}
      {galat && <p role="alert" className="w-full text-[13px] text-bata-700">{galat}</p>}
    </div>
  );
}

function digitNomor(v: string) {
  return String(v || '').replace(/\D/g, '').replace(/^0/, '62');
}

function IsiKartu({ k }: { k: BarisKlien }) {
  const { sesi } = useSesi();
  const jamGanti = useAksi<BarisJamGanti[]>('jam_ganti_daftar', { anak: k.nama_anak });
  const daftar = <T,>(d: T[] | null) => (Array.isArray(d) ? d : []);
  // U1.6: klien_aktif_baca belum membawa nomor_hash. Ambil dari baris Jam Ganti anak ini bila ada;
  // admin tetap bisa membaca Log lewat nomor asli (server menormalkan ke 62 lalu meng-hash).
  const hash = k.nomor_hash || daftar(jamGanti.data).find((j) => j.nomor_hash)?.nomor_hash || '';
  const pakaiNomor = !hash && sesi.peran === 'admin' && nomorUtuh(k.nomor_ortu);
  const bisaLog = Boolean(hash) || pakaiNomor;
  const log = useAksi<BarisLog[]>(bisaLog && jamGanti.data !== null ? 'log_sesi' : '', hash ? { nomor_hash: hash } : { nomor: k.nomor_ortu });
  const eskalasi = useAksi<BarisEskalasi[]>('eskalasi_daftar', { hari: 90 });
  // umpan_balik baru ada di U1.8: galat "aksi tidak dikenal" diperlakukan sebagai data belum tersedia.
  const umpan = useAksi<BarisUmpanBalik[]>('umpan_balik', hash ? { nomor_hash: hash } : {});
  const konfig = useAksi<unknown>('konfigurasi_baca');

  const esk = daftar(eskalasi.data).filter((e) => (hash && e.nomor_hash === hash) || (nomorUtuh(k.nomor_ortu) && nomorUtuh(e.nomor) && digitNomor(e.nomor) === digitNomor(k.nomor_ortu)));
  const umpanAda = umpan.data !== null && !umpan.galat;
  const umpanBaris = umpanAda ? daftar(umpan.data).filter((u) => !hash || u.nomor_hash === hash) : [];
  const berlaku = Number(normalKonfig(konfig.data).find((r) => r.kunci === 'JAM_GANTI_BERLAKU_HARI')?.nilai) || BERLAKU_BAWAAN;
  const logSiap = !bisaLog || log.data !== null;
  const semuaSiap = logSiap && jamGanti.data !== null && eskalasi.data !== null && (umpan.data !== null || Boolean(umpan.galat));
  const galat = [log, jamGanti, eskalasi].map((x) => x.galat).filter(Boolean);
  const sinyal = semuaSiap
    ? hitungSinyal({ klien: k, log: daftar(log.data), jamGanti: daftar(jamGanti.data), eskalasi: esk, umpanBalik: umpanBaris, berlakuJamGantiHari: berlaku }).map((s) =>
        s.kunci === 'skor' && !umpanAda ? { ...s, rincian: 'data umpan balik belum tersedia' } : s.kunci === 'izin' && !bisaLog ? { ...s, rincian: 'Log belum terbaca (perlu nomor_hash)' } : s,
      )
    : [];
  const terpicu = sinyal.filter((s) => s.terpicu).length;
  const idTerbuka = esk.find((e) => e.status === 'Terbuka')?.id;
  const muatUlang = () => [log, jamGanti, eskalasi, umpan].forEach((x) => x.muatUlang());
  const kk = { ...k, nomor_hash: hash };

  const data: [string, string][] = [
    ['Program', k.program || '-'], ['Orang tua', k.nama_ortu || '-'], ['Nomor', samarkanNomor(k.nomor_ortu)],
    ['Mulai terapi', k.tanggal_mulai || '-'], ['Re-evaluasi terakhir', k.reevaluasi_terakhir || '-'],
  ];

  return (
    <IsiHalaman>
      <a href="/klien" onClick={(e) => { e.preventDefault(); pindah('/klien'); }} className="mb-3 inline-flex h-9 items-center gap-1 rounded-lg pr-2 text-[13px] text-biru-600 hover:underline">
        <ArrowLeft size={20} /> Klien
      </a>
      <HeaderHalaman
        judul={<span className="flex flex-wrap items-center gap-3">{k.nama_anak} <Chip nada={k.aktif === 'ya' ? 'hijau' : 'redup'}>{k.aktif === 'ya' ? 'Klien aktif' : 'Tidak aktif'}</Chip></span>}
        keterangan={`${k.program || 'Program belum diisi'} · ${k.nama_ortu || 'orang tua belum diisi'}`}
      >
        <AksiKlien k={kk} idTerbuka={idTerbuka} />
      </HeaderHalaman>
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <Ubin judul="Data Klien Aktif" className="col-span-12 self-start xl:col-span-4">
          <dl className="divide-y divide-zinc-100">
            {data.map(([a, b]) => (
              <div key={a} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-[13px]">
                <dt className="text-zinc-500">{a}</dt>
                <dd className={`min-w-0 break-words text-zinc-900 ${a === 'Nomor' || a.includes('terapi') || a.includes('Re-') ? 'font-mono' : ''}`}>{b}</dd>
              </div>
            ))}
          </dl>
        </Ubin>
        <div className="col-span-12 space-y-5 xl:col-span-8">
          <Ubin
            judul="Sinyal risiko"
            keterangan={semuaSiap ? (terpicu >= 2 ? `${terpicu} sinyal terpicu: Rio atau koordinator menelepon.` : terpicu === 1 ? '1 sinyal terpicu: admin memantau dan menindak.' : 'Tidak ada sinyal terpicu.') : undefined}
          >
            {galat.length > 0 && <GalatInline pesan={`Sebagian data tidak terbaca. ${galat[0]}`} onCobaLagi={muatUlang} />}
            {!semuaSiap && !galat.length && <div className="grid gap-2 sm:grid-cols-2"><Kerangka className="h-16" /><Kerangka className="h-16" /><Kerangka className="h-16" /><Kerangka className="h-16" /></div>}
            {semuaSiap && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {sinyal.map((s) => (
                  <li key={s.kunci} className={`rounded-2xl border p-3 ${s.terpicu ? 'border-bata-200 bg-bata-50/60' : 'border-zinc-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-zinc-900">{s.judul}</span>
                      <Chip nada={s.terpicu ? 'bata' : 'redup'}>{s.terpicu ? 'Terpicu' : 'Aman'}</Chip>
                    </div>
                    <p className="mt-1 font-mono text-[12px] text-zinc-600">{s.rincian}</p>
                    {s.terpicu && <p className="mt-1 text-[12px] leading-snug text-zinc-500">{s.tindakan}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Ubin>
          <Ubin judul="Linimasa" keterangan="Percakapan, izin, jam ganti, eskalasi, dan umpan balik">
            <KeadaanData memuat={!semuaSiap} galat="" adaData={semuaSiap} muatUlang={muatUlang}>
              {!bisaLog && <p className="mb-2 text-[12px] text-zinc-500">Percakapan dan izin belum tampil: perlu nomor_hash anak ini (atau masuk sebagai admin).</p>}
              <Linimasa peristiwa={susunLinimasa(daftar(log.data), daftar(jamGanti.data), esk, umpanBaris)} />
            </KeadaanData>
          </Ubin>
        </div>
      </motion.div>
    </IsiHalaman>
  );
}

export function KartuKlien() {
  const jalur = useJalur();
  const nama = decodeURIComponent(jalur.replace(/^\/klien\//, ''));
  const { data, memuat, galat, muatUlang } = useAksi<BarisKlien[]>('klien_aktif_baca');
  const k = (Array.isArray(data) ? data : []).find((x) => x.nama_anak.toLowerCase() === nama.toLowerCase());
  if (k) return <IsiKartu key={k.nama_anak} k={k} />;
  return (
    <IsiHalaman>
      <HeaderHalaman judul={nama || 'Klien'} />
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang}>
        <Kosong judul="Anak ini tidak ada di Klien Aktif." isi="Periksa ejaan nama atau tambahkan lewat halaman Klien." />
      </KeadaanData>
    </IsiHalaman>
  );
}
