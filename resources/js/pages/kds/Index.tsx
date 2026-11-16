import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Coffee,
    Clock,
    Flame,
    CheckCircle2,
    RotateCcw,
    Volume2,
    VolumeX,
    RefreshCw,
    AlertTriangle,
    Check,
    Layers,
    SlidersHorizontal,
    X,
    Sparkles,
    Search,
    ShoppingBag,
    Package,
} from 'lucide-react';
import { Badge, Dropdown, DropdownOption, showToast } from '@/components/ui';
import { DashboardLayout, NavGroup } from '@/components/layout';

interface KdsItem {
    id: number;
    name: string;
    variant: string | null;
    quantity: number;
    notes: string | null;
    production_status: 'waiting' | 'in_progress' | 'ready';
    item_target: 'barista' | 'koki';
}

interface KdsOrder {
    id: number;
    order_number: string;
    customer_name: string;
    table_number: string;
    order_type: 'dine_in' | 'take_away';
    is_open_bill: boolean;
    order_status: string;
    promo_code?: string | null;
    promo_name?: string | null;
    discount_amount?: number;
    created_at_time: string;
    time_formatted: string;
    sla_status: 'ON TIME' | 'WARNING' | 'OVERDUE';
    sla_color: 'matcha' | 'crema' | 'berry';
    elapsed_seconds: number;
    items: KdsItem[];
}

interface MenuItemQuick {
    id: number;
    name: string;
    category_name?: string;
    production_target?: 'barista' | 'koki';
    base_price?: number;
    image?: string | null;
    is_available: boolean;
    is_manually_disabled?: boolean;
    is_stock_depleted?: boolean;
    depleted_ingredients?: string[];
}

interface Props {
    store?: {
        store_name: string;
        tagline: string;
    };
    active_tab?: string;
    active_station?: string;
    orders: KdsOrder[];
    batch_summary: Record<string, number>;
    menus: MenuItemQuick[];
}

export default function KdsIndex({
    store,
    active_tab,
    active_station,
    orders = [],
    menus = [],
}: Props) {
    // --- 1. Client-Side Instant Tab Switching (tab=all | barista | koki | sold_out) ---
    const resolveInitialTab = (): 'all' | 'barista' | 'koki' | 'sold_out' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('tab') || params.get('station');
            if (t === 'barista' || t === 'koki' || t === 'sold_out') return t;
        }
        const fallback = active_tab || active_station;
        if (fallback === 'barista' || fallback === 'koki' || fallback === 'sold_out') {
            return fallback;
        }
        return 'all';
    };

    const [activeTab, setActiveTab] = useState<'all' | 'barista' | 'koki' | 'sold_out'>(resolveInitialTab);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [currentTime, setCurrentTime] = useState<string>('');

    // --- State Filter di View Kelola Menu Sold Out ---
    const [soldOutSearch, setSoldOutSearch] = useState('');
    const [soldOutStationFilter, setSoldOutStationFilter] = useState<'all' | 'barista' | 'koki'>('all');
    const [soldOutStatusFilter, setSoldOutStatusFilter] = useState<'all' | 'available' | 'sold_out' | 'depleted'>('all');

    // Dynamic timer counter
    const [, setTick] = useState<number>(0);

    // Sinkronisasi Tab saat URL berubah (e.g. Browser Back / Forward)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('tab') || params.get('station');
            if (t === 'barista' || t === 'koki' || t === 'sold_out' || t === 'all') {
                setActiveTab(t as any);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Live Clock & Polling Tick
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }) + ' WIB'
            );
        };
        updateClock();
        const clockInterval = setInterval(updateClock, 1000);
        const tickInterval = setInterval(() => setTick((t) => t + 1), 5000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(tickInterval);
        };
    }, []);

    // Instant Tab Switching Function (Zero loading, zero delay, updates URL silently)
    const handleTabChange = (tab: 'all' | 'barista' | 'koki' | 'sold_out') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            url.searchParams.delete('station');
            url.searchParams.delete('drawer');
            window.history.replaceState({}, '', url.toString());
        }
    };

    // --- 2. Dinamis: Filter Pesanan & Rekap Racikan Sesuai Tab Aktif Secara Reaktif ---
    const displayOrders = useMemo(() => {
        if (activeTab === 'all') return orders;
        if (activeTab === 'barista') {
            return orders
                .filter((o) => o.items.some((it) => it.item_target === 'barista'))
                .map((o) => ({
                    ...o,
                    items: o.items.filter((it) => it.item_target === 'barista'),
                }));
        }
        if (activeTab === 'koki') {
            return orders
                .filter((o) => o.items.some((it) => it.item_target === 'koki'))
                .map((o) => ({
                    ...o,
                    items: o.items.filter((it) => it.item_target === 'koki'),
                }));
        }
        return orders;
    }, [orders, activeTab]);

    // Dinamis: Rekap Batch Racikan Aktif
    const displayBatchSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        displayOrders.forEach((ord) => {
            ord.items.forEach((it) => {
                if (it.production_status !== 'ready') {
                    summary[it.name] = (summary[it.name] ?? 0) + it.quantity;
                }
            });
        });
        return Object.fromEntries(
            Object.entries(summary).sort(([, a], [, b]) => b - a)
        );
    }, [displayOrders]);

    // Dinamis: Kalkulasi Badge Count untuk 4 Menu
    const dynamicCounts = useMemo(() => {
        const baristaOrdersCount = orders.filter((o) =>
            o.items.some((it) => it.item_target === 'barista')
        ).length;
        const kokiOrdersCount = orders.filter((o) =>
            o.items.some((it) => it.item_target === 'koki')
        ).length;
        const soldOutCount = menus.filter((m) => !m.is_available).length;
        const availableCount = menus.filter((m) => m.is_available).length;
        const depletedStockCount = menus.filter((m) => m.is_stock_depleted).length;

        return {
            all: orders.length,
            barista: baristaOrdersCount,
            koki: kokiOrdersCount,
            sold_out: soldOutCount,
            available: availableCount,
            depleted_stock: depletedStockCount,
            total_menus: menus.length,
        };
    }, [orders, menus]);

    // Refresh Manual Antrean KDS
    const handleRefresh = () => {
        router.reload({
            only: ['orders', 'menus'],
            onSuccess: () => showToast('Data KDS berhasil disinkronkan', 'info', 1500),
        });
    };

    // Update Status Item (Mulai Racik / Siap Saji)
    const handleUpdateItemStatus = (itemId: number, newStatus: 'in_progress' | 'ready') => {
        router.patch(
            `/staff/items/${itemId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (newStatus === 'ready') {
                        showToast('Item siap disajikan!', 'success', 1500);
                    }
                },
            }
        );
    };

    // Undo Status Item
    const handleUndoItem = (itemId: number) => {
        router.patch(
            `/staff/items/${itemId}/undo`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    showToast('Status item dikembalikan ke proses racik.', 'info', 1500);
                },
            }
        );
    };

    // Toggle Sold Out Menu
    const handleToggleMenu = (menuId: number) => {
        router.patch(
            `/staff/menus/${menuId}/toggle`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    showToast('Status ketersediaan menu diperbarui!', 'success', 1500);
                },
            }
        );
    };

    // Format SLA Timer Rapi (Mencegah tampilan anomali e.g. 1198M 05S)
    const formatSlaTimer = (seconds: number) => {
        const totalMinutes = Math.floor(seconds / 60);
        const remSecs = seconds % 60;
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return `${hours}j ${mins}m`;
        }
        return `${totalMinutes}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;
    };

    // Opsi Dropdown Filter Ketersediaan Menu
    const soldOutStatusOptions: DropdownOption[] = [
        { value: 'all', label: 'Semua Status Ketersediaan' },
        { value: 'available', label: 'Hanya Menu Tersedia', badge: 'Tersedia' },
        { value: 'sold_out', label: 'Hanya Menu Sold Out', badge: 'Habis' },
        { value: 'depleted', label: 'Terkendala Bahan Gudang', badge: 'Stok Habis' },
    ];

    // Filter Menu di View Sold Out
    const filteredQuickMenus = useMemo(() => {
        return menus.filter((m) => {
            const query = soldOutSearch.toLowerCase().trim();
            const matchesSearch =
                !query ||
                m.name.toLowerCase().includes(query) ||
                (m.category_name && m.category_name.toLowerCase().includes(query));

            const matchesStation =
                soldOutStationFilter === 'all' ||
                m.production_target === soldOutStationFilter;

            const matchesStatus =
                soldOutStatusFilter === 'all' ||
                (soldOutStatusFilter === 'available' && m.is_available) ||
                (soldOutStatusFilter === 'sold_out' && !m.is_available) ||
                (soldOutStatusFilter === 'depleted' && m.is_stock_depleted);

            return matchesSearch && matchesStation && matchesStatus;
        });
    }, [menus, soldOutSearch, soldOutStationFilter, soldOutStatusFilter]);

    // Data 4 Menu Utama KDS (Dinamis, Informatif & Responsif)
    const stationNavItems = [
        {
            id: 'station-all',
            value: 'all' as const,
            label: 'Semua Antrean',
            shortLabel: 'Semua',
            icon: <Layers className="w-4 h-4" />,
            badge: dynamicCounts.all,
            badgeVariant: 'matcha' as const,
        },
        {
            id: 'station-barista',
            value: 'barista' as const,
            label: 'Barista (Kopi & Minuman)',
            shortLabel: 'Barista',
            icon: <Coffee className="w-4 h-4" />,
            badge: dynamicCounts.barista,
            badgeVariant: dynamicCounts.barista > 0 ? ('crema' as const) : ('coffee' as const),
        },
        {
            id: 'station-koki',
            value: 'koki' as const,
            label: 'Koki (Makanan & Pastry)',
            shortLabel: 'Koki',
            icon: <Flame className="w-4 h-4" />,
            badge: dynamicCounts.koki,
            badgeVariant: dynamicCounts.koki > 0 ? ('crema' as const) : ('coffee' as const),
        },
        {
            id: 'station-sold-out',
            value: 'sold_out' as const,
            label: 'Kelola Menu Sold Out',
            shortLabel: 'Menu Sold Out',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            badge: dynamicCounts.sold_out > 0 ? `${dynamicCounts.sold_out} Habis` : 'Tersedia',
            badgeVariant: dynamicCounts.sold_out > 0 ? ('berry' as const) : ('matcha' as const),
        },
    ];

    // Konfigurasi Navigasi Sidebar Dapur KDS (Instan Tanpa Loading)
    const kdsNavGroups: NavGroup[] = [
        {
            title: 'Stasiun Dapur & Bar',
            items: [
                {
                    id: 'station-all',
                    label: 'Semua Antrean',
                    icon: <Layers className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'all',
                    badge: dynamicCounts.all,
                    badgeVariant: 'matcha',
                    onClick: () => handleTabChange('all'),
                },
                {
                    id: 'station-barista',
                    label: 'Barista (Kopi & Minuman)',
                    icon: <Coffee className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'barista',
                    badge: dynamicCounts.barista,
                    badgeVariant: dynamicCounts.barista > 0 ? 'crema' : 'coffee',
                    onClick: () => handleTabChange('barista'),
                },
                {
                    id: 'station-koki',
                    label: 'Koki (Makanan & Pastry)',
                    icon: <Flame className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'koki',
                    badge: dynamicCounts.koki,
                    badgeVariant: dynamicCounts.koki > 0 ? 'crema' : 'coffee',
                    onClick: () => handleTabChange('koki'),
                },
                {
                    id: 'menu-sold-out',
                    label: 'Kelola Menu Sold Out',
                    icon: <SlidersHorizontal className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'sold_out',
                    badge: dynamicCounts.sold_out > 0 ? `${dynamicCounts.sold_out} Habis` : 'Tersedia',
                    badgeVariant: dynamicCounts.sold_out > 0 ? 'berry' : 'matcha',
                    onClick: () => handleTabChange('sold_out'),
                },
            ],
        },
    ];

    // Header Right Controls KDS (Dengan Sound Button Kontras Tinggi & Jelas)
    const kdsHeaderRight = (
        <div className="flex items-center gap-2">
            {/* Live Clock (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-coffee-100 border border-coffee-200 rounded-xl text-xs font-mono font-bold text-coffee-900 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-crema-600" />
                <span>{currentTime || '00:00:00 WIB'}</span>
            </div>

            {/* Sound Toggle (High Contrast & Sesuai Tema Light Header) */}
            <button
                type="button"
                onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    showToast(
                        next ? 'Suara notifikasi KDS diaktifkan' : 'Suara notifikasi KDS dinonaktifkan',
                        'info',
                        1500
                    );
                }}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95 ${
                    soundEnabled
                        ? 'bg-crema-100 border-crema-300 text-crema-700 hover:bg-crema-200 ring-1 ring-crema-300/40'
                        : 'bg-white border-coffee-200 text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100'
                }`}
                title={
                    soundEnabled
                        ? 'Audio Notifikasi Aktif (Klik untuk Mematikan)'
                        : 'Audio Notifikasi Senyap (Klik untuk Mengaktifkan)'
                }
                aria-label="Toggle Suara Notifikasi"
            >
                {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-crema-700 stroke-[2.5]" />
                ) : (
                    <VolumeX className="w-4 h-4 text-coffee-400 stroke-[2]" />
                )}
            </button>

            {/* Reload Button */}
            <button
                type="button"
                onClick={handleRefresh}
                className="w-8 h-8 bg-white border border-coffee-200 text-coffee-700 hover:text-coffee-950 hover:bg-coffee-100 rounded-xl flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                title="Segarkan Data KDS"
            >
                <RefreshCw className="w-3.5 h-3.5" />
            </button>
        </div>
    );

    return (
        <DashboardLayout
            title="Kitchen Display System (KDS)"
            subtitle="Manajemen antrean pesanan real-time barista & dapur"
            storeName={store?.store_name ?? 'Monera Coffee'}
            tagline={store?.tagline ?? 'Brewing Passion, Serving Warmth'}
            navGroups={kdsNavGroups}
            headerRight={kdsHeaderRight}
        >
            <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-coffee-50/50">
                {/* 4 MENU STASIUN & KONTROL NAVIGASI (INSTAN, DINAMIS, BADGE TERBACA JELAS) */}
                <section className="bg-coffee-950 text-white px-3 sm:px-6 lg:px-8 py-2.5 border-b border-coffee-800 sticky top-14 sm:top-16 z-20 shadow-xs select-none">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                        {/* Horizontal Segmented Tabs: Instant Tab Switching */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
                            {stationNavItems.map((item) => {
                                const isActive = activeTab === item.value;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleTabChange(item.value)}
                                        className={`group flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex-shrink-0 ${
                                            isActive
                                                ? 'bg-crema-500 text-coffee-950 shadow-sm font-black ring-2 ring-crema-400/40'
                                                : 'bg-coffee-900/90 hover:bg-coffee-850 text-coffee-300 hover:text-white border border-coffee-800/80'
                                        }`}
                                    >
                                        <span className={isActive ? 'text-coffee-950' : 'text-crema-400 group-hover:text-crema-300'}>
                                            {item.icon}
                                        </span>
                                        <span className="hidden sm:inline">{item.label}</span>
                                        <span className="sm:hidden">{item.shortLabel}</span>

                                        {/* Badge Angka: Teks Putih Kontras Tinggi Saat Aktif (Anti Hilang) */}
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-black leading-none transition-colors ${
                                                isActive
                                                    ? 'bg-coffee-950 text-white shadow-2xs'
                                                    : item.badgeVariant === 'berry'
                                                    ? 'bg-berry-600 text-white'
                                                    : item.badgeVariant === 'matcha'
                                                    ? 'bg-matcha-600 text-white'
                                                    : 'bg-coffee-800 text-crema-100'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Status Label Dinamis */}
                        <div className="hidden lg:flex items-center gap-2 text-xs text-coffee-300 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-matcha-500 animate-pulse" />
                            <span className="font-medium">
                                {activeTab === 'sold_out'
                                    ? 'Mode Manajemen Ketersediaan Menu'
                                    : 'Antrean Dapur Terhubung Real-Time'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* VIEW 1, 2, 3: ANTREAN TIKET DAPUR (SEMUA, BARISTA, ATAU KOKI) */}
                {activeTab !== 'sold_out' && (
                    <>
                        {/* BATCH REKAP PRODUKSI BANNER */}
                        <section className="bg-white border-b border-coffee-200 px-3 sm:px-6 lg:px-8 py-2.5 select-none shadow-2xs">
                            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                                {/* Header Baris Batch */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-crema-600" />
                                    <span className="text-[11px] sm:text-xs font-extrabold text-coffee-900 uppercase tracking-wide">
                                        Rekap Racikan:
                                    </span>
                                </div>

                                {/* Horizontal Scroll Chips */}
                                <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
                                    {Object.entries(displayBatchSummary).map(([name, qty]) => (
                                        <div
                                            key={name}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-coffee-50 border border-coffee-200 rounded-xl"
                                        >
                                            <span className="w-5 h-5 rounded-md bg-coffee-900 text-white font-black text-[11px] flex items-center justify-center">
                                                {qty}
                                            </span>
                                            <span className="text-xs font-bold text-coffee-900 whitespace-nowrap">
                                                {name}
                                            </span>
                                        </div>
                                    ))}

                                    {Object.keys(displayBatchSummary).length === 0 && (
                                        <span className="text-xs text-coffee-400 italic">
                                            Belum ada racikan aktif yang perlu disiapkan pada stasiun ini.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* MAIN KDS FIFO TICKET GRID (UKURAN KARTU KONSISTEN & RAPI) */}
                        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
                            {/* Grid Konsisten: Tanpa items-start agar seluruh card dalam row memiliki tinggi seragam */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                                {displayOrders.map((order) => {
                                    const elapsedMins = Math.floor(order.elapsed_seconds / 60);
                                    let slaBadgeColor = 'bg-matcha-50 text-matcha-800 border-matcha-200';
                                    let slaLabel = 'ON TIME';

                                    if (elapsedMins >= 10) {
                                        slaBadgeColor =
                                            'bg-berry-50 text-berry-800 border-berry-300 font-extrabold';
                                        slaLabel = 'OVERDUE';
                                    } else if (elapsedMins >= 5) {
                                        slaBadgeColor = 'bg-crema-50 text-crema-900 border-crema-300 font-bold';
                                        slaLabel = 'WARNING';
                                    }

                                    const readyCount = order.items.filter(
                                        (it) => it.production_status === 'ready'
                                    ).length;
                                    const isAllReady = order.items.length > 0 && readyCount === order.items.length;

                                    return (
                                        <div
                                            key={order.id}
                                            className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm h-full min-h-[300px] ${
                                                isAllReady
                                                    ? 'border-matcha-400 ring-2 ring-matcha-400/20'
                                                    : elapsedMins >= 10
                                                    ? 'border-berry-300 ring-2 ring-berry-300/20'
                                                    : 'border-coffee-200'
                                            }`}
                                        >
                                            {/* Ticket Header: Bersih & Terbaca Jelas */}
                                            <div
                                                className={`p-3 sm:p-3.5 border-b space-y-1.5 ${
                                                    elapsedMins >= 10
                                                        ? 'bg-berry-50/60 border-berry-100'
                                                        : 'bg-coffee-50/70 border-coffee-100'
                                                }`}
                                            >
                                                {/* Baris 1: Nomor Pesanan, Open Bill, Promo & SLA */}
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="font-mono font-black text-coffee-950 text-xs sm:text-sm tracking-tight truncate">
                                                            {order.order_number}
                                                        </span>
                                                        {order.is_open_bill && (
                                                            <span className="px-1.5 py-0.5 bg-crema-200 text-crema-900 text-[9px] font-extrabold rounded-md flex-shrink-0">
                                                                Open Bill
                                                            </span>
                                                        )}
                                                        {order.promo_code && (
                                                            <span
                                                                title={`Kupon ${order.promo_code}${order.promo_name ? `: ${order.promo_name}` : ''}`}
                                                                className="px-1.5 py-0.5 bg-matcha-100 text-matcha-900 border border-matcha-200 text-[9px] font-extrabold rounded-md flex-shrink-0 flex items-center gap-0.5"
                                                            >
                                                                🏷️ {order.promo_code}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span
                                                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-extrabold flex-shrink-0 flex items-center gap-1 ${slaBadgeColor}`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                elapsedMins >= 10
                                                                    ? 'bg-berry-600 animate-pulse'
                                                                    : elapsedMins >= 5
                                                                    ? 'bg-crema-600'
                                                                    : 'bg-matcha-600'
                                                            }`}
                                                        />
                                                        {slaLabel} • {formatSlaTimer(order.elapsed_seconds)}
                                                    </span>
                                                </div>

                                                {/* Baris 2: Nomor Meja, Nama Pelanggan & Jam */}
                                                <div className="flex items-center justify-between text-xs pt-0.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-coffee-900 min-w-0">
                                                        <span className="px-2 py-0.5 bg-coffee-200/90 text-coffee-900 rounded-md text-[10px] sm:text-[11px] font-black flex-shrink-0">
                                                            {order.table_number}
                                                        </span>
                                                        <span className="truncate max-w-[130px] text-xs font-bold text-coffee-800">
                                                            {order.customer_name}
                                                        </span>
                                                    </div>
                                                    <span className="text-coffee-500 font-mono text-[10px] sm:text-[11px] font-medium flex-shrink-0">
                                                        {order.created_at_time} WIB
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Items List in Ticket: Compact Horizontal Tiles (Tinggi Rapi & Sejajar) */}
                                            <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-start space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                                                {order.items.map((it) => {
                                                    const isReady = it.production_status === 'ready';
                                                    const isInProgress = it.production_status === 'in_progress';

                                                    return (
                                                        <div
                                                            key={it.id}
                                                            className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                                                                isReady
                                                                    ? 'bg-coffee-50/40 border-coffee-100 opacity-50'
                                                                    : 'bg-white border-coffee-200/90 shadow-2xs'
                                                            }`}
                                                        >
                                                            {/* Kiri: Qty, Nama Menu, Variant, Notes */}
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <span className="w-5.5 h-5.5 rounded-lg bg-coffee-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                                    {it.quantity}x
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <h4
                                                                        className={`text-xs sm:text-sm font-bold leading-tight truncate ${
                                                                            isReady
                                                                                ? 'line-through text-coffee-400'
                                                                                : 'text-coffee-950'
                                                                        }`}
                                                                        title={it.name}
                                                                    >
                                                                        {it.name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                        {it.variant && (
                                                                            <span className="inline-block text-[10px] font-semibold text-crema-800 bg-crema-100 px-1.5 py-0.2 rounded">
                                                                                {it.variant}
                                                                            </span>
                                                                        )}
                                                                        {it.notes && (
                                                                            <span className="text-[10px] text-berry-700 font-semibold italic bg-berry-50 px-1.5 py-0.2 rounded border border-berry-100 truncate max-w-[140px]">
                                                                                "{it.notes}"
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Kanan: Badge Target & Tombol Aksi Sejajar */}
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-coffee-100 text-coffee-700">
                                                                    {it.item_target === 'barista' ? 'Bar' : 'Dapur'}
                                                                </span>

                                                                {isReady ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUndoItem(it.id)}
                                                                        className="px-2 py-1 rounded-lg border border-coffee-200 bg-white text-coffee-600 hover:text-coffee-950 hover:bg-coffee-100 text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
                                                                        title="Kembalikan status item ke proses racik"
                                                                    >
                                                                        <RotateCcw className="w-2.5 h-2.5" />
                                                                        Undo
                                                                    </button>
                                                                ) : isInProgress ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleUpdateItemStatus(it.id, 'ready')
                                                                        }
                                                                        className="px-2.5 py-1 rounded-xl bg-matcha-600 hover:bg-matcha-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs active:scale-95 transition cursor-pointer"
                                                                        title="Tandai item selesai & siap saji"
                                                                    >
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                        Siap
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleUpdateItemStatus(
                                                                                it.id,
                                                                                'in_progress'
                                                                            )
                                                                        }
                                                                        className="px-2.5 py-1 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs active:scale-95 transition cursor-pointer"
                                                                        title="Mulai proses racikan item ini"
                                                                    >
                                                                        <Flame className="w-3 h-3 text-crema-400" />
                                                                        Racik
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Ticket Footer dengan Visual Progress Bar (Selalu Rata Bawah) */}
                                            <div className="p-2.5 sm:p-3 bg-coffee-50/80 border-t border-coffee-100 flex items-center justify-between text-[11px] mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-coffee-600">
                                                        Progres: <strong>{readyCount}</strong> / {order.items.length}
                                                    </span>
                                                    <div className="w-14 sm:w-16 h-1.5 bg-coffee-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-matcha-500 transition-all duration-300"
                                                            style={{
                                                                width: `${
                                                                    order.items.length > 0
                                                                        ? (readyCount / order.items.length) * 100
                                                                        : 0
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {isAllReady ? (
                                                    <Badge variant="matcha" size="sm">
                                                        Siap Saji!
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="coffee" size="sm">
                                                        Diproses
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {displayOrders.length === 0 && (
                                <div className="py-20 sm:py-24 text-center bg-white rounded-3xl border border-coffee-200 shadow-xs max-w-xl mx-auto my-8 sm:my-12 px-4">
                                    <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 mx-auto text-matcha-500 mb-3" />
                                    <h3 className="text-base sm:text-lg font-bold text-coffee-900">
                                        Semua Pesanan Selesai!
                                    </h3>
                                    <p className="text-xs text-coffee-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                        Tidak ada antrean racikan aktif untuk stasiun{' '}
                                        <strong className="text-coffee-800">
                                            {activeTab === 'barista'
                                                ? 'Barista (Bar)'
                                                : activeTab === 'koki'
                                                ? 'Koki (Dapur)'
                                                : 'Dapur'}
                                        </strong>{' '}
                                        saat ini. Pesanan baru dari kasir akan otomatis muncul di sini.
                                    </p>
                                </div>
                            )}
                        </main>
                    </>
                )}

                {/* VIEW 4: KELOLA MENU SOLD OUT (INLINE VIEW PENUH - INSTAN TANPA LOADING & BUKAN POPUP) */}
                {activeTab === 'sold_out' && (
                    <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
                        {/* 1. Header Informasi & Ringkasan Metrik */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-coffee-200 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-coffee-900 text-crema-400 flex items-center justify-center shadow-xs shrink-0">
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-extrabold text-coffee-950">
                                            Kontrol Ketersediaan Menu Dapur & Bar (Sold Out)
                                        </h2>
                                        <p className="text-xs text-coffee-500 mt-0.5">
                                            Atur status menu siap saji atau habis secara langsung. Perubahan langsung tersinkronisasi ke Kasir POS.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-matcha-50 text-matcha-800 border border-matcha-200 text-xs font-bold">
                                        <span className="w-2 h-2 rounded-full bg-matcha-600 animate-pulse" />
                                        Sinkron Real-Time POS
                                    </span>
                                </div>
                            </div>

                            {/* 4 Kartu KPI Ringkasan Status Menu */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t border-coffee-100">
                                <div className="bg-coffee-50/70 p-3 sm:p-4 rounded-2xl border border-coffee-200/70">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-coffee-500">
                                        Total Menu Terdaftar
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-lg sm:text-xl font-extrabold text-coffee-950">
                                            {dynamicCounts.total_menus}
                                        </p>
                                        <ShoppingBag className="w-4 h-4 text-coffee-400" />
                                    </div>
                                    <p className="text-[10px] text-coffee-500 mt-0.5">Katalog menu cafe</p>
                                </div>

                                <div className="bg-matcha-50/50 p-3 sm:p-4 rounded-2xl border border-matcha-200/70">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-matcha-800">
                                        Siap Saji (Tersedia)
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-lg sm:text-xl font-extrabold text-matcha-900">
                                            {dynamicCounts.available}
                                        </p>
                                        <CheckCircle2 className="w-4 h-4 text-matcha-600" />
                                    </div>
                                    <p className="text-[10px] text-matcha-700 mt-0.5">Dapat dipesan di kasir</p>
                                </div>

                                <div className="bg-berry-50/50 p-3 sm:p-4 rounded-2xl border border-berry-200/70">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-berry-800">
                                        Menu Sold Out
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-lg sm:text-xl font-extrabold text-berry-900">
                                            {dynamicCounts.sold_out}
                                        </p>
                                        <AlertTriangle className="w-4 h-4 text-berry-600" />
                                    </div>
                                    <p className="text-[10px] text-berry-700 mt-0.5">Habis / tidak dapat dipesan</p>
                                </div>

                                <div className="bg-crema-50/70 p-3 sm:p-4 rounded-2xl border border-crema-200/70">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-crema-900">
                                        Stok Bahan Habis
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-lg sm:text-xl font-extrabold text-crema-950">
                                            {dynamicCounts.depleted_stock}
                                        </p>
                                        <Package className="w-4 h-4 text-crema-600" />
                                    </div>
                                    <p className="text-[10px] text-crema-800 mt-0.5">Bahan di gudang kosong</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Toolbar Pencarian & Filter */}
                        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-coffee-200 shadow-xs space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                {/* Search Bar */}
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari menu berdasarkan nama atau kategori..."
                                        value={soldOutSearch}
                                        onChange={(e) => setSoldOutSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-coffee-50/70 border border-coffee-200 rounded-xl text-xs sm:text-sm text-coffee-950 placeholder-coffee-400 focus:bg-white focus:outline-none focus:border-coffee-500 h-[38px] transition"
                                    />
                                    {soldOutSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setSoldOutSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Station Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setSoldOutStationFilter('all')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                                            soldOutStationFilter === 'all'
                                                ? 'bg-coffee-900 text-white shadow-2xs'
                                                : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
                                        }`}
                                    >
                                        Semua Stasiun
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSoldOutStationFilter('barista')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
                                            soldOutStationFilter === 'barista'
                                                ? 'bg-coffee-900 text-white shadow-2xs'
                                                : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
                                        }`}
                                    >
                                        <Coffee className="w-3 h-3 text-crema-400" />
                                        Barista (Bar)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSoldOutStationFilter('koki')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
                                            soldOutStationFilter === 'koki'
                                                ? 'bg-coffee-900 text-white shadow-2xs'
                                                : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
                                        }`}
                                    >
                                        <Flame className="w-3 h-3 text-crema-400" />
                                        Koki (Dapur)
                                    </button>
                                </div>

                                {/* Status Filter Dropdown */}
                                <div className="w-full md:w-56 flex-shrink-0">
                                    <Dropdown
                                        size="sm"
                                        options={soldOutStatusOptions}
                                        value={soldOutStatusFilter}
                                        onChange={(val) => setSoldOutStatusFilter(val as any)}
                                        placeholder="Filter Ketersediaan..."
                                        triggerClassName="bg-coffee-50 border-coffee-200 h-[38px] text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Info Filter Aktif & Reset */}
                            {(soldOutSearch || soldOutStationFilter !== 'all' || soldOutStatusFilter !== 'all') && (
                                <div className="flex items-center justify-between text-xs text-coffee-600 pt-1 border-t border-coffee-100">
                                    <span>
                                        Menampilkan <strong>{filteredQuickMenus.length}</strong> dari{' '}
                                        {menus.length} menu
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSoldOutSearch('');
                                            setSoldOutStationFilter('all');
                                            setSoldOutStatusFilter('all');
                                        }}
                                        className="text-crema-800 hover:text-coffee-950 font-bold underline cursor-pointer"
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 3. Grid Menu Cards (Touch-Friendly & Rapi) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                            {filteredQuickMenus.map((m) => {
                                const isAvailable = m.is_available;
                                const isDepleted = m.is_stock_depleted;

                                return (
                                    <div
                                        key={m.id}
                                        className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs ${
                                            !isAvailable
                                                ? 'border-berry-300 bg-berry-50/15 ring-1 ring-berry-200/50'
                                                : 'border-coffee-200 hover:border-coffee-300 hover:shadow-xs'
                                        }`}
                                    >
                                        {/* Card Top: Badges & Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-coffee-100 text-coffee-800 text-[10px] font-bold">
                                                    {m.production_target === 'barista' ? (
                                                        <>
                                                            <Coffee className="w-3 h-3 text-crema-600" />
                                                            Bar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Flame className="w-3 h-3 text-crema-600" />
                                                            Dapur
                                                        </>
                                                    )}
                                                </span>

                                                {/* Status Pill */}
                                                {isAvailable ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-matcha-50 text-matcha-700 border border-matcha-200 text-[10px] font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-matcha-600" />
                                                        Tersedia
                                                    </span>
                                                ) : isDepleted ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-berry-100 text-berry-800 border border-berry-300 text-[10px] font-extrabold">
                                                        <AlertTriangle className="w-3 h-3 text-berry-600" />
                                                        Stok Habis
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-berry-50 text-berry-700 border border-berry-200 text-[10px] font-bold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-berry-600" />
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>

                                            {/* Menu Details */}
                                            <div>
                                                <h3 className="font-extrabold text-coffee-950 text-sm leading-snug">
                                                    {m.name}
                                                </h3>
                                                <p className="text-[11px] text-coffee-500 font-medium mt-0.5">
                                                    {m.category_name ?? 'Kategori Umum'}
                                                </p>
                                                {m.base_price !== undefined && (
                                                    <p className="text-xs font-bold text-coffee-900 mt-1">
                                                        Rp {m.base_price.toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Peringatan Stok Gudang Kosong */}
                                            {isDepleted && m.depleted_ingredients && m.depleted_ingredients.length > 0 && (
                                                <div className="p-2 rounded-xl bg-berry-50 border border-berry-200 text-[11px] text-berry-800 font-semibold space-y-0.5">
                                                    <div className="flex items-center gap-1 font-bold text-berry-900">
                                                        <AlertTriangle className="w-3 h-3 text-berry-600 flex-shrink-0" />
                                                        Bahan Gudang Habis:
                                                    </div>
                                                    <p className="text-[10px] text-berry-700 pl-4">
                                                        {m.depleted_ingredients.join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Bottom: Big Touch-Friendly Toggle Switch */}
                                        <div className="pt-3 mt-3 border-t border-coffee-100/80 flex items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-coffee-900">
                                                    {isDepleted
                                                        ? 'Stok Kosong'
                                                        : isAvailable
                                                        ? 'Menu Tersedia'
                                                        : 'Menu Sold Out'}
                                                </span>
                                                <span className="text-[10px] text-coffee-500 font-medium">
                                                    {isDepleted
                                                        ? 'Gudang habis'
                                                        : isAvailable
                                                        ? 'Siap dipesan di kasir'
                                                        : 'Nonaktif di POS'}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleMenu(m.id)}
                                                disabled={isDepleted}
                                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coffee-400 focus:ring-offset-1 select-none ${
                                                    isDepleted
                                                        ? 'bg-coffee-200 cursor-not-allowed opacity-60'
                                                        : isAvailable
                                                        ? 'bg-matcha-600 hover:bg-matcha-700'
                                                        : 'bg-berry-600 hover:bg-berry-700'
                                                }`}
                                                title={
                                                    isDepleted
                                                        ? 'Bahan di gudang habis. Perbarui stok bahan terlebih dahulu.'
                                                        : isAvailable
                                                        ? 'Klik untuk mengubah menjadi Sold Out'
                                                        : 'Klik untuk mengubah menjadi Tersedia'
                                                }
                                            >
                                                <span
                                                    className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                                                        isAvailable ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                >
                                                    {isAvailable ? (
                                                        <Check className="w-3.5 h-3.5 text-matcha-600 stroke-[3]" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-berry-600 stroke-[3]" />
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {filteredQuickMenus.length === 0 && (
                            <div className="py-16 text-center bg-white rounded-3xl border border-coffee-200 shadow-xs max-w-md mx-auto p-6 space-y-3">
                                <Search className="w-10 h-10 mx-auto text-coffee-400" />
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950">
                                    Tidak Ada Menu yang Cocok
                                </h3>
                                <p className="text-xs text-coffee-500 leading-relaxed">
                                    Tidak ditemukan menu yang sesuai dengan kata kunci "<strong>{soldOutSearch}</strong>" atau filter stasiun yang dipilih.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSoldOutSearch('');
                                        setSoldOutStationFilter('all');
                                        setSoldOutStatusFilter('all');
                                    }}
                                    className="px-4 py-2 bg-coffee-900 text-white text-xs font-bold rounded-xl hover:bg-coffee-800 transition cursor-pointer"
                                >
                                    Reset Semua Filter
                                </button>
                            </div>
                        )}
                    </main>
                )}
            </div>
        </DashboardLayout>
    );
}
