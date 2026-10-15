// Buka WhatsApp setelah "Ambil alih" berhasil (U1.15).
// Tab kosong dibuka SAAT klik (sinkron) agar tidak diblokir pemblokir popup, lalu diarahkan setelah aksi sukses;
// ditutup bila aksi gagal atau nomor ternyata tidak utuh.
import { nomorUtuh, tautanWa } from './format';

export function bolehBukaWa(peran: string, nomor: string | undefined, kanal: string | undefined) {
  return peran === 'admin' && kanal === 'wa' && nomorUtuh(nomor || '');
}

export function siapkanTabWa(boleh: boolean) {
  const tab = boleh ? window.open('about:blank', '_blank') : null;
  return {
    arahkan(nomor: string | undefined) {
      if (!tab) return;
      if (!nomorUtuh(nomor || '')) {
        tab.close();
        return;
      }
      tab.opener = null;
      tab.location.href = tautanWa(nomor || '');
    },
    batal() {
      tab?.close();
    },
  };
}
