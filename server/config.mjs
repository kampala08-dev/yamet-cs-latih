// Membaca dan memeriksa variabel lingkungan sekali saat server mulai.
// Rahasia (sandi, LATIH_SECRET) hanya hidup di proses server; tidak pernah dikirim ke browser.
import { fileURLToPath } from 'node:url';

const SANDI_MIN_PRODUKSI = 12;

export function bacaKonfigurasi(env = process.env) {
  const mock = env.CS_MOCK === '1';
  const galat = [];
  const sandiAdmin = env.CS_SANDI_ADMIN || '';
  const sandiLatih = env.CS_SANDI_LATIH || '';
  const base = (env.CS_N8N_BASE || '').replace(/\/+$/, '');
  const rahasia = env.CS_LATIH_SECRET || '';

  if (!sandiAdmin) galat.push('CS_SANDI_ADMIN wajib diisi');
  else if (!mock && sandiAdmin.length < SANDI_MIN_PRODUKSI) galat.push(`CS_SANDI_ADMIN minimal ${SANDI_MIN_PRODUKSI} karakter`);
  if (sandiLatih && !mock && sandiLatih.length < SANDI_MIN_PRODUKSI) galat.push(`CS_SANDI_LATIH minimal ${SANDI_MIN_PRODUKSI} karakter`);
  if (sandiLatih && sandiLatih === sandiAdmin) galat.push('CS_SANDI_LATIH tidak boleh sama dengan CS_SANDI_ADMIN');
  if (!mock) {
    if (!/^https:\/\//.test(base)) galat.push('CS_N8N_BASE wajib https://..., contoh https://n8n-xxxx.hstgr.cloud/webhook');
    if (!rahasia) galat.push('CS_LATIH_SECRET wajib diisi (salin dari tab Konfigurasi, baris LATIH_SECRET)');
  }

  return {
    galat,
    mock,
    port: Number(env.PORT) || 8080,
    sandiAdmin,
    sandiLatih,
    n8nBase: base,
    rahasia,
    batasWaktuMs: Number(env.CS_N8N_TIMEOUT_MS) || 90_000,
    folderStatis: env.CS_FOLDER_STATIS || fileURLToPath(new URL('../dist', import.meta.url)),
  };
}
