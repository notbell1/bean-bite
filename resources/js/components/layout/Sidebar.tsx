import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Coffee,
    TrendingUp,
    Users,
    Shield,
    ShoppingBag,
    Clock,
    Receipt,
    ChefHat,
    Flame,
    SlidersHorizontal,
    LogOut,
    X,
    ArrowUpRight,
    CircleDollarSign,
    Layers,
    UserCog,
    Settings,
} from 'lucide-react';
import { Badge, showConfirm } from '@/components/ui';
import { MoneraLogoIcon } from '@/components/ui/Logo';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    badge?: string | number;
    badgeVariant?: 'matcha' | 'crema' | 'berry' | 'coffee';
    onClick?: () => void;
    active?: boolean;
}

export interface NavGroup {
    title?: string;
    items: NavItem[];
}

interface SidebarProps {
    storeName?: string;
    tagline?: string;
    isCollapsed: boolean;
    onToggleCollapse?: () => void;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    navGroups: NavGroup[];
    secondaryNav?: NavGroup;
    onOpenProfile?: () => void;
}

export default function Sidebar({
    storeName = 'Monera Coffee',
    tagline = 'Powered by Bean & Bite',
    isCollapsed,
    onToggleCollapse,
    mobileOpen,
    onCloseMobile,
    navGroups,
    secondaryNav,
    onOpenProfile,
}: SidebarProps) {
    const { url, props } = usePage();
    const auth = (props as any)?.auth;
    const user = auth?.user;
    const isProfilePage = Boolean(url && url.startsWith('/profile'));

    const handleLogout = async () => {
        const confirmed = await showConfirm({
            title: 'Konfirmasi Keluar (Logout)',
            text: 'Sesi aman Anda akan ditutup dan aktivitas dicatat ke audit log.',
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal',
            isDanger: true,
        });

        if (confirmed) {
            router.post('/logout');
        }
    };

    const roleLabel =
        user?.role === 'pemilik'
            ? 'Super Admin • Pemilik'
            : user?.role === 'admin_kasir'
            ? 'Kasir Point of Sale'
            : 'Barista & Koki Dapur';

    const renderNavItems = (items: NavItem[]) => {
        return items.map((item) => {
            const content = (
                <div
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative select-none cursor-pointer ${
                        item.active
                            ? 'bg-crema-600 text-white shadow-xs font-bold'
                            : 'text-coffee-300 hover:bg-coffee-900/70 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                >
                    <span className="flex-shrink-0">{item.icon}</span>

                    {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge !== undefined && (
                                <span
                                    className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                        item.badgeVariant === 'berry'
                                            ? 'bg-berry-600 text-white'
                                            : item.badgeVariant === 'matcha'
                                            ? 'bg-matcha-600 text-white'
                                            : item.active
                                            ? 'bg-white text-coffee-950'
                                            : 'bg-coffee-800 text-coffee-200'
                                    }`}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            );

            if (item.href) {
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        onClick={onCloseMobile}
                        className="block"
                        title={isCollapsed ? item.label : undefined}
                    >
                        {content}
                    </Link>
                );
            }

            return (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                        item.onClick?.();
                        onCloseMobile();
                    }}
                    className="w-full text-left"
                    title={isCollapsed ? item.label : undefined}
                >
                    {content}
                </button>
            );
        });
    };

    const sidebarBody = (
        <div className="h-full flex flex-col justify-between text-white select-none overflow-x-hidden overflow-y-hidden">
            {/* 1. Top Brand & Controls (Permanen Statis di Atas) */}
            <div className={`flex-shrink-0 border-b border-coffee-800/80 bg-coffee-950 ${isCollapsed ? 'p-2.5' : 'p-3.5 sm:p-4'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img
                            src="/images/icon.png"
                            alt="Monera Coffee • Bean & Bite"
                            className="w-9 h-9 rounded-xl shadow-xs flex-shrink-0 object-contain hover:scale-105 transition-transform"
                        />
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <h2 className="text-sm font-extrabold tracking-tight text-white leading-tight truncate">
                                    {storeName}
                                </h2>
                                <p className="text-[10px] text-coffee-400 font-medium truncate">
                                    {tagline}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button (Hanya tampil di drawer layar kecil) */}
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="lg:hidden p-1.5 text-coffee-400 hover:text-white rounded-lg hover:bg-coffee-900 transition cursor-pointer"
                        title="Tutup Menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Middle Navigation Items (Hanya area ini yang scroll jika layar pendek, bebas dari horizontal scrollbar) */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin space-y-4 ${isCollapsed ? 'px-2 py-3' : 'p-3.5 sm:p-4'}`}>
                <nav className="space-y-4">
                    {navGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            {!isCollapsed && group.title && (
                                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-coffee-400">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {renderNavItems(group.items)}
                            </div>
                        </div>
                    ))}

                    {/* Secondary Navigation (e.g. Cross-Portal Links) */}
                    {secondaryNav && (
                        <div className="pt-3 border-t border-coffee-800/80 space-y-1">
                            {!isCollapsed && secondaryNav.title && (
                                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-coffee-400">
                                    {secondaryNav.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {renderNavItems(secondaryNav.items)}
                            </div>
                        </div>
                    )}
                </nav>
            </div>

            {/* 3. Bottom Profile & Logout Box (Permanen Statis di Bawah) */}
            <div className={`flex-shrink-0 border-t border-coffee-800/80 bg-coffee-950 space-y-2 overflow-x-hidden ${isCollapsed ? 'p-2' : 'p-3.5 sm:p-4'}`}>
                {/* User Info Display Card (Tampilan Info Akun & Foto Profil) */}
                <div
                    className={`flex items-center gap-2.5 p-2 rounded-xl bg-coffee-900/60 border border-coffee-800/80 ${
                        isCollapsed ? 'justify-center p-1.5' : ''
                    }`}
                    title={`${user?.name} (${roleLabel})`}
                >
                    <div className="w-8 h-8 rounded-lg bg-crema-600 overflow-hidden flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs border border-crema-500/30">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="text-coffee-950 font-black">
                                {user?.name?.slice(0, 2).toUpperCase() ?? 'MB'}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate leading-tight">
                                {user?.name}
                            </p>
                            <p className="text-[10px] text-crema-400 font-medium truncate">
                                {roleLabel}
                            </p>
                        </div>
                    )}
                </div>

                {/* 1 Tombol Tunggal Pengaturan Profil di Sidebar */}
                <Link
                    href="/profile"
                    onClick={onCloseMobile}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isProfilePage
                            ? 'bg-crema-600 text-white font-bold shadow-xs'
                            : 'text-coffee-300 hover:bg-coffee-900 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title="Pengaturan Profil"
                >
                    <UserCog className="w-4 h-4 flex-shrink-0 text-crema-400" />
                    {!isCollapsed && <span>Pengaturan Profil</span>}
                </Link>

                {/* Tombol Logout */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-berry-300 hover:bg-berry-900/30 hover:text-berry-200 transition cursor-pointer ${
                        isCollapsed ? 'justify-center px-0' : ''
                    }`}
                    title={isCollapsed ? 'Keluar (Logout)' : undefined}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span>Keluar (Logout)</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* 1. Mobile Drawer Backdrop */}
            <div
                className={`fixed inset-0 bg-coffee-950/70 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-200 ${
                    mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onCloseMobile}
                aria-hidden="true"
            />

            {/* 2. Mobile Slide-Over Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-coffee-950 z-50 lg:hidden shadow-2xl transform transition-transform duration-200 ease-in-out ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarBody}
            </aside>

            {/* 3. Desktop Fixed Static Sidebar (Permanen Terkunci di Layar, Bebas dari Efek Scroll) */}
            <aside
                className={`hidden lg:flex flex-col bg-coffee-950 border-r border-coffee-800 fixed inset-y-0 left-0 h-screen transition-all duration-200 z-40 flex-shrink-0 overflow-x-hidden ${
                    isCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                {sidebarBody}
            </aside>
        </>
    );
}
