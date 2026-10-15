import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import pengetahuan from '../../data/pengetahuan.json';
import { angka, topikManusia } from '../../lib/format';
import type { JawabanChat } from '../../lib/tipe';
import { PEGAS } from '../../lib/gerak';

const KAMUS = pengetahuan as Record<string, { topik: string; contoh: string }>;

function Judul({ children }: { children: string }) {
  return <h3 className="text-[13px] font-medium text-zinc-500">{children}</h3>;
}

export function PanelBukti({ bukti }: { bukti: JawabanChat | null }) {
  if (!bukti) {
    return (
      <p className="py-2 text-sm leading-relaxed text-zinc-500">
        Pilih balasan bot untuk melihat baris Pengetahuan, alat yang dipanggil, token, dan latensinya.
      </p>
    );
  }
  const tidakTerjawab = bukti.pengetahuan_dipakai.length === 0;
  return (
    <motion.div key={bukti.id_giliran} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={PEGAS} className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[12px] text-zinc-500">id_giliran {bukti.id_giliran || '-'}</span>
        {bukti.topik && <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[12px] text-zinc-700">{topikManusia(bukti.topik)}</span>}
      </div>

      {bukti.dilewati && (
        <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-[13px] text-zinc-600">
          Giliran dilewati penyaring: {bukti.alasan || 'tanpa alasan'}. Pesan tetap tercatat di Log.
        </p>
      )}

      {bukti.isi_gambar && (
        <section className="space-y-1">
          <Judul>Isi gambar (vision)</Judul>
          <p className="rounded-xl bg-biru-50 px-3 py-2 text-[13px] leading-relaxed text-zinc-800">{bukti.isi_gambar}</p>
        </section>
      )}

      <dl className="grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-200 py-3">
        {[
          ['Latensi', `${angka(bukti.latensi_ms / 1000, 1)}`, 'dtk'],
          ['Token masuk', angka(bukti.token_in), ''],
          ['Token keluar', angka(bukti.token_out), ''],
        ].map(([k, v, s]) => (
          <div key={k} className="px-3 first:pl-0">
            <dt className="text-[12px] text-zinc-500">{k}</dt>
            <dd className="mt-0.5 font-mono text-lg tracking-tight text-zinc-900">
              {v}
              {s && <span className="ml-1 text-[12px] text-zinc-500">{s}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <section className="space-y-2">
        <Judul>Pengetahuan yang dipakai</Judul>
        {tidakTerjawab ? (
          <p className="text-[13px] leading-relaxed text-bata-700">
            Tidak ada baris Pengetahuan. Balasan ini tidak bersumber dari tab Pengetahuan
            {bukti.sumber_cara ? ` (sumber_cara: ${bukti.sumber_cara})` : ''}.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {bukti.pengetahuan_dipakai.map((id) => (
              <li key={id} className="grid grid-cols-[3.25rem_1fr] gap-3 py-2.5">
                <span className="font-mono text-[13px] text-zinc-900">{id}</span>
                <span className="min-w-0 text-[13px] leading-snug">
                  <span className="text-zinc-800">{KAMUS[id] ? topikManusia(KAMUS[id].topik) : 'tidak ada di salinan lokal'}</span>
                  {KAMUS[id]?.contoh && <span className="block truncate text-zinc-500">"{KAMUS[id].contoh}"</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!tidakTerjawab && bukti.sumber_cara && <p className="font-mono text-[11px] text-zinc-400">cara: {bukti.sumber_cara}</p>}
      </section>

      <section className="space-y-2">
        <Judul>Alat yang dipanggil</Judul>
        {bukti.tool_dipanggil.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Tidak ada alat dipanggil di giliran ini.</p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {bukti.tool_dipanggil.map((t, i) => (
              <li key={`${t.nama}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-mono text-[13px]">{t.nama}</span>
                <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${t.ok ? 'text-lumut-700' : 'text-bata-700'}`}>
                  {t.ok ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  {t.ok ? 'ok' : 'gagal'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  );
}
