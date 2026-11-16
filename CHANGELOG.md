# Changelog

Seluruh perubahan penting pada aplikasi **Bean & Bite (Monera Coffee Management System)** didokumentasikan pada file ini.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), dan versi proyek mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-16

### Added
- **Super Admin Hub (8 Modul Tab Terpadu):** Ringkasan bisnis *real-time*, manajemen pengguna (*Super Admin*), katalog menu & resep HPP, inventaris bahan baku, riwayat mutasi stok, laporan keuangan, pengaturan toko, serta *audit logs*.
- **Manajemen Voucher & Kupon Diskon:** Fitur tambah kupon diskon (persentase atau nominal tetap), batas minimal belanja, saklar status aktif/nonaktif yang tersinkronisasi langsung ke kasir POS, serta paginasi tabel maksimal 5 data per halaman.
- **Pencatatan Nama Kasir Shift:** Input nama petugas kasir yang sedang berjaga saat membuka shift dan pencetakannya pada struk thermal (58mm / 80mm).
- **KDS 4 Stasiun Kerja Instan (*Zero Loading*):** Perpindahan tab instan antar *Semua Antrean*, *Barista (Minuman)*, *Koki (Makanan)*, dan *Kelola Menu Sold Out*.
- **Panel Kelola Menu Sold Out Inline:** Pengaturan ketersediaan menu secara langsung tanpa modal *popup*, dilengkapi 4 kartu KPI stok, pencarian, filter stasiun, serta proteksi penguncian otomatis apabila stok bahan baku di gudang habis.
- **Notifikasi Suara (*Audio Chime*):** Peringatan audio otomatis saat tiket pesanan masuk ke KDS dan saat pesanan siap diambil di kasir, dilengkapi tombol kontrol audio di *header*.

### Changed & Improved
- **Tata Letak Kartu Antrean KDS:** Menyeragamkan tinggi kartu tiket antrean, menyejajarkan baris item dengan tombol aksi (*Racik / Siap / Undo*), dan merapikan footer progres item.
- **Kontras Warna & Tipografi:** Memperbaiki definisi palet warna kustom (`crema-300`, `crema-400`), meningkatkan kontras ikon suara pada header KDS, serta memastikan angka *badge* pada tab aktif terlihat tajam.
- **Presisi Komponen Toggle Switch:** Memperbaiki dimensi dan *padding* pada tombol switch *Sold Out* agar lingkaran indikator tetap berada rapi di dalam *container*.
- **Responsivitas Sidebar & Halaman Profil:** Menghilangkan *horizontal scrollbar* pada sidebar saat mode *minimize* serta memastikan seluruh menu navigasi tetap tampil konsisten ketika berada di halaman pengaturan profil.
- **Konfigurasi Keamanan Repositori:** Memperketat `.gitignore` untuk memblokir berkas sensitif (`.env`, kunci kriptografi, konfigurasi backend, skema database, tes, dokumen internal, serta konfigurasi agen AI).

### Fixed
- Memperbaiki potensi *undefined variable* pada proses penyesuaian stok di panel pemilik (`DashboardController`).
- Membersihkan elemen banner informasi yang berlebihan pada tab pengaturan toko Super Admin agar antarmuka lebih ringkas.

---

## [0.1.0] - 2026-11-14

### Added
- Inisiasi struktur proyek Laravel 11 + React 18 + Inertia.js + Tailwind CSS.
- Implementasi autentikasi multi-peran (*Pemilik*, *Admin/Kasir*, *Barista/Koki*) beserta *Role-Based Access Control (RBAC)*.
- Implementasi modul awal POS Kasir (*Pay First* & *Open Bill*), pemotongan stok bahan baku otomatis berbasis resep, serta layar dasar Bar & Kitchen Display.
