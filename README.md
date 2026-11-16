# ☕ Bean & Bite — Monera Coffee Management System

> *"Smart Management for Coffee, Kitchen & Beyond"*

**Bean & Bite** adalah sistem informasi manajemen kafe terpadu berbasis web yang dirancang khusus untuk mengoperasikan **Monera Coffee**. Platform ini menyatukan seluruh operasional harian F&B—mulai dari titik penjualan di meja kasir (*Point of Sale*), layar antrean produksi dapur & bar (*Kitchen Display System*), pemotongan stok bahan baku otomatis berbasis resep, hingga pusat kendali analitik dan keamanan pemilik (*Super Admin Hub*).

---

## ✨ Fitur Utama

### 1. 👑 Pemilik (*Super Admin Hub*)
- **Dashboard Analitik Real-Time:** Memantau omzet kotor, estimasi laba kotor berbasis HPP, grafik tren penjualan, antrean dapur aktif, dan peringatan bahan baku kritis.
- **Manajemen Pengguna (*Super Admin Control*):** Mengelola akun staf, pengaturan peran (*RBAC*), reset kata sandi, penonaktifan akun (*suspend*), serta pemutusan sesi paksa.
- **Master Menu, HPP & Resep:** Mengatur katalog menu, harga jual, varian rasa, stasiun tujuan pembuatan (Bar vs Dapur), dan formula takaran bahan baku.
- **Manajemen Inventaris & Mutasi Stok:** Memantau saldo bahan mentah gudang serta ledger riwayat keluar-masuk stok secara transparan.
- **Voucher Promo & Pengaturan Kafe:** Mengelola kupon diskon promo (persentase maupun nominal) dengan paginasi rapi serta konfigurasi profil kafe, pesan footer struk, dan tarif pajak restoran PB1.
- **Jejak Audit (*Audit Logs*):** Merekam aktivitas sensitif seperti pembatalan transaksi, perubahan harga, dan pengelolaan akun.

### 2. 💳 Admin / Kasir (*Point of Sale Terminal*)
- **Manajemen Shift Kasir:** Pencatatan nama kasir jaga dan modal kas awal saat buka shift, serta rekonsiliasi uang fisik laci kas (*Z-Report*) saat tutup shift.
- **Transaksi Cepat & Fleksibel:** Mendukung pembayaran langsung (*Pay First*) via Tunai, QRIS, Kartu Debit, maupun tagihan gantung meja (*Open Bill*).
- **Varian, Voucher & Pajak Otomatis:** Kustomisasi varian minuman/makanan, penerapan kupon promo tersinkronisasi, dan kalkulasi pajak PB1 otomatis.
- **Cetak Struk Thermal (58mm / 80mm):** Pencetakan struk rapi yang memuat identitas kafe, nama kasir bertugas, rincian pesanan, diskon, dan footer kustom.
- **Pembatalan Berotorisasi (*Void*):** Memerlukan alasan tertulis dan secara otomatis mengembalikan saldo stok bahan baku ke gudang.

### 3. 🧑‍🍳 Barista & Koki (*Kitchen Display System — 4 Stasiun*)
- **Navigasi 4 Stasiun Instan:** Perpindahan tanpa jeda muat ulang antara **Semua Antrean**, **Stasiun Barista (Minuman)**, **Stasiun Koki (Makanan)**, dan **Kelola Menu Sold Out**.
- **Antrean FIFO & Timer SLA:** Pengurutan tiket otomatis dari pesanan terlama dengan indikator warna batas waktu (*Normal, Peringatan, Terlambat*).
- **Batch Summary & Aksi Cepat:** Menampilkan ringkasan akumulasi racikan serta tombol proses cepat (*Racik $\rightarrow$ Siap*) lengkap dengan fitur **Undo** jika terjadi kesalahan klik.
- **Kontrol Menu Sold Out Inline:** Mengubah status ketersediaan menu secara langsung dari layar dapur (tanpa *popup*) dengan penguncian otomatis apabila stok bahan di gudang habis.
- **Notifikasi Suara (*Audio Chime*):** Memberikan peringatan suara otomatis saat tiket pesanan baru masuk ke dapur maupun saat pesanan siap diambil kasir.

---

## 🛠️ Tech Stack

- **Backend:** Laravel 11 (PHP 8.4)
- **Frontend:** React 18, TypeScript, Inertia.js, Tailwind CSS
- **Database:** MySQL 8.0
- **Build Tool:** Vite

---

## 🔒 Keamanan & Privasi

Repositori ini dikonfigurasi dengan aturan `.gitignore` yang ketat untuk melindungi berkas environment (`.env`), kunci kriptografi, konfigurasi backend, skema migrasi internal, serta dokumen internal agar tetap aman dan tidak terpublikasi secara terbuka.

---

<p align="center">
  <strong>Bean & Bite</strong> — Built for <strong>Monera Coffee</strong>
</p>
