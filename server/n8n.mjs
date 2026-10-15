// Penerus ke webhook n8n. Header X-CS-Latih ditambahkan di sini dan tidak pernah keluar ke browser.

function angka(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Workflow 07 saat ini mengirim tool_dipanggil sebagai daftar nama + tool_gagal/alat;
// kontrak meminta [{nama, ok}]. Keduanya diterima dan diseragamkan ke bentuk kontrak.
export function normalisasiChat(r) {
  const x = r && typeof r === 'object' ? r : {};
  let alat;
  if (Array.isArray(x.alat) && x.alat.length) {
    alat = x.alat.map((a) => ({ nama: String(a?.tool ?? a?.nama ?? ''), ok: Boolean(a?.ok) }));
  } else {
    const gagal = new Set(Array.isArray(x.tool_gagal) ? x.tool_gagal.map(String) : []);
    alat = (Array.isArray(x.tool_dipanggil) ? x.tool_dipanggil : []).map((t) =>
      typeof t === 'string' ? { nama: t, ok: !gagal.has(t) } : { nama: String(t?.nama ?? t?.tool ?? ''), ok: Boolean(t?.ok) },
    );
  }
  return {
    balasan: String(x.balasan ?? ''),
    dilewati: Boolean(x.dilewati),
    alasan: x.alasan ? String(x.alasan) : '',
    pengetahuan_dipakai: Array.isArray(x.pengetahuan_dipakai) ? x.pengetahuan_dipakai.map(String) : [],
    tool_dipanggil: alat.filter((a) => a.nama),
    token_in: angka(x.token_in),
    token_out: angka(x.token_out),
    latensi_ms: angka(x.latensi_ms),
    id_giliran: String(x.id_giliran ?? ''),
    topik: String(x.topik ?? ''),
    sumber_cara: String(x.sumber_cara ?? ''),
    isi_gambar: x.isi_gambar ? String(x.isi_gambar) : '',
    model: x.model ? String(x.model) : '',
  };
}

function pesanStatus(status, jalur) {
  if (status === 401) return 'n8n menolak rahasia latih. Samakan CS_LATIH_SECRET dengan Konfigurasi LATIH_SECRET.';
  if (status === 404) return `Webhook n8n ${jalur} tidak ditemukan. Workflow-nya mungkin belum aktif.`;
  if (status >= 500) return `n8n galat (${status}) saat memproses ${jalur}. Lihat eksekusi terakhir di n8n.`;
  return `n8n menjawab ${status} untuk ${jalur}.`;
}

export function buatKlienN8n({ n8nBase, rahasia, batasWaktuMs }, ambil = fetch) {
  async function kirim(jalur, body, { admin = false } = {}) {
    const headers = { 'content-type': 'application/json', 'X-CS-Latih': rahasia };
    if (admin) headers['X-CS-Peran'] = 'admin';
    let res;
    let mentah = '';
    try {
      res = await ambil(`${n8nBase}/${jalur}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(batasWaktuMs),
        redirect: 'error',
      });
      mentah = await res.text();
    } catch (e) {
      const habis = e && (e.name === 'TimeoutError' || e.name === 'AbortError');
      return {
        ok: false,
        kode: 504,
        galat: habis
          ? `n8n tidak menjawab dalam ${Math.round(batasWaktuMs / 1000)} detik.`
          : 'n8n tidak bisa dihubungi. Cek CS_N8N_BASE dan apakah n8n hidup.',
      };
    }
    let json = null;
    try { json = mentah ? JSON.parse(mentah) : null; } catch { json = null; }
    if (!res.ok) {
      // Galat bisnis dari workflow 11 (400 masukan, 404 id tidak ada, 409 nomor ganda) diteruskan apa adanya.
      if ([400, 404, 409].includes(res.status) && json && typeof json.galat === 'string') {
        return { ok: false, kode: res.status, galat: json.galat.slice(0, 300) };
      }
      const rinci = json && typeof json.galat === 'string' ? ` (${json.galat.slice(0, 200)})` : '';
      return { ok: false, kode: res.status === 400 ? 400 : 502, galat: pesanStatus(res.status, jalur) + rinci };
    }
    if (json === null) return { ok: false, kode: 502, galat: `n8n membalas ${jalur} tanpa JSON yang sah.` };
    return { ok: true, json };
  }

  return {
    async chat(body) {
      const r = await kirim('cs-latih', body);
      return r.ok ? { ok: true, data: normalisasiChat(r.json) } : r;
    },
    async aksi(body, opsi) {
      const r = await kirim('cs-api', body, opsi);
      if (!r.ok) return r;
      const j = r.json;
      if (j && j.ok === true) return { ok: true, data: j.data };
      return { ok: false, kode: 422, galat: (j && typeof j.galat === 'string' && j.galat) || 'n8n membalas ok:false tanpa keterangan.' };
    },
  };
}
