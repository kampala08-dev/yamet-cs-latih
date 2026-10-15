// Data tiruan CS_MOCK=1. Nama sesuai spesifikasi desain; nomor bertengah 0000 (bukan nomor nyata).
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const MENIT = 60_000;
export const JAM = 60 * MENIT;
export const HARI = 24 * JAM;

export function waktu(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function tanggal(ms) {
  return waktu(ms).slice(0, 10);
}

export function samarkan(nomor) {
  const a = String(nomor).replace(/\D/g, '');
  return a.length < 9 ? a : `${a.slice(0, 4)}-xxxx-${a.slice(-4)}`;
}

export function hashNomor(nomor) {
  return createHash('sha256').update(`tiruan:${nomor}`).digest('hex');
}

export function idAcak() {
  return randomBytes(6).toString('hex');
}

const ORTU = [
  ['Bunda Rina Marlina', 'Rafa', '3 tahun', 'Rafa umur 3 tahun belum bisa ngomong, baru mama papa', '081200000896'],
  ['Ayah Dimas Prayoga', 'Arka', '4 tahun 2 bulan', 'Arka susah fokus, kalau dipanggil tidak menoleh', '082100004417'],
  ['Bunda Yuli Astuti', 'Nadia', '5 tahun', 'Nadia belum bisa pegang pensil dengan benar', '085200001302'],
  ['Ayah Rangga Saputra', 'Keysha', '2,5 tahun', 'Keysha sering tantrum lama, susah ditenangkan', '081300007765'],
  ['Bunda Sari Wulandari', 'Bima', '6 tahun', 'Bima belum lancar membaca, sering terbalik b dan d', '081900003318'],
  ['Ayah Hendra Kusuma', 'Alya', '3 tahun 8 bulan', 'Alya jalan jinjit dan sering jatuh', '082300009154'],
  ['Bunda Melati Anggraini', 'Zidan', '4 tahun', 'Zidan tidak suka disentuh dan takut suara keras', '085700002286'],
];

// [status, jam yang lalu, sumber]
const SEBARAN = [
  ['Baru', 0.6, 'whatsapp'], ['Baru', 2.2, 'latih'], ['Follow-up', 27, 'whatsapp'], ['Baru', 5, 'whatsapp'],
  ['Dihubungi', 4.8, 'whatsapp'], ['Dihubungi', 31, 'manual'], ['Follow-up', 49, 'whatsapp'],
  ['Observasi dijadwalkan', 6, 'whatsapp'], ['Observasi dijadwalkan', 52, 'whatsapp'], ['Observasi dijadwalkan', 75, 'manual'],
  ['Observasi selesai', 120, 'whatsapp'], ['Observasi selesai', 160, 'whatsapp'], ['Asesmen', 200, 'whatsapp'],
  ['Klien aktif', 260, 'whatsapp'], ['Klien aktif', 410, 'manual'], ['Hilang', 90, 'whatsapp'], ['Hilang', 300, 'whatsapp'],
  ['Baru', 140, 'whatsapp'], ['Dihubungi', 380, 'whatsapp'], ['Observasi selesai', 520, 'whatsapp'],
];

const JAM_OBS = ['09:00', '10:30', '13:00', '15:30'];

export function buatLead(t0) {
  return SEBARAN.map(([status, jamLalu, sumber], i) => {
    const [nama_ortu, anak, usia_anak, keluhan, nomor] = ORTU[i % ORTU.length];
    const ms = t0 - jamLalu * JAM;
    const nomor_hash = hashNomor(`${nomor}-${i}`);
    const w = waktu(ms);
    const obs = status === 'Observasi dijadwalkan' ? `${tanggal(t0 + (i % 3) * HARI)} ${JAM_OBS[i % 4]}` : '';
    return {
      id: `${w}|${nomor_hash}`, waktu: w, nomor_hash, nomor, nama_ortu, nama_anak: anak, usia_anak, keluhan, sumber, status,
      status_diubah: waktu(t0 - jamLalu * JAM * 0.4),
      permintaan_jadwal: i % 3 === 0 ? 'sabtu pagi' : '', tanggal_observasi: obs, catatan_admin: '',
    };
  });
}

export function buatEskalasi(t0) {
  const baris = [
    [52 * MENIT, '081200009021', 'Keluhan: terapis sering telat dan main HP', 'tinggi', 'Terbuka'],
    [97 * MENIT, '082100008833', 'Pembayaran: sudah transfer tapi belum tercatat', 'sedang', 'Terbuka'],
    [26 * JAM, '085200001302', 'Perkembangan anak ditanyakan', 'sedang', 'Selesai'],
    [3 * HARI, '081300007765', 'Minta bicara dengan pemilik', 'tinggi', 'Selesai'],
    [9 * HARI, '081200000896', 'Keluhan: terapis Rafa sering berganti', 'tinggi', 'Diambil'],
  ];
  return baris.map(([lalu, nomor, alasan, prioritas, status]) => {
    const nomor_hash = hashNomor(nomor);
    const w = waktu(t0 - lalu);
    return {
      id: `${w}|${nomor_hash}`, waktu: w, nomor_hash, nomor, alasan, prioritas, status,
      '3_pesan_terakhir': 'terapisnya sering telat | kemarin juga main hp | tolong ditindak',
      admin: status === 'Selesai' ? 'Rio' : '', waktu_selesai: status === 'Selesai' ? waktu(t0 - lalu + 2 * JAM) : '',
      umur_menit: Math.round(lalu / MENIT),
    };
  });
}

export function buatPercakapan(t0, lead, eskalasi) {
  const isi = [
    ['Rafa', 'alamatnya dimana, minggu buka?', 4 * MENIT, 'Bot'],
    [null, 'terapisnya sering telat', 52 * MENIT, 'Eskalasi'],
    ['Arka', 'bisa sabtu pagi?', 71 * MENIT, 'Bot'],
    ['Nadia', 'baik bu, terima kasih infonya', 2 * JAM, 'Admin'],
    ['Keysha', 'observasi berapa?', 3 * JAM, 'Bot'],
    [null, 'sudah transfer tapi belum dicatat', 97 * MENIT, 'Eskalasi'],
    ['Bima', 'ada terapi baca tulis?', 5 * JAM, 'Bot'],
    ['Alya', 'anak saya jalan jinjit', 7 * JAM, 'Bot'],
    ['Zidan', 'bpjs biso dipake dak?', 9 * JAM, 'Bot'],
    [null, 'Hallo', 22 * JAM, 'Bot'],
  ];
  return isi.map(([anak, pesan, lalu, status], i) => {
    const l = anak ? lead.find((x) => x.nama_anak === anak) : null;
    const e = status === 'Eskalasi' ? eskalasi[i === 1 ? 0 : 1] : null;
    const nomor = l ? l.nomor : e ? e.nomor : '085300000417';
    const klien = anak && ['Rafa', 'Nadia', 'Arka'].includes(anak);
    return {
      jenis: klien ? 'klien' : 'lead',
      nomor_hash: klien ? hashNomor(nomor) : l ? l.nomor_hash : e ? e.nomor_hash : hashNomor(nomor), nomor_samar: samarkan(nomor), nomor,
      nama: l ? `${l.nama_ortu} (${anak})` : '', pesan_terakhir: pesan, waktu: waktu(t0 - lalu), status,
      id_eskalasi: e ? e.id : '',
    };
  });
}

export function transkrip(t0, baris) {
  const mulai = t0 - 10 * MENIT;
  const [g1, g2] = [`g-${idAcak()}`, `g-${idAcak()}`];
  const balasan = baris.status === 'Eskalasi'
    ? 'Mohon maaf atas pengalaman ini. Keluhan ini sudah saya teruskan ke admin dengan prioritas tinggi.'
    : 'Baik, Ayah/Bunda. Admin kami akan menghubungi di jam kerja untuk hal ini.';
  return [
    { waktu: waktu(mulai), arah: 'masuk', pesan: 'assalamualaikum', id_giliran: g1 },
    { waktu: waktu(mulai + 6000), arah: 'keluar', pesan: 'Waalaikumsalam, Ayah/Bunda. Saya YAMET Customer Service, asisten otomatis YAMET Palembang Dempo. Ada yang bisa saya bantu?', id_giliran: g1 },
    { waktu: waktu(mulai + 60000), arah: 'masuk', pesan: baris.pesan_terakhir, id_giliran: g2 },
    { waktu: waktu(mulai + 66000), arah: 'keluar', pesan: balasan, id_giliran: g2 },
  ];
}

export function bacaPengetahuan() {
  try {
    return JSON.parse(readFileSync(new URL('./mock-pengetahuan.json', import.meta.url), 'utf8'));
  } catch {
    return [];
  }
}

export const KONFIGURASI = [
  ['WA_PHONE_NUMBER_ID', '', 'Diisi setelah Meta lolos'], ['WA_NOMOR_TAMPIL', '0813-7239-4004', 'Nomor bot di situs'],
  ['WA_NOMOR_ADMIN', '0812-8808-0896', 'Nomor admin manusia'], ['TELEGRAM_CHAT_ADMIN', '', 'Chat id grup admin'],
  ['HARGA_OBSERVASI', 'Rp 850.000', 'Satu paket'], ['LINK_MAPS', 'https://maps.app.goo.gl/Dw8MyZpjp7bq1xmG9', ''],
  ['JAM_BATAS_IZIN_MENIT', '60', ''], ['JAM_GANTI_BERLAKU_HARI', '90', ''], ['JAM_PENGINGAT', '08.00', ''],
  ['BOT_AKTIF', 'ya', 'ya/tidak'], ['MODEL_CHAT', 'MiniMax-M3', 'Model chat bot'],
  ['RETENSI_HARI', '90', ''], ['RATE_LIMIT_PER_MENIT', '10', ''],
  // Dua baris berikut sengaja ada di tiruan untuk membuktikan server membuangnya.
  ['LATIH_SECRET', 'tiruan-tidak-boleh-tampil', ''], ['HASH_KEY', 'tiruan-tidak-boleh-tampil', ''],
].map(([kunci, nilai, keterangan]) => ({ kunci, nilai, keterangan }));

// Klien Aktif tiruan: nomor_hash dihitung n8n (usulan U1.7), tanggal_mulai & reevaluasi_terakhir = kolom baru (asumsi).
export function buatKlien(t0) {
  return [
    ['Rafa', '081200000896', 'Bunda Rina Marlina', 'Terapi Wicara', 'ya', 400, 170],
    ['Nadia', '085200001302', 'Bunda Yuli Astuti', 'Terapi Okupasi', 'ya', 120, 40],
    ['Arka', '082100004417', 'Ayah Dimas Prayoga', 'Terapi Perilaku', 'ya', 230, 95],
    ['Keysha', '081300007765', 'Ayah Rangga Saputra', 'Sensori Integrasi', 'tidak', 300, 200],
  ].map(([nama_anak, nomor_ortu, nama_ortu, program, aktif, mulaiLalu, reevalLalu]) => ({
    nama_anak, nomor_ortu, nama_ortu, program, aktif, nomor_hash: hashNomor(nomor_ortu),
    tanggal_mulai: tanggal(t0 - mulaiLalu * HARI), reevaluasi_terakhir: tanggal(t0 - reevalLalu * HARI),
  }));
}

export function buatJamGanti(t0) {
  return [
    ['Rafa', 'Terapi Wicara', 'Senin 09.00', 'Kamis 14.00', 'acara keluarga', 'Disetujui', 95],
    ['Rafa', 'Terapi Wicara', 'Rabu 10.00', 'Rabu 14.00', 'bentrok sekolah', 'Selesai', 40],
    ['Nadia', 'Terapi Okupasi', 'Rabu 10.00', 'Rabu 14.00', 'bentrok jadwal sekolah', 'Diajukan', 0.125],
  ].map(([anak, program, sesi_asal, jam_diminta, alasan, status, hariLalu], i) => {
    const w = waktu(t0 - hariLalu * HARI);
    const nomor = anak === 'Rafa' ? '081200000896' : '085200001302';
    return {
      id: `${w}|${anak}`, baris: i + 2, waktu: w, nomor: samarkan(nomor), nomor_hash: hashNomor(nomor), anak, program, sesi_asal, jam_diminta, alasan, status,
      admin: status === 'Diajukan' ? '' : 'Rio', umur_hari: Math.floor(hariLalu), berlaku_sampai: tanggal(t0 - hariLalu * HARI + 90 * HARI),
      hangus: hariLalu > 90 && !['Selesai', 'Ditolak'].includes(status),
    };
  });
}

export function buatUmpanBalik(t0) {
  return [
    [hashNomor('081200000896'), 3, 'terapisnya ganti-ganti terus', 6],
    [hashNomor('085200001302'), 5, 'Nadia senang sekali', 12],
    [hashNomor('082100004417'), 4, '', 20],
  ].map(([nomor_hash, skor, komentar, hariLalu]) => ({ waktu: waktu(t0 - hariLalu * HARI), nomor_hash, skor, komentar }));
}

export function logKlien(t0, nomor_hash, adaIzin) {
  const baris = [];
  const tambah = (hariLalu, arah, pesan, topik) => baris.push({ waktu: waktu(t0 - hariLalu * HARI), arah, pesan, topik, id_giliran: `g-${idAcak()}` });
  if (adaIzin) {
    tambah(21, 'masuk', 'Rafa besok izin ya bu, demam', 'izin');
    tambah(21, 'keluar', 'Baik, Bunda. Izin Rafa sudah dicatat dan admin diberi tahu. Semoga lekas sembuh.', 'izin');
    tambah(4, 'masuk', 'Bu, Rafa hari ini izin lagi, masih batuk', 'izin');
    tambah(4, 'keluar', 'Baik, Bunda. Izin dicatat dan terapis diberi tahu.', 'izin');
  }
  tambah(2, 'masuk', 'jadwal minggu depan tetap kan bu?', 'klien_aktif');
  tambah(2, 'keluar', 'Admin kami akan mengonfirmasi jadwal minggu depan di jam kerja, Bunda.', 'klien_aktif');
  return baris.sort((a, b) => a.waktu.localeCompare(b.waktu)).map((r) => ({ ...r, nomor_hash }));
}
