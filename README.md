# Discord Auto Check-in (Cloudflare Workers)

Kirim pesan check-in otomatis ke channel Discord tiap 6 jam (plus jeda acak 20 detik–2 menit), dari 1 sampai 12 akun. Jalan di Cloudflare Workers paket **gratis**, nggak perlu server atau laptop nyala.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/DaddyUnikii/discord-auto-checkin-)

> ⚠️ **Baca dulu:** ini memakai token akun pribadi (self-bot), yang melanggar ToS Discord. Akun bisa kena ban, apalagi kalau banyak akun di satu server. Risiko ditanggung sendiri.

---

## Yang perlu disiapkan

- Akun **GitHub** (gratis)
- Akun **Cloudflare** (gratis): https://dash.cloudflare.com/sign-up
- **ID channel** Discord tujuan
- **Token** akun Discord kamu (satu per akun)

Ada **dua cara** pasang, pilih salah satu:

- **Cara A, pakai tombol Deploy** (paling cepat, butuh akun GitHub)
- **Cara B, copy-paste manual** (tanpa GitHub sama sekali)

---

## Cara A: Tombol Deploy (±5 menit)

### 1. Klik tombol Deploy
Klik tombol **Deploy to Cloudflare** di atas. Login GitHub & Cloudflare kalau diminta, lalu izinkan Cloudflare membuat salinan repo ini di akun GitHub kamu. Nggak perlu fork manual.

### 2. Isi pengaturan
Di halaman deploy, isi:

| Nama | Isi |
|---|---|
| `CHANNEL_ID` | ID channel tujuan |
| `MESSAGE` | Pesan yang dikirim, misalnya `checkin` |
| `INTERVAL_HOURS` | Jarak antar check-in dalam jam (default `6`) |

KV (penyimpan jadwal) dan jadwal cron tiap menit dibuat otomatis. Klik **Deploy**.

**Cara ambil ID channel:** Discord → Settings → Advanced → nyalakan **Developer Mode**. Lalu klik kanan channel → **Copy Channel ID**.

### 3. Tambah token Discord
Cloudflare Dashboard → **Workers & Pages** → pilih worker kamu → **Settings** → **Variables and Secrets** → **Add**:

- Type: **Secret**
- Name: `TOKEN_1` (akun kedua `TOKEN_2`, dst. sampai `TOKEN_12`, huruf besar semua)
- Value: token Discord akun itu

Simpan. Check-in pertama jalan 20 detik–2 menit kemudian.

---

## Cara B: Copy-paste manual, tanpa GitHub (±10 menit)

### 1. Buat worker
Cloudflare Dashboard → **Workers & Pages** → **Create** → **Create Worker** (pilih template *Hello World*) → beri nama, misalnya `discord-auto-checkin` → **Deploy**.

### 2. Tempel kode
Klik **Edit code**. Hapus semua isi file `worker.js`, lalu tempel seluruh isi file [`src/index.js`](src/index.js) dari repo ini (buka file itu → tombol **Copy raw file**). Klik **Deploy**.

### 3. Buat KV (tempat simpan jadwal)
Dashboard → **Storage & Databases** → **KV** → **Create** → nama bebas, misalnya `checkin-state`.

### 4. Sambungkan KV ke worker
Buka worker kamu → **Settings** → **Bindings** → **Add** → **KV namespace**:
- Variable name: `STATE` (harus persis, huruf besar)
- KV namespace: pilih yang barusan dibuat

### 5. Isi pengaturan dan token
Masih di **Settings** → **Variables and Secrets** → **Add**, tambahkan:

| Type | Name | Value |
|---|---|---|
| Text | `CHANNEL_ID` | ID channel tujuan |
| Text | `MESSAGE` | misalnya `checkin` |
| Text | `INTERVAL_HOURS` | `6` (boleh dikosongkan, default 6) |
| **Secret** | `TOKEN_1` | token Discord akun pertama |
| **Secret** | `TOKEN_2` … `TOKEN_12` | akun berikutnya (opsional) |

**Cara ambil ID channel:** Discord → Settings → Advanced → nyalakan **Developer Mode**. Lalu klik kanan channel → **Copy Channel ID**.

### 6. Pasang jadwal otomatis
**Settings** → **Trigger Events** (atau *Triggers*) → **Add** → **Cron Triggers** → isi `* * * * *` (artinya cek tiap menit) → **Add**.

Selesai. Check-in pertama jalan 20 detik–2 menit kemudian. Cek statusnya di link `*.workers.dev` worker kamu (langkah di bawah).

---

## Cek status
Buka link worker kamu (`https://<nama-worker>.<nama-akun>.workers.dev`). Di situ terlihat check-in terakhir, jadwal berikutnya, dan riwayat. Kalau tertulis `OK`, berarti sudah jalan.

---

## Pertanyaan umum

**Gratis selamanya?** Untuk pemakaian ini, iya. 12 akun cuma pakai sekitar 1.440 run, 17 ribu baca KV, dan 100 tulis KV per hari. Batas gratis Cloudflare 100 ribu request, 100 ribu baca, dan 1.000 tulis per hari. Kalau kena batas, worker berhenti, bukan ditagih.

**Kalau gagal kirim?** Dicoba ulang tiap 10 menit. Penyebab umum: token salah/kedaluwarsa (status 401) atau akun nggak punya izin kirim di channel itu (403).

**Ganti token?** Edit Secret `TOKEN_n` di Cloudflare. Token Discord berubah kalau kamu ganti password atau logout semua perangkat.

**Update kode?** Cara A: edit di repo GitHub kamu, Cloudflare deploy ulang otomatis. Cara B: tempel ulang kode baru di **Edit code** lalu **Deploy**.

## Keamanan

- **Jangan pernah** taruh token di kode, repo, screenshot, atau chat. Token = akses penuh ke akun Discord kamu.
- Token disimpan sebagai Secret terenkripsi di Cloudflare, cuma worker kamu yang bisa baca.
- Kalau token pernah bocor, langsung ganti password Discord supaya token lama mati.
