// Menyusun src/data/skenario.json dan src/data/pengetahuan.json dari bahan di folder induk.
// Jalankan ulang (npm run skenario) setiap kali uji/*.md atau bahan/pengetahuan.csv berubah,
// lalu commit hasilnya: build Docker tidak membaca folder induk.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const keluar = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

function barisTabel(md) {
  return md
    .split('\n')
    .filter((b) => b.startsWith('|') && !/^\|\s*-/.test(b) && !/^\|\s*#\s*\|/.test(b))
    .map((b) => b.slice(1, -1).split('|').map((s) => s.trim()));
}

function bersihkanKutip(t) {
  return t.replace(/^["“]|["”]$/g, '').trim();
}

// Prompt dalam kurung, mis. "(stiker saja)", bukan teks yang bisa diketik.
function bisaDiketik(t) {
  return !/^\(.*\)$/.test(t.trim());
}

function skenarioFase1(md) {
  return barisTabel(md).map(([id, judul, pesan, harus]) => {
    const kutipan = [...pesan.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    return {
      id,
      kelompok: 'Fase 1',
      judul,
      pesan: kutipan.length ? kutipan : [pesan],
      harus,
      dilarang: '',
      bisaDiketik: kutipan.length > 0,
    };
  });
}

function redTeam(md) {
  const hasil = [];
  let kelompok = '';
  for (const b of md.split('\n')) {
    const judul = b.match(/^## ([A-F])\. (.+)$/);
    if (judul) { kelompok = `${judul[1]}. ${judul[2]}`; continue; }
    if (!b.startsWith('|') || /^\|\s*-/.test(b) || /^\|\s*#\s*\|/.test(b)) continue;
    const [id, prompt, harus, dilarang] = b.slice(1, -1).split('|').map((s) => s.trim());
    const pesan = bersihkanKutip(prompt);
    hasil.push({ id, kelompok, judul: pesan, pesan: [pesan], harus, dilarang, bisaDiketik: bisaDiketik(pesan) });
  }
  return hasil;
}

function parseCsv(teks) {
  const baris = [];
  let kol = [], sel = '', kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) {
      if (c === '"' && teks[i + 1] === '"') { sel += '"'; i++; }
      else if (c === '"') kutip = false;
      else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === ',') { kol.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && teks[i + 1] === '\n') i++;
      kol.push(sel); sel = '';
      if (kol.some((k) => k !== '')) baris.push(kol);
      kol = [];
    } else sel += c;
  }
  if (sel || kol.length) { kol.push(sel); baris.push(kol); }
  return baris;
}

const skenario = [
  ...skenarioFase1(readFileSync(join(akar, 'uji', 'skenario-fase1.md'), 'utf8')),
  ...redTeam(readFileSync(join(akar, 'uji', 'red-team.md'), 'utf8')),
];
const [kepala, ...isi] = parseCsv(readFileSync(join(akar, 'bahan', 'pengetahuan.csv'), 'utf8'));
const iId = kepala.indexOf('id'), iTopik = kepala.indexOf('topik'), iTanya = kepala.indexOf('pertanyaan_variasi');
const pengetahuan = Object.fromEntries(
  isi.map((k) => [k[iId], { topik: k[iTopik], contoh: (k[iTanya] || '').split('|')[0].trim() }]),
);

// Salinan penuh untuk mode tiruan server saja (tidak masuk bundel browser).
const iJawab = kepala.indexOf('jawaban');
const pengetahuanPenuh = isi.map((k) => ({ id: k[iId], topik: k[iTopik], pertanyaan_variasi: k[iTanya], jawaban: k[iJawab] }));
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'mock-pengetahuan.json'), JSON.stringify(pengetahuanPenuh, null, 1) + '\n');
writeFileSync(join(keluar, 'skenario.json'), JSON.stringify(skenario, null, 1) + '\n');
writeFileSync(join(keluar, 'pengetahuan.json'), JSON.stringify(pengetahuan, null, 1) + '\n');
console.log(`skenario: ${skenario.length}, pengetahuan: ${Object.keys(pengetahuan).length}`);
