// Format angka & waktu gaya Indonesia: 4.721, 0,9, 09.12.

export function angka(n: number, desimal = 0) {
  return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: desimal, minimumFractionDigits: 0 });
}

export function detik(ms: number) {
  return `${angka(ms / 1000, 1)} dtk`;
}

export function jam(waktu: string) {
  const m = String(waktu || '').match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}.${m[2]}` : waktu || '-';
}

export function tanggalJam(waktu: string) {
  const m = String(waktu || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return waktu || '-';
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(m[2]) - 1];
  return `${Number(m[3])} ${bulan} ${m[4]}.${m[5]}`;
}

export function umur(menit: number) {
  if (menit < 60) return `${angka(menit)} mnt`;
  const j = Math.floor(menit / 60);
  return j < 24 ? `${j} jam ${menit % 60} mnt` : `${Math.floor(j / 24)} hr ${j % 24} jam`;
}

// Nomor tidak pernah ditampilkan utuh di layar; utuh hanya dipakai di tautan wa.me untuk admin.
export function samarkanNomor(nomor: string) {
  const s = String(nomor || '');
  if (/[x*]/i.test(s)) return s;
  const a = s.replace(/\D/g, '');
  return a.length < 9 ? s : `${a.slice(0, 4)}-xxxx-${a.slice(-4)}`;
}

export function nomorUtuh(nomor: string) {
  const s = String(nomor || '');
  return !/[x*]/i.test(s) && s.replace(/\D/g, '').length >= 9;
}

export function tautanWa(nomor: string) {
  let a = String(nomor || '').replace(/\D/g, '');
  if (a.startsWith('0')) a = '62' + a.slice(1);
  else if (a.startsWith('8')) a = '62' + a;
  return `https://wa.me/${a}`;
}

export function topikManusia(t: string) {
  return String(t || '').replace(/_/g, ' ');
}

export function sesiBaru() {
  const b = new Uint8Array(5);
  crypto.getRandomValues(b);
  return 'latih-' + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 8);
}

// Sheet memakai judul "Kunci, Nilai, Keterangan"; n8n bisa mengirim huruf besar atau kecil.
export function normalKonfig(baris: unknown): { kunci: string; nilai: string; keterangan: string }[] {
  if (!Array.isArray(baris)) return [];
  return baris.map((r: Record<string, unknown>) => ({
    kunci: String(r.kunci ?? r.Kunci ?? ''),
    nilai: String(r.nilai ?? r.Nilai ?? ''),
    keterangan: String(r.keterangan ?? r.Keterangan ?? ''),
  }));
}

export function msDariWaktu(waktu: string) {
  const t = Date.parse(String(waktu || '').replace(' ', 'T'));
  return Number.isFinite(t) ? t : NaN;
}

// "4 mnt", "3 jam", "2 hr" sejak waktu sheet.
export function umurDari(waktu: string, sekarang = Date.now()) {
  const t = msDariWaktu(waktu);
  if (!Number.isFinite(t)) return '-';
  const menit = Math.max(0, Math.round((sekarang - t) / 60000));
  if (menit < 60) return `${menit} mnt`;
  const j = Math.floor(menit / 60);
  return j < 24 ? `${j} jam` : `${Math.floor(j / 24)} hr`;
}

export const HARI_RENTANG = { hari: 1, '7': 7, '30': 30 } as const;

export function sapaan(jamSekarang = new Date().getHours()) {
  if (jamSekarang < 11) return 'Selamat pagi';
  if (jamSekarang < 15) return 'Selamat siang';
  if (jamSekarang < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function inisial(nama: string) {
  const kata = String(nama || '').replace(/^(Bunda|Ayah|Ibu|Pak)\s+/i, '').split(/\s+/).filter(Boolean);
  return (kata[0]?.[0] || '?').toUpperCase() + (kata[1]?.[0] || '').toUpperCase();
}

const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Label deret grafik dari n8n: "HH:00" (hari ini) atau "YYYY-MM-DD" (7/30 hari).
export function labelGrafik(label: string, rentang: string) {
  const jamM = /^(\d{2}):(\d{2})$/.exec(label);
  if (jamM) return `${jamM[1]}.${jamM[2]}`;
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (!t) return label;
  const d = new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  return rentang === '7' ? `${HARI_PENDEK[d.getDay()]} ${d.getDate()}` : `${d.getDate()}/${d.getMonth() + 1}`;
}
