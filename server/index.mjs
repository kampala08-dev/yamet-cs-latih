// Server tunggal yamet-cs-latih: sajikan build Vite, autentikasi sandi, dan teruskan ke n8n.
import express from 'express';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bacaKonfigurasi } from './config.mjs';
import { buatPenyimpanSesi, bacaCookie, sandiCocok, NAMA_COOKIE, UMUR_SESI_MS } from './sesi.mjs';
import { susunAksi, saringRespons, amanSheet, NOMOR_LATIH } from './aksi.mjs';
import { buatKlienN8n } from './n8n.mjs';
import { buatMock } from './mock.mjs';

const BATAS_PANGGILAN_PER_MENIT = 60;
const MAKS_TEKS = 2000;
const MIME_GAMBAR = ['image/jpeg', 'image/png', 'image/webp'];
const RUTE_HALAMAN = ['/', '/masuk', '/latih', '/crm', '/ikhtisar', '/pipeline', '/jadwal', '/percakapan', '/eskalasi', '/klien', '/pengaturan'];

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join('; ');

function balasGalat(res, kode, galat) {
  return res.status(kode).json({ ok: false, galat });
}

function pembatasPanggilan(sekarang) {
  const jendela = new Map();
  return (kunci) => {
    const t = sekarang();
    const j = jendela.get(kunci);
    if (!j || j.mulai + 60_000 <= t) {
      jendela.set(kunci, { mulai: t, jumlah: 1 });
      return true;
    }
    jendela.set(kunci, { ...j, jumlah: j.jumlah + 1 });
    return j.jumlah + 1 <= BATAS_PANGGILAN_PER_MENIT;
  };
}

export function buatApp(konfig, { klien, sekarang = () => Date.now() } = {}) {
  const app = express();
  const sesi = buatPenyimpanSesi(sekarang);
  const bolehPanggil = pembatasPanggilan(sekarang);
  const n8n = klien || (konfig.mock ? buatMock(sekarang) : buatKlienN8n(konfig));

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    next();
  });

  // Semua POST /api wajib JSON: formulir lintas situs tidak bisa memalsukan Content-Type ini tanpa preflight.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST' && !req.is('application/json')) return balasGalat(res, 415, 'Content-Type harus application/json');
    next();
  });
  // /api/chat boleh membawa gambar (base64, U1.10): batas 8 MB; rute lain tetap 16 kB.
  app.use('/api/chat', express.json({ limit: '8mb' }));
  app.use('/api', express.json({ limit: '16kb' }));

  function sesiDari(req) {
    return sesi.ambil(bacaCookie(req.headers.cookie, NAMA_COOKIE));
  }
  function infoSesi(s) {
    return { nama: s.nama, peran: s.peran, mock: konfig.mock };
  }

  // Untuk healthcheck container; tidak membuka data apa pun.
  app.get('/api/sehat', (req, res) => res.json({ ok: true, data: null }));

  app.post('/api/masuk', (req, res) => {
    const ip = req.ip || 'tanpa-ip';
    if (sesi.terkunci(ip)) return balasGalat(res, 429, 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.');
    const nama = typeof req.body?.nama === 'string' ? req.body.nama.trim().slice(0, 40) : '';
    const sandi = typeof req.body?.sandi === 'string' ? req.body.sandi : '';
    if (!nama) return balasGalat(res, 400, 'Nama wajib diisi.');
    let peran = '';
    if (sandiCocok(sandi, konfig.sandiAdmin)) peran = 'admin';
    else if (konfig.sandiLatih && sandiCocok(sandi, konfig.sandiLatih)) peran = 'latih';
    if (!peran) {
      sesi.catatGagal(ip);
      return balasGalat(res, 401, 'Kata sandi salah.');
    }
    sesi.resetGagal(ip);
    const token = sesi.buat(nama, peran);
    res.cookie(NAMA_COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: UMUR_SESI_MS, path: '/' });
    return res.json({ ok: true, data: infoSesi({ nama, peran }) });
  });

  app.post('/api/keluar', (req, res) => {
    sesi.hapus(bacaCookie(req.headers.cookie, NAMA_COOKIE));
    res.clearCookie(NAMA_COOKIE, { path: '/' });
    res.json({ ok: true, data: null });
  });

  app.get('/api/sesi', (req, res) => {
    const s = sesiDari(req);
    if (!s) return balasGalat(res, 401, 'Belum masuk.');
    return res.json({ ok: true, data: infoSesi(s) });
  });

  app.use('/api', (req, res, next) => {
    const s = sesiDari(req);
    if (!s) return balasGalat(res, 401, 'Sesi habis. Silakan masuk lagi.');
    if (!bolehPanggil(bacaCookie(req.headers.cookie, NAMA_COOKIE))) return balasGalat(res, 429, 'Terlalu banyak permintaan. Tunggu sebentar.');
    req.sesi = s;
    next();
  });

  app.post('/api/chat', async (req, res) => {
    const teks = typeof req.body?.teks === 'string' ? req.body.teks.trim() : '';
    const nomor = typeof req.body?.nomor === 'string' ? req.body.nomor : '';
    const gambar = typeof req.body?.gambar_base64 === 'string' ? req.body.gambar_base64 : '';
    const mime = typeof req.body?.mime === 'string' ? req.body.mime : '';
    if (gambar && (!MIME_GAMBAR.includes(mime) || !/^[A-Za-z0-9+/=]+$/.test(gambar))) return balasGalat(res, 400, 'Gambar harus jpeg, png, atau webp (base64).');
    if (!teks && !gambar) return balasGalat(res, 400, 'Pesan kosong.');
    if (teks.length > MAKS_TEKS) return balasGalat(res, 400, `Pesan terlalu panjang (maks ${MAKS_TEKS} karakter).`);
    if (!NOMOR_LATIH.test(nomor)) return balasGalat(res, 400, 'Nomor sesi harus berbentuk latih-<acak>.');
    try {
      // Gambar diteruskan apa adanya ke n8n, tidak disimpan di server ini.
      const r = await n8n.chat({ nomor, teks, nama_tampil: amanSheet(req.sesi.nama), ...(gambar ? { gambar_base64: gambar, mime } : {}) });
      if (!r.ok) return balasGalat(res, r.kode || 502, r.galat);
      return res.json({ ok: true, data: r.data });
    } catch (e) {
      console.error('chat gagal:', e);
      return balasGalat(res, 502, 'Jawaban n8n tidak bisa diproses.');
    }
  });

  app.post('/api/aksi', async (req, res) => {
    const susun = susunAksi(req.body, req.sesi);
    if (susun.galat) return balasGalat(res, susun.kode, susun.galat);
    try {
      const r = await n8n.aksi(susun.body, { admin: req.sesi.peran === 'admin' });
      if (!r.ok) return balasGalat(res, r.kode || 502, r.galat);
      return res.json(saringRespons(susun.body.aksi, { ok: true, data: r.data }, req.sesi.peran));
    } catch (e) {
      console.error(`aksi ${susun.body.aksi} gagal:`, e);
      return balasGalat(res, 502, 'Jawaban n8n tidak bisa diproses.');
    }
  });

  app.use('/api', (req, res) => balasGalat(res, 404, 'Rute API tidak ada.'));
  // JSON rusak atau galat tak terduga: jawab JSON, jangan bocorkan jejak.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const kode = err && err.type === 'entity.parse.failed' ? 400 : err && err.status === 413 ? 413 : 500;
    if (kode === 500) console.error(err);
    return balasGalat(res, kode, kode === 500 ? 'Galat server.' : 'Permintaan tidak sah.');
  });

  const indeks = join(konfig.folderStatis, 'index.html');
  app.use(express.static(konfig.folderStatis, { index: false, maxAge: '1y', immutable: true }));
  app.get([...RUTE_HALAMAN, /^\/klien\/[^/]+$/], (req, res) => {
    if (!existsSync(indeks)) return res.status(503).type('text').send('Build belum ada. Jalankan npm run build.');
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(indeks);
  });

  return { app, bersihkanSesi: sesi.bersihkan };
}

function mulai() {
  const konfig = bacaKonfigurasi();
  if (konfig.galat.length) {
    console.error('Konfigurasi belum lengkap:\n- ' + konfig.galat.join('\n- '));
    process.exit(1);
  }
  const { app, bersihkanSesi } = buatApp(konfig);
  setInterval(bersihkanSesi, 10 * 60 * 1000).unref();
  app.listen(konfig.port, () => {
    console.log(`yamet-cs-latih jalan di port ${konfig.port}${konfig.mock ? ' (MODE TIRUAN: tidak memanggil n8n)' : ''}`);
  });
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) mulai();
