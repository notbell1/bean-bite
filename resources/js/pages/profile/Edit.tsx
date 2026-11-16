import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    User,
    Users,
    Mail,
    Phone,
    Lock,
    Shield,
    ShoppingBag,
    Coffee,
    ChefHat,
    Flame,
    KeyRound,
    Sparkles,
    Store,
    Clock,
    TrendingUp,
    Receipt,
    Wallet,
    Volume2,
    VolumeX,
    ArrowLeft,
    Layers,
    Save,
    CircleDollarSign,
    CheckCircle2,
    SlidersHorizontal,
    Activity,
    UserCog,
    Camera,
    Trash2,
    AlertCircle,
    Package,
    ClipboardList,
    Ticket,
} from 'lucide-react';
import { Button, Badge, showToast } from '@/components/ui';
import { DashboardLayout, NavGroup } from '@/components/layout';

interface ProfileData {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    role: 'pemilik' | 'admin_kasir' | 'barista_koki';
    avatar?: string | null;
    avatar_url?: string;
    created_at: string;
    last_login_at: string;
}

interface AuditItem {
    id: number;
    action: string;
    time_ago: string;
    ip_address: string;
}

interface RoleContext {
    super_admin_count?: number;
    active_shift?: {
        id: number;
        shift_name: string;
        opened_at: string;
        start_cash_formatted: string;
    } | null;
}

interface Props {
    profile: ProfileData;
    recent_logs: AuditItem[];
    role_context: RoleContext;
}

export default function ProfileEdit({ profile, recent_logs, role_context }: Props) {
    const { store } = usePage().props as any;

    const [name, setName] = useState(profile.name || '');
    const [email, setEmail] = useState(profile.email || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State Pengelolaan Foto Profil (Avatar) & Validasi
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
    const [removeAvatar, setRemoveAvatar] = useState<boolean>(false);
    const [photoError, setPhotoError] = useState<string>('');

    // Handler Pemilihan File Foto Profil dengan Validasi Format & MIME serta Batas Maksimal
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setPhotoError('');

        if (!file) {
            return;
        }

        // 1. Validasi Ekstensi dan MIME Type (Hanya JPEG, PNG, JPG, WEBP)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(fileExt)) {
            setPhotoError('Format file tidak didukung! Format yang diperbolehkan: JPG, JPEG, PNG, atau WEBP.');
            e.target.value = '';
            return;
        }

        // 2. Validasi Batas Maksimal Ukuran File (2MB = 2 * 1024 * 1024 bytes)
        const maxSizeBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
            setPhotoError(`Ukuran foto terlalu besar (${sizeInMb} MB). Batas maksimum file adalah 2 MB (2048 KB).`);
            e.target.value = '';
            return;
        }

        // File valid: simpan ke state dan generate preview lokal
        setAvatarFile(file);
        setRemoveAvatar(false);
        setAvatarPreview(URL.createObjectURL(file));
        showToast('Foto profil valid dan siap disimpan.', 'info');
    };

    // Handler Hapus Foto Profil
    const handleRemovePhoto = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(true);
        setPhotoError('');
        showToast('Foto profil akan dihapus dan diganti avatar default saat formulir disimpan.', 'info');
    };

    // Preferensi Suara Audio Alert untuk Barista / Koki KDS (Konsisten antara SSR & Client)
    const [kdsSoundEnabled, setKdsSoundEnabled] = useState<boolean>(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('monera_kds_sound');
            if (saved !== null) {
                setKdsSoundEnabled(saved !== 'false');
            }
        } catch {
            // Abaikan kegagalan akses storage
        }
    }, []);

    const handleToggleSound = () => {
        const next = !kdsSoundEnabled;
        setKdsSoundEnabled(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('monera_kds_sound', String(next));
        }
        showToast(
            next ? 'Audio alert lonceng KDS diaktifkan.' : 'Audio alert lonceng KDS dinonaktifkan.',
            'info',
            2000
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const emailChanged = email.trim().toLowerCase() !== (profile.email || '').toLowerCase();
        const passwordChanged = newPassword.trim().length > 0;

        if ((emailChanged || passwordChanged) && !currentPassword) {
            setErrors({
                current_password: 'Kata sandi saat ini wajib diisi untuk otorisasi perubahan email atau kata sandi baru.',
            });
            return;
        }

        if (passwordChanged && newPassword !== newPasswordConfirmation) {
            setErrors({
                new_password_confirmation: 'Konfirmasi kata sandi baru tidak cocok.',
            });
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone || '');
        if (currentPassword) formData.append('current_password', currentPassword);
        if (newPassword) formData.append('new_password', newPassword);
        if (newPasswordConfirmation) formData.append('new_password_confirmation', newPasswordConfirmation);
        if (avatarFile) formData.append('avatar', avatarFile);
        if (removeAvatar) formData.append('remove_avatar', '1');

        router.post(
            '/profile',
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setNewPasswordConfirmation('');
                    setAvatarFile(null);
                    setRemoveAvatar(false);
                    showToast('Profil dan foto akun Anda berhasil diperbarui!', 'success');
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrors(errs);
                    const firstErr = Object.values(errs)[0];
                    if (firstErr) {
                        showToast(String(firstErr), 'error');
                    }
                },
            }
        );
    };

    // Role-Adaptive Sidebar Navigation Groups (Sinkron 100% dengan Menu di Seluruh Dashboard Role)
    const roleNavGroups: NavGroup[] = React.useMemo(() => {
        if (profile.role === 'pemilik') {
            return [
                {
                    title: 'Menu Utama',
                    items: [
                        {
                            id: 'overview',
                            label: 'Ringkasan Eksekutif',
                            icon: <TrendingUp className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=overview',
                        },
                        {
                            id: 'menus',
                            label: 'Katalog Menu Kafe',
                            icon: <Coffee className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=menus',
                        },
                        {
                            id: 'users',
                            label: 'Kelola Pengguna',
                            icon: <Users className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=users',
                        },
                        {
                            id: 'inventory',
                            label: 'Inventaris & Stok',
                            icon: <Package className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=inventory',
                        },
                        {
                            id: 'mutations',
                            label: 'Riwayat Mutasi & Opname',
                            icon: <ClipboardList className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=mutations',
                        },
                        {
                            id: 'finance',
                            label: 'Laba Rugi & Finansial',
                            icon: <Wallet className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=finance',
                        },
                        {
                            id: 'settings',
                            label: 'Pengaturan Toko',
                            icon: <Store className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=settings',
                        },
                        {
                            id: 'audit',
                            label: 'Audit Log Keamanan',
                            icon: <Shield className="w-4 h-4 text-crema-500" />,
                            href: '/super/dashboard?tab=audit',
                        },
                    ],
                },
            ];
        }

        if (profile.role === 'admin_kasir') {
            return [
                {
                    title: 'Menu Kasir',
                    items: [
                        {
                            id: 'catalog',
                            label: 'Katalog Menu',
                            icon: <Coffee className="w-4 h-4 text-crema-500" />,
                            href: '/admin/dashboard?tab=catalog',
                        },
                        {
                            id: 'cart',
                            label: 'Keranjang Pesanan',
                            icon: <ShoppingBag className="w-4 h-4 text-crema-500" />,
                            href: '/admin/dashboard?tab=cart',
                        },
                        {
                            id: 'open-bills',
                            label: 'Pesanan Open Bill',
                            icon: <Clock className="w-4 h-4 text-crema-500" />,
                            href: '/admin/dashboard?tab=open-bills',
                        },
                        {
                            id: 'history',
                            label: 'Riwayat & Void',
                            icon: <Receipt className="w-4 h-4 text-crema-500" />,
                            href: '/admin/dashboard?tab=history',
                        },
                        {
                            id: 'shift',
                            label: 'Shift Kasir',
                            icon: <CircleDollarSign className="w-4 h-4 text-crema-500" />,
                            href: '/admin/dashboard?tab=shift',
                        },
                    ],
                },
            ];
        }

        // Barista / Koki (Dapur KDS)
        return [
            {
                title: 'Antrean Dapur',
                items: [
                    {
                        id: 'station-all',
                        label: 'Semua Antrean',
                        icon: <Layers className="w-4 h-4 text-crema-500" />,
                        href: '/staff/dashboard?tab=all',
                    },
                    {
                        id: 'station-barista',
                        label: 'Barista (Kopi & Minuman)',
                        icon: <Coffee className="w-4 h-4 text-crema-500" />,
                        href: '/staff/dashboard?tab=barista',
                    },
                    {
                        id: 'station-koki',
                        label: 'Koki (Makanan & Pastry)',
                        icon: <Flame className="w-4 h-4 text-crema-500" />,
                        href: '/staff/dashboard?tab=koki',
                    },
                    {
                        id: 'menu-sold-out',
                        label: 'Kelola Menu Sold Out',
                        icon: <SlidersHorizontal className="w-4 h-4 text-crema-500" />,
                        href: '/staff/dashboard?tab=sold_out',
                    },
                ],
            },
        ];
    }, [profile.role]);

    const returnPortalHref =
        profile.role === 'pemilik'
            ? '/super/dashboard'
            : profile.role === 'admin_kasir'
            ? '/admin/dashboard'
            : '/staff/dashboard';

    const returnPortalLabel =
        profile.role === 'pemilik'
            ? 'Kembali ke Dashboard'
            : profile.role === 'admin_kasir'
            ? 'Kembali ke Terminal POS'
            : 'Kembali ke Layar KDS';

    const headerRightControls = (
        <Link
            href={returnPortalHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-coffee-100 hover:bg-coffee-200 text-coffee-800 transition"
        >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{returnPortalLabel}</span>
            <span className="sm:hidden">Kembali</span>
        </Link>
    );

    const roleDisplayName =
        profile.role === 'pemilik'
            ? 'Pemilik (Super Admin)'
            : profile.role === 'admin_kasir'
            ? 'Admin Kasir (Point of Sale)'
            : 'Barista & Koki (Kitchen Display System)';

    const roleBadgeVariant =
        profile.role === 'pemilik'
            ? 'coffee'
            : profile.role === 'admin_kasir'
            ? 'crema'
            : 'matcha';

    return (
        <DashboardLayout
            title="Pengaturan Profil & Akun"
            subtitle="Konfigurasi data pribadi, keamanan, dan preferensi kerja operasional"
            storeName={store?.store_name ?? 'Monera Coffee'}
            tagline={store?.tagline ?? 'Powered by Bean & Bite'}
            navGroups={roleNavGroups}
            headerRight={headerRightControls}
        >
            <div className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full">
                {/* 1. HERO PROFILE CARD */}
                <div className="p-5 sm:p-7 rounded-3xl bg-white border border-coffee-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="flex items-center gap-4 sm:gap-5 z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-coffee-950 text-crema-400 flex items-center justify-center font-black text-xl sm:text-2xl border-2 border-crema-500/40 shadow-sm flex-shrink-0 overflow-hidden">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{profile.name ? profile.name.slice(0, 2).toUpperCase() : 'MB'}</span>
                            )}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-extrabold text-coffee-950 truncate">
                                    {profile.name}
                                </h2>
                                <Badge variant={roleBadgeVariant} size="sm">
                                    {roleDisplayName}
                                </Badge>
                            </div>
                            <p className="text-xs text-coffee-600 font-mono">
                                @{profile.username} • ID #{profile.id}
                            </p>
                            <p className="text-[11px] text-coffee-500 flex items-center gap-2">
                                <span>Terdaftar: <strong>{profile.created_at}</strong></span>
                                <span>•</span>
                                <span>Login Terakhir: <strong>{profile.last_login_at}</strong></span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 z-10 self-start md:self-auto">
                        <Link
                            href={returnPortalHref}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-coffee-900 text-white hover:bg-coffee-800 shadow-xs transition"
                        >
                            <span>Buka Portal Kerja</span>
                        </Link>
                    </div>

                    {/* Subtle Brand Watermark Background */}
                    <div className="absolute right-0 top-0 bottom-0 opacity-5 pointer-events-none flex items-center pr-6">
                        <UserCog className="w-48 h-48 text-coffee-900" />
                    </div>
                </div>

                {/* 2. MAIN GRID FORM & OPERATIONAL PANELS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* LEFT / CENTER: PROFILE & CREDENTIALS FORM (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-3xl bg-white border border-coffee-200 shadow-xs space-y-6">
                            {/* PENGATURAN FOTO PROFIL DENGAN VALIDASI & PREVIEW */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-coffee-50/70 border border-coffee-200 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-coffee-950 overflow-hidden flex items-center justify-center font-black text-lg sm:text-xl text-crema-400 border border-coffee-300 shadow-2xs flex-shrink-0">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Preview Foto"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{profile.name ? profile.name.slice(0, 2).toUpperCase() : 'MB'}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-1.5">
                                                <Camera className="w-3.5 h-3.5 text-crema-600" />
                                                <span>Foto Profil Akun</span>
                                            </p>
                                            <p className="text-[11px] text-coffee-500">
                                                Format: JPG, JPEG, PNG, WEBP • Batas Maksimal: 2 MB
                                            </p>
                                            {avatarFile && (
                                                <p className="text-[11px] text-matcha-700 font-semibold mt-0.5 truncate">
                                                    File: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
                                                </p>
                                            )}
                                            {removeAvatar && !avatarFile && (
                                                <p className="text-[11px] text-berry-600 font-semibold mt-0.5">
                                                    Foto profil akan dihapus saat disimpan.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <label
                                            htmlFor="avatar-file-input"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-crema-600 hover:bg-crema-700 text-white shadow-2xs cursor-pointer transition select-none"
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                            <span>{avatarPreview ? 'Ganti Foto' : 'Unggah Foto'}</span>
                                            <input
                                                id="avatar-file-input"
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                onChange={handleFileChange}
                                                className="sr-only"
                                            />
                                        </label>

                                        {(avatarPreview || avatarFile) && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-berry-50 hover:bg-berry-100 text-berry-700 border border-berry-200 transition cursor-pointer"
                                                title="Hapus Foto Profil"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Hapus</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {photoError && (
                                    <div className="p-2.5 rounded-xl bg-berry-50 border border-berry-200 text-berry-800 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-berry-600 flex-shrink-0" />
                                        <span>{photoError}</span>
                                    </div>
                                )}
                                {errors.avatar && (
                                    <div className="p-2.5 rounded-xl bg-berry-50 border border-berry-200 text-berry-800 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-berry-600 flex-shrink-0" />
                                        <span>{errors.avatar}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-b border-coffee-100 pb-3">
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <User className="w-4 h-4 text-crema-600" />
                                    <span>Informasi Data Diri & Kontak</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Perbarui informasi profil yang digunakan dalam sistem kerja Monera Coffee.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Nama Lengkap <span className="text-berry-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nama lengkap Anda"
                                            className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none transition"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-[11px] text-berry-600 mt-1">{errors.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                            Username (ID Unik)
                                        </label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                disabled
                                                value={profile.username}
                                                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl bg-coffee-50 text-coffee-500 font-mono cursor-not-allowed"
                                                title="Username akun dibuat oleh administrator sistem"
                                            />
                                        </div>
                                        <p className="text-[10px] text-coffee-400 mt-1">Username login terkunci permanen.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                            No. WhatsApp / HP
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Contoh: 08123456789"
                                                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none transition"
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-[11px] text-berry-600 mt-1">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Email Akun <span className="text-berry-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@moneracoffee.com"
                                            className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none transition"
                                        />
                                    </div>
                                    <p className="text-[10px] text-coffee-500 mt-1">
                                        * Mengubah email akun mewajibkan konfirmasi kata sandi saat ini.
                                    </p>
                                    {errors.email && (
                                        <p className="text-[11px] text-berry-600 mt-1">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Section Ubah Password */}
                            <div className="pt-4 border-t border-coffee-100 space-y-4">
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-crema-600" />
                                        <span>Ganti Kata Sandi Akun (Opsional)</span>
                                    </h4>
                                    <p className="text-xs text-coffee-500">
                                        Kosongkan bagian ini jika Anda tidak bermaksud memperbarui kata sandi.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                            Kata Sandi Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 8 karakter"
                                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none transition"
                                        />
                                        {errors.new_password && (
                                            <p className="text-[11px] text-berry-600 mt-1">{errors.new_password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                            Ulangi Kata Sandi Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={newPasswordConfirmation}
                                            onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                            placeholder="Ketik ulang kata sandi baru"
                                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none transition"
                                        />
                                        {errors.new_password_confirmation && (
                                            <p className="text-[11px] text-berry-600 mt-1">
                                                {errors.new_password_confirmation}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Verifikasi Keamanan Kata Sandi Saat Ini */}
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
                                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Konfirmasi Kata Sandi Saat Ini</span>
                                </div>
                                <p className="text-[11px] text-amber-900 leading-relaxed">
                                    Wajib dimasukkan jika Anda mengubah <strong>Email Akun</strong> atau <strong>Kata Sandi Baru</strong> demi perlindungan keamanan akun.
                                </p>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi akun Anda saat ini..."
                                    className="w-full px-3.5 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                                />
                                {errors.current_password && (
                                    <p className="text-[11px] text-berry-700 font-semibold mt-1">
                                        {errors.current_password}
                                    </p>
                                )}
                            </div>

                            {/* Tombol Simpan Form */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-coffee-100">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={isSubmitting}
                                    leftIcon={<Save className="w-4 h-4" />}
                                    className="px-6"
                                >
                                    {isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT: ROLE-SPECIFIC PANELS & AUDIT TRAIL (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* PANEL 1: HAK AKSES OPERASIONAL SESUAI PERAN */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-coffee-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
                                <h3 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-crema-600" />
                                    <span>Tanggung Jawab Operasional</span>
                                </h3>
                                <Badge variant={roleBadgeVariant} size="sm">
                                    {profile.role.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>

                            {profile.role === 'pemilik' && (
                                <div className="space-y-3 text-xs text-coffee-700">
                                    <p className="leading-relaxed">
                                        Sebagai <strong>Pemilik Bisnis (Super Admin)</strong>, Anda memiliki kendali penuh atas:
                                    </p>
                                    <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-coffee-600">
                                        <li>Pengawasan omzet gross, margin laba kotor, dan riwayat pesanan riil.</li>
                                        <li>Manajemen staf, reset kata sandi, dan penegakan batas maksimal 2 Super Admin.</li>
                                        <li>Audit log keamanan atas seluruh aktivitas sensitif di toko.</li>
                                        <li>Pintasan terpadu ke terminal kasir dan layar dapur KDS.</li>
                                    </ul>

                                    <div className="p-3 rounded-2xl bg-coffee-50 border border-coffee-200 space-y-1 mt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-coffee-900">Kuota Super Admin:</span>
                                            <span className="font-extrabold text-xs text-crema-700">
                                                {role_context.super_admin_count ?? 1} / 2 Akun
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-coffee-500">
                                            Sistem wajib memiliki minimal 1 Super Admin dan maksimal 2 Super Admin.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {profile.role === 'admin_kasir' && (
                                <div className="space-y-3 text-xs text-coffee-700">
                                    <p className="leading-relaxed">
                                        Sebagai <strong>Admin Kasir (Point of Sale)</strong>, tanggung jawab operasional Anda meliputi:
                                    </p>
                                    <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-coffee-600">
                                        <li>Buka dan tutup shift kasir fisik dengan perhitungan rekonsiliasi kas.</li>
                                        <li>Pemrosesan pesanan meja (Dine In) dan bungkusan (Take Away).</li>
                                        <li>Manajemen pesanan gantung (Open Bill) hingga pelunasan di kasir.</li>
                                        <li>Pencetakan struk transaksi pelanggan dan pencatatan alasan void.</li>
                                    </ul>

                                    <div className="p-3.5 rounded-2xl bg-coffee-50 border border-coffee-200 space-y-2 mt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-coffee-900">Status Shift Anda:</span>
                                            {role_context.active_shift ? (
                                                <Badge variant="matcha" size="sm">Shift Aktif (OPEN)</Badge>
                                            ) : (
                                                <Badge variant="berry" size="sm">Tutup (Belum Buka)</Badge>
                                            )}
                                        </div>
                                        {role_context.active_shift && (
                                            <p className="text-[11px] text-coffee-600">
                                                {role_context.active_shift.shift_name} • Modal: <strong>{role_context.active_shift.start_cash_formatted}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {profile.role === 'barista_koki' && (
                                <div className="space-y-3 text-xs text-coffee-700">
                                    <p className="leading-relaxed">
                                        Sebagai <strong>Barista & Koki Dapur (KDS)</strong>, tanggung jawab Anda meliputi:
                                    </p>
                                    <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-coffee-600">
                                        <li>Memonitor tiket racikan minuman & masakan real-time dari kasir.</li>
                                        <li>Menandai status pesanan (Sedang Diracik / Selesai Siap Saji).</li>
                                        <li>Mengontrol ketersediaan menu yang habis (Sold Out) langsung dari stasiun kerja.</li>
                                        <li>Menjaga SLA waktu penyajian pesanan pelanggan Monera Coffee.</li>
                                    </ul>

                                    {/* Preferensi Suara Alert KDS */}
                                    <div className="p-3.5 rounded-2xl bg-coffee-50 border border-coffee-200 flex items-center justify-between gap-3 mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-matcha-100 text-matcha-800 flex items-center justify-center flex-shrink-0">
                                                {kdsSoundEnabled ? (
                                                    <Volume2 className="w-4 h-4" />
                                                ) : (
                                                    <VolumeX className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-coffee-950">
                                                    Audio Chime Alert (KDS)
                                                </p>
                                                <p className="text-[10px] text-coffee-500">
                                                    Lonceng otomatis saat pesanan baru masuk
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleToggleSound}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                                                kdsSoundEnabled
                                                    ? 'bg-matcha-600 text-white hover:bg-matcha-700 shadow-xs'
                                                    : 'bg-coffee-200 text-coffee-800 hover:bg-coffee-300'
                                            }`}
                                        >
                                            {kdsSoundEnabled ? 'Aktif' : 'Mati'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PANEL 2: AUDIT LOG AKTIVITAS AKUN ANDA DENGAN TABEL ZEBRA */}
                        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-coffee-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-crema-600" />
                                        <span>Jejak Audit Aktivitas Akun Anda</span>
                                    </h3>
                                    <p className="text-[11px] text-coffee-500">
                                        5 rekaman aktivitas keamanan terakhir akun Anda
                                    </p>
                                </div>
                            </div>

                            {recent_logs.length === 0 ? (
                                <p className="text-xs text-coffee-400 italic py-4 text-center">
                                    Belum ada catatan aktivitas keamanan.
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-coffee-200 scrollbar-thin">
                                    <table className="table-zebra text-xs w-full">
                                        <thead>
                                            <tr>
                                                <th className="py-2.5 px-3">Waktu</th>
                                                <th className="py-2.5 px-3">Aksi / Tindakan</th>
                                                <th className="py-2.5 px-3 text-right">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent_logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td className="py-2.5 px-3 font-mono text-[11px] text-coffee-600 whitespace-nowrap">
                                                        {log.time_ago}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold text-coffee-950">
                                                        {log.action.replace(/_/g, ' ').toUpperCase()}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-coffee-600">
                                                        <code className="bg-coffee-100 text-coffee-700 px-1 py-0.5 rounded">
                                                            {log.ip_address}
                                                        </code>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
