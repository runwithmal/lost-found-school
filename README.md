# Lost & Found Sekolah ♡

Website Lost & Found bertema pink pastel. Pengunjung dapat melihat barang yang ditemukan dan menghubungi admin melalui WhatsApp. Hanya admin yang dapat login dan menambahkan, mengubah, atau menghapus barang.

## Teknologi
- React + Vite
- Supabase Database, Auth, dan Storage
- WhatsApp click-to-chat

## 1. Siapkan Supabase
1. Buat project di https://supabase.com/.
2. Buka **SQL Editor**, tempel isi `supabase.sql`, lalu jalankan.
3. Buka **Project Settings > API**. Salin Project URL dan `anon` / publishable key.
4. Buka **Authentication > Users**, tambahkan akun admin menggunakan email dan password yang kamu tentukan.
5. Jadikan akun tersebut admin: buka **Authentication > Users**, pilih user, lalu edit **App Metadata** menjadi:
   `{"role":"admin"}`
   Jangan masukkan role admin ke User Metadata. App Metadata hanya boleh diubah oleh admin project.
6. Pastikan bucket `found-items` sudah dibuat oleh SQL sebagai bucket publik. Foto barang yang diunggah akan dapat dilihat pengunjung.

## 2. Jalankan website
1. Install Node.js versi LTS dari https://nodejs.org/.
2. Ekstrak folder project.
3. Buka terminal di folder project, jalankan:
   ```bash
   npm install
   ```
4. Salin `.env.example` menjadi `.env` lalu isi:
   - `VITE_SUPABASE_URL` = Project URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = anon / publishable key
   - `VITE_ADMIN_WHATSAPP` = nomor WhatsApp admin dengan kode negara, hanya angka. Contoh Indonesia: `62812...` (tanpa +, spasi, atau strip)
   - `VITE_SCHOOL_NAME` = nama sekolah atau nama layanan
5. Jalankan:
   ```bash
   npm run dev
   ```
6. Buka alamat lokal yang ditampilkan Vite, biasanya `http://localhost:5173`.

## 3. Deploy agar bisa diakses warga sekolah
Deploy folder project ke Vercel atau Netlify. Masukkan semua variabel `.env` ke bagian Environment Variables di pengaturan project hosting, lalu deploy ulang.

## Catatan keamanan & privasi
- Jangan pernah memasukkan `service_role` key Supabase ke website atau file `.env` frontend. Gunakan hanya anon/publishable key.
- Kebijakan Row Level Security di `supabase.sql` membuat hanya admin yang dapat mengubah data.
- Foto barang tampil untuk publik. Jangan unggah foto yang menampilkan kartu identitas, alamat rumah, nomor telepon, atau data pribadi.
- Untuk mengklaim barang, pemilik sebaiknya menghubungi admin dan menjelaskan ciri khusus barang yang tidak ditampilkan di website. Admin yang memverifikasi sebelum menyerahkan barang.
- Ganti nomor WhatsApp contoh sebelum website dipublikasikan.
