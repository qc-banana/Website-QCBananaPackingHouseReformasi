# QC Packing House

Template website dengan struktur:
- `index.html`: dashboard
- `pages/pg1.html` s.d. `pg4.html`: halaman per PG
- `css/`: tampilan
- `js/`: logika form, grafik, dan koneksi Supabase
- `assets/logo.png`: logo sementara
- `supabase_setup.sql`: skema tabel Supabase

## Cara membuka
1. Ekstrak folder `QC-PACKING-HOUSE`.
2. Buka folder itu di VS Code.
3. Jalankan `index.html` dengan ekstensi Live Server (disarankan), atau buka file di browser.
4. Klik PG 1–4 pada sidebar.

## Supabase
1. Buat project Supabase.
2. Buka SQL Editor, jalankan isi `supabase_setup.sql`.
3. Buka `js/config.js`, isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY`/publishable key dari project.
4. Jangan pernah masukkan `service_role` key ke file frontend.
5. Kebijakan SELECT di SQL sudah disiapkan. Kebijakan INSERT/UPDATE belum diaktifkan karena hak input petugas perlu dipastikan dahulu. Untuk menguji simpan data lintas perangkat, siapkan kebijakan tulis yang sesuai atau implementasikan login Supabase Auth terlebih dahulu.

## Catatan perilaku template
- Form PG menyimpan record dengan `ph = null`.
- Form PH menyimpan record terpisah dengan nama PH terpilih.
- Persentase ukuran dihitung dari jumlah ukuran tersebut / total Call.
- UC = ukuran sampai 42; Good Call = 43–46; OC = 47 ke atas.
- Grafik menampilkan maksimal 5 week terbaru yang memiliki data.
- Jika Supabase belum dikonfigurasi, template menggunakan localStorage untuk pratinjau di browser itu saja. Data localStorage tidak tersinkron ke perangkat lain.
- Daftar PH di dropdown saat ini contoh PH 14, 15, 16 dan bisa diubah setelah daftar PH sebenarnya dipastikan.
