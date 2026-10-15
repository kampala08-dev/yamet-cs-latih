import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buatApp } from './index.mjs';
import { buatKlienN8n, normalisasiChat } from './n8n.mjs';
import { susunAksi, saringRespons } from './aksi.mjs';
import { bacaKonfigurasi } from './config.mjs';

const SANDI = 'sandi-uji-panjang-01';
let server;
let alamat;
const panggilanN8n = [];

// Tiruan fetch ke n8n: mencatat header supaya bisa dibuktikan rahasia hanya dikirim ke n8n.
async function fetchPalsu(url, opsi) {
  panggilanN8n.push({ url, headers: opsi.headers, body: JSON.parse(opsi.body) });
  const body = JSON.parse(opsi.body);
  if (url.endsWith('/cs-latih')) {
    return new Response(JSON.stringify({ balasan: 'halo', pengetahuan_dipakai: ['P001'], tool_dipanggil: ['catat_lead'], tool_gagal: ['catat_lead'], token_in: 10, token_out: 5, latensi_ms: 900, id_giliran: 'g1', topik: 'umum', sumber_cara: 'penanda model' }));
  }
  if (body.aksi === 'konfigurasi_baca') {
    return new Response(JSON.stringify({ ok: true, data: [{ Kunci: 'BOT_AKTIF', Nilai: 'ya' }, { Kunci: 'LATIH_SECRET', Nilai: 'bocor' }, { kunci: 'HASH_KEY', nilai: 'bocor' }] }));
  }
  return new Response(JSON.stringify({ ok: true, data: { aksi: body.aksi } }));
}

before(async () => {
  const konfig = { mock: false, sandiAdmin: SANDI, sandiLatih: 'sandi-latih-panjang-02', folderStatis: '.', n8nBase: 'https://n8n.contoh/webhook', rahasia: 'rahasia-uji', batasWaktuMs: 2000 };
  const { app } = buatApp(konfig, { klien: buatKlienN8n(konfig, fetchPalsu) });
  await new Promise((r) => { server = app.listen(0, r); });
  alamat = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function post(jalur, body, cookie = '') {
  const res = await fetch(alamat + jalur, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json(), cookie: (res.headers.get('set-cookie') || '').split(';')[0] };
}

async function masuk(sandi = SANDI) {
  return (await post('/api/masuk', { nama: 'Rio', sandi })).cookie;
}

test('menolak sandi salah dan API tanpa sesi', async () => {
  assert.equal((await post('/api/masuk', { nama: 'Rio', sandi: 'salah' })).status, 401);
  assert.equal((await post('/api/aksi', { aksi: 'ringkasan' })).status, 401);
});

test('POST selain JSON ditolak (perlindungan CSRF formulir)', async () => {
  const res = await fetch(alamat + '/api/masuk', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'nama=a&sandi=b' });
  assert.equal(res.status, 415);
});

test('cookie sesi HttpOnly + SameSite=Strict', async () => {
  const res = await fetch(alamat + '/api/masuk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nama: 'Rio', sandi: SANDI }) });
  const sc = res.headers.get('set-cookie');
  assert.match(sc, /HttpOnly/);
  assert.match(sc, /SameSite=Strict/);
});

test('chat: rahasia dikirim ke n8n, tidak ke browser; tool dinormalisasi', async () => {
  const c = await masuk();
  const r = await post('/api/chat', { nomor: 'latih-abc123', teks: 'halo' }, c);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.data.tool_dipanggil, [{ nama: 'catat_lead', ok: false }]);
  const terakhir = panggilanN8n.at(-1);
  assert.equal(terakhir.headers['X-CS-Latih'], 'rahasia-uji');
  assert.equal(terakhir.body.nama_tampil, 'Rio');
  assert.ok(!JSON.stringify(r.json).includes('rahasia-uji'));
});

test('chat: nomor selain latih-... ditolak', async () => {
  const c = await masuk();
  assert.equal((await post('/api/chat', { nomor: '081288080896', teks: 'halo' }, c)).status, 400);
});

test('konfigurasi_baca membuang baris rahasia walau n8n mengirimnya', async () => {
  const c = await masuk();
  const r = await post('/api/aksi', { aksi: 'konfigurasi_baca' }, c);
  assert.deepEqual(r.json.data.map((x) => x.Kunci || x.kunci), ['BOT_AKTIF']);
});

test('peran latih tidak boleh menulis; admin mengirim X-CS-Peran', async () => {
  const cl = await masuk('sandi-latih-panjang-02');
  assert.equal((await post('/api/aksi', { aksi: 'konfigurasi_tulis', kunci: 'BOT_AKTIF', nilai: 'tidak' }, cl)).status, 403);
  await post('/api/aksi', { aksi: 'lead', hari: 1 }, cl);
  assert.equal(panggilanN8n.at(-1).headers['X-CS-Peran'], undefined);
  const ca = await masuk();
  await post('/api/aksi', { aksi: 'lead', hari: 1 }, ca);
  assert.equal(panggilanN8n.at(-1).headers['X-CS-Peran'], 'admin');
});

test('susunAksi: daftar putih kolom dan kunci rahasia', () => {
  const admin = { nama: 'Rio', peran: 'admin' };
  assert.equal(susunAksi({ aksi: 'hapus_semua' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'konfigurasi_tulis', kunci: 'LATIH_SECRET', nilai: 'x' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'label', id_giliran: 'g1', label: 'Mungkin' }, admin).kode, 400);
  const ok = susunAksi({ aksi: 'eskalasi_status', id: 'w|h', status: 'Diambil', admin: 'penyusup', lain: 1 }, admin);
  assert.deepEqual(ok.body, { aksi: 'eskalasi_status', id: 'w|h', status: 'Diambil', admin: 'Rio' });
});

test('normalisasiChat menerima bentuk kontrak [{nama, ok}]', () => {
  const d = normalisasiChat({ balasan: 'x', tool_dipanggil: [{ nama: 'buat_eskalasi', ok: true }] });
  assert.deepEqual(d.tool_dipanggil, [{ nama: 'buat_eskalasi', ok: true }]);
});

test('konfigurasi produksi wajib n8n + rahasia', () => {
  const k = bacaKonfigurasi({ CS_SANDI_ADMIN: 'pendek' });
  assert.equal(k.galat.length, 3);
  assert.equal(bacaKonfigurasi({ CS_MOCK: '1', CS_SANDI_ADMIN: 'uji' }).galat.length, 0);
});

test('nomor diawali + diterima lalu diamankan dari rumus Sheets', () => {
  const admin = { nama: '=HYPERLINK("x")', peran: 'admin' };
  const k = susunAksi({ aksi: 'klien_aktif_tulis', nama_anak: 'Rafa', nomor_ortu: '+62 812 0000 0896', aktif: 'ya' }, admin);
  assert.equal(k.body.nomor_ortu, "'+62 812 0000 0896");
  const e = susunAksi({ aksi: 'eskalasi_status', id: 'w|h', status: 'Selesai' }, admin);
  assert.equal(e.body.admin, '\'=HYPERLINK("x")');
});

test('peran latih: nomor utuh dari n8n tetap disamarkan server', async () => {
  const c = await masuk('sandi-latih-panjang-02');
  const r = await post('/api/aksi', { aksi: 'lead', hari: 1 }, c);
  assert.equal(r.status, 200);
  assert.deepEqual(saringRespons('lead', { ok: true, data: [{ nomor: '081288080896', x: { nomor_ortu: '0812 0000 0896' } }] }, 'latih').data,
    [{ nomor: '0812-xxxx-0896', x: { nomor_ortu: '0812-xxxx-0896' } }]);
});

test('respons n8n rusak tidak menjatuhkan server', async () => {
  const k = buatKlienN8n({ n8nBase: 'https://n', rahasia: 'r', batasWaktuMs: 1000 }, async () => new Response('{"alat":[null,{"tool":"x","ok":true}]}'));
  const r = await k.chat({});
  assert.deepEqual(r.data.tool_dipanggil, [{ nama: 'x', ok: true }]);
});

test('aksi CRM v2: validasi tahap lead, log_sesi nomor_hash, pengetahuan, peran', () => {
  const admin = { nama: 'Rio', peran: 'admin' };
  const latih = { nama: 'Uji', peran: 'latih' };
  assert.equal(susunAksi({ aksi: 'lead_status', id: 'w|h', status: 'Daftar' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'lead_status', id: 'w|h', status: 'Observasi dijadwalkan' }, admin).body.status, 'Observasi dijadwalkan');
  assert.equal(susunAksi({ aksi: 'lead_status', id: 'w|h', status: 'Hilang' }, latih).kode, 403);
  assert.equal(susunAksi({ aksi: 'lead_tulis', nama_ortu: 'Bunda Rina', nomor: '0812 0000 0896', sumber: 'whatsapp' }, admin).body.sumber, 'manual');
  assert.equal(susunAksi({ aksi: 'log_sesi', nomor_hash: 'a'.repeat(64) }, latih).body.nomor_hash, 'a'.repeat(64));
  assert.equal(susunAksi({ aksi: 'log_sesi', nomor_hash: '081288080896' }, latih).kode, 400);
  assert.equal(susunAksi({ aksi: 'pengetahuan_tulis', id: 'X1', topik: 'biaya', jawaban: 'x' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'pengetahuan_tulis', id: '', topik: 'biaya', jawaban: 'Rp 850.000' }, admin).body.id, '');
  assert.equal(susunAksi({ aksi: 'grafik', rentang: '90' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'eskalasi_status', status: 'Diambil' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'eskalasi_status', nomor_hash: 'b'.repeat(64), status: 'Diambil' }, admin).body.admin, 'Rio');
  assert.equal(susunAksi({ aksi: 'toString' }, admin).kode, 400);
});

test('aksi kartu anak: jam_ganti_daftar dan umpan_balik tervalidasi', () => {
  const latih = { nama: 'Uji', peran: 'latih' };
  assert.deepEqual(susunAksi({ aksi: 'jam_ganti_daftar', anak: 'Rafa' }, latih).body, { aksi: 'jam_ganti_daftar', anak: 'Rafa', hari: 180 });
  assert.equal(susunAksi({ aksi: 'umpan_balik', nomor_hash: 'bukan-hash' }, latih).kode, 400);
  assert.equal(susunAksi({ aksi: 'umpan_balik', nomor_hash: 'c'.repeat(64) }, latih).body.hari, 90);
});

test('U1.6: Hilang wajib alasan baku, lead_tulis tanggal, log_sesi nomor asli hanya admin', () => {
  const admin = { nama: 'Rio', peran: 'admin' };
  const latih = { nama: 'Uji', peran: 'latih' };
  assert.equal(susunAksi({ aksi: 'lead_status', id: 'w|h', status: 'Hilang' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'lead_status', id: 'w|h', status: 'Hilang', alasan: 'biaya' }, admin).body.alasan, 'biaya');
  assert.equal(susunAksi({ aksi: 'lead_tulis', nama_ortu: 'Bunda Rina', nomor: '081200000896', tanggal_observasi: '20/10/2026' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'lead_tulis', nama_ortu: 'Bunda Rina', nomor: '081200000896', tanggal_observasi: '2026-10-20 09:00' }, admin).body.tanggal_observasi, '2026-10-20 09:00');
  assert.equal(susunAksi({ aksi: 'log_sesi', nomor: '0812-0000-0896' }, admin).body.nomor, '0812-0000-0896');
  assert.equal(susunAksi({ aksi: 'log_sesi', nomor: '0812-0000-0896' }, latih).kode, 400);
  assert.equal(susunAksi({ aksi: 'jam_ganti_status', id: 'w|Rafa', status: 'Selesai' }, admin).body.status, 'Selesai');
  assert.equal(susunAksi({ aksi: 'pengetahuan_tulis', topik: 'Biaya!', jawaban: 'x' }, admin).kode, 400);
});

test('galat bisnis n8n (409) diteruskan dengan kode dan pesannya', async () => {
  const k = buatKlienN8n({ n8nBase: 'https://n', rahasia: 'r', batasWaktuMs: 1000 }, async () => new Response(JSON.stringify({ ok: false, galat: 'nomor sudah ada di Lead baris 5' }), { status: 409 }));
  const r = await k.aksi({ aksi: 'lead_tulis' });
  assert.deepEqual(r, { ok: false, kode: 409, galat: 'nomor sudah ada di Lead baris 5' });
});

test('U1.10: chat gambar diteruskan apa adanya, mime divalidasi, isi_gambar dinormalisasi', async () => {
  const c = await masuk();
  const ok = await post('/api/chat', { nomor: 'latih-gbr001', teks: '', gambar_base64: 'aGVsbG8=', mime: 'image/jpeg' }, c);
  assert.equal(ok.status, 200);
  assert.equal(panggilanN8n.at(-1).body.gambar_base64, 'aGVsbG8=');
  assert.equal(panggilanN8n.at(-1).body.mime, 'image/jpeg');
  assert.equal((await post('/api/chat', { nomor: 'latih-gbr001', teks: 'x', gambar_base64: 'aGVsbG8=', mime: 'image/gif' }, c)).status, 400);
  assert.equal(normalisasiChat({ isi_gambar: 'bukti transfer' }).isi_gambar, 'bukti transfer');
  assert.equal(normalisasiChat({ model: 'MiniMax-M3' }).model, 'MiniMax-M3');
});

test('U1.13: pengetahuan_verbatim dan verbatim di pengetahuan_tulis', () => {
  const admin = { nama: 'Rio', peran: 'admin' };
  assert.deepEqual(susunAksi({ aksi: 'pengetahuan_verbatim', id: 'P018', verbatim: 'ya' }, admin).body, { aksi: 'pengetahuan_verbatim', id: 'P018', verbatim: 'ya' });
  assert.equal(susunAksi({ aksi: 'pengetahuan_verbatim', id: 'P018', verbatim: 'tidak' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'pengetahuan_verbatim', id: 'P018', verbatim: 'ya' }, { nama: 'U', peran: 'latih' }).kode, 403);
  assert.equal(susunAksi({ aksi: 'pengetahuan_tulis', id: 'P018', topik: 'lokasi_jam', jawaban: 'x', verbatim: 'ya' }, admin).body.verbatim, 'ya');
  assert.equal('verbatim' in susunAksi({ aksi: 'pengetahuan_tulis', id: 'P018', topik: 'lokasi_jam', jawaban: 'x' }, admin).body, false);
});

test('U1.15: balas_admin hanya admin, nama admin dari sesi, teks wajib', () => {
  const admin = { nama: 'Rio', peran: 'admin' };
  const h = 'd'.repeat(64);
  assert.deepEqual(susunAksi({ aksi: 'balas_admin', nomor_hash: h, teks: 'Baik Bunda', admin: 'palsu' }, admin).body, { aksi: 'balas_admin', nomor_hash: h, teks: 'Baik Bunda', admin: 'Rio' });
  assert.equal(susunAksi({ aksi: 'balas_admin', nomor_hash: h, teks: '' }, admin).kode, 400);
  assert.equal(susunAksi({ aksi: 'balas_admin', nomor_hash: h, teks: 'x' }, { nama: 'U', peran: 'latih' }).kode, 403);
});
