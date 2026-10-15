// Daftar putih aksi ke webhook cs-api (kontrak bahan/api-latih.md).
// Hanya kolom yang dikenal yang diteruskan; nilai dari browser tidak pernah dipercaya mentah.

export const NOMOR_LATIH = /^latih-[a-z0-9]{4,32}$/;
const KUNCI_RAHASIA = /(_SECRET|_KEY|_TOKEN)$/i;
const KUNCI_SAH = /^[A-Z][A-Z0-9_]{1,63}$/;

export function kunciRahasia(kunci) {
  return KUNCI_RAHASIA.test(String(kunci || ''));
}

// Cegah injeksi rumus Google Sheets: nilai berawalan = + - @ disimpan sebagai teks.
export function amanSheet(t) {
  return /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
}

function teks(v, maks, wajib = false) {
  if (v === undefined || v === null || v === '') {
    if (wajib) throw new Error('kolom wajib kosong');
    return '';
  }
  if (typeof v !== 'string' && typeof v !== 'number') throw new Error('nilai harus teks');
  const t = String(v).trim();
  if (wajib && !t) throw new Error('kolom wajib kosong');
  if (t.length > maks) throw new Error(`teks terlalu panjang (maks ${maks})`);
  return t;
}

function hari(v, bawaan) {
  if (v === undefined || v === null || v === '') return bawaan;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 90) throw new Error('hari harus 1 sampai 90');
  return n;
}

function pilihan(v, daftar) {
  if (!daftar.includes(v)) throw new Error(`nilai harus salah satu dari: ${daftar.join(', ')}`);
  return v;
}

export const TAHAP_LEAD = ['Baru', 'Follow-up', 'Dihubungi', 'Observasi dijadwalkan', 'Observasi selesai', 'Asesmen', 'Klien aktif', 'Hilang'];
const HASH = /^[a-f0-9]{64}$/;
// Alasan Hilang baku (U1.6).
export const ALASAN_HILANG = ['tidak merespons', 'biaya', 'jarak/jadwal', 'pilih tempat lain', 'belum siap', 'tidak sesuai layanan'];

function hashOpsional(b) {
  const h = teks(b.nomor_hash, 64);
  if (h && !HASH.test(h)) throw new Error('nomor_hash tidak sah');
  return h ? { nomor_hash: h } : {};
}

function tanggalOpsional(v, nama) {
  const t = teks(v, 10);
  if (t && !/^\d{4}-\d{2}-\d{2}$/.test(t)) throw new Error(`${nama} berbentuk YYYY-MM-DD`);
  return t;
}

function tanggalJamOpsional(v) {
  const t = teks(v, 16);
  if (t && !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(t)) throw new Error('tanggal_observasi berbentuk YYYY-MM-DD atau YYYY-MM-DD HH:MM');
  return t;
}

function bilangan(v, bawaan, min, maks, nama) {
  if (v === undefined || v === null || v === '') return bawaan;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > maks) throw new Error(`${nama} harus ${min} sampai ${maks}`);
  return n;
}

function nomorWa(v) {
  const t = teks(v, 20, true);
  if (!/^[0-9+\-\s]{8,20}$/.test(t)) throw new Error('nomor hanya angka, spasi, + atau -');
  return t;
}

// Baris dikenali lewat id (waktu|nomor_hash) atau, bila belum punya baris, nomor_hash saja.
function idAtauHash(b) {
  const id = teks(b.id, 200);
  const nomor_hash = teks(b.nomor_hash, 64);
  if (nomor_hash && !HASH.test(nomor_hash)) throw new Error('nomor_hash tidak sah');
  if (!id && !nomor_hash) throw new Error('id atau nomor_hash wajib');
  return id ? { id } : { nomor_hash };
}

// tulis = aksi yang mengubah sheet selain label; hanya peran admin.
const ATURAN = {
  label: { tulis: false, susun: (b) => ({ id_giliran: teks(b.id_giliran, 120, true), label: pilihan(b.label, ['Benar', 'Salah']), koreksi: teks(b.koreksi, 2000) }) },
  log_sesi: {
    tulis: false,
    susun: (b, sesi) => {
      const hash = teks(b.nomor_hash, 64);
      if (hash) {
        if (!HASH.test(hash)) throw new Error('nomor_hash tidak sah');
        return { nomor_hash: hash };
      }
      const nomor = teks(b.nomor, 40, true);
      if (NOMOR_LATIH.test(nomor)) return { nomor };
      // Nomor asli (kartu anak, U1.6: klien_aktif_baca belum membawa nomor_hash) hanya untuk admin.
      if (sesi.peran === 'admin' && /^[0-9+\-\s]{8,20}$/.test(nomor)) return { nomor };
      throw new Error('log_sesi hanya untuk nomor latih-..., nomor_hash, atau nomor asli oleh admin');
    },
  },
  ringkasan: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 7) }) },
  lead: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 1) }) },
  perlu_tindakan: { tulis: false, susun: () => ({}) },
  pertanyaan: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 7) }) },
  audit: { tulis: false, susun: () => ({}) },
  konfigurasi_baca: { tulis: false, susun: () => ({}) },
  percakapan: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 1), batas: bilangan(b.batas, 50, 1, 200, 'batas') }) },
  jadwal: { tulis: false, susun: (b) => ({ hari_ke_depan: bilangan(b.hari_ke_depan, 7, 1, 31, 'hari_ke_depan') }) },
  pipeline: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 30), sumber: teks(b.sumber, 40) }) },
  grafik: { tulis: false, susun: (b) => ({ rentang: pilihan(String(b.rentang ?? 'hari'), ['hari', '7', '30']) }) },
  layanan: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 7) }) },
  pengetahuan_baca: { tulis: false, susun: () => ({}) },
  // Usulan U1.7 (belum ada di kontrak workflow 11): daftar eskalasi penuh dan daftar Klien Aktif.
  eskalasi_daftar: { tulis: false, susun: (b) => ({ hari: hari(b.hari, 30), ...hashOpsional(b) }) },
  klien_aktif_baca: { tulis: false, susun: () => ({}) },
  // Usulan U1.7 kartu anak: riwayat jam ganti (filter anak) dan umpan balik (filter nomor_hash).
  jam_ganti_daftar: { tulis: false, susun: (b) => ({ anak: teks(b.anak, 80), hari: bilangan(b.hari, 180, 1, 365, 'hari'), ...hashOpsional(b) }) },
  umpan_balik: {
    tulis: false,
    susun: (b) => {
      const nomor_hash = teks(b.nomor_hash, 64);
      if (nomor_hash && !HASH.test(nomor_hash)) throw new Error('nomor_hash tidak sah');
      return { nomor_hash, hari: bilangan(b.hari, 90, 1, 400, 'hari') };
    },
  },
  konfigurasi_tulis: {
    tulis: true,
    susun: (b) => {
      const kunci = teks(b.kunci, 64, true);
      if (!KUNCI_SAH.test(kunci)) throw new Error('format kunci tidak sah');
      if (kunciRahasia(kunci)) throw new Error('kunci rahasia tidak boleh diubah dari sini');
      return { kunci, nilai: teks(b.nilai, 500) };
    },
  },
  klien_aktif_tulis: {
    tulis: true,
    susun: (b) => ({
      nama_anak: teks(b.nama_anak, 80, true),
      nomor_ortu: nomorWa(b.nomor_ortu),
      nama_ortu: teks(b.nama_ortu, 80),
      program: teks(b.program, 120),
      aktif: pilihan(b.aktif, ['ya', 'tidak']),
      tanggal_mulai: tanggalOpsional(b.tanggal_mulai, 'tanggal_mulai'),
      reevaluasi_terakhir: tanggalOpsional(b.reevaluasi_terakhir, 'reevaluasi_terakhir'),
    }),
  },
  eskalasi_status: { tulis: true, susun: (b) => ({ ...idAtauHash(b), status: pilihan(b.status, ['Diambil', 'Selesai']) }) },
  lead_status: {
    tulis: true,
    susun: (b) => {
      const status = pilihan(b.status, TAHAP_LEAD);
      const alasan = teks(b.alasan, 60);
      if (status === 'Hilang') pilihan(alasan, ALASAN_HILANG);
      return { id: teks(b.id, 200, true), status, ...(alasan ? { alasan } : {}) };
    },
  },
  lead_tulis: {
    tulis: true,
    susun: (b) => ({
      nama_ortu: teks(b.nama_ortu, 80, true),
      nomor: nomorWa(b.nomor),
      usia_anak: teks(b.usia_anak, 40),
      keluhan: teks(b.keluhan, 500),
      sumber: 'manual',
      status: pilihan(b.status || 'Baru', TAHAP_LEAD),
      tanggal_observasi: tanggalJamOpsional(b.tanggal_observasi),
      catatan_admin: teks(b.catatan_admin, 500),
    }),
  },
  pengetahuan_tulis: {
    tulis: true,
    susun: (b) => {
      const id = teks(b.id, 8);
      if (id && !/^P\d{3,4}$/.test(id)) throw new Error('id Pengetahuan berbentuk P001');
      const topik = teks(b.topik, 40, true);
      if (!/^[a-z0-9_]{2,40}$/.test(topik)) throw new Error('topik hanya huruf kecil, angka, garis bawah');
      const verbatim = b.verbatim === undefined ? {} : { verbatim: pilihan(b.verbatim, ['ya', '']) };
      return { id, topik, pertanyaan_variasi: teks(b.pertanyaan_variasi, 1000), jawaban: teks(b.jawaban, 2000, true), ...verbatim };
    },
  },
  // U1.15: admin membalas orang tua dari panel transkrip (nama admin diisi server dari sesi).
  balas_admin: {
    tulis: true,
    susun: (b) => {
      const nomor_hash = teks(b.nomor_hash, 64, true);
      if (!HASH.test(nomor_hash)) throw new Error('nomor_hash tidak sah');
      return { nomor_hash, teks: teks(b.teks, 1000, true) };
    },
  },
  // U1.13: tanda "jawab persis" per baris Pengetahuan.
  pengetahuan_verbatim: {
    tulis: true,
    susun: (b) => {
      const id = teks(b.id, 8, true);
      if (!/^P\d{3,4}$/.test(id)) throw new Error('id Pengetahuan berbentuk P001');
      return { id, verbatim: pilihan(b.verbatim, ['ya', '']) };
    },
  },
  // Usulan U1.7: tombol Setujui/Tolak jam ganti dari CRM.
  jam_ganti_status: { tulis: true, susun: (b) => ({ id: teks(b.id, 200, true), status: pilihan(b.status, ['Disetujui', 'Ditolak', 'Selesai']) }) },
};

export const DAFTAR_AKSI = Object.keys(ATURAN);

// Mengembalikan { body } yang siap dikirim ke n8n, atau { galat, kode }.
export function susunAksi(masukan, sesi) {
  const aksi = masukan && typeof masukan.aksi === 'string' ? masukan.aksi : '';
  const aturan = Object.hasOwn(ATURAN, aksi) ? ATURAN[aksi] : null;
  if (!aturan) return { galat: 'aksi tidak dikenal', kode: 400 };
  if (aturan.tulis && sesi.peran !== 'admin') return { galat: 'hanya admin yang boleh mengubah data ini', kode: 403 };
  try {
    const isi = { ...aturan.susun(masukan, sesi), ...(['eskalasi_status', 'jam_ganti_status', 'balas_admin'].includes(aksi) ? { admin: sesi.nama } : {}) };
    // Validasi dulu, baru amankan semua teks yang akan ditulis ke sheet.
    const aman = Object.fromEntries(Object.entries(isi).map(([k, v]) => [k, typeof v === 'string' ? amanSheet(v) : v]));
    return { body: { aksi, ...aman } };
  } catch (e) {
    return { galat: `${aksi}: ${e.message}`, kode: 400 };
  }
}

const KOLOM_NOMOR = new Set(['nomor', 'nomor_ortu']);

function samarkan(nilai) {
  const s = String(nilai ?? '');
  const a = s.replace(/\D/g, '');
  if (/[x*]/i.test(s) || a.length < 9) return s;
  return `${a.slice(0, 4)}-xxxx-${a.slice(-4)}`;
}

// Samarkan semua kolom nomor di kedalaman berapa pun (bukan admin = tidak pernah menerima nomor utuh).
function samarkanDalam(v) {
  if (Array.isArray(v)) return v.map(samarkanDalam);
  if (!v || typeof v !== 'object') return v;
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, KOLOM_NOMOR.has(k) ? samarkan(x) : samarkanDalam(x)]));
}

// Pertahanan kedua: n8n sudah menyaring, tapi baris rahasia dibuang dan nomor disamarkan di sini juga.
export function saringRespons(aksi, respons, peran = 'admin') {
  let data = respons.data;
  if (aksi === 'konfigurasi_baca') {
    data = Array.isArray(data) ? data.filter((r) => !kunciRahasia(r && (r.kunci ?? r.Kunci))) : [];
  }
  if (peran !== 'admin') data = samarkanDalam(data);
  return { ...respons, data };
}
