// Mode CS_MOCK=1: tiruan n8n untuk mengembangkan UI tanpa workflow 07/11.
// Bentuk data = usulan atas kontrak bahan/api-latih.md + desain-crm-v2.md; lihat uji/U1.7-laporan.md.
import { chatTiruan } from './mock-chat.mjs';
import {
  HARI, JAM, KONFIGURASI, bacaPengetahuan, buatEskalasi, buatJamGanti, buatKlien, buatLead, buatPercakapan, logKlien, samarkan, tanggal, transkrip, waktu,
} from './mock-data.mjs';

const TAHAP = ['Baru', 'Dihubungi', 'Observasi dijadwalkan', 'Observasi selesai', 'Asesmen', 'Klien aktif'];

function tunggu(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Deret semu yang stabil (tidak berubah tiap muat ulang).
function semu(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function kolomTahap(status) {
  return status === 'Follow-up' ? 'Baru' : status;
}

function grafik(rentang, t0) {
  if (rentang === 'hari') {
    const sekarang = new Date(t0).getHours();
    const deret = Array.from({ length: 15 }, (_, i) => {
      const j = 7 + i;
      const puncak = Math.exp(-((j - 10) ** 2) / 6) * 6 + Math.exp(-((j - 19) ** 2) / 5) * 4;
      return { label: `${String(j).padStart(2, '0')}:00`, percakapan: j > sekarang ? 0 : Math.round(puncak + semu(j) * 2) };
    });
    return { deret, giliran: 61, token: 4721, latensi_median_ms: 6200, selesai_tanpa_admin_pct: 71 };
  }
  const n = Number(rentang);
  const deret = Array.from({ length: n }, (_, i) => {
    const d = new Date(t0 - (n - 1 - i) * HARI);
    return { label: tanggal(d.getTime()), percakapan: d.getDay() === 0 ? Math.round(semu(i) * 4) : Math.round(14 + semu(i + 3) * 16) };
  });
  const total = deret.reduce((a, b) => a + b.percakapan, 0);
  return { deret, giliran: total * 3, token: total * 33, latensi_median_ms: 6400, selesai_tanpa_admin_pct: n === 7 ? 71 : 68.4 };
}

function pipeline(lead, hari, sumber, t0) {
  const dalam = lead.filter((l) => t0 - Date.parse(l.waktu.replace(' ', 'T')) <= hari * HARI && (!sumber || l.sumber === sumber));
  const indeks = (l) => TAHAP.indexOf(kolomTahap(l.status));
  const sampai = (i) => dalam.filter((l) => indeks(l) >= i).length;
  const umur = (l) => Math.round((t0 - Date.parse(l.waktu.replace(' ', 'T'))) / JAM);
  const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  const diTahap = (l) => Math.round((t0 - Date.parse((l.status_diubah || l.waktu).replace(' ', 'T'))) / JAM);
  const tahap = TAHAP.map((status, i) => {
    const isi = dalam.filter((l) => kolomTahap(l.status) === status);
    return {
      status, jumlah: isi.length, kumulatif: sampai(i), umur_median_jam: median(isi.map(diTahap)),
      // U1.6: konversi_pct = dari tahap sebelumnya; arti lama (ke tahap berikut) = konversi_ke_berikut_pct.
      konversi_pct: i > 0 && sampai(i - 1) ? Math.round((sampai(i) / sampai(i - 1)) * 1000) / 10 : null,
      konversi_ke_berikut_pct: i < TAHAP.length - 1 && sampai(i) ? Math.round((sampai(i + 1) / sampai(i)) * 1000) / 10 : null,
      teratas: isi.slice(0, 3).map((l) => ({ ...l, umur_jam: umur(l) })),
    };
  });
  const hilang = dalam.filter((l) => l.status === 'Hilang');
  const alasan = hilang.length ? [{ alasan: 'tidak merespons', jumlah: hilang.length }] : [];
  return { tahap, lainnya: 0, hari, sumber: sumber || '', hilang: { jumlah: hilang.length, alasan_terbanyak: alasan[0]?.alasan ?? null, alasan, teratas: hilang.slice(0, 3).map((l) => ({ ...l, umur_jam: umur(l) })) }, total: dalam.length };
}

function ringkasan(hari, eskalasi, lead) {
  const skala = { 1: [23, 4, 3], 7: [143, 17, 6], 30: [512, 61, 14] }[hari] || [143, 17, 6];
  const terbuka = eskalasi.filter((e) => e.status === 'Terbuka').length;
  return {
    percakapan: skala[0], lead_baru: skala[1], eskalasi_terbuka: terbuka,
    observasi_dijadwalkan: lead.filter((l) => l.status === 'Observasi dijadwalkan').length,
    selesai_tanpa_admin_pct: 71, balasan_pertama_dtk: 6, token_total: 4721, kuota_pct: null,
    sebelumnya: { percakapan: Math.round(skala[0] * 0.86), lead_baru: skala[1] + 2, eskalasi_terbuka: 1, observasi_dijadwalkan: 2 },
    alur: { pesan_masuk: skala[0] * 3, dijawab_bot: Math.round(skala[0] * 3 * 0.94), lead_tercatat: skala[1], observasi_dijadwalkan: 3, followup_terkirim: null, pengingat_terkirim: null },
  };
}

export function buatMock(sekarang = () => Date.now()) {
  const t0 = sekarang();
  let lead = buatLead(t0);
  let eskalasi = buatEskalasi(t0);
  let konfigurasi = KONFIGURASI;
  let klien = buatKlien(t0);
  const riwayatJamGanti = buatJamGanti(t0);
  let pengetahuan = bacaPengetahuan();
  let jamGanti = [{ id: `${waktu(t0 - 3 * JAM)}|Nadia`, waktu: waktu(t0 - 3 * JAM), nomor: '085200001302', anak: 'Nadia', program: 'Terapi Okupasi', sesi_asal: 'Rabu 10.00', jam_diminta: 'Rabu 14.00', alasan: 'bentrok jadwal sekolah', status: 'Diajukan', admin: '' }];
  const label = new Map();
  const percakapanLatih = new Map();
  const percakapan = buatPercakapan(t0, lead, eskalasi);
  const audit = [
    ['woi dmn alamatnyo? jam brp bukak?', 'YAMET Palembang Dempo berlokasi di Jl. Dempo Luar No.558, 17 Ilir ...', 'lokasi_jam'],
    ['anak sayo 2 tahun belum lancar ngomong', 'Untuk kebutuhan terkait bicara, tersedia Terapi Wicara ...', 'layanan'],
    ['bpjs biso dak?', 'Mohon maaf, untuk hal ini admin kami akan menghubungi Ayah/Bunda.', 'tidak ada'],
  ].map(([pesan, balasan, topik], i) => ({ id_giliran: `aud-${i + 1}`, waktu: waktu(t0 - (i * 19 + 7) * JAM), pesan, balasan, topik, label: '' }));

  const samarLead = (admin) => (l) => ({ ...l, nomor: admin ? l.nomor : samarkan(l.nomor) });
  const ubah = (daftar, id, f) => {
    if (!daftar.some((x) => x.id === id)) throw new Error('baris tidak ditemukan');
    return daftar.map((x) => (x.id === id ? f(x) : x));
  };

  const tanganan = {
    ringkasan: ({ hari }) => ringkasan(hari, eskalasi, lead),
    lead: ({ hari = 1 }, admin) => lead.filter((l) => t0 - Date.parse(l.waktu.replace(' ', 'T')) <= hari * HARI).map(samarLead(admin)),
    perlu_tindakan: () => ({
      eskalasi_terbuka: eskalasi.filter((e) => e.status !== 'Selesai').map((e) => ({ ...e, nomor: samarkan(e.nomor) })),
      followup_jatuh_tempo: lead.filter((l) => l.status === 'Follow-up').map((l) => ({ ...l, nomor: samarkan(l.nomor), umur_jam: 26 })),
      jam_ganti_diajukan: jamGanti.filter((j) => j.status === 'Diajukan').map((j) => ({ ...j, nomor: samarkan(j.nomor) })),
    }),
    pertanyaan: () => ({
      terbanyak: [['lokasi_jam', 41], ['biaya', 33], ['layanan', 27], ['pendaftaran', 19], ['observasi_asesmen', 14]].map(([topik, jumlah]) => ({ topik, jumlah })),
      tidak_terjawab: [
        { waktu: waktu(t0 - 5 * JAM), pesan: 'bpjs biso dipake dak?' },
        { waktu: waktu(t0 - 26 * JAM), pesan: 'ada terapi renang untuk anak?' },
        { waktu: waktu(t0 - 49 * JAM), pesan: 'parkir mobil muat berapa?' },
        { waktu: waktu(t0 - 71 * JAM), pesan: 'terapisnya ada yang laki-laki?' },
      ],
    }),
    audit: () => audit.filter((a) => !label.has(a.id_giliran)),
    konfigurasi_baca: () => konfigurasi,
    percakapan: ({ hari = 1 }) => percakapan.filter((p) => t0 - Date.parse(p.waktu.replace(' ', 'T')) <= hari * HARI),
    log_sesi: ({ nomor, nomor_hash }) => {
      const digit = (v) => String(v || '').replace(/\D/g, '').replace(/^0/, '62');
      const k = klien.find((x) => x.nomor_hash === nomor_hash || (nomor && digit(x.nomor_ortu) === digit(nomor)));
      const sumber = k ? logKlien(t0, k.nomor_hash, k.nama_anak === 'Rafa') : nomor ? percakapanLatih.get(nomor) || [] : k ? logKlien(t0, nomor_hash, k.nama_anak === 'Rafa') : transkrip(t0, percakapan.find((p) => p.nomor_hash === nomor_hash) || { pesan_terakhir: '-', status: 'Bot' });
      return sumber.map((r) => (label.has(r.id_giliran) && r.arah === 'keluar' ? { ...r, label: label.get(r.id_giliran).l, koreksi: label.get(r.id_giliran).koreksi } : r));
    },
    jadwal: ({ hari_ke_depan = 7 }) => {
      const batas = tanggal(t0 + hari_ke_depan * HARI);
      const obs = lead.filter((l) => l.status === 'Observasi dijadwalkan' && l.tanggal_observasi && l.tanggal_observasi.slice(0, 10) <= batas)
        .map((l, i) => ({ id: l.id, tanggal: l.tanggal_observasi.slice(0, 10), jam: l.tanggal_observasi.slice(11, 16), nama_anak: l.nama_anak, nama_ortu: l.nama_ortu, jenis: 'Observasi', pengingat: i % 2 ? 'belum' : 'terkirim', terlewat: l.tanggal_observasi.slice(0, 10) < tanggal(t0), nomor: samarkan(l.nomor), usia_anak: l.usia_anak, keluhan: l.keluhan, pengingat_rincian: [] }));
      const ases = [{ id: 'as-1', tanggal: tanggal(t0 + HARI), jam: '14:00', nama_anak: 'Bima', nama_ortu: 'Bunda Sari Wulandari', jenis: 'Asesmen', pengingat: 'terkirim' }];
      return [...obs, ...ases].sort((a, b) => `${a.tanggal}${a.jam}`.localeCompare(`${b.tanggal}${b.jam}`));
    },
    pipeline: ({ hari = 30, sumber }, admin) => {
      const p = pipeline(lead, hari, sumber, t0);
      const s = samarLead(admin);
      return { ...p, tahap: p.tahap.map((t) => ({ ...t, teratas: t.teratas.map(s) })), hilang: { ...p.hilang, teratas: p.hilang.teratas.map(s) } };
    },
    grafik: ({ rentang }) => grafik(rentang, t0),
    layanan: () => [['P002', 'Terapi Wicara', 38], ['P003', 'Sensori Integrasi', 21], ['P004', 'Terapi Okupasi', 17], ['P005', 'Terapi Perilaku', 12], ['P007', 'Fisioterapi', 5]].map(([id, nama, jumlah]) => ({ id, nama, jumlah })),
    pengetahuan_baca: () => pengetahuan,
    eskalasi_daftar: ({ nomor_hash }) => eskalasi.filter((e) => !nomor_hash || e.nomor_hash === nomor_hash).map(({ '3_pesan_terakhir': p3, ...e }) => ({ ...e, pesan_terakhir: p3, nomor: samarkan(e.nomor) })),
    jam_ganti_daftar: ({ anak, nomor_hash }) => riwayatJamGanti.filter((j) => (!anak || j.anak.toLowerCase() === anak.toLowerCase()) && (!nomor_hash || j.nomor_hash === nomor_hash)),
    // U1.6: tanpa nomor_hash (usulan U1.7 belum diambil); umpan_balik baru ada di U1.8.
    klien_aktif_baca: (_, admin) => klien.map(({ nomor_hash: _h, ...k }, i) => ({ ...k, baris: i + 2, nomor_ortu: admin ? k.nomor_ortu : samarkan(k.nomor_ortu) })),
    label: ({ id_giliran, label: l, koreksi }) => {
      label.set(id_giliran, { l, koreksi });
      return { id_giliran, label: l };
    },
    konfigurasi_tulis: ({ kunci, nilai }) => {
      if (!konfigurasi.some((k) => k.kunci === kunci)) throw new Error(`kunci ${kunci} tidak ada di tab Konfigurasi`);
      konfigurasi = konfigurasi.map((k) => (k.kunci === kunci ? { ...k, nilai } : k));
      return { kunci, nilai };
    },
    klien_aktif_tulis: (b) => {
      const ada = klien.some((k) => k.nama_anak === b.nama_anak);
      const lama = klien.find((k) => k.nama_anak === b.nama_anak) || {};
      const baru = { ...lama, nama_anak: b.nama_anak, nomor_ortu: b.nomor_ortu, nama_ortu: b.nama_ortu, program: b.program, aktif: b.aktif };
      klien = ada ? klien.map((k) => (k.nama_anak === b.nama_anak ? baru : k)) : [...klien, baru];
      return { nama_anak: b.nama_anak, hasil: ada ? 'diperbarui' : 'ditambahkan' };
    },
    eskalasi_status: ({ id, nomor_hash, status, admin }) => {
      if (id) eskalasi = ubah(eskalasi, id, (e) => ({ ...e, status, admin, waktu_selesai: status === 'Selesai' ? waktu(sekarang()) : '' }));
      else eskalasi = [...eskalasi, { id: `${waktu(sekarang())}|${nomor_hash}`, waktu: waktu(sekarang()), nomor_hash, nomor: '', alasan: 'Diambil admin dari CRM', prioritas: 'sedang', status, admin, waktu_selesai: '', umur_menit: 0 }];
      return { id, nomor_hash, status, admin };
    },
    jam_ganti_status: ({ id, status, admin }) => {
      jamGanti = ubah(jamGanti, id, (j) => ({ ...j, status, admin }));
      return { id, status };
    },
    lead_status: ({ id, status }) => {
      lead = ubah(lead, id, (l) => ({ ...l, status }));
      return { id, status };
    },
    lead_tulis: (b) => {
      const w = waktu(sekarang());
      const baris = { ...b, id: `${w}|manual${lead.length}`, waktu: w, nomor_hash: '', nama_anak: '', permintaan_jadwal: '', tanggal_observasi: '', catatan_admin: '' };
      lead = [baris, ...lead];
      return { id: baris.id, waktu: w };
    },
    pengetahuan_tulis: ({ id, topik, pertanyaan_variasi, jawaban }) => {
      const idBaru = id || `P${String(pengetahuan.length + 1).padStart(3, '0')}`;
      const baris = { id: idBaru, topik, pertanyaan_variasi, jawaban };
      pengetahuan = pengetahuan.some((p) => p.id === idBaru) ? pengetahuan.map((p) => (p.id === idBaru ? baris : p)) : [...pengetahuan, baris];
      return { id: idBaru, hasil: id ? 'diperbarui' : 'ditambahkan' };
    },
  };

  return {
    chat: (body) => chatTiruan(body, percakapanLatih),
    async aksi(body, { admin = false } = {}) {
      await tunggu(250 + Math.random() * 450);
      const f = Object.hasOwn(tanganan, body.aksi) ? tanganan[body.aksi] : null;
      if (!f) return { ok: false, kode: 400, galat: 'aksi tidak dikenal' };
      try {
        return { ok: true, data: f(body, admin) };
      } catch (e) {
        return { ok: false, kode: 422, galat: e.message };
      }
    },
  };
}
