// Bentuk data dari server (kontrak bahan/api-latih.md, dinormalisasi server/n8n.mjs).

export type Peran = 'admin' | 'latih';

export interface InfoSesi {
  nama: string;
  peran: Peran;
  mock: boolean;
}

export interface AlatDipanggil {
  nama: string;
  ok: boolean;
}

export interface JawabanChat {
  balasan: string;
  dilewati: boolean;
  alasan: string;
  pengetahuan_dipakai: string[];
  tool_dipanggil: AlatDipanggil[];
  token_in: number;
  token_out: number;
  latensi_ms: number;
  id_giliran: string;
  topik: string;
  sumber_cara: string;
  isi_gambar?: string;
}

export type Label = 'Benar' | 'Salah';

export interface Ringkasan {
  percakapan: number;
  lead_baru: number;
  selesai_tanpa_admin_pct: number;
  balasan_pertama_dtk: number;
  token_total: number;
  kuota_pct: number;
}

export type StatusLead = 'Baru' | 'Follow-up' | 'Dihubungi' | 'Daftar' | 'Batal';

export interface BarisLead {
  waktu: string;
  nomor_hash?: string;
  nomor: string;
  nama_ortu: string;
  usia_anak: string;
  keluhan: string;
  sumber: string;
  status: StatusLead | string;
  permintaan_jadwal: string;
  tanggal_observasi: string;
  catatan_admin: string;
}

export interface BarisEskalasi {
  id?: string;
  pesan_terakhir?: string;
  waktu_selesai?: string;
  waktu: string;
  nomor_hash?: string;
  nomor: string;
  alasan: string;
  prioritas: string;
  '3_pesan_terakhir'?: string;
  status: string;
  admin?: string;
  umur_menit?: number;
}

export interface BarisJamGanti {
  id?: string;
  admin?: string;
  nomor_hash?: string;
  hangus?: boolean;
  berlaku_sampai?: string;
  waktu: string;
  nomor: string;
  anak: string;
  program: string;
  sesi_asal: string;
  jam_diminta: string;
  alasan: string;
  status: string;
}

export interface PerluTindakan {
  eskalasi_terbuka: BarisEskalasi[];
  followup_jatuh_tempo: (BarisLead & { umur_jam?: number })[];
  jam_ganti_diajukan: BarisJamGanti[];
}

export interface Pertanyaan {
  terbanyak: { topik: string; jumlah: number }[];
  tidak_terjawab: { waktu: string; pesan: string }[];
}

export interface BarisAudit {
  id_giliran: string;
  waktu: string;
  pesan: string;
  balasan?: string;
  topik?: string;
  label?: string;
}

export interface BarisLog {
  waktu: string;
  arah: string;
  pesan: string;
  topik?: string;
  label?: string;
  koreksi?: string;
  id_giliran?: string;
}

export interface BarisKonfig {
  kunci: string;
  nilai: string;
  keterangan: string;
}

export interface Skenario {
  id: string;
  kelompok: string;
  judul: string;
  pesan: string[];
  harus: string;
  dilarang: string;
  bisaDiketik: boolean;
}

// --- CRM v2 (desain-crm-v2.md). Bentuk = usulan U1.7, lihat uji/U1.7-laporan.md. ---

export type Rentang = 'hari' | '7' | '30';

export interface RingkasanV2 extends Omit<Ringkasan, 'selesai_tanpa_admin_pct' | 'balasan_pertama_dtk' | 'kuota_pct'> {
  selesai_tanpa_admin_pct: number | null;
  balasan_pertama_dtk: number | null;
  kuota_pct: number | null;
  eskalasi_terbuka: number;
  observasi_dijadwalkan: number;
  sebelumnya?: Partial<Record<'percakapan' | 'lead_baru' | 'eskalasi_terbuka' | 'observasi_dijadwalkan', number>>;
  alur?: Partial<Record<'pesan_masuk' | 'dijawab_bot' | 'lead_tercatat' | 'observasi_dijadwalkan' | 'followup_terkirim' | 'pengingat_terkirim', number | null>>;
}

export interface LeadV2 extends BarisLead {
  id?: string;
  status_diubah?: string;
  nama_anak?: string;
  umur_jam?: number;
}

export interface TahapPipeline {
  status: string;
  jumlah: number;
  kumulatif?: number;
  umur_median_jam?: number | null;
  // U1.6: konversi_pct = dari tahap sebelumnya; konversi_ke_berikut_pct = ke tahap berikut.
  konversi_ke_berikut_pct?: number | null;
  konversi_pct: number | null;
  teratas: LeadV2[];
}

export interface DataPipeline {
  tahap: TahapPipeline[];
  hilang: { jumlah: number; alasan_terbanyak?: string | null; alasan?: { alasan: string; jumlah: number }[]; teratas: LeadV2[] };
  total: number;
}

export interface BarisPercakapan {
  nomor_hash: string;
  nomor_samar: string;
  nama: string;
  pesan_terakhir: string;
  waktu: string;
  status: 'Bot' | 'Admin' | 'Eskalasi' | string;
  id_eskalasi?: string;
  jenis?: JenisPercakapan;
  kanal?: string;
}

export interface BarisJadwal {
  id: string;
  tanggal: string;
  jam: string;
  nama_anak: string;
  nama_ortu: string;
  jenis: string;
  pengingat: 'terkirim' | 'belum' | string;
  terlewat?: boolean;
}

export interface DataGrafik {
  deret: { label: string; percakapan: number }[];
  giliran: number;
  token: number;
  latensi_median_ms: number | null;
  selesai_tanpa_admin_pct: number | null;
}

export interface BarisLayanan {
  id: string;
  nama: string;
  jumlah: number;
}

export interface BarisPengetahuan {
  id: string;
  topik: string;
  pertanyaan_variasi: string;
  jawaban: string;
}

export interface BarisKlien {
  nama_anak: string;
  nomor_ortu: string;
  nama_ortu: string;
  program: string;
  aktif: string;
  nomor_hash?: string;
  tanggal_mulai?: string;
  reevaluasi_terakhir?: string;
}

export interface BarisUmpanBalik {
  waktu: string;
  nomor_hash: string;
  skor: number;
  komentar?: string;
}

export type JenisPercakapan = 'lead' | 'klien';
