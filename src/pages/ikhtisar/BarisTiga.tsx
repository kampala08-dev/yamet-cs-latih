// Baris 3 (7/5): Pipeline lead dan Grafik percakapan.
import { useCallback, useState } from 'react';
import { angka, labelGrafik } from '../../lib/format';
import { useAksi } from '../../lib/useAksi';
import type { DataGrafik, DataPipeline, LeadV2, Rentang } from '../../lib/tipe';
import { DetailLead } from '../../components/DetailLead';
import { GrafikCorong } from '../../components/GrafikCorong';
import { GrafikGaris } from '../../components/GrafikGaris';
import { PilihTampilan, useTampilan } from '../../components/PilihTampilan';
import { Kerangka, KeadaanData, Kosong } from '../../components/Keadaan';
import { PipelineKolom, type KolomData } from '../../components/PipelineKolom';
import { Ubin } from '../../components/Ubin';

export function kolomDariPipeline(p: DataPipeline): { kolom: KolomData[]; hilang: KolomData } {
  return {
    kolom: (p.tahap || []).map((t) => ({ status: t.status, jumlah: t.jumlah, konversi_ke_berikut: t.konversi_ke_berikut_pct ?? null, lead: t.teratas || [] })),
    hilang: { status: 'Hilang', jumlah: p.hilang?.jumlah ?? 0, konversi_ke_berikut: null, lead: p.hilang?.teratas ?? [] },
  };
}

function UbinPipeline({ hari }: { hari: number }) {
  const { data, memuat, galat, muatUlang } = useAksi<DataPipeline>('pipeline', { hari });
  const [dipilih, setDipilih] = useState<LeadV2 | null>(null);
  const [tampilan, setTampilan] = useTampilan('cs-tampilan-pipeline-ikhtisar', 'corong');
  const tutup = useCallback(() => setDipilih(null), []);
  const k = data ? kolomDariPipeline(data) : null;
  return (
    <Ubin judul="Pipeline lead" keterangan={`${data ? angka(data.total) : '-'} lead dalam rentang ini`} lihatSemua="/pipeline" aksi={<PilihTampilan nilai={tampilan} onUbah={setTampilan} />} className="col-span-12 xl:col-span-7">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang} kerangka={<div className="grid grid-cols-3 gap-3"><Kerangka className="h-40" /><Kerangka className="h-40" /><Kerangka className="h-40" /></div>}>
        {k && data && (!data.total ? <Kosong judul="Belum ada lead di rentang ini." /> : tampilan === 'corong' ? <GrafikCorong data={data} /> : <PipelineKolom kolom={k.kolom} hilang={k.hilang} onPilih={setDipilih} />)}
      </KeadaanData>
      <DetailLead lead={dipilih} onTutup={tutup} onBerubah={muatUlang} />
    </Ubin>
  );
}

function UbinGrafik({ rentang }: { rentang: Rentang }) {
  const { data, memuat, galat, muatUlang } = useAksi<DataGrafik>('grafik', { rentang });
  const angkaKecil: [string, string][] = data
    ? [
        ['Giliran', angka(data.giliran)],
        ['Token', angka(data.token)],
        ['Latensi median', data.latensi_median_ms === null ? '-' : `${angka(data.latensi_median_ms / 1000, 1)} dtk`],
        ['Tanpa admin', data.selesai_tanpa_admin_pct === null ? '-' : `${angka(data.selesai_tanpa_admin_pct, 1)}%`],
      ]
    : [];
  return (
    <Ubin judul="Grafik percakapan" keterangan={rentang === 'hari' ? 'Per jam, hari ini' : `Per hari, ${rentang} hari`} className="col-span-12 xl:col-span-5">
      <KeadaanData memuat={memuat} galat={galat} adaData={Boolean(data)} muatUlang={muatUlang} kerangka={<Kerangka className="h-[180px]" />}>
        {data && <GrafikGaris deret={(data.deret || []).map((d) => ({ ...d, label: labelGrafik(d.label, rentang) }))} />}
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
          {angkaKecil.map(([k, v]) => (
            <div key={k} className="bg-white px-3 py-2.5">
              <dt className="text-[11px] text-zinc-500">{k}</dt>
              <dd className="font-mono text-[15px] text-zinc-900">{v}</dd>
            </div>
          ))}
        </dl>
      </KeadaanData>
    </Ubin>
  );
}

export function BarisTiga({ rentang, hari }: { rentang: Rentang; hari: number }) {
  return (
    <>
      <UbinPipeline hari={hari} />
      <UbinGrafik rentang={rentang} />
    </>
  );
}
