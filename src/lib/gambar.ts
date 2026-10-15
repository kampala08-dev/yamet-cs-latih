// Gambar latih: terima jpeg/png/webp <= 5 MB, kompres di browser ke lebar maks 1280 px (JPEG).
export const MIME_DITERIMA = ['image/jpeg', 'image/png', 'image/webp'];
export const MAKS_BYTE = 5 * 1024 * 1024;
const LEBAR_MAKS = 1280;
const LEBAR_PRATINJAU = 320;

export interface Lampiran {
  base64: string;
  mime: string;
  pratinjau: string;
}

function muat(file: File): Promise<HTMLImageElement> {
  return new Promise((ok, gagal) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); gagal(new Error('Gambar tidak bisa dibaca.')); };
    img.src = url;
  });
}

function keDataUrl(img: HTMLImageElement, lebarMaks: number, kualitas: number) {
  const skala = Math.min(1, lebarMaks / img.naturalWidth);
  const kanvas = document.createElement('canvas');
  kanvas.width = Math.round(img.naturalWidth * skala);
  kanvas.height = Math.round(img.naturalHeight * skala);
  const ctx = kanvas.getContext('2d');
  if (!ctx) throw new Error('Peramban tidak mendukung kompres gambar.');
  ctx.fillStyle = '#ffffff'; // latar putih untuk PNG transparan saat jadi JPEG
  ctx.fillRect(0, 0, kanvas.width, kanvas.height);
  ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
  return kanvas.toDataURL('image/jpeg', kualitas);
}

export async function siapkanGambar(file: File): Promise<Lampiran> {
  if (!MIME_DITERIMA.includes(file.type)) throw new Error('Hanya gambar JPEG, PNG, atau WebP.');
  if (file.size > MAKS_BYTE) throw new Error('Gambar lebih dari 5 MB.');
  const img = await muat(file);
  const utama = keDataUrl(img, LEBAR_MAKS, 0.85);
  return { base64: utama.split(',')[1], mime: 'image/jpeg', pratinjau: keDataUrl(img, LEBAR_PRATINJAU, 0.7) };
}
