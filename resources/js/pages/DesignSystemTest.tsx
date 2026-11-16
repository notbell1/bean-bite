import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Coffee,
    Search,
    Lock,
    Mail,
    Bell,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    HelpCircle,
    FileText,
    Sparkles,
    User,
    ChefHat,
    Shield,
    Trash2,
    RefreshCw,
    SlidersHorizontal,
} from 'lucide-react';
import {
    Button,
    Input,
    Dropdown,
    Pagination,
    Badge,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    promptVoidOrder,
} from '@/components/ui';

export default function DesignSystemTest() {
    // State Sandbox Dropdown
    const [selectedCategory, setSelectedCategory] = useState<string | number>('espresso');
    const [selectedRole, setSelectedRole] = useState<string | number>('admin_kasir');

    // State Sandbox Pagination
    const [currentPage, setCurrentPage] = useState<number>(14);
    const [totalPages, setTotalPages] = useState<number>(20);

    // State Sandbox Input & Button
    const [isLoadingBtn, setIsLoadingBtn] = useState<boolean>(false);
    const [testInput, setTestInput] = useState<string>('');
    const [testPassword, setTestPassword] = useState<string>('Rahasia123!');
    const [showErrors, setShowErrors] = useState<boolean>(false);

    // State Sandbox Void Result
    const [lastVoidReason, setLastVoidReason] = useState<string | null>(null);

    // Opsi Dropdown Kategori
    const categoryOptions = [
        {
            value: 'espresso',
            label: 'Espresso Based',
            description: 'Kopi konsentrat tinggi (Latte, Cappuccino, Americano)',
            badge: 'Barista',
            icon: <Coffee className="w-4 h-4" />,
        },
        {
            value: 'manual-brew',
            label: 'Manual Brew (V60 & Aeropress)',
            description: 'Single origin Arabika Gayo & Flores Bajawa',
            badge: 'Barista',
            icon: <Sparkles className="w-4 h-4" />,
        },
        {
            value: 'tea-artisan',
            label: 'Artisan Tea & Matcha',
            description: 'Green tea, Earl Grey, Chamomile herbal',
            badge: 'Barista',
            icon: <Bell className="w-4 h-4" />,
        },
        {
            value: 'pastry',
            label: 'Bakery & Pastry',
            description: 'Butter croissant, Pain au Chocolat dipanggang fresh',
            badge: 'Koki',
            icon: <ChefHat className="w-4 h-4" />,
        },
        {
            value: 'main-course',
            label: 'Main Course & Kitchen',
            description: 'Pasta, Rice Bowl, Sandwiches gurih hangat',
            badge: 'Koki',
            icon: <ChefHat className="w-4 h-4" />,
        },
    ];

    // Opsi Dropdown Role
    const roleOptions = [
        {
            value: 'pemilik',
            label: 'Pemilik (Super Admin)',
            description: 'Akses laporan keuangan, audit logs, & user control',
            icon: <Shield className="w-4 h-4 text-coffee-800" />,
        },
        {
            value: 'admin_kasir',
            label: 'Admin / Kasir (Front Office)',
            description: 'Layanan POS, Open Bill, shift kas, & cetak struk',
            icon: <User className="w-4 h-4 text-crema-600" />,
        },
        {
            value: 'barista_koki',
            label: 'Barista & Koki (Dapur / KDS)',
            description: 'Layar antrean pesanan FIFO & SLA timer produksi',
            icon: <ChefHat className="w-4 h-4 text-matcha-600" />,
        },
    ];

    // Handler Void Order
    const handleTestVoid = async () => {
        const reason = await promptVoidOrder('BB-20261114-001');
        if (reason) {
            setLastVoidReason(reason);
            showToast('Order #BB-20261114-001 berhasil dibatalkan!', 'success');
        }
    };

    // Handler Konfirmasi
    const handleTestConfirm = async (isDanger: boolean) => {
        const confirmed = await showConfirm({
            title: isDanger ? 'Tutup Shift Kasir?' : 'Simpan Perubahan Menu?',
            text: isDanger
                ? 'Semua transaksi shift ini akan dikunci dan laporan Z-Report akan dicetak.'
                : 'Data harga jual dan estimasi HPP bahan akan segera diperbarui.',
            confirmButtonText: isDanger ? 'Ya, Tutup Shift' : 'Ya, Simpan',
            isDanger,
        });

        if (confirmed) {
            showToast(isDanger ? 'Shift berhasil ditutup!' : 'Perubahan tersimpan!', 'success');
        }
    };

    return (
        <div className="min-h-screen bg-coffee-50 text-coffee-950 font-sans pb-20">
            <Head title="Testing Template Desain Global — Bean & Bite">
                <link rel="icon" type="image/png" href="/images/icon.png?v=icon-2026" />
                <link rel="shortcut icon" href="/favicon.ico?v=icon-2026" />
                <link rel="apple-touch-icon" href="/images/icon.png?v=icon-2026" />
            </Head>

            {/* Top Navbar */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-coffee-200 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-coffee-900 flex items-center justify-center text-white shadow-md shadow-coffee-900/20">
                            <Coffee className="w-6 h-6 text-crema-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-coffee-900">
                                    Monera Coffee
                                </h1>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-800 border border-coffee-200">
                                    Powered by Bean & Bite
                                </span>
                            </div>
                            <p className="text-xs text-coffee-600 font-medium hidden sm:block">
                                Brewing Passion, Serving Warmth • Smart Cafe Management System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={() => window.location.reload()}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Sparkles className="w-3.5 h-3.5 text-crema-500" />}
                            onClick={() => showToast('Komponen Desain Siap Diuji!', 'success')}
                        >
                            Test Toast
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
                {/* Hero Banner */}
                <section className="bg-gradient-to-r from-coffee-900 via-coffee-800 to-coffee-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-coffee-900/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
                        <Coffee className="w-96 h-96 -mr-20 -mt-10" />
                    </div>
                    <div className="relative z-10 max-w-2xl space-y-3">
                        <Badge variant="crema" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                            Live Component Testing Sandbox
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Verifikasi Visual & Interaktif Template Global
                        </h2>
                        <p className="text-coffee-200 text-sm sm:text-base leading-relaxed">
                            Halaman ini memvalidasi integrasi <strong>Google Font Plus Jakarta Sans</strong>, palet warna <em>soft tapi tajam</em>, <strong>Custom Dropdown</strong> dengan pencarian, <strong>Custom SweetAlert2</strong>, dan tombol <strong>Pagination dinamis</strong>.
                        </p>
                    </div>
                </section>

                {/* 1. Palette Warna & Tipografi */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-coffee-100 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-coffee-800" />
                                1. Palet Warna Resmi ("Soft tapi Tajam")
                            </h3>
                            <p className="text-xs text-coffee-500 mt-0.5">
                                Harmoni warna warm milk, roasted espresso, crema amber, matcha, dan terracotta berry.
                            </p>
                        </div>
                        <span className="text-xs font-mono bg-coffee-50 text-coffee-700 px-3 py-1 rounded-xl border border-coffee-200 font-semibold">
                            font-family: 'Plus Jakarta Sans', sans-serif
                        </span>
                    </div>

                    {/* Color Swatches Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#FBF9F5] border border-coffee-200 shadow-inner" />
                            <p className="text-xs font-bold text-coffee-900">coffee-50</p>
                            <p className="text-[11px] font-mono text-coffee-500">#FBF9F5</p>
                            <span className="text-[10px] text-coffee-600 block">Soft Canvas</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#F5EFEB] border border-coffee-200" />
                            <p className="text-xs font-bold text-coffee-900">coffee-100</p>
                            <p className="text-[11px] font-mono text-coffee-500">#F5EFEB</p>
                            <span className="text-[10px] text-coffee-600 block">Card Surface</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#EADBC8] border border-coffee-200" />
                            <p className="text-xs font-bold text-coffee-900">coffee-200</p>
                            <p className="text-[11px] font-mono text-coffee-500">#EADBC8</p>
                            <span className="text-[10px] text-coffee-600 block">Soft Border</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#A8763E]" />
                            <p className="text-xs font-bold text-coffee-900">coffee-500</p>
                            <p className="text-[11px] font-mono text-coffee-500">#A8763E</p>
                            <span className="text-[10px] text-coffee-600 block">Caramel Mid</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#4B270C]" />
                            <p className="text-xs font-bold text-coffee-900">coffee-800</p>
                            <p className="text-[11px] font-mono text-coffee-500">#4B270C</p>
                            <span className="text-[10px] text-coffee-600 block">Espresso Tone</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-coffee-200 bg-coffee-50">
                            <div className="h-12 rounded-xl bg-[#291506] shadow-sm shadow-coffee-900/30" />
                            <p className="text-xs font-bold text-coffee-900">coffee-900</p>
                            <p className="text-[11px] font-mono text-coffee-500">#291506</p>
                            <span className="text-[10px] text-coffee-600 block">Primary Dark</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-crema-200 bg-crema-50/50">
                            <div className="h-12 rounded-xl bg-[#D97706]" />
                            <p className="text-xs font-bold text-crema-800">crema-600</p>
                            <p className="text-[11px] font-mono text-crema-700">#D97706</p>
                            <span className="text-[10px] text-crema-700 block">Amber Highlight</span>
                        </div>

                        <div className="space-y-1.5 p-2 rounded-2xl border border-matcha-200 bg-matcha-50/50">
                            <div className="h-12 rounded-xl bg-[#16A34A]" />
                            <p className="text-xs font-bold text-matcha-700">matcha-600</p>
                            <p className="text-[11px] font-mono text-matcha-700">#16A34A</p>
                            <span className="text-[10px] text-matcha-700 block">Success Green</span>
                        </div>
                    </div>
                </section>

                {/* 2. Custom Dropdown Showcase */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-6">
                    <div className="border-b border-coffee-100 pb-4">
                        <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-crema-600" />
                            2. Dropdown Custom Styling (Searchable & Categorized)
                        </h3>
                        <p className="text-xs text-coffee-500 mt-0.5">
                            Dilengkapi filter pencarian real-time, lencana badge, status terpilih, dan transisi halus.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dropdown 1: Kategori Menu dengan Search */}
                        <div className="space-y-3 p-5 rounded-2xl bg-coffee-50/60 border border-coffee-200">
                            <Dropdown
                                label="Kategori Menu (Dengan Pencarian)"
                                placeholder="Pilih kategori menu cafe..."
                                options={categoryOptions}
                                value={selectedCategory}
                                onChange={(val) => setSelectedCategory(val)}
                                searchable={true}
                            />
                            <div className="text-xs text-coffee-600 bg-white p-3 rounded-xl border border-coffee-200 flex items-center justify-between">
                                <span>Nilai Aktif Terpilih:</span>
                                <code className="font-bold text-coffee-900 bg-coffee-100 px-2 py-0.5 rounded-md">
                                    {String(selectedCategory)}
                                </code>
                            </div>
                        </div>

                        {/* Dropdown 2: Hak Akses Role */}
                        <div className="space-y-3 p-5 rounded-2xl bg-coffee-50/60 border border-coffee-200">
                            <Dropdown
                                label="Pilih Role Akun Staf"
                                placeholder="Pilih peran pengguna..."
                                options={roleOptions}
                                value={selectedRole}
                                onChange={(val) => setSelectedRole(val)}
                                searchable={false}
                            />
                            <div className="text-xs text-coffee-600 bg-white p-3 rounded-xl border border-coffee-200 flex items-center justify-between">
                                <span>Nilai Aktif Terpilih:</span>
                                <code className="font-bold text-coffee-900 bg-coffee-100 px-2 py-0.5 rounded-md">
                                    {String(selectedRole)}
                                </code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Global Pagination Showcase */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-coffee-100 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-coffee-900" />
                                3. Tombol Pagination Global (Kompak & Pola Konsisten)
                            </h3>
                            <p className="text-xs text-coffee-500 mt-0.5">
                                Pola: &lt; 1 2 3 4 .. 20 &gt; &nbsp;|&nbsp; &lt; 1 .. 13 14 15 .. 20 &gt; &nbsp;|&nbsp; &lt; 1 .. 17 18 19 20 &gt;
                            </p>
                        </div>

                        {/* Slider Simulasi Total Halaman */}
                        <div className="flex items-center gap-3 bg-coffee-50 px-4 py-2 rounded-2xl border border-coffee-200">
                            <SlidersHorizontal className="w-4 h-4 text-coffee-600" />
                            <span className="text-xs font-semibold text-coffee-800">
                                Total Hal: {totalPages}
                            </span>
                            <input
                                type="range"
                                min="3"
                                max="20"
                                value={totalPages}
                                onChange={(e) => setTotalPages(Number(e.target.value))}
                                className="w-24 accent-coffee-900 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Live Pagination Sandbox */}
                    <div className="p-6 bg-coffee-50/50 rounded-2xl border border-coffee-200 space-y-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalPages * 10}
                            itemsPerPage={10}
                            showSummary={true}
                            onPageChange={(page) => setCurrentPage(page)}
                        />

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-coffee-200/60 text-xs text-coffee-600">
                            <span>Simulasi Pola Halaman:</span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(2)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-coffee-200 font-semibold hover:bg-coffee-100"
                            >
                                &lt; 1 2 3 4 .. 20 &gt; (Hal 2)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(14)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-coffee-200 font-semibold hover:bg-coffee-100"
                            >
                                &lt; 1 .. 13 14 15 .. 20 &gt; (Hal 14)
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(19)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-coffee-200 font-semibold hover:bg-coffee-100"
                            >
                                &lt; 1 .. 17 18 19 20 &gt; (Hal 19)
                            </button>
                        </div>
                    </div>
                </section>

                {/* 4. SweetAlert2 Theme Sandbox */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-6">
                    <div className="border-b border-coffee-100 pb-4">
                        <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-matcha-600" />
                            4. SweetAlert2 Custom Theme & Dialog Modals
                        </h3>
                        <p className="text-xs text-coffee-500 mt-0.5">
                            Gaya popup disesuaikan dengan estetika Bean & Bite (font Plus Jakarta Sans, soft cream card, tombol espresso).
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Bell className="w-3.5 h-3.5 text-crema-600" />}
                            onClick={() => showToast('Pesanan #BB-002 masuk ke Barista!', 'success')}
                        >
                            Toast Alert
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-matcha-500" />}
                            onClick={() =>
                                showSuccess(
                                    'Shift Kasir Dibuka',
                                    'Modal awal sebesar Rp 300.000 telah tercatat di sistem.'
                                )
                            }
                        >
                            Alert Sukses
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-crema-600" />}
                            onClick={() =>
                                showWarning(
                                    'Stok Menipis!',
                                    'Bahan Fresh Milk UHT tersisa 1.500 ml (di bawah ambang minimum).'
                                )
                            }
                        >
                            Peringatan
                        </Button>

                        <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() =>
                                showError(
                                    'Printer Error',
                                    'Gagal mencetak struk thermal. Periksa kertas printer kasir!'
                                )
                            }
                        >
                            Alert Error
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<HelpCircle className="w-3.5 h-3.5 text-coffee-700" />}
                            onClick={() => handleTestConfirm(false)}
                        >
                            Konfirmasi
                        </Button>

                        <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={handleTestVoid}
                        >
                            Void Order
                        </Button>
                    </div>

                    {lastVoidReason && (
                        <div className="p-4 bg-berry-50 border border-berry-200 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-berry-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-berry-800 space-y-1">
                                <p className="font-bold">
                                    Hasil Pengujian Form Void Order (#BB-20261114-001):
                                </p>
                                <p className="italic bg-white/70 p-2 rounded-lg border border-berry-200/60">
                                    "{lastVoidReason}"
                                </p>
                                <p className="text-[11px] text-berry-700">
                                    Alasan ini secara otomatis dicatat ke tabel <code>audit_logs</code> bersama ID kasir.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* 5. Komponen Form Input & Buttons */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-coffee-100 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-berry-600" />
                                5. Form Input & Variasi Tombol Action
                            </h3>
                            <p className="text-xs text-coffee-500 mt-0.5">
                                Mendukung prefix icon, toggle show/hide password, state loading, dan error handling.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowErrors(!showErrors)}
                        >
                            {showErrors ? 'Sembunyikan Error' : 'Simulasi State Error'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Username / Email"
                            placeholder="e.g. kasir / kasir@beanbite.com"
                            leftIcon={<Mail className="w-4 h-4" />}
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            error={showErrors ? 'Format email tidak valid atau sudah terdaftar' : undefined}
                            helperText="Digunakan untuk login staf operasional"
                        />

                        <Input
                            label="Password"
                            placeholder="Masukkan kata sandi..."
                            leftIcon={<Lock className="w-4 h-4" />}
                            isPassword={true}
                            value={testPassword}
                            onChange={(e) => setTestPassword(e.target.value)}
                            error={showErrors ? 'Password wajib minimal 8 karakter' : undefined}
                            helperText="Klik ikon mata untuk melihat/menyembunyikan"
                        />

                        <Input
                            label="Nomor Meja (Dine-in)"
                            placeholder="e.g. Meja 04"
                            leftIcon={<FileText className="w-4 h-4" />}
                            defaultValue="Meja 08"
                            helperText="Kosongkan jika pesanan Take Away"
                        />
                    </div>

                    {/* Button Variations */}
                    <div className="pt-4 border-t border-coffee-100 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-coffee-700">
                            Variasi Gaya Tombol (Button):
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="primary">Primary (Espresso)</Button>
                            <Button variant="secondary">Secondary (Latte)</Button>
                            <Button variant="accent">Accent (Caramel)</Button>
                            <Button variant="danger">Danger (Berry)</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost Button</Button>
                            <Button
                                variant="primary"
                                isLoading={isLoadingBtn}
                                onClick={() => {
                                    setIsLoadingBtn(true);
                                    setTimeout(() => setIsLoadingBtn(false), 2000);
                                }}
                            >
                                {isLoadingBtn ? 'Memproses' : 'Klik Toggle Loading'}
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 6. Badges & Status Indicators */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200 shadow-xs space-y-4">
                    <h3 className="text-lg font-bold text-coffee-900 flex items-center gap-2 border-b border-coffee-100 pb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-coffee-500" />
                        6. Status Badges (Role, Order, & Payment)
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="coffee" icon={<Shield className="w-3 h-3" />}>
                            Role: Pemilik (Super Admin)
                        </Badge>
                        <Badge variant="crema" icon={<User className="w-3 h-3" />}>
                            Role: Admin / Kasir
                        </Badge>
                        <Badge variant="matcha" icon={<ChefHat className="w-3 h-3" />}>
                            Role: Barista & Koki
                        </Badge>
                        <Badge variant="matcha" icon={<CheckCircle2 className="w-3 h-3" />}>
                            Payment: Paid (Lunas)
                        </Badge>
                        <Badge variant="crema" icon={<AlertTriangle className="w-3 h-3" />}>
                            Order: Open Bill
                        </Badge>
                        <Badge variant="berry" icon={<XCircle className="w-3 h-3" />}>
                            Order: Cancelled / Void
                        </Badge>
                    </div>
                </section>
            </main>
        </div>
    );
}
