// Uji nyata ke n8n (workflow 07 + 11 aktif): npm run uji-nyata
// Membaca latih/.env, menyalakan server mode nyata di proses ini (port acak), masuk sebagai admin,
// lalu memanggil aksi berurutan dan memeriksa bentuk data terhadap uji/U1.6-laporan.md.
// Data uji yang tertulis permanen: 1 giliran latih (nomor latih-ujinyata...) berlabel Benar. Tidak ada aksi tulis lain.
// Yang dicetak hanya status, jumlah baris, dan ketidakcocokan bentuk; isi data (nama, nomor) tidak dicetak.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const fileEnv = join(akar, '.env');

function bacaEnv() {
  if (!existsSync(fileEnv)) {
    console.error('latih/.env belum ada. Salin .env.example menjadi .env lalu isi CS_SANDI_ADMIN, CS_N8N_BASE, CS_LATIH_SECRET.');
    process.exit(2);
  }
  for (const baris of readFileSync(fileEnv, 'utf8').split(/\r?\n/)) {
    const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || baris.trim().startsWith('#')) continue;
    const nilai = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = nilai;
  }
  process.env.CS_MOCK = '0';
}

// --- Pemeriksa bentuk sederhana: { kunci: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'a|null' } ---
function jenisDari(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function periksa(obj, spec, jalur = '') {
  const masalah = [];
  if (!obj || typeof obj !== 'object') return [`${jalur || 'data'}: bukan objek (${jenisDari(obj)})`];
  for (const [k, harap] of Object.entries(spec)) {
    const boleh = harap.split('|');
    const ada = Object.hasOwn(obj, k);
    if (!ada) { masalah.push(`${jalur}${k}: tidak ada (harap ${harap})`); continue; }
    if (!boleh.includes(jenisDari(obj[k]))) masalah.push(`${jalur}${k}: ${jenisDari(obj[k])} (harap ${harap})`);
  }
  return masalah;
}

function periksaBaris(arr, spec, nama) {
  if (!Array.isArray(arr)) return [`${nama}: bukan array (${jenisDari(arr)})`];
  return arr.slice(0, 5).flatMap((r, i) => periksa(r, spec, `${nama}[${i}].`));
}

const S = 'string', N = 'number', NN = 'number|null', A = 'array', O = 'object', B = 'boolean';

const BENTUK = {
  ringkasan: (d) => [
    ...periksa(d, { percakapan: N, lead_baru: N, selesai_tanpa_admin_pct: NN, balasan_pertama_dtk: NN, token_total: N, kuota_pct: NN, eskalasi_terbuka: N, observasi_dijadwalkan: N, sebelumnya: O, alur: O }),
    ...(d?.sebelumnya ? periksa(d.sebelumnya, { percakapan: N, lead_baru: N, eskalasi_terbuka: N, observasi_dijadwalkan: N }, 'sebelumnya.') : []),
    ...(d?.alur ? periksa(d.alur, { pesan_masuk: N, dijawab_bot: N, lead_tercatat: N, observasi_dijadwalkan: N, followup_terkirim: NN, pengingat_terkirim: NN }, 'alur.') : []),
  ],
  lead: (d) => periksaBaris(d, { waktu: S, nomor_hash: S, nomor: S, nama_ortu: S, status: S, status_diubah: S, id: S, nama_anak: S }, 'lead'),
  perlu_tindakan: (d) => [
    ...periksa(d, { eskalasi_terbuka: A, followup_jatuh_tempo: A, jam_ganti_diajukan: A }),
    ...periksaBaris(d?.jam_ganti_diajukan ?? [], { id: S, status: S }, 'jam_ganti_diajukan'),
  ],
  pipeline: (d) => [
    ...periksa(d, { tahap: A, hilang: O, total: N }),
    ...(Array.isArray(d?.tahap) && d.tahap.length !== 6 ? [`tahap: ${d.tahap.length} kolom (harap 6)`] : []),
    ...periksaBaris(d?.tahap ?? [], { status: S, jumlah: N, kumulatif: N, konversi_pct: NN, konversi_ke_berikut_pct: NN, umur_median_jam: NN, teratas: A }, 'tahap'),
    ...(d?.hilang ? periksa(d.hilang, { jumlah: N, alasan_terbanyak: 'string|null', alasan: A, teratas: A }, 'hilang.') : []),
  ],
  grafik: (d) => [
    ...periksa(d, { deret: A, giliran: N, token: N, latensi_median_ms: NN, selesai_tanpa_admin_pct: NN }),
    ...periksaBaris(d?.deret ?? [], { label: S, percakapan: N }, 'deret'),
  ],
  percakapan: (d) => [
    ...periksaBaris(d, { nomor_hash: S, nomor_samar: S, nama: S, pesan_terakhir: S, waktu: S, status: S, id_eskalasi: S, jenis: S }, 'percakapan'),
    ...(Array.isArray(d) ? d.filter((p) => !['Bot', 'Admin', 'Eskalasi'].includes(p.status)).slice(0, 3).map((p) => `percakapan.status tak dikenal: ${p.status}`) : []),
    ...(Array.isArray(d) ? d.filter((p) => !['lead', 'klien'].includes(p.jenis)).slice(0, 3).map((p) => `percakapan.jenis tak dikenal: ${p.jenis}`) : []),
  ],
  jadwal: (d) => periksaBaris(d, { id: S, tanggal: S, jam: S, nama_anak: S, nama_ortu: S, jenis: S, pengingat: S, terlewat: B }, 'jadwal'),
  klien_aktif_baca: (d) => periksaBaris(d, { nama_anak: S, nomor_ortu: S, nama_ortu: S, program: S, aktif: S, tanggal_mulai: S, reevaluasi_terakhir: S }, 'klien'),
  konfigurasi_baca: (d) => {
    if (!Array.isArray(d)) return ['konfigurasi: bukan array'];
    const kunci = d.map((r) => r.kunci ?? r.Kunci);
    return [
      ...kunci.filter((k) => /(_SECRET|_KEY|_TOKEN)$/i.test(k)).map((k) => `kunci rahasia ikut terkirim: ${k}`),
      ...['BOT_AKTIF', 'MODEL_CHAT'].filter((k) => !kunci.includes(k)).map((k) => `kunci ${k} tidak ada`),
    ];
  },
};

// Catatan yang bukan kegagalan: bidang usulan U1.7 yang belum diambil workflow 11.
const INFO = {
  klien_aktif_baca: (d) => (Array.isArray(d) && d.length && !Object.hasOwn(d[0], 'nomor_hash') ? ['nomor_hash belum ada (UI memakai cadangan: Jam Ganti / nomor asli admin)'] : []),
};

async function main() {
  bacaEnv();
  // Sandi admin dari .env tidak dipakai di sini: server uji hidup di proses ini saja (127.0.0.1, port acak),
  // jadi cukup sandi acak sekali pakai. Panjang sandi .env tetap diperiksa untuk deploy.
  const panjangSandiEnv = (process.env.CS_SANDI_ADMIN || '').length;
  const peringatan = panjangSandiEnv < 12 ? [`CS_SANDI_ADMIN di .env ${panjangSandiEnv} karakter: server deploy akan menolak mulai (minimal 12).`] : [];
  process.env.CS_SANDI_ADMIN = randomBytes(18).toString('base64url');
  const { bacaKonfigurasi } = await import('../server/config.mjs');
  const { buatApp } = await import('../server/index.mjs');
  const konfig = bacaKonfigurasi();
  if (konfig.galat.length) {
    console.error('Konfigurasi .env belum lengkap:\n- ' + konfig.galat.join('\n- '));
    process.exit(2);
  }
  const { app } = buatApp(konfig);
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const alamat = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const hasil = [];

  async function panggil(jalur, body) {
    const t = Date.now();
    const res = await fetch(alamat + jalur, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
    const teks = await res.text();
    if (teks.includes(konfig.rahasia)) throw new Error('RAHASIA BOCOR ke respons browser');
    let json = null;
    try { json = JSON.parse(teks); } catch { json = null; }
    return { status: res.status, json, ms: Date.now() - t, setCookie: res.headers.get('set-cookie') };
  }

  async function langkah(nama, jalur, body, cek) {
    try {
      const r = await panggil(jalur, body);
      if (r.status !== 200 || !r.json?.ok) {
        hasil.push({ nama, lulus: false, ms: r.ms, catatan: [`HTTP ${r.status}: ${r.json?.galat ?? 'tanpa JSON'}`] });
        return null;
      }
      const masalah = cek ? cek(r.json.data) : [];
      const info = INFO[nama] ? INFO[nama](r.json.data) : [];
      const jumlah = Array.isArray(r.json.data) ? `${r.json.data.length} baris` : '';
      hasil.push({ nama, lulus: masalah.length === 0, ms: r.ms, jumlah, catatan: masalah, info });
      return r.json.data;
    } catch (e) {
      hasil.push({ nama, lulus: false, ms: 0, catatan: [e.message] });
      return null;
    }
  }

  try {
    const masuk = await panggil('/api/masuk', { nama: 'Uji nyata', sandi: konfig.sandiAdmin });
    if (masuk.status !== 200) throw new Error(`masuk gagal (${masuk.status})`);
    cookie = (masuk.setCookie || '').split(';')[0];

    const nomor = `latih-ujinyata${randomBytes(3).toString('hex')}`;
    const chat = await langkah('chat (S1)', '/api/chat', { nomor, teks: 'assalamualaikum' }, (d) => [
      ...periksa(d, { balasan: S, pengetahuan_dipakai: A, tool_dipanggil: A, token_in: N, token_out: N, latensi_ms: N, id_giliran: S }),
      ...(d && !d.id_giliran ? ['id_giliran kosong'] : []),
      ...(d && !d.balasan && !d.dilewati ? ['balasan kosong'] : []),
    ]);
    const idGiliran = chat?.id_giliran;
    if (idGiliran) {
      await langkah('label Benar', '/api/aksi', { aksi: 'label', id_giliran: idGiliran, label: 'Benar', koreksi: '' }, (d) => periksa(d, { id_giliran: S, label: S }));
      await langkah('log_sesi', '/api/aksi', { aksi: 'log_sesi', nomor }, (d) => [
        ...periksaBaris(d, { waktu: S, arah: S, pesan: S, id_giliran: S }, 'log'),
        ...(Array.isArray(d) && !d.some((r) => r.id_giliran === idGiliran) ? ['giliran uji tidak ada di log_sesi'] : []),
        ...(Array.isArray(d) && !d.some((r) => r.id_giliran === idGiliran && r.label === 'Benar') ? ['label Benar belum terbaca di Log'] : []),
      ]);
    } else {
      hasil.push({ nama: 'label Benar', lulus: false, ms: 0, catatan: ['dilewati: chat tidak memberi id_giliran'] });
      hasil.push({ nama: 'log_sesi', lulus: false, ms: 0, catatan: ['dilewati: chat tidak memberi id_giliran'] });
    }

    const urutan = [
      ['ringkasan', { hari: 7 }], ['lead', { hari: 1 }], ['perlu_tindakan', {}], ['pipeline', { hari: 30 }], ['grafik', { rentang: '7' }],
      ['percakapan', { hari: 1 }], ['jadwal', { hari_ke_depan: 7 }], ['klien_aktif_baca', {}], ['konfigurasi_baca', {}],
    ];
    for (const [aksi, isi] of urutan) await langkah(aksi, '/api/aksi', { aksi, ...isi }, BENTUK[aksi]);
  } catch (e) {
    hasil.push({ nama: 'persiapan', lulus: false, ms: 0, catatan: [e.message] });
  } finally {
    server.close();
  }

  const baris = hasil.map((h) => {
    const kepala = `${h.lulus ? 'LULUS' : 'GAGAL'}  ${h.nama.padEnd(18)} ${String(h.ms).padStart(6)} ms  ${h.jumlah || ''}`;
    const rinci = [...(h.catatan || []).map((c) => `        - ${c}`), ...(h.info || []).map((c) => `        info: ${c}`)];
    return [kepala, ...rinci].join('\n');
  });
  const lulus = hasil.filter((h) => h.lulus).length;
  const catatanEnv = peringatan.map((p) => `PERINGATAN: ${p}\n`).join('');
  const ringkas = `\nUji nyata ${new Date().toISOString()} ke ${konfig.n8nBase}\n${catatanEnv}${baris.join('\n')}\n\n${lulus}/${hasil.length} lulus\n`;
  console.log(ringkas);
  writeFileSync(join(akar, '..', 'uji', 'U1.7-uji-nyata.txt'), ringkas);
  process.exit(lulus === hasil.length ? 0 : 1);
}

main();
