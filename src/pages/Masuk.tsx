import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { SignIn } from '@phosphor-icons/react';
import { api } from '../lib/api';
import type { InfoSesi } from '../lib/tipe';
import { Tombol } from '../components/Tombol';
import { PEGAS } from '../lib/gerak';


const ISI = [
  ['Latih', 'Kirim pesan sebagai orang tua, lihat baris Pengetahuan dan alat yang dipakai bot, beri label Benar atau Salah.'],
  ['CRM', 'Lead hari ini, eskalasi yang menunggu, pertanyaan yang belum terjawab, dan audit mingguan.'],
];

export function Masuk({ onMasuk }: { onMasuk: (s: InfoSesi) => void }) {
  const [nama, setNama] = useState('');
  const [sandi, setSandi] = useState('');
  const [galat, setGalat] = useState('');
  const [mengirim, setMengirim] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return setGalat('Isi nama Anda dulu. Nama dicatat sebagai admin yang menangani eskalasi.');
    if (!sandi) return setGalat('Kata sandi wajib diisi.');
    setMengirim(true);
    setGalat('');
    try {
      onMasuk(await api.masuk(nama.trim(), sandi));
    } catch (er) {
      setGalat(er instanceof Error ? er.message : String(er));
      setMengirim(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] md:grid-cols-[1fr_minmax(0,460px)]">
      <section className="flex flex-col justify-between gap-10 border-b border-zinc-200 bg-kuning-50 px-4 py-8 md:border-b-0 md:border-r md:px-12 md:py-12">
        <div className="flex items-center gap-2 font-medium">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-kuning-400 font-mono text-sm font-semibold">Y</span>
          YAMET Customer Service
        </div>
        <div className="max-w-xl">
          <h1 className="text-2xl font-medium leading-tight tracking-tight text-zinc-900 md:text-4xl">Ruang latih dan CRM chatbot CS</h1>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-zinc-600">
            Khusus admin YAMET Palembang Dempo. Semua data dibaca dari sheet CS Bot YAMET lewat n8n.
          </p>
          <dl className="mt-8 hidden divide-y divide-kuning-200 border-y border-kuning-200 md:block">
            {ISI.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[5rem_1fr] gap-4 py-4 text-sm">
                <dt className="font-medium">{k}</dt>
                <dd className="leading-relaxed text-zinc-600">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="hidden font-mono text-[11px] text-zinc-500 md:block">yamet-cs-latih</p>
      </section>

      <section className="flex items-start px-4 py-10 md:items-center md:px-12">
        <motion.form
          onSubmit={kirim}
          noValidate
          className="w-full max-w-sm space-y-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={PEGAS}
        >
          <h2 className="text-lg font-medium">Masuk</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="nama" className="text-sm font-medium text-zinc-700">Nama</label>
            <input
              id="nama"
              autoComplete="name"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              maxLength={40}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-[15px] outline-none focus:border-zinc-400"
            />
            <p className="text-[13px] text-zinc-500">Dipakai sebagai nama tampil di latih dan nama admin di eskalasi.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sandi" className="text-sm font-medium text-zinc-700">Kata sandi</label>
            <input
              id="sandi"
              type="password"
              autoComplete="current-password"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              aria-invalid={Boolean(galat)}
              aria-describedby={galat ? 'galat-masuk' : undefined}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-[15px] outline-none focus:border-zinc-400 aria-[invalid=true]:border-bata-600"
            />
            {galat && <p id="galat-masuk" role="alert" className="text-[13px] text-bata-700">{galat}</p>}
          </div>
          <Tombol type="submit" varian="gelap" ukuran="besar" className="w-full" disabled={mengirim} ikon={<SignIn size={20} />}>
            {mengirim ? 'Memeriksa...' : 'Masuk'}
          </Tombol>
        </motion.form>
      </section>
    </main>
  );
}
