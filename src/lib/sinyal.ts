// Sinyal risiko klien aktif (bahan/crm-prinsip-yamet.md bagian 4). Murni: tanpa efek samping, mudah diuji.
import { msDariWaktu } from './format';
import type { BarisEskalasi, BarisJamGanti, BarisKlien, BarisLog, BarisUmpanBalik } from './tipe';

const HARI_MS = 86_400_000;

export interface Sinyal {
  kunci: string;
  judul: string;
  terpicu: boolean;
  rincian: string;
  tindakan: string;
}

interface Masukan {
  klien: BarisKlien;
  log: BarisLog[];
  jamGanti: BarisJamGanti[];
  eskalasi: BarisEskalasi[];
  umpanBalik: BarisUmpanBalik[];
  berlakuJamGantiHari: number;
  sekarang?: number;
}

function hariLalu(waktu: string, sekarang: number) {
  const t = msDariWaktu(waktu);
  return Number.isFinite(t) ? (sekarang - t) / HARI_MS : Infinity;
}

export function hitungSinyal({ klien, log, jamGanti, eskalasi, umpanBalik, berlakuJamGantiHari, sekarang = Date.now() }: Masukan): Sinyal[] {
  // Izin dihitung per tanggal: satu giliran izin bisa menulis beberapa baris Log bertopik izin (pesan, balasan, catat_izin).
  const izin = new Set(log.filter((r) => r.topik === 'izin' && hariLalu(r.waktu, sekarang) <= 28).map((r) => r.waktu.slice(0, 10))).size;

  const aktifJamGanti = jamGanti.filter((j) => !['Selesai', 'Ditolak'].includes(j.status));
  const sisaHari = (j: BarisJamGanti) => berlakuJamGantiHari - hariLalu(j.waktu, sekarang);
  // Pakai `hangus` dari server; hitung sendiri hanya bila bidang itu tidak ada.
  const hangus = aktifJamGanti.filter((j) => (typeof j.hangus === 'boolean' ? j.hangus : sisaHari(j) < 0)).length;
  const hampir = aktifJamGanti.filter((j) => j.hangus !== true && sisaHari(j) >= 0 && sisaHari(j) <= 14).length;

  const acuanReeval = klien.reevaluasi_terakhir || klien.tanggal_mulai || '';
  const hariReeval = acuanReeval ? hariLalu(acuanReeval, sekarang) : null;

  const keluhan = eskalasi.filter((e) => e.status !== 'Selesai' && hariLalu(e.waktu, sekarang) <= 60).length;
  const skorRendah = umpanBalik.filter((u) => Number(u.skor) <= 3);

  return [
    {
      kunci: 'izin', judul: 'Izin beruntun', terpicu: izin >= 2,
      rincian: `${izin} izin dalam 28 hari${izin >= 3 ? ' (merah)' : ''}`,
      tindakan: 'WA personal: tanya kendala, tawarkan jam ganti, beri tahu terapis.',
    },
    {
      kunci: 'jam_ganti', judul: 'Jam ganti hangus', terpicu: hangus + hampir > 0,
      rincian: hangus || hampir ? `${hangus} hangus, ${hampir} hangus dalam 14 hari` : 'tidak ada yang hampir hangus',
      tindakan: 'Tawarkan dua pilihan jadwal; bila sudah hangus jelaskan aturan dengan ramah.',
    },
    {
      kunci: 'reevaluasi', judul: 'Re-evaluasi lewat', terpicu: hariReeval !== null && hariReeval > 150,
      rincian: hariReeval === null ? 'tanggal re-evaluasi belum ada' : `${Math.floor(hariReeval)} hari sejak re-evaluasi terakhir`,
      tindakan: 'Tawarkan jadwal re-evaluasi dan kirim ringkasan kemajuan dari terapis.',
    },
    {
      kunci: 'keluhan', judul: 'Keluhan terbuka', terpicu: keluhan > 0,
      rincian: keluhan ? `${keluhan} eskalasi belum selesai (60 hari)` : 'tidak ada eskalasi terbuka',
      tindakan: 'Rio atau koordinator menelepon dalam 1 hari kerja.',
    },
    {
      kunci: 'skor', judul: 'Skor rendah', terpicu: skorRendah.length > 0,
      rincian: skorRendah.length ? `skor ${skorRendah.map((u) => u.skor).join(', ')}` : 'tidak ada skor 3 atau kurang',
      tindakan: 'Admin menghubungi dalam 1 hari kerja, dengarkan dulu.',
    },
  ];
}
