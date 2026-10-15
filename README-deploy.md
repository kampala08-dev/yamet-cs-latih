# Deploy halaman latih + CRM (yamet-cs-latih)

Satu container Node: menyajikan halaman, memeriksa kata sandi, dan meneruskan permintaan ke n8n.
Rahasia n8n hanya ada di server, tidak pernah sampai ke browser.

## 1. Taruh kode di GitHub
Docker Manager Hostinger tidak bisa `build`, jadi polanya sama dengan landing `yamet-dempo`:
container `builder` meng-clone repo, build, lalu container `web` menjalankan hasilnya.

1. Buat repo baru, mis. `kampala08-dev/yamet-cs-latih` (privat disarankan).
2. Isi repo = isi folder `latih/` ini (package.json di akar repo). Jangan ikutkan `node_modules/`, `dist/`, `.env` (sudah ada di `.gitignore`).
3. Kalau `uji/*.md` atau `bahan/pengetahuan.csv` berubah, jalankan `npm run skenario` di folder ini lalu commit ulang `src/data/*.json`.

## 2. Buat project di Docker Manager
1. hPanel, VPS, Docker Manager, Compose baru, nama project `yamet-cs-latih`.
2. Tempel isi `docker-compose.yml`.
3. Isi Environment (atau file `.env` di project) sesuai tabel di bawah.
4. DNS: tambah A record subdomain (mis. `latih`) ke IP VPS `72.62.124.82`. Sertifikat dibuat otomatis oleh Traefik.
5. Deploy. Builder butuh 1 sampai 3 menit; `web` baru jalan setelah builder sukses.

Ambil kode terbaru dari GitHub = **Restart project** (builder jalan ulang). Kalau builder gagal, `web` tidak naik: buka log builder.

## 3. Variabel yang harus diisi Rio

| Variabel | Wajib | Isi |
|---|---|---|
| `CS_SANDI_ADMIN` | ya | Kata sandi admin, minimal 12 karakter. Buat sendiri, simpan di pengelola sandi. |
| `CS_N8N_BASE` | ya | `https://<domain n8n Hostinger>/webhook` tanpa garis miring di akhir. |
| `CS_LATIH_SECRET` | ya | Sheet **CS Bot YAMET**, tab **Konfigurasi**, baris **LATIH_SECRET**, kolom Nilai. Salin persis. Harus sama dengan yang dibaca workflow 07 dan 11. |
| `CS_DOMAIN` | ya | Domain halaman, mis. `latih.yametpalembang.io`. |
| `CS_REPO_URL` | ya | `https://github.com/<akun>/<repo>.git`. Repo privat: `https://<token>@github.com/<akun>/<repo>.git` dengan token GitHub fine-grained **read-only** khusus repo itu. |
| `CS_REPO_CABANG` | tidak | Bawaan `main`. |
| `CS_REPO_FOLDER` | tidak | Bawaan `.` (package.json di akar repo). Isi `n8n-cs-whatsapp/latih` kalau repo memuat seluruh folder Bot YAMET. |
| `CS_SANDI_LATIH` | tidak | Sandi kedua untuk peran latih: bisa latih dan memberi label, tapi tidak melihat nomor utuh dan tidak bisa mengubah Konfigurasi, Klien Aktif, atau status eskalasi. Minimal 12 karakter, beda dari sandi admin. |
| `CS_N8N_TIMEOUT_MS` | tidak | Bawaan 90000 (90 detik). |
| `CS_MOCK` | tidak | Biarkan kosong/0 di VPS. `1` = data tiruan tanpa n8n (hanya untuk uji tampilan). |

Kalau variabel wajib kosong, compose menolak jalan dengan pesan `isi CS_...`; server juga menolak mulai dan menulis daftar yang kurang di log.

## 4. Yang harus siap di n8n
- Workflow **07 - CS YAMET (utama)** aktif: webhook `POST /cs-latih` (chat latih).
- Workflow **11 - CS API Latih CRM** aktif: webhook `POST /cs-api` (label, CRM, Pengaturan).
- Keduanya memeriksa header `X-CS-Latih` = Konfigurasi `LATIH_SECRET`. Kalau `LATIH_SECRET` di sheet diganti, ganti juga `CS_LATIH_SECRET` lalu Restart project.

Kalau salah satu belum aktif, halaman tetap terbuka dan menampilkan galat di tempat ("Webhook n8n ... tidak ditemukan").

## 5. Jalankan di PC (tanpa Docker)
```
npm install
npm run build
# PowerShell: $env:CS_MOCK="1"; $env:CS_SANDI_ADMIN="sandi-uji-lokal"; npm start
# Git Bash:   CS_MOCK=1 CS_SANDI_ADMIN=sandi-uji-lokal npm start
```
Buka http://localhost:8080. Mode tiruan menampilkan label "tiruan" di kepala halaman.
Uji server: `npm test`. Pengembangan tampilan: `npm start` di satu terminal, `npm run dev` di terminal lain (Vite 5173, API diteruskan ke 8080).

Mesin yang bisa `docker build` (bukan Docker Manager): `docker build -t yamet-cs-latih .` lalu `docker run --env-file .env -p 8080:8080 yamet-cs-latih`.

## 6. Keamanan singkat
- Sesi cookie 12 jam (HttpOnly, SameSite=Strict, Secure di balik HTTPS). Restart container = semua orang masuk ulang.
- 5 kali salah sandi dari satu IP = dikunci 15 menit. Maksimal 60 panggilan per menit per sesi.
- Halaman latih hanya bisa memakai nomor `latih-...`; nomor orang tua asli tidak bisa dipakai dari sini.
- Kunci Konfigurasi berakhiran `_SECRET`, `_KEY`, `_TOKEN` dibuang server walau n8n mengirimnya, dan tidak bisa ditulis.
- Nomor orang tua utuh hanya untuk peran admin (tautan WhatsApp); di layar selalu disamarkan. Server juga menyamarkan ulang untuk peran latih.
- Teks yang ditulis ke sheet dan berawalan `= + - @` diberi tanda kutip agar tidak dibaca sebagai rumus.
