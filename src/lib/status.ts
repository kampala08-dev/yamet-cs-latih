// Status Lead disamakan dengan workflow (desain-crm-v2.md). Nilai lama dipetakan.
export const TAHAP_PIPELINE = ['Baru', 'Dihubungi', 'Observasi dijadwalkan', 'Observasi selesai', 'Asesmen', 'Klien aktif'] as const;
// Alasan Hilang baku, wajib saat status Hilang.
export const ALASAN_HILANG = ['tidak merespons', 'biaya', 'jarak/jadwal', 'pilih tempat lain', 'belum siap', 'tidak sesuai layanan'] as const;

export const SEMUA_STATUS = ['Baru', 'Follow-up', 'Dihubungi', 'Observasi dijadwalkan', 'Observasi selesai', 'Asesmen', 'Klien aktif', 'Hilang'] as const;

export function normalStatus(s: string): string {
  if (s === 'Daftar') return 'Observasi dijadwalkan';
  if (s === 'Batal') return 'Hilang';
  return s;
}

// Follow-up = sub-keadaan Baru, tampil di kolom Baru dengan chip ambar.
export function kolomPipeline(s: string): string {
  const n = normalStatus(s);
  return n === 'Follow-up' ? 'Baru' : n;
}

export type Nada = 'netral' | 'biru' | 'hijau' | 'bata' | 'ambar' | 'kuning' | 'redup';

export function nadaStatus(s: string): Nada {
  const n = normalStatus(s);
  if (n === 'Follow-up') return 'ambar';
  if (n === 'Klien aktif' || n === 'Selesai' || n === 'Disetujui' || n === 'terkirim') return 'hijau';
  if (n === 'Terbuka' || n === 'Eskalasi' || n === 'Ditolak') return 'bata';
  if (n === 'Bot') return 'biru';
  if (n === 'Hilang' || n === 'belum') return 'redup';
  return 'netral';
}
