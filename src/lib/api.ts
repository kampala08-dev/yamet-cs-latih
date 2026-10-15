// Klien API ke server sendiri (bukan ke n8n). Rahasia n8n tidak pernah ada di browser.
import type { InfoSesi, JawabanChat } from './tipe';

export class GalatApi extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const PERISTIWA_SESI_HABIS = 'cs-sesi-habis';

async function minta<T>(jalur: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(jalur, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new GalatApi('Server aplikasi tidak bisa dihubungi. Periksa koneksi internet.', 0);
  }
  let json: { ok?: boolean; data?: T; galat?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json || json.ok !== true) {
    if (res.status === 401 && jalur !== '/api/masuk' && jalur !== '/api/sesi') {
      window.dispatchEvent(new Event(PERISTIWA_SESI_HABIS));
    }
    throw new GalatApi(json?.galat || `Permintaan gagal (${res.status}).`, res.status);
  }
  return json.data as T;
}

export const api = {
  sesi: (signal?: AbortSignal) => minta<InfoSesi>('/api/sesi', undefined, signal),
  masuk: (nama: string, sandi: string) => minta<InfoSesi>('/api/masuk', { nama, sandi }),
  keluar: () => minta<null>('/api/keluar', {}),
  chat: (nomor: string, teks: string, gambar?: { base64: string; mime: string }) =>
    minta<JawabanChat>('/api/chat', { nomor, teks, ...(gambar ? { gambar_base64: gambar.base64, mime: gambar.mime } : {}) }),
  aksi: <T>(aksi: string, isi: Record<string, unknown> = {}, signal?: AbortSignal) =>
    minta<T>('/api/aksi', { aksi, ...isi }, signal),
};
