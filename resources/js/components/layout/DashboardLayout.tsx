import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Menu, PanelLeftClose, PanelLeft, Coffee, UserCog } from 'lucide-react';
import Sidebar, { NavGroup } from './Sidebar';

interface DashboardLayoutProps {
    title: string;
    subtitle?: string;
    storeName?: string;
    tagline?: string;
    navGroups: NavGroup[];
    secondaryNav?: NavGroup;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}

export default function DashboardLayout({
    title,
    subtitle,
    storeName = 'Monera Coffee',
    tagline = 'Powered by Bean & Bite',
    navGroups,
    secondaryNav,
    headerRight,
    children,
}: DashboardLayoutProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // 1. Inisialisasi state minimize/collapse konsisten (Mencegah SSR/Client Hydration Mismatch)
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    // Sinkronkan preferensi LocalStorage hanya setelah komponen mounted di browser
    useEffect(() => {
        try {
            const saved = localStorage.getItem('monera_sidebar_collapsed');
            if (saved === 'true') {
                setIsCollapsed(true);
            }
        } catch {
            // Abaikan kegagalan akses storage
        }
    }, []);

    // 2. State drawer mobile
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('monera_sidebar_collapsed', String(next));
            }
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-coffee-50 font-sans text-coffee-950 flex flex-col w-full selection:bg-coffee-200 selection:text-coffee-950">
            <Head title={`${title} — ${storeName}`}>
                <link rel="icon" type="image/png" sizes="192x192" href="/images/icon.png?v=2026" />
                <link rel="icon" type="image/png" sizes="32x32" href="/images/icon.png?v=2026" />
                <link rel="icon" type="image/png" sizes="16x16" href="/images/icon.png?v=2026" />
                <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=2026" />
                <link rel="apple-touch-icon" href="/images/icon.png?v=2026" />
            </Head>

            {/* MODULAR REUSABLE COLLAPSIBLE SIDEBAR (STATIS FIXED DI DESKTOP) */}
            <Sidebar
                storeName={storeName}
                tagline={tagline}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
                navGroups={navGroups}
                secondaryNav={secondaryNav}
            />

            {/* AREA UTAMA DASHBOARD (Offset dinamis persis di samping sidebar statis) */}
            <div
                className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-200 ${
                    isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
                }`}
            >
                {/* TOP HEADER GLOBAL */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-coffee-200 shadow-2xs select-none">
                    <div className="px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
                        {/* Kiri: Hamburger Mobile & Title */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {/* Tombol Hamburger di Layar Mobile */}
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden p-2 rounded-xl text-coffee-700 hover:text-coffee-950 hover:bg-coffee-100 transition cursor-pointer flex-shrink-0"
                                title="Buka Menu Navigasi"
                                aria-label="Buka Menu Navigasi"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {/* Tombol Minimize Sidebar di Layar Desktop */}
                            <button
                                type="button"
                                onClick={toggleCollapse}
                                className="hidden lg:flex p-1.5 rounded-xl text-coffee-600 hover:text-coffee-950 hover:bg-coffee-100 transition cursor-pointer flex-shrink-0"
                                title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
                            >
                                {isCollapsed ? (
                                    <PanelLeft className="w-5 h-5" />
                                ) : (
                                    <PanelLeftClose className="w-5 h-5" />
                                )}
                            </button>

                            {/* Title & Subtitle */}
                            <div className="min-w-0">
                                <h1 className="text-xs sm:text-base font-extrabold text-coffee-950 tracking-tight leading-tight truncate">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-[10px] sm:text-xs text-coffee-500 font-medium truncate hidden xs:block">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Kanan: Custom Controls Slot Sesuai Role (Dropdown Periode, Switcher, Audio, dll) */}
                        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                            {headerRight}

                            {/* Avatar Profil di Header */}
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 p-1 rounded-xl hover:bg-coffee-100 border border-coffee-200 transition cursor-pointer"
                                title="Pengaturan Profil & Akun"
                                aria-label="Pengaturan Profil"
                            >
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-coffee-200 border border-coffee-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-coffee-800">
                                    {user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{user?.name?.slice(0, 2).toUpperCase() ?? 'MB'}</span>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* KONTEN UTAMA */}
                <main className="flex-1 w-full min-w-0 overflow-x-clip">
                    {children}
                </main>
            </div>
        </div>
    );
}
