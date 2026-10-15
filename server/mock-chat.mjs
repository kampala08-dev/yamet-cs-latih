// Jawaban chat tiruan untuk halaman latih (CS_MOCK=1).
import { normalisasiChat } from './n8n.mjs';
import { idAcak, waktu } from './mock-data.mjs';

// Kalimat jawaban diambil dari bahan/pengetahuan.csv supaya pratinjau terasa nyata.
const POLA = [
  { cocok: /uji galat/i, galat: true },
  { cocok: /assalam|halo|hallo|selamat (pagi|siang|sore|malam)/i, balasan: 'Waalaikumsalam, Ayah/Bunda. Saya YAMET Customer Service, asisten otomatis YAMET Palembang Dempo. Ada yang bisa saya bantu terkait layanan terapi anak?', p: ['P071'], topik: 'umum' },
  { cocok: /telat|main hp|komplain|kecewa/i, balasan: 'Mohon maaf atas pengalaman ini, Ayah/Bunda. Keluhan ini sudah saya teruskan ke admin dengan prioritas tinggi, dan admin akan menghubungi Ayah/Bunda secepatnya.', p: [], alat: [['buat_eskalasi', true]], topik: 'eskalasi' },
  { cocok: /pindah jam|ganti jam|mau pindah/i, balasan: 'Baik, Ayah/Bunda. Permintaan pindah jam sudah saya ajukan ke admin. Admin akan mengonfirmasi apakah jam yang diminta tersedia.', p: [], alat: [['cek_klien_aktif', true], ['ajukan_jam_ganti', true]], topik: 'jam_ganti' },
  { cocok: /alamat|dimana|di mana|lokasi|minggu|buka/i, balasan: 'YAMET Palembang Dempo berlokasi di Jl. Dempo Luar No.558, 17 Ilir, Kec. Ilir Tim. I, Kota Palembang, Ayah/Bunda. Tautan Maps: https://maps.app.goo.gl/Dw8MyZpjp7bq1xmG9\nKami buka Senin sampai Jumat 08.00 sampai 18.00 dan Sabtu 08.00 sampai 15.00. Hari Minggu kami tutup.', p: ['P018', 'P019', 'P022'], topik: 'lokasi_jam' },
  { cocok: /per sesi|diskon/i, balasan: 'Untuk biaya terapi per sesi, admin kami akan menginformasikan langsung, Ayah/Bunda. Yang bisa saya sampaikan: biaya Observasi dan Assessment Rp 850.000 untuk satu paket.', p: ['P041'], topik: 'biaya' },
  { cocok: /berapa|biaya|harga|observasi/i, balasan: 'Biaya Observasi dan Assessment adalah Rp 850.000 untuk satu paket, Ayah/Bunda, dan dibayar sekali.', p: ['P041', 'P042'], topik: 'biaya' },
  { cocok: /autis|adhd|normal/i, balasan: 'Mohon maaf Ayah/Bunda, saya tidak dapat menilai atau menentukan kondisi anak lewat chat. Penilaian dilakukan lewat observasi dan asesmen oleh tim kami. Boleh tahu nama Ayah/Bunda?', p: ['P081'], topik: 'batas' },
  { cocok: /ngomong|bicara|wicara/i, balasan: 'Untuk kebutuhan terkait bicara, bahasa, dan komunikasi, tersedia Terapi Wicara, Ayah/Bunda. Apakah terapi ini yang paling sesuai akan dilihat lewat observasi dan asesmen awal. Boleh tahu nama Ayah/Bunda?', p: ['P008', 'P046'], topik: 'layanan' },
  { cocok: /nama saya|saya (bunda|ayah|ibu|pak)/i, balasan: 'Terima kasih, Bunda. Data awal sudah saya catat. Berapa usia anaknya sekarang?', p: [], alat: [['catat_lead', true]], topik: 'lead' },
  { cocok: /sabtu|jadwal|kapan/i, balasan: 'Preferensi jadwalnya sudah saya catat, Ayah/Bunda. Admin akan mengonfirmasi slot yang tersedia di jam kerja.', p: ['P021'], alat: [['catat_permintaan_jadwal', true]], topik: 'pendaftaran' },
];

const JAWAB_LAIN = 'Terima kasih, Ayah/Bunda. Untuk pertanyaan ini admin kami akan menghubungi di jam kerja. Ada hal lain yang bisa saya bantu?';

function gambarTiruan(nomor, teks, percakapan) {
  const id_giliran = `g-${idAcak()}`;
  const balasan = 'Terima kasih, Ayah/Bunda, gambarnya sudah kami terima. Bila ini bukti transfer, admin akan memeriksa dan mengonfirmasi di jam kerja.';
  const w = waktu(Date.now());
  percakapan.set(nomor, [...(percakapan.get(nomor) || []), { waktu: w, arah: 'masuk', pesan: `[gambar] ${teks}`.trim(), id_giliran }, { waktu: w, arah: 'keluar', pesan: balasan, id_giliran }]);
  return { ok: true, data: normalisasiChat({ balasan, pengetahuan_dipakai: [], alat: [], token_in: 3120, token_out: 48, latensi_ms: 6400, id_giliran, topik: 'gambar', sumber_cara: 'tidak ada', model: 'MiniMax-M3', isi_gambar: '(tiruan) Tangkapan layar bukti transfer bank, nominal Rp 850.000, tanggal 15 Okt 2026.' }) };
}

function tunggu(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function chatTiruan({ nomor, teks, gambar_base64 }, percakapan, cariVerbatim = () => null) {
  await tunggu(900 + Math.random() * 1300);
  if (gambar_base64) return gambarTiruan(nomor, teks, percakapan);
  const persis = cariVerbatim(teks);
  if (persis) {
    const id_giliran = `g-${idAcak()}`;
    const w = waktu(Date.now());
    percakapan.set(nomor, [...(percakapan.get(nomor) || []), { waktu: w, arah: 'masuk', pesan: teks, id_giliran }, { waktu: w, arah: 'keluar', pesan: persis.jawaban, id_giliran }]);
    return { ok: true, data: normalisasiChat({ balasan: persis.jawaban, pengetahuan_dipakai: [persis.id], alat: [], token_in: 0, token_out: 0, latensi_ms: 180, id_giliran, topik: persis.topik, sumber_cara: 'verbatim', model: 'verbatim' }) };
  }
  const pola = POLA.find((x) => x.cocok.test(teks));
  if (pola && pola.galat) return { ok: false, kode: 504, galat: 'n8n tidak menjawab dalam 90 detik. (tiruan)' };
  const id_giliran = `g-${idAcak()}`;
  const balasan = pola ? pola.balasan : JAWAB_LAIN;
  const latensi_ms = 3100 + Math.floor(Math.random() * 5200);
  const w = waktu(Date.now());
  percakapan.set(nomor, [
    ...(percakapan.get(nomor) || []),
    { waktu: w, arah: 'masuk', pesan: teks, id_giliran },
    { waktu: w, arah: 'keluar', pesan: balasan, id_giliran, latensi_ms },
  ]);
  return {
    ok: true,
    data: normalisasiChat({
      balasan,
      pengetahuan_dipakai: pola ? pola.p : [],
      alat: (pola?.alat || []).map(([tool, ok]) => ({ tool, ok })),
      token_in: 2400 + teks.length * 3 + Math.floor(Math.random() * 180),
      token_out: 60 + Math.floor(balasan.length / 3.5),
      latensi_ms,
      id_giliran,
      topik: pola ? pola.topik : 'umum',
      sumber_cara: pola && pola.p.length ? 'penanda model' : 'tidak ada',
      model: 'MiniMax-M3',
    }),
  };
}
