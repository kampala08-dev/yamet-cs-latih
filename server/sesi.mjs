// Sesi cookie 12 jam di memori proses. Restart container = semua orang masuk ulang (sengaja sederhana).
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export const NAMA_COOKIE = 'cs_sesi';
export const UMUR_SESI_MS = 12 * 60 * 60 * 1000;
const BATAS_GAGAL = 5;
const JENDELA_GAGAL_MS = 15 * 60 * 1000;

function hash(t) {
  return createHash('sha256').update(String(t), 'utf8').digest();
}

export function sandiCocok(masukan, sandi) {
  if (!sandi) return false;
  return timingSafeEqual(hash(masukan), hash(sandi));
}

export function buatPenyimpanSesi(sekarang = () => Date.now()) {
  const sesi = new Map();
  const gagal = new Map();

  function bersihkan() {
    const t = sekarang();
    for (const [k, v] of sesi) if (v.kedaluwarsa <= t) sesi.delete(k);
    for (const [k, v] of gagal) if (v.mulai + JENDELA_GAGAL_MS <= t) gagal.delete(k);
  }

  return {
    buat(nama, peran) {
      const token = randomBytes(32).toString('base64url');
      sesi.set(token, { nama, peran, kedaluwarsa: sekarang() + UMUR_SESI_MS });
      return token;
    },
    ambil(token) {
      if (!token) return null;
      const s = sesi.get(token);
      if (!s) return null;
      if (s.kedaluwarsa <= sekarang()) { sesi.delete(token); return null; }
      return s;
    },
    hapus(token) { sesi.delete(token); },
    terkunci(ip) {
      const g = gagal.get(ip);
      return Boolean(g && g.jumlah >= BATAS_GAGAL && g.mulai + JENDELA_GAGAL_MS > sekarang());
    },
    catatGagal(ip) {
      const g = gagal.get(ip);
      const t = sekarang();
      if (!g || g.mulai + JENDELA_GAGAL_MS <= t) gagal.set(ip, { jumlah: 1, mulai: t });
      else gagal.set(ip, { ...g, jumlah: g.jumlah + 1 });
    },
    resetGagal(ip) { gagal.delete(ip); },
    bersihkan,
  };
}

export function bacaCookie(header, nama) {
  if (!header) return '';
  for (const bagian of header.split(';')) {
    const [k, ...v] = bagian.trim().split('=');
    if (k === nama) return decodeURIComponent(v.join('='));
  }
  return '';
}
