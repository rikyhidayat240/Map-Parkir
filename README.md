# Lahan Parkir — Jalan Santai Dies Natalis ke-64 Unud

Sebuah aplikasi peta interaktif berbasis web sederhana (Single-Page Application) untuk memudahkan peserta Jalan Santai Dies Natalis ke-64 Universitas Udayana dalam menemukan titik-titik lahan parkir yang tersedia.

## Fitur Utama

- **Peta Interaktif**: Menampilkan titik lahan parkir menggunakan library [Leaflet.js](https://leafletjs.com/).
- **Informasi Parkir**: Detail informasi setiap lahan parkir, dilengkapi dengan foto (slider foto jika ada lebih dari satu foto).
- **Lacak Lokasi (Geolocation)**: Mengetahui posisi pengguna saat ini secara *real-time* di peta dan menghitung jarak garis lurus dari lokasi pengguna ke lahan parkir yang dipilih.
- **Navigasi Rute**: Terintegrasi dengan Google Maps untuk memberikan arahan rute (navigasi) dari posisi pengguna menuju lahan parkir terpilih.
- **Daftar Lahan Parkir**: Menampilkan list seluruh lahan parkir yang tersedia untuk kemudahan pencarian.

## Struktur Direktori

```text
Map Parkir/
├── foto/             # Berisi kumpulan aset gambar/foto lokasi parkir
├── netlify/          # Folder konfigurasi untuk hosting di Netlify
├── .gitignore        # Daftar file/folder yang diabaikan oleh Git
├── index.html        # Halaman utama aplikasi (UI, style CSS, dan script JS)
└── parkir.json       # Database statis berbentuk JSON berisi koordinat dan info parkir
```

## Teknologi yang Digunakan

- **HTML5 & CSS3**: Struktur dan desain antarmuka (Responsive UI / Mobile-friendly).
- **Vanilla JavaScript (ES6)**: Logika aplikasi, fetch data JSON, slider gambar, dan akses Geolocation API.
- **Leaflet.js**: Library open-source JavaScript untuk peta interaktif (menggunakan base map dari OpenStreetMap).

## Cara Menjalankan Secara Lokal

Karena aplikasi ini melakukan request data menggunakan fungsi `fetch()` ke file `parkir.json`, aplikasi ini tidak bisa dijalankan hanya dengan klik dua kali (klik ganda) file `index.html` di beberapa browser (akan terkena isu *CORS* pada protokol `file://`).

Anda memerlukan *local web server* untuk menjalankannya:

### Menggunakan VS Code (Disarankan)
1. Buka folder `Map Parkir` di Visual Studio Code.
2. Install ekstensi **Live Server**.
3. Klik kanan pada file `index.html` lalu pilih **"Open with Live Server"**.
4. Browser akan otomatis terbuka di `http://127.0.0.1:5500`.

### Menggunakan Node.js
Jika Anda sudah menginstal Node.js, Anda dapat menggunakan `http-server` atau `serve`:
```bash
npx serve .
# atau
npx http-server .
```
Lalu buka alamat localhost yang diberikan (biasanya `http://localhost:3000` atau `http://localhost:8080`) di browser Anda.

## Penambahan Data Parkir Baru

Anda bisa menambah, mengedit, atau menghapus titik parkir dengan memodifikasi file `parkir.json`.

Contoh struktur datanya:
```json
{
  "name": "Nama Lokasi Parkir",
  "lat": -8.798150,
  "lng": 115.171801,
  "notes": "Keterangan opsional mengenai parkiran ini.",
  "photos": [
    "foto/p1-1.jpeg"
  ]
}
```
*Pastikan format file JSON valid agar peta dapat dimuat dengan baik.*
