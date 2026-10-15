// Pipeline penuh: jumlah & konversi dari aksi pipeline, semua kartu dari aksi lead (dikelompokkan per tahap).
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { HARI_RENTANG, angka, msDariWaktu } from '../lib/format';
import { INDUK_UBIN } from '../lib/gerak';
import { kolomPipeline, normalStatus } from '../lib/status';
import { useAksi } from '../lib/useAksi';
import type { DataPipeline, LeadV2, Rentang } from '../lib/tipe';
import { DetailLead } from '../components/DetailLead';
import { GrafikCorong } from '../components/GrafikCorong';
import { PilihTampilan, useTampilan } from '../components/PilihTampilan';
import { HeaderHalaman, IsiHalaman, PemilihRentang } from '../components/HeaderHalaman';
import { Kerangka, KeadaanData } from '../components/Keadaan';
import { PipelineKolom } from '../components/PipelineKolom';
import { Ubin } from '../components/Ubin';

const SUMBER = [['', 'Semua sumber'], ['whatsapp', 'WhatsApp'], ['manual', 'Manual'], ['latih', 'Latih']] as const;

export function Pipeline() {
  const [rentang, setRentang] = useState<Rentang>('30');
  const [sumber, setSumber] = useState('');
  const [dipilih, setDipilih] = useState<LeadV2 | null>(null);
  const [tampilan, setTampilan] = useTampilan('cs-tampilan-pipeline-halaman', 'tahap');
  const tutup = useCallback(() => setDipilih(null), []);
  const hari = HARI_RENTANG[rentang];
  const pipa = useAksi<DataPipeline>('pipeline', { hari, sumber });
  const lead = useAksi<LeadV2[]>('lead', { hari });

  const sekarang = useMemo(() => Date.now(), [lead.data]);
  const semua = (Array.isArray(lead.data) ? lead.data : []).filter((l) => !sumber || l.sumber === sumber)
    .map((l) => ({ ...l, umur_jam: l.umur_jam ?? Math.max(0, Math.round((sekarang - msDariWaktu(l.waktu)) / 3_600_000)) }));
  const kolom = (pipa.data?.tahap ?? []).map((t) => ({
    status: t.status, jumlah: t.jumlah, konversi_ke_berikut: t.konversi_ke_berikut_pct ?? null,
    lead: lead.data ? semua.filter((l) => kolomPipeline(l.status) === t.status) : t.teratas,
  }));
  const hilang = { status: 'Hilang', jumlah: pipa.data?.hilang?.jumlah ?? 0, konversi_ke_berikut: null, lead: lead.data ? semua.filter((l) => normalStatus(l.status) === 'Hilang') : pipa.data?.hilang?.teratas ?? [] };

  function berubah() {
    pipa.muatUlang();
    lead.muatUlang();
  }

  return (
    <IsiHalaman>
      <HeaderHalaman judul="Pipeline" keterangan={`${pipa.data ? angka(pipa.data.total) : '-'} lead · Baru sampai Klien aktif. Ketuk kartu untuk mengubah tahap.`}>
        <label htmlFor="sumber" className="sr-only">Sumber</label>
        <select id="sumber" value={sumber} onChange={(e) => setSumber(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400">
          {SUMBER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <PemilihRentang nilai={rentang} onUbah={setRentang} />
        <PilihTampilan nilai={tampilan} onUbah={setTampilan} />
      </HeaderHalaman>
      <motion.div variants={INDUK_UBIN} initial="awal" animate="tampil" className="space-y-5">
        {tampilan === 'corong' && (
          <Ubin judul="Corong lead" keterangan="Lead yang pernah mencapai tiap tahap dalam rentang ini">
            <KeadaanData memuat={pipa.memuat} galat={pipa.galat} adaData={Boolean(pipa.data)} muatUlang={pipa.muatUlang} kerangka={<Kerangka className="h-72" />}>
              {pipa.data && <GrafikCorong data={pipa.data} />}
            </KeadaanData>
          </Ubin>
        )}
        <Ubin judul="Kartu per tahap">
          <KeadaanData memuat={pipa.memuat} galat={pipa.galat || lead.galat} adaData={Boolean(pipa.data)} muatUlang={berubah} kerangka={<div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Kerangka className="h-64" /><Kerangka className="h-64" /><Kerangka className="h-64" /><Kerangka className="h-64" /></div>}>
            <PipelineKolom kolom={kolom} hilang={hilang} onPilih={setDipilih} sisa={!lead.data} />
          </KeadaanData>
        </Ubin>
      </motion.div>
      <DetailLead lead={dipilih} onTutup={tutup} onBerubah={berubah} />
    </IsiHalaman>
  );
}
