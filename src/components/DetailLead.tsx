import { useState } from 'react';
import { WhatsappLogo } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { nomorUtuh, samarkanNomor, tanggalJam, tautanWa } from '../lib/format';
import { ALASAN_HILANG, SEMUA_STATUS, normalStatus } from '../lib/status';
import { useSesi } from '../lib/sesi';
import type { LeadV2 } from '../lib/tipe';
import { ChipStatus } from './Chip';
import { FormAksi, KELAS_INPUT, KOLOM_KLIEN } from './FormAksi';
import { PanelSamping } from './PanelSamping';

function Isi({ lead, onBerubah }: { lead: LeadV2; onBerubah?: (id: string, status: string) => void }) {
  const { sesi } = useSesi();
  const admin = sesi.peran === 'admin';
  const [status, setStatus] = useState(normalStatus(lead.status));
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState('');
  const [pilihHilang, setPilihHilang] = useState(false);
  const [alasan, setAlasan] = useState<string>(ALASAN_HILANG[0]);

  function pilihTahap(baru: string) {
    // Hilang wajib membawa alasan dari daftar baku.
    if (baru === 'Hilang') return setPilihHilang(true);
    setPilihHilang(false);
    void ubahTahap(baru);
  }

  async function ubahTahap(baru: string, alasanHilang = '') {
    if (!lead.id) return setGalat('Baris ini tidak punya id (waktu|nomor_hash), tahap tidak bisa diubah.');
    setProses(true);
    setGalat('');
    try {
      await api.aksi('lead_status', { id: lead.id, status: baru, ...(alasanHilang ? { alasan: alasanHilang } : {}) });
      setStatus(baru);
      setPilihHilang(false);
      onBerubah?.(lead.id, baru);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : String(e));
    } finally {
      setProses(false);
    }
  }

  const kolom: [string, string | undefined][] = [
    ['Masuk', tanggalJam(lead.waktu)], ['Nomor', samarkanNomor(lead.nomor)], ['Anak', lead.nama_anak], ['Usia anak', lead.usia_anak],
    ['Keluhan', lead.keluhan], ['Sumber', lead.sumber], ['Permintaan jadwal', lead.permintaan_jadwal],
    ['Observasi', lead.tanggal_observasi], ['Catatan admin', lead.catatan_admin],
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="tahap-lead" className="text-sm font-medium text-zinc-700">Tahap</label>
        <div className="flex items-center gap-3">
          <select id="tahap-lead" value={pilihHilang ? 'Hilang' : status} disabled={!admin || proses} onChange={(e) => pilihTahap(e.target.value)} className={`${KELAS_INPUT} h-11 flex-1`}>
            {SEMUA_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChipStatus status={status} />
        </div>
        {pilihHilang && (
          <div className="space-y-2 rounded-2xl border border-zinc-200 p-3">
            <label htmlFor="alasan-hilang" className="text-[13px] font-medium text-zinc-700">Alasan hilang</label>
            <div className="flex flex-wrap items-center gap-2">
              <select id="alasan-hilang" value={alasan} onChange={(e) => setAlasan(e.target.value)} className={`${KELAS_INPUT} h-11 flex-1`}>
                {ALASAN_HILANG.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button type="button" disabled={proses} onClick={() => ubahTahap('Hilang', alasan)} className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 active:scale-[0.98] disabled:opacity-50">Simpan</button>
              <button type="button" onClick={() => setPilihHilang(false)} className="h-11 rounded-xl px-3 text-sm text-zinc-600 hover:bg-zinc-100">Batal</button>
            </div>
          </div>
        )}
        {galat && <p role="alert" className="text-[13px] text-bata-700">{galat}</p>}
        {!admin && <p className="text-[12px] text-zinc-500">Hanya admin yang bisa mengubah tahap.</p>}
      </div>
      <dl className="divide-y divide-zinc-200 border-y border-zinc-200">
        {kolom.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-[13px]">
            <dt className="text-zinc-500">{k}</dt>
            <dd className={`min-w-0 break-words text-zinc-900 ${k === 'Nomor' || k === 'Masuk' ? 'font-mono' : ''}`}>{v || '-'}</dd>
          </div>
        ))}
      </dl>
      {admin && nomorUtuh(lead.nomor) ? (
        <a href={tautanWa(lead.nomor)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 active:scale-[0.98]">
          <WhatsappLogo size={20} /> Buka WhatsApp
        </a>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-[13px] text-zinc-500">Nomor disamarkan. Tombol WhatsApp hanya untuk peran admin.</p>
      )}
      {status === 'Klien aktif' && (
        <section className="space-y-3 rounded-2xl bg-lumut-50 p-4">
          <h3 className="text-sm font-medium text-lumut-700">Lead ini jadi klien. Salin ke Klien Aktif?</h3>
          <FormAksi
            aksi="klien_aktif_tulis"
            kolom={KOLOM_KLIEN}
            awal={{ nama_anak: lead.nama_anak || '', nomor_ortu: nomorUtuh(lead.nomor) ? lead.nomor : '', nama_ortu: lead.nama_ortu || '', program: '', aktif: 'ya', tanggal_mulai: '', reevaluasi_terakhir: '' }}
            label="Salin ke Klien Aktif"
            boleh={admin}
            pesanBerhasil="Tersalin ke Klien Aktif"
          />
        </section>
      )}
    </div>
  );
}

export function DetailLead({ lead, onTutup, onBerubah }: { lead: LeadV2 | null; onTutup: () => void; onBerubah?: (id: string, status: string) => void }) {
  return (
    <PanelSamping terbuka={Boolean(lead)} onTutup={onTutup} judul={lead?.nama_ortu || 'Detail lead'}>
      {lead && <Isi key={lead.id || lead.waktu} lead={lead} onBerubah={onBerubah} />}
    </PanelSamping>
  );
}
