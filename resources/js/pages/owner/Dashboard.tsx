import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Coffee,
    Shield,
    LogOut,
    TrendingUp,
    Users,
    Package,
    AlertTriangle,
    Clock,
    DollarSign,
    CheckCircle2,
    XCircle,
    UserX,
    UserCheck,
    KeyRound,
    Layers,
    FileSpreadsheet,
    Activity,
    ArrowUpRight,
    Search,
    Filter,
    Calendar,
    ChevronDown,
    X,
    ShoppingBag,
    ChefHat,
    Edit3,
    Trash2,
    Lock,
    Mail,
    UserPlus,
    Phone,
    UserCheck2,
    AlertCircle,
    Eye,
    EyeOff,
    UserCog,
    RefreshCw,
    Flame,
    Plus,
    SlidersHorizontal,
    Boxes,
    ArrowDownRight,
    ClipboardList,
    Wallet,
    ArrowDownLeft,
    Receipt,
    Landmark,
    Store,
    Printer,
    MapPin,
    Percent,
    Save,
    Check,
    ImageIcon,
    Tag,
    Ticket,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import {
    Button,
    Badge,
    Dropdown,
    DropdownOption,
    Input,
    Pagination,
    showToast,
    showConfirm,
    promptPasswordConfirm,
} from '@/components/ui';
import { DashboardLayout, NavGroup } from '@/components/layout';

export interface MenuAdminItem {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    base_price: number;
    base_price_formatted: string;
    cost_price: number;
    cost_price_formatted: string;
    is_available: boolean;
    is_active: boolean;
    variants_count: number;
}

interface UserItem {
    id: number;
    name: string;
    username: string;
    email: string;
    role: 'pemilik' | 'admin_kasir' | 'barista_koki';
    phone: string | null;
    avatar_url: string;
    is_active: boolean;
    last_login_at: string;
    created_at: string;
}

export interface IngredientItem {
    id: number;
    name: string;
    unit: string;
    stock: number;
    min_stock: number;
    cost_per_unit: number;
    cost_per_unit_formatted: string;
    total_asset: number;
    total_asset_formatted: string;
    status: 'aman' | 'menipis' | 'habis';
    is_active: boolean;
    recipes_count: number;
    used_in_menus: string[];
}

export interface StockLogItem {
    id: number;
    ingredient_id: number;
    ingredient_name: string;
    unit: string;
    user_name: string;
    type: 'waste' | 'adjustment' | 'in' | 'out';
    quantity: number;
    cost: number;
    cost_formatted: string;
    reference: string | null;
    notes: string | null;
    created_at: string;
    created_at_raw?: string | null;
    time_ago: string;
}

export interface FinancialSummary {
    gross_revenue: number;
    gross_revenue_formatted: string;
    cogs: number;
    cogs_formatted: string;
    gross_profit: number;
    gross_profit_formatted: string;
    gross_margin_percent: number;
    procurement_cost: number;
    procurement_cost_formatted: string;
    waste_expense: number;
    waste_expense_formatted: string;
    total_expense: number;
    total_expense_formatted: string;
    net_cash_flow: number;
    net_cash_flow_formatted: string;
    is_surplus: boolean;
    period_revenue_formatted: string;
    period_expense_formatted: string;
    period_procurement_formatted: string;
    period_waste_formatted: string;
    period_net_cash_flow_formatted: string;
    period_is_surplus: boolean;
}

export interface FinancialLedgerItem {
    id: string;
    type: 'income' | 'expense' | 'waste';
    category: string;
    title: string;
    description: string;
    amount: number;
    amount_formatted: string;
    cogs: number | null;
    cogs_formatted: string | null;
    user_name: string;
    created_at: string;
    created_at_raw?: string | null;
    time_ago: string;
}

export interface PromoItem {
    id: number;
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_value_formatted: string;
    min_order_amount: number;
    min_order_amount_formatted: string;
    max_discount_amount: number | null;
    max_discount_amount_formatted: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    users: UserItem[];
    ingredients?: IngredientItem[];
    stock_logs?: StockLogItem[];
    financial_summary?: FinancialSummary;
    financial_ledger?: FinancialLedgerItem[];
    kpi: {
        omzet_gross: string;
        laba_kotor: string;
        profit_margin: number;
        total_orders: number;
        active_open_bills: number;
        critical_stock_count: number;
        total_ingredients?: number;
        total_inventory_asset_formatted?: string;
        critical_count?: number;
        out_of_stock_count?: number;
        total_waste_cost_formatted?: string;
        total_waste_count?: number;
        total_adjustment_count?: number;
        total_restock_count?: number;
    };
    critical_ingredients: Array<{
        id: number;
        name: string;
        unit: string;
        stock: number;
        min_stock: number;
    }>;
    active_shift: {
        id: number;
        shift_name: string;
        kasir_name: string;
        kasir_avatar_url?: string;
        start_cash_formatted: string;
        expected_cash_formatted: string;
        opened_at: string;
        status: string;
    } | null;
    hourly_sales: Array<{
        hour: string;
        orders: number;
        revenue_formatted?: string;
    }>;
    peak_hour?: string;
    top_menus: Array<{
        name: string;
        sold: number;
        cost_formatted: string;
        margin_percent: number;
    }>;
    recent_audit_logs: Array<{
        id: number;
        action: string;
        user_name: string;
        ip_address: string;
        time_ago: string;
    }>;
    categories?: Array<{
        id: number;
        name: string;
        slug: string;
        production_target: string;
        menus_count?: number;
    }>;
    menus?: MenuAdminItem[];
    promos?: PromoItem[];
    store?: {
        id?: number;
        store_name: string;
        tagline: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        logo: string | null;
        tax_percentage: number;
        service_charge_percentage: number;
        receipt_footer: string | null;
        is_open: boolean;
    };
}

export default function OwnerDashboard({
    users,
    categories = [],
    menus = [],
    promos = [],
    ingredients = [],
    stock_logs = [],
    financial_summary,
    financial_ledger = [],
    kpi,
    critical_ingredients,
    active_shift,
    hourly_sales,
    top_menus,
    recent_audit_logs,
    peak_hour,
    store,
}: Props) {
    const { url, props } = usePage();
    const auth = (props as any)?.auth;
    const currentUser = auth?.user;

    const urlParams = useMemo(() => {
        if (!url) return new URLSearchParams();
        const qIdx = url.indexOf('?');
        return qIdx !== -1 ? new URLSearchParams(url.slice(qIdx)) : new URLSearchParams();
    }, [url]);

    const initialTab = (urlParams.get('tab') as 'overview' | 'users' | 'menus' | 'inventory' | 'mutations' | 'finance' | 'settings' | 'audit') || 'overview';
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'menus' | 'inventory' | 'mutations' | 'finance' | 'settings' | 'audit'>(
        initialTab === 'users' || initialTab === 'menus' || initialTab === 'audit' || initialTab === 'inventory' || initialTab === 'mutations' || initialTab === 'finance' || initialTab === 'settings' ? initialTab : 'overview'
    );

    const [selectedPeriod, setSelectedPeriod] = useState<string>(
        urlParams.get('period') || 'today'
    );

    // Real-time Polling & Live Database Sync State
    const [autoSync, setAutoSync] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>('');

    // Inisialisasi waktu sinkronisasi hanya setelah komponen mounted di browser
    useEffect(() => {
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, []);

    // Auto-polling live update dari database setiap 6 detik
    useEffect(() => {
        if (!autoSync) return;

        const interval = setInterval(() => {
            router.reload({
                only: ['kpi', 'hourly_sales', 'top_menus', 'critical_ingredients', 'active_shift', 'recent_audit_logs', 'users', 'ingredients', 'stock_logs'],
                onStart: () => setIsRefreshing(true),
                onFinish: () => {
                    setIsRefreshing(false);
                    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                },
            });
        }, 6000);

        return () => clearInterval(interval);
    }, [autoSync]);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => {
                setIsRefreshing(false);
                setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                showToast('Data dashboard disinkronkan langsung dari database.', 'success', 2000);
            },
        });
    };

    const handleTabChange = (tab: 'overview' | 'users' | 'menus' | 'inventory' | 'mutations' | 'finance' | 'settings' | 'audit') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handlePeriodChange = (val: string) => {
        setSelectedPeriod(val);
        router.get(
            `/super/dashboard?tab=${activeTab}&period=${val}`,
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    useEffect(() => {
        const syncTabFromUrl = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const tab = params.get('tab');
                if (tab === 'users' || tab === 'menus' || tab === 'audit' || tab === 'overview' || tab === 'inventory' || tab === 'mutations' || tab === 'finance' || tab === 'settings') {
                    setActiveTab(tab);
                }
            }
        };

        window.addEventListener('popstate', syncTabFromUrl);
        return () => window.removeEventListener('popstate', syncTabFromUrl);
    }, []);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

    // Filter Pengguna di Tab Users
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
    const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

    // Opsi Dropdown Custom Periode Laporan
    const periodOptions: DropdownOption[] = [
        { value: 'today', label: 'Hari Ini (Real-time Live)', badge: 'Live' },
        { value: 'yesterday', label: 'Kemarin (Shift Selesai)' },
        { value: 'last_7_days', label: '7 Hari Terakhir' },
        { value: 'this_month', label: 'Bulan Ini' },
    ];

    // Opsi Dropdown Custom Filter Role Pengguna
    const roleFilterOptions: DropdownOption[] = [
        { value: 'all', label: 'Semua Peran (All Roles)' },
        { value: 'pemilik', label: 'Pemilik (Super Admin)', badge: 'Super Admin' },
        { value: 'admin_kasir', label: 'Admin / Kasir' },
        { value: 'barista_koki', label: 'Barista & Koki Dapur' },
    ];

    // Opsi Dropdown Custom Filter Status Akun
    const statusFilterOptions: DropdownOption[] = [
        { value: 'all', label: 'Semua Status' },
        { value: 'active', label: 'Hanya Akun Aktif', badge: 'Aktif' },
        { value: 'suspended', label: 'Hanya Akun Ditangguhkan (Suspended)' },
    ];

    // Filter Client-Side untuk Pengguna
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
            const matchesStatus =
                userStatusFilter === 'all' ||
                (userStatusFilter === 'active' && u.is_active) ||
                (userStatusFilter === 'suspended' && !u.is_active);
            const matchesSearch =
                u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
            return matchesRole && matchesStatus && matchesSearch;
        });
    }, [users, userRoleFilter, userStatusFilter, userSearchQuery]);

    // Pagination Pengguna (Max 10 / Page)
    const [userPage, setUserPage] = useState(1);
    const userPageSize = 10;
    const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * userPageSize;
        return filteredUsers.slice(start, start + userPageSize);
    }, [filteredUsers, userPage]);

    useEffect(() => {
        setUserPage(1);
    }, [userSearchQuery, userRoleFilter, userStatusFilter]);

    // Kuota Super Admin (Maksimal 2, Minimal 1)
    const superAdminCount = useMemo(() => users.filter((u) => u.role === 'pemilik').length, [users]);

    // State Tambah Staf Baru
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        role: 'admin_kasir' as 'pemilik' | 'admin_kasir' | 'barista_koki',
        password: '',
        password_confirmation: '',
        admin_password: '',
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

    // State Edit Pengguna & Hak Akses
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'admin_kasir' as 'pemilik' | 'admin_kasir' | 'barista_koki',
        new_password: '',
        new_password_confirmation: '',
        admin_password: '',
    });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    const openEditModal = (u: UserItem) => {
        setEditingUser(u);
        setEditForm({
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            role: u.role,
            new_password: '',
            new_password_confirmation: '',
            admin_password: '',
        });
        setEditErrors({});
    };

    const handleCreateUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateErrors({});

        if (createForm.role === 'pemilik' && superAdminCount >= 2) {
            showToast('Batas maksimal 2 Super Admin telah tercapai!', 'error');
            return;
        }

        if (createForm.role === 'pemilik' && !createForm.admin_password) {
            setCreateErrors({
                admin_password: 'Kata sandi Super Admin Anda diperlukan untuk otorisasi pembuatan Super Admin baru.',
            });
            return;
        }

        setIsCreateSubmitting(true);

        router.post('/owner/users', createForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateSubmitting(false);
                setIsCreateModalOpen(false);
                setCreateForm({
                    name: '',
                    username: '',
                    email: '',
                    phone: '',
                    role: 'admin_kasir',
                    password: '',
                    password_confirmation: '',
                    admin_password: '',
                });
                showToast(`Staf baru ${createForm.name} berhasil ditambahkan.`, 'success');
            },
            onError: (errs) => {
                setIsCreateSubmitting(false);
                setCreateErrors(errs);
                const firstErr = Object.values(errs)[0];
                if (firstErr) {
                    showToast(String(firstErr), 'error');
                }
            },
        });
    };

    const handleUpdateUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setEditErrors({});

        const roleChanged = editForm.role !== editingUser.role;
        const emailChanged = editForm.email.toLowerCase() !== editingUser.email.toLowerCase();
        const passwordChanged = editForm.new_password.trim().length > 0;

        if (roleChanged && editForm.role === 'pemilik' && superAdminCount >= 2 && editingUser.role !== 'pemilik') {
            showToast('Batas maksimal 2 Super Admin telah tercapai!', 'error');
            return;
        }

        if (roleChanged && editingUser.role === 'pemilik' && editForm.role !== 'pemilik' && superAdminCount <= 1) {
            showToast('Sistem wajib memiliki minimal 1 Super Admin!', 'error');
            return;
        }

        if ((roleChanged || emailChanged || passwordChanged) && !editForm.admin_password) {
            setEditErrors({
                admin_password: 'Kata sandi Super Admin Anda wajib diisi untuk otorisasi perubahan Role, Email, atau Password.',
            });
            return;
        }

        setIsEditSubmitting(true);

        router.put(`/owner/users/${editingUser.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditSubmitting(false);
                setEditingUser(null);
                showToast(`Data akun ${editForm.name} berhasil diperbarui.`, 'success');
            },
            onError: (errs) => {
                setIsEditSubmitting(false);
                setEditErrors(errs);
                const firstErr = Object.values(errs)[0];
                if (firstErr) {
                    showToast(String(firstErr), 'error');
                }
            },
        });
    };

    const handleDeleteUser = async (u: UserItem) => {
        // 1. Tidak bisa menghapus diri sendiri
        if (u.id === currentUser?.id) {
            showToast('Proteksi Keamanan: Anda tidak dapat menghapus akun Anda sendiri!', 'error');
            return;
        }

        // 2. Minimal 1 akun Super Admin
        if (u.role === 'pemilik' && superAdminCount <= 1) {
            showToast('Proteksi Keamanan: Tidak dapat menghapus satu-satunya akun Super Admin di sistem!', 'error');
            return;
        }

        const adminPassword = await promptPasswordConfirm(
            `Hapus Akun ${u.name}?`,
            `Akun staf @${u.username} (${u.role === 'pemilik' ? 'Super Admin' : u.role === 'admin_kasir' ? 'Kasir' : 'Barista'}) akan dihapus permanen. Masukkan kata sandi Super Admin Anda untuk otorisasi penghapusan:`
        );

        if (!adminPassword) return;

        router.delete(`/owner/users/${u.id}`, {
            data: { admin_password: adminPassword },
            preserveScroll: true,
            onSuccess: () => {
                showToast(`Akun staf ${u.name} berhasil dihapus permanen.`, 'success');
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] || 'Gagal menghapus akun pengguna.';
                showToast(String(firstErr), 'error');
            },
        });
    };

    // Handler Logout Aman
    const handleLogout = async () => {
        const confirmed = await showConfirm({
            title: 'Keluar dari Portal Pemilik?',
            text: 'Sesi aman Anda akan ditutup dan audit trail akan dicatat.',
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal',
            isDanger: true,
        });

        if (confirmed) {
            router.post('/logout');
        }
    };

    // Handler Suspend / Aktifkan Staf
    const handleToggleUser = async (u: UserItem) => {
        if (u.id === 1 || u.role === 'pemilik') {
            showToast('Akun Super Admin memiliki imunitas dan tidak dapat dinonaktifkan!', 'error');
            return;
        }

        const actionText = u.is_active ? 'menonaktifkan (suspend)' : 'mengaktifkan kembali';
        const confirmed = await showConfirm({
            title: `${u.is_active ? 'Suspend' : 'Aktifkan'} Akun ${u.name}?`,
            text: `Apakah Anda yakin ingin ${actionText} akun staf ini?`,
            confirmButtonText: `Ya, ${u.is_active ? 'Suspend' : 'Aktifkan'}`,
            isDanger: u.is_active,
        });

        if (confirmed) {
            router.post(`/owner/users/${u.id}/toggle-status`, {}, {
                preserveScroll: true,
                onSuccess: () => showToast(`Status akun ${u.name} berhasil diperbarui.`, 'success'),
            });
        }
    };

    // Handler Reset Password Staf
    const handleResetPassword = async (u: UserItem) => {
        const confirmed = await showConfirm({
            title: `Reset Password ${u.name}?`,
            text: "Kata sandi akan direset menjadi default 'password123'. Staf dapat menggantinya kembali saat login.",
            confirmButtonText: 'Ya, Reset Password',
            isDanger: true,
        });

        if (confirmed) {
            router.post(`/owner/users/${u.id}/reset-password`, {}, {
                preserveScroll: true,
                onSuccess: () => showToast(`Password untuk ${u.name} berhasil direset.`, 'success'),
            });
        }
    };

    // Handler Force Close Shift
    const handleForceCloseShift = async () => {
        if (!active_shift) return;

        const confirmed = await showConfirm({
            title: `Tutup Paksa Shift #${active_shift.id}?`,
            text: `Shift ${active_shift.shift_name} (Kasir: ${active_shift.kasir_name}) akan dikunci dan dicatat di audit log.`,
            confirmButtonText: 'Tutup Shift Paksa',
            isDanger: true,
        });

        if (confirmed) {
            router.post(`/owner/shifts/${active_shift.id}/force-close`, {}, {
                preserveScroll: true,
                onSuccess: () => showToast('Shift kasir berhasil ditutup paksa.', 'success'),
            });
        }
    };

    // ==========================================
    // LOGIKA & STATE INVENTARIS & STOK REAL-TIME
    // ==========================================
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'aman' | 'menipis' | 'habis'>('all');

    const inventoryStatusOptions: DropdownOption[] = [
        { value: 'all', label: 'Semua Status Stok' },
        { value: 'aman', label: 'Stok Aman', badge: 'Aman' },
        { value: 'menipis', label: 'Stok Menipis (≤ Min)', badge: 'Kritis' },
        { value: 'habis', label: 'Stok Habis (Kosong)', badge: 'Habis' },
    ];

    const unitOptions: DropdownOption[] = [
        { value: 'gram', label: 'gram (g)', description: 'Bubuk, biji kopi, takaran timbangan' },
        { value: 'ml', label: 'mililiter (ml)', description: 'Susu cair, sirup, saus, air mineral' },
        { value: 'pcs', label: 'pieces (pcs)', description: 'Adonan croissant, pastry satuan' },
        { value: 'shot', label: 'shot', description: 'Ekstraksi konsentrat espresso' },
        { value: 'slice', label: 'slice', description: 'Potongan kue, lemon, keju lembaran' },
        { value: 'pack', label: 'pack', description: 'Kemasan pak / pouch bahan' },
        { value: 'botol', label: 'botol', description: 'Kemasan botol pabrik' },
    ];

    const ingredientOptions: DropdownOption[] = useMemo(() => {
        return ingredients.map((ing) => ({
            value: String(ing.id),
            label: ing.name,
            description: `Stok saat ini: ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(ing.stock)} ${ing.unit}`,
            badge: ing.status === 'habis' ? 'Habis' : ing.status === 'menipis' ? 'Kritis' : 'Aman',
        }));
    }, [ingredients]);

    const filteredIngredients = useMemo(() => {
        return ingredients.filter((ing) => {
            const matchesStatus = inventoryStatusFilter === 'all' || ing.status === inventoryStatusFilter;
            const q = inventorySearchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                ing.name.toLowerCase().includes(q) ||
                ing.unit.toLowerCase().includes(q) ||
                ing.used_in_menus.some((m) => m.toLowerCase().includes(q));
            return matchesStatus && matchesSearch;
        });
    }, [ingredients, inventoryStatusFilter, inventorySearchQuery]);

    // Pagination Inventaris (Max 10 / Page)
    const [inventoryPage, setInventoryPage] = useState(1);
    const inventoryPageSize = 10;
    const totalInventoryPages = Math.max(1, Math.ceil(filteredIngredients.length / inventoryPageSize));
    const paginatedIngredients = useMemo(() => {
        const start = (inventoryPage - 1) * inventoryPageSize;
        return filteredIngredients.slice(start, start + inventoryPageSize);
    }, [filteredIngredients, inventoryPage]);

    useEffect(() => {
        setInventoryPage(1);
    }, [inventorySearchQuery, inventoryStatusFilter]);

    // State Modal Tambah Bahan Baku
    const [isCreateIngredientOpen, setIsCreateIngredientOpen] = useState(false);
    const [createIngredientForm, setCreateIngredientForm] = useState({
        name: '',
        unit: 'gram',
        initial_stock: '',
        min_stock: '',
        cost_per_unit: '',
    });
    const [createIngredientErrors, setCreateIngredientErrors] = useState<Record<string, string>>({});
    const [isCreateIngredientSubmitting, setIsCreateIngredientSubmitting] = useState(false);

    const handleCreateIngredientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateIngredientErrors({});
        setIsCreateIngredientSubmitting(true);

        router.post('/owner/inventory', createIngredientForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateIngredientOpen(false);
                setCreateIngredientForm({
                    name: '',
                    unit: 'gram',
                    initial_stock: '',
                    min_stock: '',
                    cost_per_unit: '',
                });
                showToast('Bahan baku baru berhasil ditambahkan ke inventaris.', 'success');
            },
            onError: (errs) => {
                setCreateIngredientErrors(errs);
                showToast('Gagal menambahkan bahan baku. Periksa kembali form.', 'error');
            },
            onFinish: () => setIsCreateIngredientSubmitting(false),
        });
    };

    // State Modal Edit Bahan Baku
    const [editingIngredient, setEditingIngredient] = useState<IngredientItem | null>(null);
    const [editIngredientForm, setEditIngredientForm] = useState({
        name: '',
        unit: 'gram',
        min_stock: '',
        cost_per_unit: '',
        is_active: true,
    });
    const [editIngredientErrors, setEditIngredientErrors] = useState<Record<string, string>>({});
    const [isEditIngredientSubmitting, setIsEditIngredientSubmitting] = useState(false);

    const openEditIngredientModal = (ing: IngredientItem) => {
        setEditingIngredient(ing);
        setEditIngredientForm({
            name: ing.name,
            unit: ing.unit,
            min_stock: String(ing.min_stock),
            cost_per_unit: String(ing.cost_per_unit),
            is_active: ing.is_active,
        });
        setEditIngredientErrors({});
    };

    const handleEditIngredientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingIngredient) return;
        setEditIngredientErrors({});
        setIsEditIngredientSubmitting(true);

        router.put(`/owner/inventory/${editingIngredient.id}`, editIngredientForm, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingIngredient(null);
                showToast(`Data bahan baku '${editingIngredient.name}' berhasil diperbarui.`, 'success');
            },
            onError: (errs) => {
                setEditIngredientErrors(errs);
                showToast('Gagal memperbarui data bahan baku.', 'error');
            },
            onFinish: () => setIsEditIngredientSubmitting(false),
        });
    };

    // State Modal Penyesuaian Stok / Restock Cepat
    const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientItem | null>(null);
    const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
    const [adjustStockForm, setAdjustStockForm] = useState({
        ingredient_id: '',
        type: 'in' as 'in' | 'waste' | 'adjustment',
        quantity: '',
        cost: '',
        reference: '',
        notes: '',
    });
    const [adjustStockErrors, setAdjustStockErrors] = useState<Record<string, string>>({});
    const [isAdjustStockSubmitting, setIsAdjustStockSubmitting] = useState(false);

    const openAdjustStockModal = (ing?: IngredientItem) => {
        const target = ing || ingredients[0] || null;
        setAdjustingIngredient(target);
        setAdjustStockForm({
            ingredient_id: target ? String(target.id) : '',
            type: 'in',
            quantity: '',
            cost: '',
            reference: '',
            notes: '',
        });
        setAdjustStockErrors({});
        setIsAdjustStockOpen(true);
    };

    const selectedTargetForAdjustment = useMemo(() => {
        if (adjustingIngredient) return adjustingIngredient;
        return ingredients.find((i) => String(i.id) === adjustStockForm.ingredient_id) || null;
    }, [adjustingIngredient, ingredients, adjustStockForm.ingredient_id]);

    const projectedStockAfterAdjustment = useMemo(() => {
        if (!selectedTargetForAdjustment) return null;
        const current = selectedTargetForAdjustment.stock;
        const inputQty = parseFloat(adjustStockForm.quantity);
        if (isNaN(inputQty) || inputQty <= 0) return current;

        if (adjustStockForm.type === 'in') {
            return current + inputQty;
        } else if (adjustStockForm.type === 'waste') {
            return Math.max(0, current - inputQty);
        } else if (adjustStockForm.type === 'adjustment') {
            return inputQty;
        }
        return current;
    }, [selectedTargetForAdjustment, adjustStockForm.type, adjustStockForm.quantity]);

    const handleAdjustStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const target = selectedTargetForAdjustment;
        if (!target) {
            showToast('Pilih bahan baku terlebih dahulu.', 'error');
            return;
        }

        const qtyNum = parseFloat(adjustStockForm.quantity);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            setAdjustStockErrors({ quantity: 'Kuantitas harus berupa angka lebih dari 0.' });
            return;
        }

        if (adjustStockForm.type === 'waste' && qtyNum > target.stock) {
            setAdjustStockErrors({
                quantity: `Kuantitas waste (${qtyNum} ${target.unit}) melebihi stok yang tersedia (${target.stock} ${target.unit}).`,
            });
            return;
        }

        setAdjustStockErrors({});
        setIsAdjustStockSubmitting(true);

        router.post(`/owner/inventory/${target.id}/adjust`, adjustStockForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdjustStockOpen(false);
                setAdjustingIngredient(null);
                showToast(`Penyesuaian stok untuk '${target.name}' berhasil disimpan.`, 'success');
            },
            onError: (errs) => {
                setAdjustStockErrors(errs);
                showToast('Gagal memproses penyesuaian stok. Periksa kembali form.', 'error');
            },
            onFinish: () => setIsAdjustStockSubmitting(false),
        });
    };

    // Handler Hapus Bahan Baku dengan Proteksi Integritas Resep
    const handleDeleteIngredient = async (ing: IngredientItem) => {
        if (ing.recipes_count > 0) {
            await showConfirm({
                title: `Bahan Terhubung Menu Resep`,
                text: `Bahan baku '${ing.name}' masih digunakan oleh ${ing.recipes_count} menu aktif (${ing.used_in_menus.join(', ')}). Demi integritas transaksi kasir, hapus atau ubah resep menu terkait terlebih dahulu.`,
                confirmButtonText: 'Saya Mengerti',
                isDanger: false,
            });
            return;
        }

        const confirmed = await showConfirm({
            title: `Hapus Bahan Baku '${ing.name}'?`,
            text: `Bahan baku dengan satuan (${ing.unit}) dan stok saat ini (${ing.stock}) akan dihapus secara permanen dari inventaris.`,
            confirmButtonText: 'Ya, Hapus Bahan Baku',
            isDanger: true,
        });

        if (confirmed) {
            router.delete(`/owner/inventory/${ing.id}`, {
                preserveScroll: true,
                onSuccess: () => showToast(`Bahan baku '${ing.name}' berhasil dihapus dari inventaris.`, 'success'),
                onError: (err) => showToast(Object.values(err)[0] || 'Gagal menghapus bahan baku.', 'error'),
            });
        }
    };

    // Maksimal order pada chart jam sibuk
    const maxHourOrder = Math.max(...hourly_sales.map((h) => h.orders), 1);

    // State Filter & Search Tab Riwayat Mutasi Stok
    const [mutationSearchQuery, setMutationSearchQuery] = useState('');
    const [mutationTypeFilter, setMutationTypeFilter] = useState<'all' | 'waste' | 'adjustment' | 'in' | 'out'>('all');

    const filteredStockLogs = useMemo(() => {
        return (stock_logs || [])
            .filter((log) => {
                const matchesType = mutationTypeFilter === 'all' || log.type === mutationTypeFilter;
                const q = mutationSearchQuery.toLowerCase().trim();
                const matchesSearch =
                    !q ||
                    log.ingredient_name.toLowerCase().includes(q) ||
                    (log.reference && log.reference.toLowerCase().includes(q)) ||
                    (log.notes && log.notes.toLowerCase().includes(q)) ||
                    log.user_name.toLowerCase().includes(q);
                return matchesType && matchesSearch;
            })
            .sort((a, b) => {
                if (a.created_at_raw && b.created_at_raw) {
                    const diff = new Date(b.created_at_raw).getTime() - new Date(a.created_at_raw).getTime();
                    if (diff !== 0) return diff;
                }
                return b.id - a.id;
            });
    }, [stock_logs, mutationTypeFilter, mutationSearchQuery]);

    // Pagination Mutasi Stok (Max 10 / Page)
    const [mutationPage, setMutationPage] = useState(1);
    const mutationPageSize = 10;
    const totalMutationPages = Math.max(1, Math.ceil(filteredStockLogs.length / mutationPageSize));
    const paginatedStockLogs = useMemo(() => {
        const start = (mutationPage - 1) * mutationPageSize;
        return filteredStockLogs.slice(start, start + mutationPageSize);
    }, [filteredStockLogs, mutationPage]);

    useEffect(() => {
        setMutationPage(1);
    }, [mutationSearchQuery, mutationTypeFilter]);

    const countAllMutations = (stock_logs || []).length;
    const countWasteMutations = (stock_logs || []).filter((l) => l.type === 'waste').length;
    const countAdjustmentMutations = (stock_logs || []).filter((l) => l.type === 'adjustment').length;
    const countInMutations = (stock_logs || []).filter((l) => l.type === 'in').length;
    const countOutMutations = (stock_logs || []).filter((l) => l.type === 'out').length;

    const mutationTypeOptions: DropdownOption[] = [
        { value: 'all', label: `Semua Mutasi (${countAllMutations})` },
        { value: 'waste', label: `Bahan Rusak (${countWasteMutations})`, badge: 'Rusak' },
        { value: 'adjustment', label: `Opname Fisik (${countAdjustmentMutations})`, badge: 'Opname' },
        { value: 'in', label: `Restock Masuk (${countInMutations})`, badge: 'Restock' },
        { value: 'out', label: `Pemakaian POS (${countOutMutations})`, badge: 'POS' },
    ];

    // State Filter & Search Tab Laba Rugi & Finansial
    const [financeSearchQuery, setFinanceSearchQuery] = useState('');
    const [financeFlowFilter, setFinanceFlowFilter] = useState<'all' | 'income' | 'expense' | 'waste'>('all');

    const filteredFinancialLedger = useMemo(() => {
        return (financial_ledger || [])
            .filter((item) => {
                const matchesFlow = financeFlowFilter === 'all' || item.type === financeFlowFilter;
                const q = financeSearchQuery.toLowerCase().trim();
                const matchesSearch =
                    !q ||
                    item.title.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    item.category.toLowerCase().includes(q) ||
                    item.user_name.toLowerCase().includes(q);
                return matchesFlow && matchesSearch;
            })
            .sort((a, b) => {
                if (a.created_at_raw && b.created_at_raw) {
                    return new Date(b.created_at_raw).getTime() - new Date(a.created_at_raw).getTime();
                }
                return 0;
            });
    }, [financial_ledger, financeFlowFilter, financeSearchQuery]);

    // Pagination Laba Rugi (Maksimal 10 Baris Data / Page)
    const [financePage, setFinancePage] = useState(1);
    const financePageSize = 10;
    const totalFinancePages = Math.max(1, Math.ceil(filteredFinancialLedger.length / financePageSize));
    const paginatedFinancialLedger = useMemo(() => {
        const start = (financePage - 1) * financePageSize;
        return filteredFinancialLedger.slice(start, start + financePageSize);
    }, [filteredFinancialLedger, financePage]);

    useEffect(() => {
        setFinancePage(1);
    }, [financeSearchQuery, financeFlowFilter]);

    const countAllFinance = (financial_ledger || []).length;
    const countIncomeFinance = (financial_ledger || []).filter((f) => f.type === 'income').length;
    const countExpenseFinance = (financial_ledger || []).filter((f) => f.type === 'expense').length;
    const countWasteFinance = (financial_ledger || []).filter((f) => f.type === 'waste').length;

    const financeFlowOptions: DropdownOption[] = [
        { value: 'all', label: `Semua Aliran Kas (${countAllFinance})` },
        { value: 'income', label: `Pemasukan POS (${countIncomeFinance})`, badge: '+ Kas' },
        { value: 'expense', label: `Belanja Stok Bahan (${countExpenseFinance})`, badge: '- Kas' },
        { value: 'waste', label: `Kerugian Rusak/Waste (${countWasteFinance})`, badge: 'Rugi' },
    ];

    // State Manajemen Voucher & Kupon Diskon (Promos)
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [promoSearchQuery, setPromoSearchQuery] = useState('');
    const [promoStatusFilter, setPromoStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isSavingPromo, setIsSavingPromo] = useState(false);
    const [isTogglingPromoId, setIsTogglingPromoId] = useState<number | null>(null);
    const [isDeletingPromoId, setIsDeletingPromoId] = useState<number | null>(null);

    const [promoForm, setPromoForm] = useState({
        code: '',
        name: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        start_date: '',
        end_date: '',
        is_active: true,
    });

    const resetPromoForm = () => {
        setPromoForm({
            code: '',
            name: '',
            discount_type: 'percentage',
            discount_value: '',
            min_order_amount: '',
            max_discount_amount: '',
            start_date: '',
            end_date: '',
            is_active: true,
        });
    };

    const handleCreatePromo = (e: React.FormEvent) => {
        e.preventDefault();
        const codeTrimmed = promoForm.code.trim().toUpperCase();
        if (!codeTrimmed) {
            showToast('Kode voucher wajib diisi!', 'error');
            return;
        }

        const discountNum = parseFloat(promoForm.discount_value);
        if (isNaN(discountNum) || discountNum <= 0) {
            showToast('Nilai diskon harus lebih besar dari 0!', 'error');
            return;
        }

        if (promoForm.discount_type === 'percentage' && discountNum > 100) {
            showToast('Nilai diskon persentase tidak boleh melebihi 100%!', 'error');
            return;
        }

        setIsSavingPromo(true);
        router.post('/super/promos', {
            code: codeTrimmed,
            name: promoForm.name.trim(),
            discount_type: promoForm.discount_type,
            discount_value: discountNum,
            min_order_amount: promoForm.min_order_amount ? parseFloat(promoForm.min_order_amount) : 0,
            max_discount_amount: promoForm.discount_type === 'percentage' && promoForm.max_discount_amount ? parseFloat(promoForm.max_discount_amount) : null,
            start_date: promoForm.start_date || null,
            end_date: promoForm.end_date || null,
            is_active: promoForm.is_active,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingPromo(false);
                setIsPromoModalOpen(false);
                resetPromoForm();
                showToast(`Voucher diskon '${codeTrimmed}' berhasil ditambahkan dan disinkronkan ke Kasir & Barista KDS!`, 'success');
            },
            onError: (errs) => {
                setIsSavingPromo(false);
                const first = Object.values(errs)[0] as string;
                showToast(first || 'Gagal menyimpan voucher diskon.', 'error');
            },
        });
    };

    const handleTogglePromo = (promo: PromoItem) => {
        setIsTogglingPromoId(promo.id);
        router.post(`/super/promos/${promo.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsTogglingPromoId(null);
                showToast(`Status voucher '${promo.code}' diubah menjadi ${!promo.is_active ? 'Aktif' : 'Nonaktif'}.`, 'success');
            },
            onError: () => {
                setIsTogglingPromoId(null);
                showToast('Gagal mengubah status voucher diskon.', 'error');
            },
        });
    };

    const handleDeletePromo = (promo: PromoItem) => {
        if (!confirm(`Hapus voucher diskon '${promo.code}' (${promo.name}) secara permanen?`)) {
            return;
        }
        setIsDeletingPromoId(promo.id);
        router.delete(`/super/promos/${promo.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeletingPromoId(null);
                showToast(`Voucher diskon '${promo.code}' berhasil dihapus.`, 'success');
            },
            onError: (errs) => {
                setIsDeletingPromoId(null);
                const first = Object.values(errs)[0] as string;
                showToast(first || 'Gagal menghapus voucher diskon.', 'error');
            },
        });
    };

    const filteredPromos = useMemo(() => {
        return (promos || []).filter((p) => {
            const matchSearch =
                p.code.toLowerCase().includes(promoSearchQuery.toLowerCase()) ||
                p.name.toLowerCase().includes(promoSearchQuery.toLowerCase());
            const matchStatus =
                promoStatusFilter === 'all'
                    ? true
                    : promoStatusFilter === 'active'
                    ? p.is_active
                    : !p.is_active;
            return matchSearch && matchStatus;
        });
    }, [promos, promoSearchQuery, promoStatusFilter]);

    const activePromosCount = useMemo(() => (promos || []).filter((p) => p.is_active).length, [promos]);
    const inactivePromosCount = useMemo(() => (promos || []).filter((p) => !p.is_active).length, [promos]);

    // Pagination Kupon Voucher (Maksimal 5 data per halaman)
    const [promoPage, setPromoPage] = useState(1);
    const promoPageSize = 5;
    const totalPromoPages = Math.max(1, Math.ceil(filteredPromos.length / promoPageSize));
    const paginatedPromos = useMemo(() => {
        const startIndex = (promoPage - 1) * promoPageSize;
        return filteredPromos.slice(startIndex, startIndex + promoPageSize);
    }, [filteredPromos, promoPage, promoPageSize]);

    // State Tab Pengaturan Cafe & Toko (Store Settings)
    const [storeForm, setStoreForm] = useState({
        store_name: store?.store_name ?? 'Monera Coffee',
        tagline: store?.tagline ?? 'Brewing Passion, Serving Warmth',
        address: store?.address ?? 'Jl. Gejayan No. 45, Sleman, D.I. Yogyakarta',
        phone: store?.phone ?? '0812-3456-7890',
        email: store?.email ?? 'hello@moneracoffee.com',
        tax_percentage: store?.tax_percentage !== undefined ? Number(store.tax_percentage) : 10,
        service_charge_percentage: store?.service_charge_percentage !== undefined ? Number(store.service_charge_percentage) : 0,
        receipt_footer: store?.receipt_footer ?? 'Terima kasih atas kunjungan Anda di Monera Coffee! • Follow IG @moneracoffee',
        is_open: store?.is_open ?? true,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Sinkronisasi form saat prop store diperbarui dari server
    useEffect(() => {
        if (store) {
            setStoreForm({
                store_name: store.store_name ?? 'Monera Coffee',
                tagline: store.tagline ?? '',
                address: store.address ?? '',
                phone: store.phone ?? '',
                email: store.email ?? '',
                tax_percentage: store.tax_percentage !== undefined ? Number(store.tax_percentage) : 10,
                service_charge_percentage: store.service_charge_percentage !== undefined ? Number(store.service_charge_percentage) : 0,
                receipt_footer: store.receipt_footer ?? '',
                is_open: Boolean(store.is_open),
            });
        }
    }, [store]);

    const handleSaveStoreSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        router.put('/owner/settings', storeForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingSettings(false);
                showToast('Pengaturan Cafe & Informasi Struk Kasir berhasil disimpan dan disinkronkan!', 'success');
            },
            onError: (errs) => {
                setIsSavingSettings(false);
                const first = Object.values(errs)[0] as string;
                showToast(first || 'Gagal menyimpan pengaturan toko.', 'error');
            },
        });
    };

    // ==========================================
    // STATE & HANDLER TAB KATALOG MENU KAFE
    // ==========================================
    const [menuSearch, setMenuSearch] = useState('');
    const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');
    const [menuStatusFilter, setMenuStatusFilter] = useState<'all' | 'available' | 'sold_out'>('all');

    // Modal Tambah Menu
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [addMenuForm, setAddMenuForm] = useState({
        name: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        base_price: '',
        cost_price: '',
        description: '',
        is_available: true,
    });
    const [addMenuImageFile, setAddMenuImageFile] = useState<File | null>(null);
    const [addMenuImagePreview, setAddMenuImagePreview] = useState<string | null>('/images/icon.png');
    const [addMenuErrors, setAddMenuErrors] = useState<Record<string, string>>({});
    const [isAddMenuSubmitting, setIsAddMenuSubmitting] = useState(false);

    // Modal Ubah Menu
    const [editingMenu, setEditingMenu] = useState<MenuAdminItem | null>(null);
    const [editMenuForm, setEditMenuForm] = useState({
        name: '',
        category_id: '',
        base_price: '',
        cost_price: '',
        description: '',
        is_available: true,
    });
    const [editMenuImageFile, setEditMenuImageFile] = useState<File | null>(null);
    const [editMenuImagePreview, setEditMenuImagePreview] = useState<string | null>(null);
    const [editMenuErrors, setEditMenuErrors] = useState<Record<string, string>>({});
    const [isEditMenuSubmitting, setIsEditMenuSubmitting] = useState(false);

    // Filter Menu Katalog
    const menuCategoryOptions: DropdownOption[] = useMemo(() => {
        return categories.map((cat) => ({
            value: String(cat.id),
            label: cat.name,
            badge: cat.production_target === 'barista' ? 'Barista' : 'Koki Dapur',
        }));
    }, [categories]);

    const filteredMenus = useMemo(() => {
        return menus.filter((menu) => {
            const matchesSearch =
                menu.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                menu.category_name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                (menu.description && menu.description.toLowerCase().includes(menuSearch.toLowerCase()));

            const matchesCategory =
                menuCategoryFilter === 'all' || String(menu.category_id) === String(menuCategoryFilter);

            const matchesStatus =
                menuStatusFilter === 'all'
                    ? true
                    : menuStatusFilter === 'available'
                    ? menu.is_available
                    : !menu.is_available;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [menus, menuSearch, menuCategoryFilter, menuStatusFilter]);

    const handleOpenAddMenu = () => {
        setAddMenuForm({
            name: '',
            category_id: categories[0]?.id ? String(categories[0].id) : '',
            base_price: '',
            cost_price: '',
            description: '',
            is_available: true,
        });
        setAddMenuImageFile(null);
        setAddMenuImagePreview('/images/icon.png');
        setAddMenuErrors({});
        setIsAddMenuOpen(true);
    };

    const handleOpenEditMenu = (menu: MenuAdminItem) => {
        setEditingMenu(menu);
        setEditMenuForm({
            name: menu.name,
            category_id: String(menu.category_id),
            base_price: String(menu.base_price),
            cost_price: String(menu.cost_price || ''),
            description: menu.description || '',
            is_available: menu.is_available,
        });
        setEditMenuImageFile(null);
        setEditMenuImagePreview(menu.image || '/images/icon.png');
        setEditMenuErrors({});
    };

    const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                showToast('Ukuran gambar maksimal 3MB.', 'error');
                return;
            }
            setAddMenuImageFile(file);
            setAddMenuImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                showToast('Ukuran gambar maksimal 3MB.', 'error');
                return;
            }
            setEditMenuImageFile(file);
            setEditMenuImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateMenuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddMenuSubmitting(true);
        setAddMenuErrors({});

        const formData = new FormData();
        formData.append('name', addMenuForm.name);
        formData.append('category_id', addMenuForm.category_id);
        formData.append('base_price', addMenuForm.base_price);
        if (addMenuForm.cost_price) formData.append('cost_price', addMenuForm.cost_price);
        if (addMenuForm.description) formData.append('description', addMenuForm.description);
        formData.append('is_available', addMenuForm.is_available ? '1' : '0');
        if (addMenuImageFile) {
            formData.append('image', addMenuImageFile);
        }

        router.post('/owner/menus', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddMenuOpen(false);
                showToast(`Menu '${addMenuForm.name}' berhasil ditambahkan ke katalog!`, 'success');
            },
            onError: (errs) => {
                setAddMenuErrors(errs);
                const first = Object.values(errs)[0] as string;
                showToast(first || 'Gagal menambahkan menu baru. Periksa data form.', 'error');
            },
            onFinish: () => setIsAddMenuSubmitting(false),
        });
    };

    const handleUpdateMenuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMenu) return;

        setIsEditMenuSubmitting(true);
        setEditMenuErrors({});

        const formData = new FormData();
        formData.append('name', editMenuForm.name);
        formData.append('category_id', editMenuForm.category_id);
        formData.append('base_price', editMenuForm.base_price);
        if (editMenuForm.cost_price) formData.append('cost_price', editMenuForm.cost_price);
        formData.append('description', editMenuForm.description || '');
        formData.append('is_available', editMenuForm.is_available ? '1' : '0');
        if (editMenuImageFile) {
            formData.append('image', editMenuImageFile);
        }

        router.post(`/owner/menus/${editingMenu.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingMenu(null);
                showToast(`Menu '${editMenuForm.name}' berhasil diperbarui!`, 'success');
            },
            onError: (errs) => {
                setEditMenuErrors(errs);
                const first = Object.values(errs)[0] as string;
                showToast(first || 'Gagal memperbarui menu. Periksa data form.', 'error');
            },
            onFinish: () => setIsEditMenuSubmitting(false),
        });
    };

    const handleToggleMenu = (menu: MenuAdminItem) => {
        router.post(
            `/owner/menus/${menu.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(`Status ketersediaan menu '${menu.name}' diubah menjadi ${!menu.is_available ? 'Tersedia' : 'Habis / Sold Out'}.`, 'success');
                },
                onError: () => {
                    showToast('Gagal mengubah status ketersediaan menu.', 'error');
                },
            }
        );
    };

    const handleDeleteMenu = async (menu: MenuAdminItem) => {
        const confirmed = await showConfirm({
            title: 'Hapus Menu dari Katalog?',
            text: `Apakah Anda yakin ingin menghapus menu '${menu.name}'? Menu ini tidak akan lagi muncul di POS dan sistem pemesanan.`,
            confirmButtonText: 'Ya, Hapus Menu',
            cancelButtonText: 'Batal',
            isDanger: true,
        });

        if (confirmed) {
            router.delete(`/owner/menus/${menu.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(`Menu '${menu.name}' berhasil dihapus.`, 'success');
                },
                onError: () => {
                    showToast('Gagal menghapus menu.', 'error');
                },
            });
        }
    };

    // ========================================================
    // KUNCI SCROLL HALAMAN BELAKANG SAAT MODAL TERBUKA
    // ========================================================
    const isAnyModalOpen = Boolean(
        isCreateModalOpen ||
        editingUser ||
        isCreateIngredientOpen ||
        editingIngredient ||
        isAdjustStockOpen ||
        isAddMenuOpen ||
        editingMenu
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isAnyModalOpen]);

    // Konfigurasi Navigasi Sidebar Modular Pemilik
    const ownerNavGroups: NavGroup[] = [
        {
            title: 'Menu Utama',
            items: [
                {
                    id: 'overview',
                    label: 'Ringkasan Eksekutif',
                    icon: <TrendingUp className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'overview',
                    onClick: () => handleTabChange('overview'),
                },
                {
                    id: 'menus',
                    label: 'Katalog Menu Kafe',
                    icon: <Coffee className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'menus',
                    onClick: () => handleTabChange('menus'),
                    badge: menus.length,
                },
                {
                    id: 'users',
                    label: 'Kelola Pengguna',
                    icon: <Users className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'users',
                    onClick: () => handleTabChange('users'),
                },
                {
                    id: 'inventory',
                    label: 'Inventaris & Stok',
                    icon: <Package className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'inventory',
                    onClick: () => handleTabChange('inventory'),
                },
                {
                    id: 'mutations',
                    label: 'Riwayat Mutasi & Opname',
                    icon: <ClipboardList className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'mutations',
                    onClick: () => handleTabChange('mutations'),
                },
                {
                    id: 'finance',
                    label: 'Laba Rugi & Finansial',
                    icon: <Wallet className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'finance',
                    onClick: () => handleTabChange('finance'),
                },
                {
                    id: 'settings',
                    label: 'Pengaturan Toko',
                    icon: <Store className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'settings',
                    onClick: () => handleTabChange('settings'),
                },
                {
                    id: 'audit',
                    label: 'Audit Log Keamanan',
                    icon: <Shield className="w-4 h-4 text-crema-500" />,
                    active: activeTab === 'audit',
                    onClick: () => handleTabChange('audit'),
                },
            ],
        },
    ];

    // Header Right Controls: Dropdown Periode, Live Sync, Refresh & Ekspor
    const headerRightControls = (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">


            {/* Manual Refresh Button */}
            <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-coffee-50 text-coffee-800 border border-coffee-200 transition cursor-pointer shadow-2xs"
                title={`Klik untuk sinkronisasi manual database sekarang (Terakhir: ${lastSyncTime})`}
            >
                <RefreshCw className={`w-3.5 h-3.5 text-crema-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline">Perbarui</span>
            </button>

            {/* Dropdown Filter Periode */}
            <div className="w-32 sm:w-36 md:w-44">
                <Dropdown
                    size="sm"
                    options={periodOptions}
                    value={selectedPeriod}
                    onChange={(val) => handlePeriodChange(String(val))}
                    placeholder="Pilih Periode..."
                    triggerClassName="bg-coffee-50 border-coffee-200 text-xs font-semibold"
                />
            </div>

            <Button
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex text-xs"
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                onClick={() => showToast('Mempersiapkan data laporan finansial...', 'info')}
            >
                Ekspor
            </Button>
        </div>
    );

    return (
        <DashboardLayout
            title={
                activeTab === 'overview'
                    ? 'Ringkasan Eksekutif & Finansial'
                    : activeTab === 'menus'
                    ? 'Manajemen Katalog Menu Kafe'
                    : activeTab === 'users'
                    ? 'Manajemen Pengguna & Staf'
                    : activeTab === 'inventory'
                    ? 'Inventaris & Kelola Stok Real-time'
                    : activeTab === 'mutations'
                    ? 'Riwayat Mutasi & Opname Stok'
                    : activeTab === 'finance'
                    ? 'Laba Rugi & Arus Kas Finansial'
                    : activeTab === 'settings'
                    ? 'Pengaturan Toko & Voucher Promosi'
                    : 'Audit Trail & Jejak Keamanan'
            }
            subtitle={
                activeTab === 'overview'
                    ? 'Pemantauan data riil operasional, margin laba, dan jam sibuk Monera Coffee'
                    : activeTab === 'menus'
                    ? 'Atur katalog menu, harga jual, margin laba HPP, foto produk, ketersediaan stok, dan kategori sajian'
                    : activeTab === 'users'
                    ? 'Kelola akun kasir, barista, hak akses role, serta otorisasi keamanan Super Admin'
                    : activeTab === 'inventory'
                    ? 'Kelola stok bahan baku, restock supplier, opname fisik, dan sinkronisasi real-time dengan POS & Dapur KDS'
                    : activeTab === 'mutations'
                    ? 'Rekaman historis barang rusak (waste), koreksi opname fisik berkala, restock supplier, dan pemakaian POS'
                    : activeTab === 'finance'
                    ? 'Laporan laba rugi, perputaran kas masuk penjualan POS vs kas keluar belanja stok & kerugian bahan rusak'
                    : activeTab === 'settings'
                    ? 'Konfigurasi identitas toko, tarif pajak PB1, format struk, serta manajemen voucher diskon kasir & dapur'
                    : 'Rekaman jejak aktivitas sistem dan mitigasi insiden operasional secara transparan'
            }
            storeName={store?.store_name ?? 'Monera Coffee'}
            tagline={store?.tagline ?? 'Powered by Bean & Bite'}
            navGroups={ownerNavGroups}
            headerRight={headerRightControls}
        >
            <div className="p-3 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4 max-w-7xl mx-auto w-full">
                    {/* TAB 1: OVERVIEW EKSEKUTIF REAL-TIME */}
                    {activeTab === 'overview' && (
                        <>
                            {/* 4 KPI Cards: Compact Responsive Grid (2 cols mobile -> 4 cols desktop) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                                <div className="p-3 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-1 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Omzet Gross
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.omzet_gross}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-matcha-700 font-semibold truncate">
                                        <span className="bg-matcha-50 px-1.5 py-0.2 rounded font-bold border border-matcha-200/60">+14.8%</span>
                                        <span className="text-coffee-500 font-normal truncate hidden xs:inline">vs kemarin</span>
                                    </div>
                                </div>

                                <div className="p-3 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-1 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Estimasi Laba
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-crema-50 text-crema-700 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.laba_kotor}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-crema-800 font-medium truncate">
                                        Margin: <strong className="font-bold">{kpi.profit_margin}%</strong>
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-1 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Total Pesanan
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-coffee-50 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <Activity className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.total_orders} Order
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-coffee-600 font-medium truncate">
                                        <strong>{kpi.active_open_bills}</strong> Open Bill aktif
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-1 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Bahan Kritis
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-berry-600 tracking-tight truncate leading-tight">
                                        {kpi.critical_stock_count} Item Menipis
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-berry-700 font-semibold truncate">
                                        {kpi.critical_stock_count > 0 ? 'Perlu Restock' : 'Semua Aman'}
                                    </p>
                                </div>
                            </div>

                            {/* Main Content: Responsive 12-Column Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
                                {/* Left 7 Cols: Hourly Sales Bar Chart & Active Cashier Shift */}
                                <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 min-w-0">
                                    {/* Hourly Sales Bar Chart (Responsive, No Internal Scrollbar) */}
                                    <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-3 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-coffee-100 pb-2.5">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-1.5">
                                                    <span>Tren Penjualan & Jam Sibuk</span>
                                                    <span className="text-[10px] font-mono text-coffee-500 font-normal">(08:00 - 22:00)</span>
                                                </h3>
                                                <p className="text-[10px] sm:text-[11px] text-coffee-500">
                                                    Volume transaksi per jam operasional real-time dari database
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                                {peak_hour && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg shadow-2xs">
                                                        <Flame className="w-3 h-3 text-amber-600" />
                                                        <span>Puncak: {peak_hour}</span>
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono bg-coffee-100/70 text-coffee-800 px-2 py-0.5 rounded font-semibold">
                                                    {selectedPeriod === 'today' ? 'Hari Ini' : selectedPeriod === 'yesterday' ? 'Kemarin' : 'Periode'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Responsive Chart Container with Dynamic Grid Guides */}
                                        <div className="relative pt-6 pb-1">
                                            {/* Reference Gridlines */}
                                            <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                                                <div className="border-b border-dashed border-coffee-300 w-full" />
                                                <div className="border-b border-dashed border-coffee-200 w-full" />
                                                <div className="border-b border-dashed border-coffee-200 w-full" />
                                                <div className="border-b border-dashed border-coffee-300 w-full" />
                                            </div>

                                            {/* Bars Flex Row (Fit any screen without internal scrollbar!) */}
                                            <div className="h-32 sm:h-36 flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
                                                {hourly_sales.map((h) => {
                                                    const maxOrders = Math.max(...hourly_sales.map((item) => item.orders), 1);
                                                    const hasOrders = h.orders > 0;
                                                    const heightPct = hasOrders ? Math.max(Math.round((h.orders / maxOrders) * 100), 20) : 6;
                                                    const isPeak = h.orders >= 3 || (hasOrders && h.orders === maxOrders);

                                                    return (
                                                        <div
                                                            key={h.hour}
                                                            className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                                                        >
                                                            {/* Floating Hover Tooltip */}
                                                            <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-coffee-950 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-xl pointer-events-none z-30 whitespace-nowrap">
                                                                <span>{h.hour}:00 • {h.orders} Order</span>
                                                                {h.revenue_formatted && (
                                                                    <span className="block text-crema-300 text-[9px] font-mono">{h.revenue_formatted}</span>
                                                                )}
                                                            </div>

                                                            {/* Top Order Number Badge for active bars */}
                                                            {hasOrders && (
                                                                <span className="text-[9px] sm:text-[10px] font-black text-crema-800 bg-crema-100 border border-crema-300 px-1 py-0.2 rounded shadow-2xs mb-1">
                                                                    {h.orders}
                                                                </span>
                                                            )}

                                                            {/* The Bar */}
                                                            <div
                                                                style={{ height: `${heightPct}%` }}
                                                                className={`w-full max-w-[22px] sm:max-w-[28px] rounded-t-md transition-all duration-300 ${
                                                                    hasOrders
                                                                        ? isPeak
                                                                            ? 'bg-gradient-to-t from-coffee-950 via-coffee-800 to-crema-600 shadow-xs'
                                                                            : 'bg-gradient-to-t from-crema-700 to-crema-500 shadow-2xs'
                                                                        : 'bg-coffee-100 hover:bg-coffee-200'
                                                                }`}
                                                            />

                                                            {/* Hour Label */}
                                                            <span className={`text-[9px] sm:text-[10px] font-mono font-semibold mt-1.5 ${hasOrders ? 'text-coffee-950 font-bold' : 'text-coffee-400'}`}>
                                                                {h.hour}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Shift Monitoring Box */}
                                    <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-3 min-w-0">
                                        <div className="flex items-center justify-between border-b border-coffee-100 pb-2.5">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-1.5">
                                                    <span>Monitoring Shift Kasir & Rekonsiliasi Kas</span>
                                                </h3>
                                                <p className="text-[10px] sm:text-[11px] text-coffee-500">
                                                    Status laci kas fisik secara langsung tersinkron dari POS
                                                </p>
                                            </div>
                                            {active_shift ? (
                                                <Badge variant="matcha" size="sm">
                                                    Shift Aktif (OPEN)
                                                </Badge>
                                            ) : (
                                                <Badge variant="neutral" size="sm">
                                                    Tutup
                                                </Badge>
                                            )}
                                        </div>

                                        {active_shift ? (
                                            <div className="p-3 sm:p-3.5 rounded-xl bg-coffee-50/70 border border-coffee-200 space-y-2.5">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-coffee-200 border border-coffee-300 flex-shrink-0 flex items-center justify-center font-bold text-xs text-coffee-800 shadow-2xs">
                                                            {active_shift.kasir_avatar_url ? (
                                                                <img
                                                                    src={active_shift.kasir_avatar_url}
                                                                    alt={active_shift.kasir_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span>{active_shift.kasir_name?.slice(0, 2).toUpperCase() ?? 'KS'}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs sm:text-sm font-bold text-coffee-950 truncate">
                                                                {active_shift.shift_name}
                                                            </h4>
                                                            <p className="text-[11px] text-coffee-600 truncate">
                                                                Kasir: <strong className="text-coffee-900">{active_shift.kasir_name}</strong> • Buka sejak {active_shift.opened_at}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="text-xs py-1 px-3 self-start sm:self-auto flex-shrink-0"
                                                        onClick={handleForceCloseShift}
                                                    >
                                                        Tutup Shift Paksa
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-coffee-200/80 text-xs">
                                                    <div className="bg-white p-2 rounded-lg border border-coffee-200/60">
                                                        <span className="text-[10px] text-coffee-500 font-medium">Modal Awal Laci:</span>
                                                        <p className="text-xs sm:text-sm font-bold text-coffee-900 truncate">
                                                            {active_shift.start_cash_formatted}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-2 rounded-lg border border-crema-200 bg-crema-50/40">
                                                        <span className="text-[10px] text-crema-800 font-medium">Ekspektasi Kas Laci:</span>
                                                        <p className="text-xs sm:text-sm font-extrabold text-crema-900 truncate">
                                                            {active_shift.expected_cash_formatted}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center bg-coffee-50/50 rounded-xl border border-coffee-100 text-xs text-coffee-500">
                                                Belum ada shift kasir yang aktif saat ini.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right 5 Cols: Top 5 Menus & Critical Stock */}
                                <div className="lg:col-span-5 space-y-3.5 sm:space-y-4 min-w-0">
                                    {/* Top 5 Menu Terlaris with Table Zebra */}
                                    <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-2.5 min-w-0">
                                        <div className="flex items-center justify-between border-b border-coffee-100 pb-2">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-bold text-coffee-950">
                                                    Top Menu Terlaris
                                                </h3>
                                                <p className="text-[10px] text-coffee-500">
                                                    Urutan penjualan menu teratas
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-mono text-coffee-600 bg-coffee-50 px-2 py-0.5 rounded border border-coffee-200">
                                                Top 5
                                            </span>
                                        </div>

                                        {top_menus.length === 0 ? (
                                            <p className="text-coffee-400 italic text-xs py-3 text-center">Belum ada transaksi.</p>
                                        ) : (
                                            <div className="overflow-x-auto rounded-xl border border-coffee-200 scrollbar-thin">
                                                <table className="table-zebra text-xs w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="py-2 px-2.5 text-center w-8">#</th>
                                                            <th className="py-2 px-2.5">Menu</th>
                                                            <th className="py-2 px-2.5 text-right">Terjual</th>
                                                            <th className="py-2 px-2.5 text-right">Margin</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {top_menus.map((tm, idx) => (
                                                            <tr key={tm.name}>
                                                                <td className="py-2 px-2.5 text-center font-bold text-coffee-600 text-[11px]">
                                                                    #{idx + 1}
                                                                </td>
                                                                <td className="py-2 px-2.5">
                                                                    <p className="font-bold text-coffee-950 truncate max-w-[140px]">{tm.name}</p>
                                                                    <p className="text-[9px] text-coffee-500 font-mono">HPP: {tm.cost_formatted}</p>
                                                                </td>
                                                                <td className="py-2 px-2.5 text-right font-semibold text-coffee-900 whitespace-nowrap">
                                                                    {tm.sold} porsi
                                                                </td>
                                                                <td className="py-2 px-2.5 text-right">
                                                                    <span className="text-[10px] font-bold text-matcha-700 bg-matcha-50 px-1.5 py-0.2 rounded border border-matcha-200/80">
                                                                        +{tm.margin_percent}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Critical Ingredients Alert with Table Zebra */}
                                    <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-2.5 min-w-0">
                                        <div className="flex items-center justify-between border-b border-coffee-100 pb-2">
                                            <h3 className="text-xs sm:text-sm font-bold text-coffee-950 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-berry-600" />
                                                <span>Bahan Baku Menipis</span>
                                            </h3>
                                            <span className="text-[10px] font-bold text-berry-800 bg-berry-50 px-2 py-0.5 rounded-full border border-berry-200">
                                                {critical_ingredients.length} Item
                                            </span>
                                        </div>

                                        {critical_ingredients.length === 0 ? (
                                            <p className="text-matcha-700 bg-matcha-50 p-2.5 rounded-xl border border-matcha-200 text-xs text-center">
                                                ✓ Seluruh stok bahan baku berada pada tingkat aman.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto rounded-xl border border-coffee-200 scrollbar-thin">
                                                <table className="table-zebra text-xs w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="py-2 px-2.5">Bahan</th>
                                                            <th className="py-2 px-2 text-center">Batas</th>
                                                            <th className="py-2 px-2.5 text-right">Sisa</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {critical_ingredients.map((ing) => (
                                                            <tr key={ing.id}>
                                                                <td className="py-2 px-2.5 font-bold text-coffee-950 truncate max-w-[120px]">
                                                                    {ing.name}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-coffee-500 font-mono text-[10px]">
                                                                    {ing.min_stock} {ing.unit}
                                                                </td>
                                                                <td className="py-2 px-2.5 text-right font-black text-berry-700 font-mono text-[11px] whitespace-nowrap">
                                                                    {ing.stock} {ing.unit}
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
                        </>
                    )}

                    {/* TAB KATALOG MENU KAFE (SUPER ADMIN MANAJEMEN MENU) */}
                    {activeTab === 'menus' && (
                        <div className="space-y-3.5 sm:space-y-4">
                            {/* 4 Mini KPI Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                                <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Total Menu
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-crema-50 text-crema-700 flex items-center justify-center flex-shrink-0">
                                            <Coffee className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {menus.length}
                                    </p>
                                    <p className="text-[10px] text-coffee-500">Menu terdaftar di katalog</p>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Kategori Sajian
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-coffee-100 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <Tag className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {categories.length}
                                    </p>
                                    <p className="text-[10px] text-coffee-500">Barista & Koki Dapur</p>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Menu Siap Jual
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-matcha-700 tracking-tight truncate leading-tight">
                                        {menus.filter((m) => m.is_available).length}
                                    </p>
                                    <p className="text-[10px] text-coffee-500">Aktif di Terminal</p>
                                </div>

                                <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-500">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                                            Habis / Sold Out
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                                            <XCircle className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-2xl font-black text-berry-700 tracking-tight truncate leading-tight">
                                        {menus.filter((m) => !m.is_available).length}
                                    </p>
                                    <p className="text-[10px] text-coffee-500">Stok habis sementara</p>
                                </div>
                            </div>

                            {/* Filter Bar: Pencarian, Status, dan Kategori Tabs */}
                            <div className="bg-white rounded-2xl border border-coffee-200 p-3 sm:p-4 shadow-2xs space-y-3">
                                <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
                                    {/* Search Input */}
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={menuSearch}
                                            onChange={(e) => setMenuSearch(e.target.value)}
                                            placeholder="Cari nama menu kopi, makanan, deskripsi..."
                                            className="w-full pl-9 pr-8 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none bg-coffee-50/40 focus:bg-white transition"
                                        />
                                        {menuSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setMenuSearch('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-700"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Status Toggle Pills */}
                                    <div className="flex items-center gap-1 bg-coffee-100/70 p-1 rounded-xl self-start md:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => setMenuStatusFilter('all')}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                                menuStatusFilter === 'all'
                                                    ? 'bg-white text-coffee-950 shadow-2xs'
                                                    : 'text-coffee-600 hover:text-coffee-900'
                                            }`}
                                        >
                                            Semua ({menus.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMenuStatusFilter('available')}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                                menuStatusFilter === 'available'
                                                    ? 'bg-white text-matcha-800 shadow-2xs'
                                                    : 'text-coffee-600 hover:text-coffee-900'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-matcha-500" />
                                            Tersedia ({menus.filter((m) => m.is_available).length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMenuStatusFilter('sold_out')}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                                menuStatusFilter === 'sold_out'
                                                    ? 'bg-white text-berry-800 shadow-2xs'
                                                    : 'text-coffee-600 hover:text-coffee-900'
                                            }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-berry-500" />
                                            Habis ({menus.filter((m) => !m.is_available).length})
                                        </button>
                                    </div>

                                    {/* Tombol Tambah Menu Baru */}
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={handleOpenAddMenu}
                                        className="text-xs h-[36px] whitespace-nowrap flex items-center justify-center gap-1.5 flex-shrink-0"
                                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                                    >
                                        Tambah Menu Baru
                                    </Button>
                                </div>

                                {/* Category Filter Tabs (Wrap Dinamis di Layar Kecil) */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-coffee-100">
                                    <span className="text-[11px] font-bold text-coffee-500 mr-1 flex items-center gap-1">
                                        <Filter className="w-3 h-3" /> Kategori:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setMenuCategoryFilter('all')}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            menuCategoryFilter === 'all'
                                                ? 'bg-coffee-900 text-white shadow-2xs'
                                                : 'bg-coffee-100/70 text-coffee-700 hover:bg-coffee-200/60'
                                        }`}
                                    >
                                        Semua ({menus.length})
                                    </button>
                                    {categories.map((cat) => {
                                        const count = menus.filter((m) => m.category_id === cat.id).length;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setMenuCategoryFilter(String(cat.id))}
                                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    menuCategoryFilter === String(cat.id)
                                                        ? 'bg-coffee-900 text-white shadow-2xs'
                                                        : 'bg-coffee-100/70 text-coffee-700 hover:bg-coffee-200/60'
                                                }`}
                                            >
                                                <span>{cat.name}</span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                                        menuCategoryFilter === String(cat.id)
                                                            ? 'bg-coffee-800 text-crema-300'
                                                            : 'bg-coffee-200 text-coffee-600'
                                                    }`}
                                                >
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Menu Cards Grid */}
                            {filteredMenus.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-coffee-200 p-12 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-coffee-100 text-coffee-400 flex items-center justify-center mx-auto">
                                        <Coffee className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-coffee-900">Tidak ada menu yang sesuai</p>
                                        <p className="text-xs text-coffee-500 max-w-sm mx-auto">
                                            Coba sesuaikan kata kunci pencarian atau ubah filter kategori dan status menu.
                                        </p>
                                    </div>
                                    {(menuSearch || menuCategoryFilter !== 'all' || menuStatusFilter !== 'all') && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setMenuSearch('');
                                                setMenuCategoryFilter('all');
                                                setMenuStatusFilter('all');
                                            }}
                                        >
                                            Reset Filter
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {filteredMenus.map((menu) => {
                                        const profit = menu.base_price - (menu.cost_price || 0);
                                        const marginPercent = menu.base_price > 0 ? Math.round((profit / menu.base_price) * 100) : 0;
                                        return (
                                            <div
                                                key={menu.id}
                                                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group ${
                                                    menu.is_available
                                                        ? 'border-coffee-200/90 hover:border-coffee-400 hover:shadow-md'
                                                        : 'border-berry-200/60 bg-stone-50/40 opacity-90'
                                                }`}
                                            >
                                                {/* Image Header with Badges */}
                                                <div className="relative w-full h-36 bg-coffee-100 overflow-hidden">
                                                    <img
                                                        src={menu.image || '/images/icon.png'}
                                                        alt={menu.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/images/icon.png';
                                                        }}
                                                    />

                                                    {/* Availability Status Pill */}
                                                    <div className="absolute top-2 right-2">
                                                        {menu.is_available ? (
                                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-matcha-600/90 text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                                Tersedia
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-berry-600/95 text-white backdrop-blur-xs shadow-xs">
                                                                Habis / Sold Out
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                                                    <div>
                                                        {/* Kategori Sajian di atas nama menu (Tanpa border, teks bold) */}
                                                        <span className="text-[11px] font-bold text-crema-600 block mb-0.5">
                                                            {menu.category_name}
                                                        </span>
                                                        <div className="flex items-start justify-between gap-1">
                                                            <h3 className="font-bold text-coffee-950 text-sm leading-snug line-clamp-1 group-hover:text-crema-700 transition">
                                                                {menu.name}
                                                            </h3>
                                                        </div>
                                                        <p className="text-[11px] text-coffee-500 line-clamp-2 mt-1 leading-relaxed min-h-[32px]">
                                                            {menu.description || 'Tidak ada deskripsi sajian.'}
                                                        </p>
                                                    </div>

                                                    {/* Price & Margin Metrics */}
                                                    <div className="p-2.5 rounded-xl bg-coffee-50/70 border border-coffee-200/60 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-semibold text-coffee-600">Harga Jual:</span>
                                                            <span className="font-mono font-black text-sm text-coffee-950">
                                                                {menu.base_price_formatted}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-coffee-200/50">
                                                            <span className="text-[10px] text-coffee-500">HPP (Modal):</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-coffee-700 text-[11px]">
                                                                    {menu.cost_price_formatted}
                                                                </span>
                                                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-matcha-50 text-matcha-700 border border-matcha-200/60">
                                                                    +{marginPercent}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="pt-2 border-t border-coffee-100 flex items-center justify-between gap-1.5">
                                                        {/* Toggle Stock Availability */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleMenu(menu)}
                                                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-1 justify-center border cursor-pointer ${
                                                                menu.is_available
                                                                    ? 'bg-stone-50 hover:bg-berry-50 text-coffee-700 hover:text-berry-700 border-coffee-200 hover:border-berry-300'
                                                                    : 'bg-matcha-50 hover:bg-matcha-100 text-matcha-800 border-matcha-300'
                                                            }`}
                                                            title={menu.is_available ? 'Tandai menu sebagai Habis / Sold Out' : 'Tandai menu sebagai Tersedia'}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${menu.is_available ? 'bg-matcha-500' : 'bg-berry-500'}`} />
                                                            <span className="text-[11px] truncate">
                                                                {menu.is_available ? 'Set Habis' : 'Set Tersedia'}
                                                            </span>
                                                        </button>

                                                        {/* Edit Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditMenu(menu)}
                                                            className="p-1.5 rounded-xl text-coffee-600 hover:text-coffee-950 hover:bg-coffee-100 border border-coffee-200/80 transition cursor-pointer"
                                                            title="Ubah detail menu, harga, atau foto"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteMenu(menu)}
                                                            className="p-1.5 rounded-xl text-berry-600 hover:text-berry-700 hover:bg-berry-50 border border-berry-200 transition cursor-pointer"
                                                            title="Hapus menu dari katalog"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: KELOLA PENGGUNA (DATA DARI TABLE USERS) */}
                    {activeTab === 'users' && (
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* Summary Mini Cards Pengguna (Ultra-Compact, Hemat Ruang) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                {/* Card 1: Total Staf */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Total Akun
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-coffee-100 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <Users className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {users.length} Staf
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        {users.filter(u => u.is_active).length} Aktif • {users.filter(u => !u.is_active).length} Suspend
                                    </p>
                                </div>

                                {/* Card 2: Super Admin */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-crema-300 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-crema-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Super Admin
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-crema-100 text-crema-800 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {superAdminCount}/2 Akun
                                    </p>
                                    <p className="text-[10px] text-crema-800 font-semibold truncate">
                                        {superAdminCount >= 2 ? 'Kuota Penuh' : `Sisa ${2 - superAdminCount} slot`}
                                    </p>
                                </div>

                                {/* Card 3: Admin Kasir */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Kasir
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-coffee-100 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {users.filter(u => u.role === 'admin_kasir').length} StafKasir POS
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Operasional
                                    </p>
                                </div>

                                {/* Card 4: Barista & Dapur */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-matcha-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-matcha-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Barista & Koki
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                                            <ChefHat className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {users.filter(u => u.role === 'barista_koki').length} Staf
                                    </p>
                                    <p className="text-[10px] text-matcha-700 font-medium truncate">
                                        Produksi Dapur KDS
                                    </p>
                                </div>
                            </div>

                            {/* Main Table Card Pengguna */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
                                {/* 1-Row Filter Toolbar on Desktop */}
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="w-3.5 h-3.5 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama, username, atau email staf..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-8 py-1.5 bg-coffee-50/70 border border-coffee-200 rounded-xl text-xs text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500 h-[36px] transition"
                                        />
                                        {userSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setUserSearchQuery('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="w-full sm:w-44 lg:w-40 flex-shrink-0">
                                        <Dropdown
                                            size="sm"
                                            options={roleFilterOptions}
                                            value={userRoleFilter}
                                            onChange={(val) => setUserRoleFilter(String(val))}
                                            placeholder="Filter Role..."
                                            triggerClassName="bg-coffee-50/70 border-coffee-200 h-[36px] text-xs"
                                        />
                                    </div>

                                    <div className="w-full sm:w-40 lg:w-36 flex-shrink-0">
                                        <Dropdown
                                            size="sm"
                                            options={statusFilterOptions}
                                            value={userStatusFilter}
                                            onChange={(val) => setUserStatusFilter(String(val))}
                                            placeholder="Filter Status..."
                                            triggerClassName="bg-coffee-50/70 border-coffee-200 h-[36px] text-xs"
                                        />
                                    </div>

                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                        onClick={() => {
                                            setCreateErrors({});
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="text-xs h-[36px] flex-shrink-0 whitespace-nowrap"
                                    >
                                        Tambah Staf Baru
                                    </Button>
                                </div>

                                {/* Responsive Table Staf (Clean Fluid Design) */}
                                <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                                    <table className="table-zebra w-full text-xs min-w-[680px]">
                                        <thead>
                                            <tr>
                                                <th className="w-10 text-center">#</th>
                                                <th className="min-w-[180px]">Pengguna</th>
                                                <th className="whitespace-nowrap">Role Akses</th>
                                                <th className="text-center whitespace-nowrap">Status</th>
                                                <th className="whitespace-nowrap">Login Terakhir</th>
                                                <th className="text-center whitespace-nowrap">Aksi Keamanan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedUsers.map((u, idx) => {
                                                const isSuperAdmin = u.role === 'pemilik';
                                                const isSelf = u.id === currentUser?.id;
                                                const isSoleSuperAdmin = isSuperAdmin && superAdminCount <= 1;

                                                return (
                                                    <tr key={u.id}>
                                                        <td className="text-center font-mono text-coffee-400 font-semibold">
                                                            {(userPage - 1) * userPageSize + idx + 1}
                                                        </td>
                                                        <td className="min-w-[180px]">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <img
                                                                    src={u.avatar_url}
                                                                    alt={u.name}
                                                                    className="w-7 h-7 rounded-full object-cover border border-coffee-200 bg-coffee-100 flex-shrink-0"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-bold text-coffee-950 truncate max-w-[200px]" title={u.name}>
                                                                        {u.name}
                                                                    </p>
                                                                    <p className="text-[11px] text-coffee-500 truncate max-w-[200px]" title={`@${u.username} • ${u.email}`}>
                                                                        @{u.username} • {u.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="whitespace-nowrap">
                                                            {u.role === 'pemilik' ? (
                                                                <Badge variant="coffee" size="sm">
                                                                    Pemilik (Super Admin)
                                                                </Badge>
                                                            ) : u.role === 'admin_kasir' ? (
                                                                <Badge variant="crema" size="sm">
                                                                    Admin Kasir
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="matcha" size="sm">
                                                                    Barista & Koki
                                                                </Badge>
                                                            )}
                                                        </td>

                                                        <td className="text-center whitespace-nowrap">
                                                            {u.is_active ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-matcha-50 text-matcha-700 border border-matcha-200 text-[10.5px] font-semibold">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-matcha-600" />
                                                                    Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-berry-50 text-berry-700 border border-berry-200 text-[10.5px] font-semibold">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-berry-600" />
                                                                    Ditangguhkan
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="text-coffee-500 text-[11px] whitespace-nowrap" title={`Login Terakhir: ${u.last_login_at}`}>
                                                            {u.last_login_at}
                                                        </td>

                                                        <td className="text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {/* Tombol Ubah / Edit Data */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 flex items-center justify-center rounded-lg border-coffee-200 hover:bg-coffee-50"
                                                                    onClick={() => openEditModal(u)}
                                                                    title="Ubah Profil & Hak Akses"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5 text-coffee-700" />
                                                                </Button>

                                                                {/* Tombol Reset Password Cepat */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 flex items-center justify-center rounded-lg border-coffee-200 hover:bg-coffee-50"
                                                                    onClick={() => handleResetPassword(u)}
                                                                    title="Reset Password ke default (password123)"
                                                                >
                                                                    <KeyRound className="w-3.5 h-3.5 text-coffee-600" />
                                                                </Button>

                                                                {/* Tombol Suspend / Aktifkan */}
                                                                <Button
                                                                    variant={u.is_active ? 'danger' : 'outline'}
                                                                    size="sm"
                                                                    className={`h-7 w-7 p-0 flex items-center justify-center rounded-lg ${
                                                                        !u.is_active ? 'border-matcha-200 text-matcha-700 hover:bg-matcha-50' : ''
                                                                    }`}
                                                                    disabled={isSuperAdmin}
                                                                    onClick={() => handleToggleUser(u)}
                                                                    title={
                                                                        isSuperAdmin
                                                                            ? 'Super Admin memiliki proteksi imunitas dan tidak dapat disuspend'
                                                                            : u.is_active
                                                                            ? 'Suspend Akun'
                                                                            : 'Aktifkan Akun'
                                                                    }
                                                                >
                                                                    {u.is_active ? (
                                                                        <UserX className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <UserCheck className="w-3.5 h-3.5 text-matcha-600" />
                                                                    )}
                                                                </Button>

                                                                {/* Tombol Hapus Akun */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className={`h-7 w-7 p-0 flex items-center justify-center rounded-lg ${
                                                                        isSelf || isSoleSuperAdmin
                                                                            ? 'opacity-40 cursor-not-allowed bg-coffee-100 text-coffee-400 border-coffee-200'
                                                                            : 'text-berry-700 hover:text-white hover:bg-berry-600 border-berry-200 hover:border-berry-600'
                                                                    }`}
                                                                    disabled={isSelf || isSoleSuperAdmin}
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    title={
                                                                        isSelf
                                                                            ? 'Proteksi Keamanan: Anda tidak dapat menghapus akun Anda sendiri'
                                                                            : isSoleSuperAdmin
                                                                            ? 'Proteksi Keamanan: Wajib ada minimal 1 akun Super Admin di sistem'
                                                                            : 'Hapus Akun Staf'
                                                                    }
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredUsers.length === 0 && (
                                    <div className="py-12 text-center text-coffee-400">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-xs font-semibold">Tidak ada pengguna yang cocok dengan filter.</p>
                                    </div>
                                )}

                                {/* Custom Pagination Pengguna */}
                                {filteredUsers.length > 0 && (
                                    <Pagination
                                        currentPage={userPage}
                                        totalPages={totalUserPages}
                                        totalItems={filteredUsers.length}
                                        itemsPerPage={userPageSize}
                                        onPageChange={setUserPage}
                                        className="pt-2 border-t border-coffee-100"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INVENTARIS & KELOLA STOK REAL-TIME */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* Summary Mini Cards Inventaris (Ultra-Compact, Hemat Ruang) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                {/* Card 1: Total Bahan */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Total Bahan
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-coffee-100 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {ingredients.length} Item
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Tersinkronisasi menu
                                    </p>
                                </div>

                                {/* Card 2: Nilai Aset Stok */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-crema-300 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-crema-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Nilai Aset Stok
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-crema-100 text-crema-800 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.total_inventory_asset_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Kalkulasi riil HPP
                                    </p>
                                </div>

                                {/* Card 3: Stok Menipis */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-crema-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-crema-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Stok Menipis
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-crema-50 text-crema-700 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-crema-900 tracking-tight truncate leading-tight">
                                        {kpi.critical_count ?? 0} Bahan
                                    </p>
                                    <p className="text-[10px] text-crema-700 font-medium truncate">
                                        Di bawah batas minimum
                                    </p>
                                </div>

                                {/* Card 4: Stok Habis */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-berry-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-berry-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Stok Habis (0)
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-berry-900 tracking-tight truncate leading-tight">
                                        {kpi.out_of_stock_count ?? 0} Bahan
                                    </p>
                                    <p className="text-[10px] text-berry-600 font-medium truncate">
                                        Perlu restock segera
                                    </p>
                                </div>
                            </div>

                            {/* Main Content Card: Filter Bar & Zebra Table */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
                                {/* 1-Row Filter Toolbar on Desktop */}
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="w-3.5 h-3.5 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={inventorySearchQuery}
                                                onChange={(e) => setInventorySearchQuery(e.target.value)}
                                                placeholder="Cari nama bahan baku, satuan, atau resep menu..."
                                                className="w-full pl-8 pr-8 py-1.5 text-xs border border-coffee-200 rounded-xl bg-coffee-50/70 focus:bg-white focus:outline-none focus:border-coffee-500 transition-colors h-[36px]"
                                            />
                                            {inventorySearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setInventorySearchQuery('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-48 lg:w-44 flex-shrink-0">
                                            <Dropdown
                                                size="sm"
                                                options={inventoryStatusOptions}
                                                value={inventoryStatusFilter}
                                                onChange={(val) => setInventoryStatusFilter(val as any)}
                                                placeholder="Filter Status Stok..."
                                                triggerClassName="bg-coffee-50/70 border-coffee-200 h-[36px] text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs border-coffee-300 hover:bg-coffee-50 h-[36px] whitespace-nowrap"
                                            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-crema-600" />}
                                            onClick={() => openAdjustStockModal()}
                                        >
                                            Penyesuaian Stok Cepat
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="text-xs h-[36px] whitespace-nowrap"
                                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                                            onClick={() => {
                                                setCreateIngredientErrors({});
                                                setIsCreateIngredientOpen(true);
                                            }}
                                        >
                                            Tambah Bahan Baku
                                        </Button>
                                    </div>
                                </div>

                                {/* Responsive Zebra Table Inventaris (Clean Fluid Design) */}
                                <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                                    <table className="table-zebra w-full text-xs min-w-[860px]">
                                        <thead>
                                            <tr>
                                                <th className="w-10 text-center">#</th>
                                                <th className="min-w-[160px]">Nama Bahan Baku</th>
                                                <th className="text-center whitespace-nowrap">Satuan</th>
                                                <th className="text-right whitespace-nowrap">Stok Saat Ini</th>
                                                <th className="text-center whitespace-nowrap">Status</th>
                                                <th className="text-right whitespace-nowrap">Batas Min.</th>
                                                <th className="text-right whitespace-nowrap">HPP Satuan</th>
                                                <th className="text-right whitespace-nowrap">Nilai Aset</th>
                                                <th className="text-center whitespace-nowrap">Menu Terkait</th>
                                                <th className="text-center whitespace-nowrap">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedIngredients.map((ing, idx) => {
                                                return (
                                                    <tr key={ing.id}>
                                                        <td className="text-center font-mono text-coffee-400 font-semibold">
                                                            {(inventoryPage - 1) * inventoryPageSize + idx + 1}
                                                        </td>
                                                        <td className="min-w-[160px]">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="font-bold text-coffee-950 text-xs truncate max-w-[180px]" title={ing.name}>
                                                                    {ing.name}
                                                                </span>
                                                                {!ing.is_active && (
                                                                    <span className="px-1.5 py-0.2 bg-coffee-200 text-coffee-600 text-[10px] rounded font-semibold flex-shrink-0" title="Bahan Nonaktif">
                                                                        Nonaktif
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-center font-mono text-coffee-600 font-semibold uppercase whitespace-nowrap" title={`Satuan Takaran: ${ing.unit}`}>
                                                            {ing.unit}
                                                        </td>
                                                        <td className="text-right whitespace-nowrap" title={`Stok Saat Ini: ${ing.stock} ${ing.unit}`}>
                                                            <span className="font-mono font-bold text-coffee-950 text-xs">
                                                                {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(ing.stock)}
                                                            </span>
                                                            <span className="text-[11px] text-coffee-500 ml-1">
                                                                {ing.unit}
                                                            </span>
                                                        </td>
                                                        <td className="text-center whitespace-nowrap">
                                                            {ing.status === 'habis' ? (
                                                                <Badge variant="berry" size="sm">
                                                                    Habis (0)
                                                                </Badge>
                                                            ) : ing.status === 'menipis' ? (
                                                                <Badge variant="crema" size="sm">
                                                                    Menipis
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="matcha" size="sm">
                                                                    Aman
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="text-right font-mono text-coffee-600 whitespace-nowrap" title={`Batas Stok Minimum: ${ing.min_stock} ${ing.unit}`}>
                                                            {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(ing.min_stock)} {ing.unit}
                                                        </td>
                                                        <td className="text-right font-mono text-coffee-700 whitespace-nowrap" title={`HPP Satuan: ${ing.cost_per_unit_formatted} per ${ing.unit}`}>
                                                            {ing.cost_per_unit_formatted}
                                                        </td>
                                                        <td className="text-right font-mono font-bold text-coffee-950 whitespace-nowrap" title={`Total Nilai Aset: ${ing.total_asset_formatted}`}>
                                                            {ing.total_asset_formatted}
                                                        </td>
                                                        <td className="text-center whitespace-nowrap">
                                                            {ing.recipes_count > 0 ? (
                                                                <span
                                                                    className="px-2 py-0.5 bg-coffee-100 text-coffee-800 text-[11px] font-bold rounded-full cursor-default"
                                                                    title={ing.used_in_menus.length > 0 ? `Digunakan dalam resep: ${ing.used_in_menus.join(', ')}` : `${ing.recipes_count} Menu`}
                                                                >
                                                                    {ing.recipes_count} Menu
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-coffee-400" title="Belum terhubung ke resep menu manapun">
                                                                    Bebas
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6.5 px-2 text-[10.5px] text-coffee-700 hover:text-coffee-950 hover:bg-coffee-100 rounded-lg"
                                                                    leftIcon={<SlidersHorizontal className="w-3 h-3 text-crema-600" />}
                                                                    onClick={() => openAdjustStockModal(ing)}
                                                                    title="Sesuaikan Stok / Restock Masuk / Catat Waste"
                                                                >
                                                                    Stok
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6.5 w-6.5 p-0 text-coffee-700 hover:text-coffee-950 hover:bg-coffee-100 rounded-lg"
                                                                    onClick={() => openEditIngredientModal(ing)}
                                                                    title="Ubah Parameter Bahan Baku"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6.5 w-6.5 p-0 text-berry-600 hover:text-berry-800 hover:bg-berry-50 rounded-lg"
                                                                    onClick={() => handleDeleteIngredient(ing)}
                                                                    title="Hapus Bahan Baku dari Inventaris"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredIngredients.length === 0 && (
                                    <div className="py-12 text-center text-coffee-400 space-y-2">
                                        <Package className="w-8 h-8 mx-auto opacity-40" />
                                        <p className="text-xs font-semibold">Tidak ada bahan baku yang cocok dengan pencarian / filter.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-coffee-600"
                                            onClick={() => {
                                                setInventorySearchQuery('');
                                                setInventoryStatusFilter('all');
                                            }}
                                        >
                                            Reset Filter
                                        </Button>
                                    </div>
                                )}

                                {/* Custom Pagination Inventaris */}
                                {filteredIngredients.length > 0 && (
                                    <Pagination
                                        currentPage={inventoryPage}
                                        totalPages={totalInventoryPages}
                                        totalItems={filteredIngredients.length}
                                        itemsPerPage={inventoryPageSize}
                                        onPageChange={setInventoryPage}
                                        className="pt-2 border-t border-coffee-100"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: RIWAYAT MUTASI STOK, BAHAN RUSAK & OPNAME FISIK */}
                    {activeTab === 'mutations' && (
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* Summary Mini Cards Mutasi (Ultra-Compact, Hemat Ruang) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                {/* Card 1: Total Kerugian Waste */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-berry-200/80 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-berry-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Kerugian Rusak
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-berry-900 tracking-tight truncate leading-tight">
                                        {kpi.total_waste_cost_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className="text-[10px] text-berry-600 font-medium truncate">
                                        {kpi.total_waste_count ?? countWasteMutations} insiden waste
                                    </p>
                                </div>

                                {/* Card 2: Koreksi Opname Fisik */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-crema-300 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-crema-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Opname Fisik
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-crema-100 text-crema-800 flex items-center justify-center flex-shrink-0">
                                            <SlidersHorizontal className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.total_adjustment_count ?? countAdjustmentMutations} Koreksi
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Audit fisik vs sistem
                                    </p>
                                </div>

                                {/* Card 3: Restock Supplier Masuk */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-matcha-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-matcha-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Restock Masuk
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                                            <ArrowDownRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {kpi.total_restock_count ?? countInMutations} Penerimaan
                                    </p>
                                    <p className="text-[10px] text-matcha-700 font-medium truncate">
                                        Faktur supplier masuk
                                    </p>
                                </div>

                                {/* Card 4: Total Log Mutasi */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-coffee-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-coffee-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Total Mutasi
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-coffee-100 text-coffee-700 flex items-center justify-center flex-shrink-0">
                                            <ClipboardList className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {countAllMutations} Log
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Tersinkronisasi live
                                    </p>
                                </div>
                            </div>

                            {/* Main Table Card Mutasi */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
                                {/* 1-Row Filter Toolbar on Desktop */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                                        <div className="relative flex-1 min-w-[180px]">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                                            <input
                                                type="text"
                                                value={mutationSearchQuery}
                                                onChange={(e) => setMutationSearchQuery(e.target.value)}
                                                placeholder="Cari nama bahan, no referensi, catatan, atau staf..."
                                                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 transition-all text-coffee-900 placeholder:text-coffee-400 h-[36px]"
                                            />
                                            {mutationSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMutationSearchQuery('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 text-xs"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-48 lg:w-52 flex-shrink-0">
                                            <Dropdown
                                                size="sm"
                                                options={mutationTypeOptions}
                                                value={mutationTypeFilter}
                                                onChange={(val) => setMutationTypeFilter(String(val) as any)}
                                                placeholder="Filter Jenis Mutasi..."
                                                triggerClassName="bg-coffee-50/70 border-coffee-200 h-[36px] text-xs"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="primary"
                                        leftIcon={<Plus className="w-3.5 h-3.5 flex-shrink-0" />}
                                        onClick={() => {
                                            openAdjustStockModal();
                                            setAdjustStockForm((prev) => ({ ...prev, type: 'waste' }));
                                        }}
                                        className="text-xs h-[36px] w-full sm:w-auto flex-shrink-0 whitespace-nowrap inline-flex flex-row items-center justify-center gap-1.5"
                                    >
                                        <span className="whitespace-nowrap">Catat Mutasi/Opname</span>
                                    </Button>
                                </div>

                                {/* Table Riwayat Mutasi (Clean Fluid Design) */}
                                <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                                    <table className="table-zebra w-full text-xs min-w-[880px]">
                                        <thead>
                                            <tr>
                                                <th className="w-10 text-center">#</th>
                                                <th className="whitespace-nowrap">Waktu & Tanggal</th>
                                                <th className="min-w-[150px]">Bahan Baku</th>
                                                <th className="text-center whitespace-nowrap">Jenis Mutasi</th>
                                                <th className="text-right whitespace-nowrap">Perubahan Stok</th>
                                                <th className="text-right whitespace-nowrap">Biaya / Kerugian</th>
                                                <th className="min-w-[180px]">Referensi & Catatan</th>
                                                <th className="text-center whitespace-nowrap">Penanggung Jawab</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedStockLogs.map((log, idx) => {
                                                const isWaste = log.type === 'waste';
                                                const isAdj = log.type === 'adjustment';
                                                const isIn = log.type === 'in';
                                                const isOut = log.type === 'out';

                                                return (
                                                    <tr key={log.id}>
                                                        {/* Number */}
                                                        <td className="text-center font-mono text-coffee-400 font-semibold">
                                                            {(mutationPage - 1) * mutationPageSize + idx + 1}
                                                        </td>

                                                        {/* Time & Date */}
                                                        <td className="whitespace-nowrap" title={`${log.created_at} (${log.time_ago})`}>
                                                            <div className="font-semibold text-coffee-950">
                                                                {log.created_at}
                                                            </div>
                                                            <div className="text-[10.5px] text-coffee-400 font-medium">
                                                                {log.time_ago}
                                                            </div>
                                                        </td>

                                                        {/* Ingredient Name */}
                                                        <td className="min-w-[150px]">
                                                            <div className="font-bold text-coffee-950 text-xs truncate max-w-[180px]" title={log.ingredient_name}>
                                                                {log.ingredient_name}
                                                            </div>
                                                            <div className="text-[10.5px] text-coffee-500 font-mono" title={`Satuan Takaran: ${log.unit}`}>
                                                                Satuan: {log.unit}
                                                            </div>
                                                        </td>

                                                        {/* Type Badge */}
                                                        <td className="text-center whitespace-nowrap">
                                                            {isWaste && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-berry-50 text-berry-700 border border-berry-200" title="Bahan Rusak / Limbah Kadaluarsa">
                                                                    <AlertTriangle className="w-3 h-3 text-berry-600" />
                                                                    Bahan Rusak
                                                                </span>
                                                            )}
                                                            {isAdj && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-crema-100 text-crema-800 border border-crema-300" title="Penyesuaian Selisih Opname Fisik">
                                                                    <SlidersHorizontal className="w-3 h-3 text-crema-700" />
                                                                    Opname Fisik
                                                                </span>
                                                            )}
                                                            {isIn && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-matcha-50 text-matcha-700 border border-matcha-200" title="Pasokan Masuk dari Supplier">
                                                                    <ArrowDownRight className="w-3 h-3 text-matcha-600" />
                                                                    Restock Masuk
                                                                </span>
                                                            )}
                                                            {isOut && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-coffee-100 text-coffee-700 border border-coffee-200" title="Pengurangan Otomatis dari Transaksi POS">
                                                                    <Coffee className="w-3 h-3 text-coffee-500" />
                                                                    Pemakaian POS
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Quantity */}
                                                        <td className="text-right whitespace-nowrap font-mono" title={`Kuantitas Perubahan: ${log.quantity} ${log.unit}`}>
                                                            {isIn && (
                                                                <span className="font-bold text-matcha-700 text-xs">
                                                                    +{log.quantity.toLocaleString('id-ID')} {log.unit}
                                                                </span>
                                                            )}
                                                            {isWaste && (
                                                                <span className="font-bold text-berry-700 text-xs">
                                                                    -{log.quantity.toLocaleString('id-ID')} {log.unit}
                                                                </span>
                                                            )}
                                                            {isAdj && (
                                                                <span className="font-bold text-crema-800 text-xs">
                                                                    ~{log.quantity.toLocaleString('id-ID')} {log.unit}
                                                                </span>
                                                            )}
                                                            {isOut && (
                                                                <span className="font-medium text-coffee-600 text-xs">
                                                                    -{log.quantity.toLocaleString('id-ID')} {log.unit}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Cost / Kerugian */}
                                                        <td className="text-right whitespace-nowrap" title={log.cost > 0 ? `Nominal: ${log.cost_formatted}` : '-'}>
                                                            {log.cost > 0 ? (
                                                                <div>
                                                                    <span className={`font-mono font-bold text-xs ${isWaste ? 'text-berry-700' : 'text-coffee-950'}`}>
                                                                        {log.cost_formatted}
                                                                    </span>
                                                                    {isWaste && (
                                                                        <div className="text-[10px] text-berry-600 font-semibold">
                                                                            Kerugian Rusak
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-coffee-400 font-mono text-[11px]">-</span>
                                                            )}
                                                        </td>

                                                        {/* Reference & Notes */}
                                                        <td className="min-w-[180px]">
                                                            <div
                                                                className="font-semibold text-coffee-900 text-xs truncate max-w-xs cursor-default"
                                                                title={`Referensi: ${log.reference || (isWaste ? 'Bahan Rusak / Limbah' : isAdj ? 'Penyesuaian Opname' : isIn ? 'Restock Bahan' : 'Pesanan POS')}`}
                                                            >
                                                                {log.reference || (isWaste ? 'Bahan Rusak / Limbah' : isAdj ? 'Penyesuaian Opname' : isIn ? 'Restock Bahan' : 'Pesanan POS')}
                                                            </div>
                                                            {log.notes ? (
                                                                <p
                                                                    className="text-[10.5px] text-coffee-600 mt-0.5 truncate max-w-xs italic cursor-default"
                                                                    title={`Catatan Staf: "${log.notes}"`}
                                                                >
                                                                    "{log.notes}"
                                                                </p>
                                                            ) : (
                                                                <span className="text-coffee-400 text-[10px] italic">Tidak ada catatan</span>
                                                            )}
                                                        </td>

                                                        {/* Responsible User */}
                                                        <td className="text-center whitespace-nowrap">
                                                            <div
                                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-coffee-50 border border-coffee-200 cursor-default"
                                                                title={`Dicatat oleh Staf: ${log.user_name}`}
                                                            >
                                                                <div className="w-4.5 h-4.5 rounded-full bg-coffee-800 text-crema-300 font-bold text-[9.5px] flex items-center justify-center">
                                                                    {log.user_name.slice(0, 1).toUpperCase()}
                                                                </div>
                                                                <span className="text-[10.5px] font-semibold text-coffee-900">
                                                                    {log.user_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredStockLogs.length === 0 && (
                                    <div className="py-12 text-center text-coffee-400 space-y-2">
                                        <ClipboardList className="w-8 h-8 mx-auto opacity-40" />
                                        <p className="text-xs font-semibold">Tidak ada data mutasi yang cocok dengan pencarian / filter.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-coffee-600"
                                            onClick={() => {
                                                setMutationSearchQuery('');
                                                setMutationTypeFilter('all');
                                            }}
                                        >
                                            Reset Filter Mutasi
                                        </Button>
                                    </div>
                                )}

                                {/* Custom Pagination Mutasi */}
                                {filteredStockLogs.length > 0 && (
                                    <Pagination
                                        currentPage={mutationPage}
                                        totalPages={totalMutationPages}
                                        totalItems={filteredStockLogs.length}
                                        itemsPerPage={mutationPageSize}
                                        onPageChange={setMutationPage}
                                        className="pt-2 border-t border-coffee-100"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: LABA RUGI & ARUS KAS FINANSIAL */}
                    {activeTab === 'finance' && (
                        <div className="space-y-3 sm:space-y-3.5">
                            {/* 4 Summary Mini Cards Laba Rugi (Ultra-Compact, Hemat Ruang) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                                {/* Card 1: Total Pemasukan Kas POS */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-matcha-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-matcha-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Pemasukan Penjualan
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {financial_summary?.gross_revenue_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className="text-[10px] text-matcha-700 font-semibold truncate">
                                        {kpi.total_orders} Pesanan Selesai
                                    </p>
                                </div>

                                {/* Card 2: Total Pengeluaran Kas (Belanja Stok + Waste) */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-berry-200/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-berry-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Pengeluaran Kas
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                                            <ArrowDownLeft className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {financial_summary?.total_expense_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className="text-[10px] text-coffee-500 font-medium truncate">
                                        Belanja Stok + Kerugian Rusak
                                    </p>
                                </div>

                                {/* Card 3: Laba Kotor Resep (Gross Profit) */}
                                <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-crema-300/90 shadow-2xs space-y-0.5 min-w-0">
                                    <div className="flex items-center justify-between text-crema-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Laba Kotor Resep
                                        </span>
                                        <div className="w-5 h-5 rounded-md bg-crema-100 text-crema-800 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-coffee-950 tracking-tight truncate leading-tight">
                                        {financial_summary?.gross_profit_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className="text-[10px] text-crema-800 font-semibold truncate">
                                        +{financial_summary?.gross_margin_percent ?? 0}% Margin Resep
                                    </p>
                                </div>

                                {/* Card 4: Arus Kas Bersih (Net Profit / Net Cash Flow) */}
                                <div className={`p-2.5 sm:p-3 bg-white rounded-xl border shadow-2xs space-y-0.5 min-w-0 ${financial_summary?.is_surplus ? 'border-matcha-200/90' : 'border-berry-200/90'}`}>
                                    <div className={`flex items-center justify-between ${financial_summary?.is_surplus ? 'text-matcha-700' : 'text-berry-700'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                            Arus Kas Bersih (Net)
                                        </span>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${financial_summary?.is_surplus ? 'bg-matcha-50 text-matcha-700' : 'bg-berry-50 text-berry-700'}`}>
                                            <Wallet className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <p className={`text-sm sm:text-lg font-black tracking-tight truncate leading-tight ${financial_summary?.is_surplus ? 'text-matcha-800' : 'text-berry-700'}`}>
                                        {financial_summary?.net_cash_flow_formatted ?? 'Rp 0'}
                                    </p>
                                    <p className={`text-[10px] font-bold truncate ${financial_summary?.is_surplus ? 'text-matcha-700' : 'text-berry-700'}`}>
                                        {financial_summary?.is_surplus ? '● Surplus Kas Bertambah' : '▲ Defisit Kas'}
                                    </p>
                                </div>
                            </div>

                            {/* Main Table Card Buku Kas & Ledger Finansial */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-3.5 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4">
                                {/* 1-Row Filter Toolbar on Desktop */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                                        <div className="relative flex-1 min-w-[180px]">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                                            <input
                                                type="text"
                                                value={financeSearchQuery}
                                                onChange={(e) => setFinanceSearchQuery(e.target.value)}
                                                placeholder="Cari no order, nama bahan, catatan, kasir..."
                                                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 transition-all text-coffee-900 placeholder:text-coffee-400 h-[36px]"
                                            />
                                            {financeSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFinanceSearchQuery('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 text-xs"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-56 lg:w-52 flex-shrink-0">
                                            <Dropdown
                                                size="sm"
                                                options={financeFlowOptions}
                                                value={financeFlowFilter}
                                                onChange={(val) => setFinanceFlowFilter(String(val) as any)}
                                                placeholder="Filter Aliran Kas..."
                                                triggerClassName="bg-coffee-50/70 border-coffee-200 h-[36px] text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Info Rincian Ringkas di Toolbar */}
                                    <div className="hidden lg:flex items-center gap-3 text-xs text-coffee-600 bg-coffee-50/80 px-3 py-1.5 rounded-xl border border-coffee-200/70">
                                        <span>
                                            Masuk: <strong className="text-matcha-700">+{financial_summary?.gross_revenue_formatted ?? 'Rp 0'}</strong>
                                        </span>
                                        <span className="text-coffee-300">•</span>
                                        <span>
                                            Keluar: <strong className="text-berry-700">-{financial_summary?.total_expense_formatted ?? 'Rp 0'}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Table Ledger Finansial (Clean Fluid Design) */}
                                <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                                    <table className="table-zebra w-full text-xs min-w-[920px]">
                                        <thead>
                                            <tr>
                                                <th className="w-12 text-center">#</th>
                                                <th className="min-w-[130px]">WAKTU & TANGGAL</th>
                                                <th className="min-w-[125px]">ALIRAN KAS</th>
                                                <th className="min-w-[140px]">KATEGORI</th>
                                                <th className="min-w-[200px]">KETERANGAN / TRANSAKSI</th>
                                                <th className="min-w-[125px] text-right">NOMINAL (+/-)</th>
                                                <th className="min-w-[120px] text-center">PENANGGUNG JAWAB</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedFinancialLedger.map((item, idx) => {
                                                const rowNumber = (financePage - 1) * financePageSize + idx + 1;
                                                const isIncome = item.type === 'income';
                                                const isWaste = item.type === 'waste';

                                                return (
                                                    <tr key={item.id}>
                                                        <td className="text-center font-bold text-coffee-500 whitespace-nowrap">
                                                            {rowNumber}
                                                        </td>

                                                        {/* Waktu & Tanggal */}
                                                        <td className="whitespace-nowrap">
                                                            <div className="font-semibold text-coffee-950">
                                                                {item.created_at}
                                                            </div>
                                                            <div className="text-[10px] text-coffee-400">
                                                                {item.time_ago}
                                                            </div>
                                                        </td>

                                                        {/* Aliran Kas Badge */}
                                                        <td className="whitespace-nowrap">
                                                            {isIncome ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-matcha-50 text-matcha-800 border border-matcha-200">
                                                                    <ArrowUpRight className="w-3 h-3 text-matcha-700 flex-shrink-0" />
                                                                    Kas Masuk
                                                                </span>
                                                            ) : isWaste ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-berry-50 text-berry-800 border border-berry-200">
                                                                    <AlertTriangle className="w-3 h-3 text-berry-700 flex-shrink-0" />
                                                                    Kerugian Rusak
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-coffee-100 text-coffee-900 border border-coffee-300">
                                                                    <ArrowDownLeft className="w-3 h-3 text-coffee-700 flex-shrink-0" />
                                                                    Kas Belanja
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Kategori */}
                                                        <td className="whitespace-nowrap">
                                                            <span className="font-semibold text-coffee-900">
                                                                {item.category}
                                                            </span>
                                                        </td>

                                                        {/* Keterangan & Deskripsi Transaksi */}
                                                        <td className="max-w-[240px]">
                                                            <div className="font-bold text-coffee-950 truncate" title={item.title}>
                                                                {item.title}
                                                            </div>
                                                            <div className="text-[11px] text-coffee-600 truncate" title={item.description}>
                                                                {item.description}
                                                            </div>
                                                            {item.cogs_formatted && (
                                                                <div className="text-[10px] text-crema-800 font-medium">
                                                                    {item.cogs_formatted}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Nominal (+/-) */}
                                                        <td className="text-right whitespace-nowrap font-mono font-bold text-sm">
                                                            {isIncome ? (
                                                                <span className="text-matcha-800">
                                                                    {item.amount_formatted}
                                                                </span>
                                                            ) : isWaste ? (
                                                                <span className="text-berry-700">
                                                                    {item.amount_formatted}
                                                                </span>
                                                            ) : (
                                                                <span className="text-coffee-900">
                                                                    {item.amount_formatted}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Penanggung Jawab */}
                                                        <td className="text-center whitespace-nowrap">
                                                            <div
                                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-coffee-50 border border-coffee-200 cursor-default"
                                                                title={`Staf Terkait: ${item.user_name}`}
                                                            >
                                                                <div className="w-4.5 h-4.5 rounded-full bg-coffee-800 text-crema-300 font-bold text-[9.5px] flex items-center justify-center">
                                                                    {item.user_name.slice(0, 1).toUpperCase()}
                                                                </div>
                                                                <span className="text-[10.5px] font-semibold text-coffee-900">
                                                                    {item.user_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredFinancialLedger.length === 0 && (
                                    <div className="py-12 text-center text-coffee-400 space-y-2">
                                        <Wallet className="w-8 h-8 mx-auto opacity-40" />
                                        <p className="text-xs font-semibold">Tidak ada transaksi finansial yang sesuai dengan pencarian / filter.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-coffee-600"
                                            onClick={() => {
                                                setFinanceSearchQuery('');
                                                setFinanceFlowFilter('all');
                                            }}
                                        >
                                            Reset Filter Finansial
                                        </Button>
                                    </div>
                                )}

                                {/* Custom Pagination Laba Rugi */}
                                {filteredFinancialLedger.length > 0 && (
                                    <Pagination
                                        currentPage={financePage}
                                        totalPages={totalFinancePages}
                                        totalItems={filteredFinancialLedger.length}
                                        itemsPerPage={financePageSize}
                                        onPageChange={setFinancePage}
                                        className="pt-2 border-t border-coffee-100"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: PENGATURAN TOKO & VOUCHER DISKON */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* MANAJEMEN VOUCHER & KUPON DISKON*/}
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-coffee-200 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-md">
                                        <input
                                            type="text"
                                            value={promoSearchQuery}
                                            onChange={(e) => {
                                                setPromoSearchQuery(e.target.value);
                                                setPromoPage(1);
                                            }}
                                            placeholder="Cari berdasarkan kode voucher atau nama promo..."
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                        />
                                        <Tag className="w-4 h-4 text-coffee-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        {promoSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPromoSearchQuery('');
                                                    setPromoPage(1);
                                                }}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-coffee-400 hover:text-coffee-600"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPromoStatusFilter('all');
                                                    setPromoPage(1);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    promoStatusFilter === 'all'
                                                        ? 'bg-coffee-900 text-white shadow-2xs'
                                                        : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
                                                }`}
                                            >
                                                Semua ({(promos || []).length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPromoStatusFilter('active');
                                                    setPromoPage(1);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    promoStatusFilter === 'active'
                                                        ? 'bg-matcha-700 text-white shadow-2xs'
                                                        : 'bg-matcha-50 text-matcha-800 hover:bg-matcha-100'
                                                }`}
                                            >
                                                Aktif ({activePromosCount})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPromoStatusFilter('inactive');
                                                    setPromoPage(1);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                    promoStatusFilter === 'inactive'
                                                        ? 'bg-coffee-700 text-white shadow-2xs'
                                                        : 'bg-coffee-50 text-coffee-600 hover:bg-coffee-100'
                                                }`}
                                            >
                                                Nonaktif ({inactivePromosCount})
                                            </button>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => {
                                                resetPromoForm();
                                                setIsPromoModalOpen(true);
                                            }}
                                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                                            className="text-xs h-[34px] px-3.5 font-bold"
                                        >
                                            Tambah Voucher
                                        </Button>
                                    </div>
                                </div>

                                {/* Tabel Daftar Voucher Diskon */}
                                <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs overflow-hidden">
                                    {filteredPromos.length === 0 ? (
                                        <div className="py-12 text-center px-4">
                                            <div className="w-12 h-12 rounded-2xl bg-coffee-100 text-coffee-600 flex items-center justify-center mx-auto mb-3">
                                                <Ticket className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-sm font-bold text-coffee-950">
                                                {promoSearchQuery ? 'Voucher Tidak Ditemukan' : 'Belum Ada Voucher Diskon'}
                                            </h3>
                                            <p className="text-xs text-coffee-500 max-w-sm mx-auto mt-1">
                                                {promoSearchQuery
                                                    ? `Tidak ada kupon yang cocok dengan kata kunci "${promoSearchQuery}".`
                                                    : 'Buat voucher diskon baru untuk memberikan promosi potongan harga kepada pelanggan kafe.'}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => {
                                                    resetPromoForm();
                                                    setIsPromoModalOpen(true);
                                                }}
                                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                                                className="mt-4 text-xs h-[36px] px-4 mx-auto"
                                            >
                                                Tambah Voucher Sekarang
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto scrollbar-thin">
                                            <table className="w-full text-left text-xs text-coffee-950 min-w-[760px]">
                                                <thead>
                                                    <tr className="border-b border-coffee-200 bg-coffee-50/70 text-[11px] font-bold text-coffee-700 uppercase tracking-wider">
                                                        <th className="py-3 px-4">Kode & Nama Voucher</th>
                                                        <th className="py-3 px-4">Nilai Diskon</th>
                                                        <th className="py-3 px-4">Syarat & Ketentuan</th>
                                                        <th className="py-3 px-4">Periode Aktif</th>
                                                        <th className="py-3 px-4 text-center">Status Operasional</th>
                                                        <th className="py-3 px-4 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-coffee-100">
                                                    {paginatedPromos.map((promo) => (
                                                        <tr key={promo.id} className="hover:bg-coffee-50/40 transition">
                                                            {/* Kode & Nama */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-coffee-100 text-coffee-900 border border-coffee-200 tracking-wider">
                                                                        {promo.code}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-bold text-coffee-950 text-xs">
                                                                            {promo.name}
                                                                        </p>
                                                                        <p className="text-[10.5px] text-coffee-400">
                                                                            Dibuat {promo.created_at}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Nilai Diskon */}
                                                            <td className="py-3 px-4">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                                                                    promo.discount_type === 'percentage'
                                                                        ? 'bg-matcha-50 text-matcha-800 border border-matcha-200'
                                                                        : 'bg-crema-100 text-crema-900 border border-crema-200'
                                                                }`}>
                                                                    {promo.discount_type === 'percentage' ? (
                                                                        <Percent className="w-3 h-3" />
                                                                    ) : (
                                                                        <span>Rp</span>
                                                                    )}
                                                                    {promo.discount_value_formatted}
                                                                </span>
                                                            </td>

                                                            {/* Syarat & Ketentuan */}
                                                            <td className="py-3 px-4">
                                                                <div className="space-y-0.5 text-[11px]">
                                                                    <p className="text-coffee-700">
                                                                        <span className="text-coffee-400">Min. Belanja:</span>{' '}
                                                                        <span className="font-semibold">{promo.min_order_amount_formatted}</span>
                                                                    </p>
                                                                    {promo.discount_type === 'percentage' && promo.max_discount_amount && (
                                                                        <p className="text-coffee-700">
                                                                            <span className="text-coffee-400">Maks. Potongan:</span>{' '}
                                                                            <span className="font-semibold">{promo.max_discount_amount_formatted}</span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Periode */}
                                                            <td className="py-3 px-4">
                                                                <div className="text-[11px] text-coffee-700">
                                                                    {promo.start_date || promo.end_date ? (
                                                                        <p className="flex items-center gap-1 font-medium">
                                                                            <Calendar className="w-3 h-3 text-coffee-400" />
                                                                            {promo.start_date || 'Awal'} s/d {promo.end_date || 'Seterusnya'}
                                                                        </p>
                                                                    ) : (
                                                                        <span className="text-matcha-700 font-semibold bg-matcha-50 px-2 py-0.5 rounded-full border border-matcha-200 text-[10px]">
                                                                            Berlaku Seterusnya
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Status Operasional Switch */}
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    disabled={isTogglingPromoId === promo.id}
                                                                    onClick={() => handleTogglePromo(promo)}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                                                                        promo.is_active
                                                                            ? 'bg-matcha-50 text-matcha-800 border-matcha-300 hover:bg-matcha-100'
                                                                            : 'bg-coffee-100 text-coffee-500 border-coffee-200 hover:bg-coffee-200'
                                                                    } ${isTogglingPromoId === promo.id ? 'opacity-50 cursor-wait' : ''}`}
                                                                    title={promo.is_active ? 'Klik untuk menonaktifkan voucher ini' : 'Klik untuk mengaktifkan voucher ini'}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${promo.is_active ? 'bg-matcha-500' : 'bg-coffee-400'}`} />
                                                                    <span>{promo.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                                </button>
                                                            </td>

                                                            {/* Aksi */}
                                                            <td className="py-3 px-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    disabled={isDeletingPromoId === promo.id}
                                                                    onClick={() => handleDeletePromo(promo)}
                                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-berry-600 hover:text-berry-700 hover:bg-berry-50 transition cursor-pointer disabled:opacity-40"
                                                                    title="Hapus voucher ini"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Pagination Kupon Voucher (Maksimal 5 data / halaman) */}
                                            {filteredPromos.length > 0 && (
                                                <Pagination
                                                    currentPage={promoPage}
                                                    totalPages={totalPromoPages}
                                                    totalItems={filteredPromos.length}
                                                    itemsPerPage={promoPageSize}
                                                    onPageChange={setPromoPage}
                                                    className="p-3 border-t border-coffee-100"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* BAGIAN 2: SECTION PENGATURAN TOKO (STORE SETTINGS) & PRATINJAU STRUK THERMAL */}
                            <div className="space-y-4 pt-3 border-t border-coffee-200">
                                {/* 2-Column Responsive Layout: Form on Left (7 cols), Live Thermal Receipt Preview on Right (5 cols) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                                    {/* Formulir Pengaturan Toko */}
                                    <form
                                        onSubmit={handleSaveStoreSettings}
                                        className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-4 sm:p-6 space-y-4"
                                    >
                                        <div className="border-b border-coffee-100 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-bold text-coffee-950 uppercase tracking-wider">
                                                    Identitas Bisnis & Kebijakan Kasir
                                                </h3>
                                                <p className="text-[11px] text-coffee-500">
                                                    Informasi dasar toko yang dicetak pada nota pelanggan
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3.5">
                                            {/* Nama Toko & Slogan */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Nama Cafe / Toko <span className="text-berry-600">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={storeForm.store_name}
                                                        onChange={(e) => setStoreForm((prev) => ({ ...prev, store_name: e.target.value }))}
                                                        required
                                                        placeholder="Monera Coffee"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Tagline / Slogan
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={storeForm.tagline}
                                                        onChange={(e) => setStoreForm((prev) => ({ ...prev, tagline: e.target.value }))}
                                                        placeholder="Brewing Passion, Serving Warmth"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                            </div>

                                            {/* Alamat Lengkap */}
                                            <div>
                                                <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                    Alamat Fisik Cafe (Tercetak di Struk)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={storeForm.address}
                                                    onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
                                                    placeholder="Jl. Gejayan No. 45, Sleman, D.I. Yogyakarta"
                                                    className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 resize-none"
                                                />
                                            </div>

                                            {/* Kontak No HP / WA & Email */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        No. Telepon / WhatsApp Toko
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={storeForm.phone}
                                                        onChange={(e) => setStoreForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="0812-3456-7890"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Email Resmi Cafe
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={storeForm.email}
                                                        onChange={(e) => setStoreForm((prev) => ({ ...prev, email: e.target.value }))}
                                                        placeholder="hello@moneracoffee.com"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                            </div>

                                            {/* Tarif Pajak Restoran & Service Charge */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Pajak Restoran PB1 (%) <span className="text-berry-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="100"
                                                            value={storeForm.tax_percentage}
                                                            onChange={(e) => setStoreForm((prev) => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 0 }))}
                                                            required
                                                            className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 font-bold"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                                                            %
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-coffee-400">Standar PB1 daerah: 10%</span>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Service Charge (%)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="100"
                                                            value={storeForm.service_charge_percentage}
                                                            onChange={(e) => setStoreForm((prev) => ({ ...prev, service_charge_percentage: parseFloat(e.target.value) || 0 }))}
                                                            className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 font-bold"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                                                            %
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-coffee-400">Biaya layanan operasional</span>
                                                </div>
                                            </div>

                                            {/* Pesan Kustom Footer Struk */}
                                            <div>
                                                <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                    Pesan Penutup Struk Kasir (Receipt Footer)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={storeForm.receipt_footer}
                                                    onChange={(e) => setStoreForm((prev) => ({ ...prev, receipt_footer: e.target.value }))}
                                                    placeholder="Terima kasih atas kunjungan Anda di Monera Coffee! • Tag kami di Instagram @moneracoffee"
                                                    className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 resize-none"
                                                />
                                                <span className="text-[10px] text-coffee-400">Maksimal 500 karakter. Ditampilkan di bagian terbawah struk cetak kasir.</span>
                                            </div>

                                            {/* Status Buka / Tutup Toko */}
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-coffee-50 border border-coffee-200/80">
                                                <div>
                                                    <p className="text-xs font-bold text-coffee-950">Status Operasional Toko</p>
                                                    <p className="text-[10.5px] text-coffee-500">Tentukan apakah kasir diizinkan membuka shift dan memproses pesanan</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStoreForm((prev) => ({ ...prev, is_open: !prev.is_open }))}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        storeForm.is_open ? 'bg-matcha-600' : 'bg-coffee-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                                            storeForm.is_open ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pt-3 border-t border-coffee-100 flex items-center justify-end gap-2.5">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                isLoading={isSavingSettings}
                                                leftIcon={<Save className="w-3.5 h-3.5" />}
                                                className="text-xs h-[38px] px-5"
                                            >
                                                Simpan Pengaturan Cafe
                                            </Button>
                                        </div>
                                    </form>

                                    {/* Pratinjau Kertas Struk Thermal (Live Receipt Simulator) */}
                                    <div className="lg:col-span-5 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-coffee-700 px-1">
                                            <span className="flex items-center gap-1.5">
                                                <Printer className="w-3.5 h-3.5 text-crema-600" />
                                                Pratinjau Kertas Struk (Thermal 58mm/80mm)
                                            </span>
                                            <span className="text-[10px] font-bold text-matcha-700 bg-matcha-50 px-2 py-0.5 rounded-full border border-matcha-200">
                                                Live Preview
                                            </span>
                                        </div>

                                        {/* Kertas Struk Thermal Bergaya Autentik */}
                                        <div className="bg-[#FAF9F6] border-2 border-dashed border-coffee-300 rounded-2xl p-5 shadow-sm font-mono text-xs text-coffee-950 space-y-3 relative overflow-hidden select-none">
                                            {/* Kop Struk */}
                                            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-coffee-300">
                                                <p className="font-extrabold text-sm tracking-wide text-coffee-950 uppercase">
                                                    {storeForm.store_name || 'MONERA COFFEE'}
                                                </p>
                                                {storeForm.tagline && (
                                                    <p className="text-[10px] italic text-coffee-600">
                                                        "{storeForm.tagline}"
                                                    </p>
                                                )}
                                                {storeForm.address && (
                                                    <p className="text-[10px] text-coffee-700 leading-tight">
                                                        {storeForm.address}
                                                    </p>
                                                )}
                                                {storeForm.phone && (
                                                    <p className="text-[10px] text-coffee-700">
                                                        Telp/WA: {storeForm.phone}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Metadata Transaksi Contoh */}
                                            <div className="text-[10.5px] space-y-0.5 text-coffee-700 pb-2 border-b border-dashed border-coffee-300">
                                                <div className="flex justify-between">
                                                    <span>No: #BB-20261115-088</span>
                                                    <span>Dine In (Meja 03)</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Kasir: Admin Kasir</span>
                                                    <span>15 Nov 2026, 14:30</span>
                                                </div>
                                            </div>

                                            {/* Item Pembelian Contoh */}
                                            <div className="space-y-1.5 text-[11px] py-1">
                                                <div className="flex justify-between font-semibold">
                                                    <span>2x Kopi Susu Aren Monera</span>
                                                    <span>Rp 44.000</span>
                                                </div>
                                                <div className="text-[10px] text-coffee-500 pl-2">
                                                    @ Rp 22.000 • Ice, Less Sugar
                                                </div>
                                                <div className="flex justify-between font-semibold">
                                                    <span>1x Croissant Butter Warm</span>
                                                    <span>Rp 28.000</span>
                                                </div>
                                                <div className="text-[10px] text-coffee-500 pl-2">
                                                    @ Rp 28.000 • Panaskan
                                                </div>
                                            </div>

                                            {/* Kalkulasi Subtotal, Pajak, Total */}
                                            <div className="pt-2 border-t border-dashed border-coffee-300 space-y-1 text-[11px]">
                                                <div className="flex justify-between text-coffee-700">
                                                    <span>Subtotal</span>
                                                    <span>Rp 72.000</span>
                                                </div>
                                                <div className="flex justify-between text-coffee-700">
                                                    <span>Pajak Restoran PB1 ({storeForm.tax_percentage}%)</span>
                                                    <span>
                                                        Rp {Math.round(72000 * (storeForm.tax_percentage / 100)).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                {storeForm.service_charge_percentage > 0 && (
                                                    <div className="flex justify-between text-coffee-700">
                                                        <span>Service Charge ({storeForm.service_charge_percentage}%)</span>
                                                        <span>
                                                            Rp {Math.round(72000 * (storeForm.service_charge_percentage / 100)).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-bold text-sm text-coffee-950 pt-1 border-t border-coffee-900/30">
                                                    <span>TOTAL BAYAR</span>
                                                    <span>
                                                        Rp {(
                                                            72000 +
                                                            Math.round(72000 * (storeForm.tax_percentage / 100)) +
                                                            Math.round(72000 * (storeForm.service_charge_percentage / 100))
                                                        ).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10.5px] text-coffee-600 pt-0.5">
                                                    <span>Bayar (CASH)</span>
                                                    <span>Rp 100.000</span>
                                                </div>
                                                <div className="flex justify-between text-[10.5px] text-coffee-600">
                                                    <span>Kembalian</span>
                                                    <span>
                                                        Rp {(
                                                            100000 -
                                                            (72000 +
                                                                Math.round(72000 * (storeForm.tax_percentage / 100)) +
                                                                Math.round(72000 * (storeForm.service_charge_percentage / 100)))
                                                        ).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer Struk Kustom */}
                                            <div className="text-center pt-3 border-t border-dashed border-coffee-300 space-y-1 text-[10px] text-coffee-600">
                                                <p className="whitespace-pre-line leading-relaxed">
                                                    {storeForm.receipt_footer || 'Terima kasih atas kunjungan Anda di Monera Coffee!'}
                                                </p>
                                                <p className="font-semibold text-coffee-400 text-[9px] uppercase tracking-wider">
                                                    Powered by Bean & Bite POS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Tambah Voucher Baru */}
                            {isPromoModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-xl max-w-lg w-full overflow-hidden">
                                        <div className="px-5 py-4 border-b border-coffee-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-crema-100 text-crema-800 flex items-center justify-center">
                                                    <Ticket className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-coffee-950">
                                                        Tambah Voucher Diskon Baru
                                                    </h3>
                                                    <p className="text-[11px] text-coffee-500">
                                                        Kupon otomatis tersinkron ke Kasir & Barista KDS
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsPromoModalOpen(false)}
                                                className="w-7 h-7 rounded-lg text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 flex items-center justify-center transition"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <form onSubmit={handleCreatePromo} className="p-5 space-y-4">
                                            {/* Kode Voucher & Nama */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Kode Voucher <span className="text-berry-600">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={promoForm.code}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                                                        required
                                                        placeholder="DISKON10"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 font-mono font-bold uppercase"
                                                    />
                                                    <span className="text-[10px] text-coffee-400">Huruf & angka, otomatis kapital</span>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Nama Promosi <span className="text-berry-600">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={promoForm.name}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, name: e.target.value }))}
                                                        required
                                                        placeholder="Diskon Pembukaan 10%"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                            </div>

                                            {/* Tipe Diskon (Pill Selection) */}
                                            <div>
                                                <label className="block text-xs font-bold text-coffee-900 mb-1.5">
                                                    Tipe Potongan Diskon <span className="text-berry-600">*</span>
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPromoForm((prev) => ({ ...prev, discount_type: 'percentage' }))}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                                                            promoForm.discount_type === 'percentage'
                                                                ? 'bg-matcha-50 text-matcha-900 border-matcha-400 shadow-2xs'
                                                                : 'bg-coffee-50 text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                                        }`}
                                                    >
                                                        <Percent className="w-4 h-4 text-matcha-700" />
                                                        <span>Persentase (%)</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPromoForm((prev) => ({ ...prev, discount_type: 'fixed' }))}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                                                            promoForm.discount_type === 'fixed'
                                                                ? 'bg-crema-100 text-crema-950 border-crema-400 shadow-2xs'
                                                                : 'bg-coffee-50 text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                                        }`}
                                                    >
                                                        <Tag className="w-4 h-4 text-crema-700" />
                                                        <span>Nominal Tetap (Rp)</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Nilai Diskon & Maksimal Diskon */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Nilai Diskon ({promoForm.discount_type === 'percentage' ? '%' : 'Rp'}) <span className="text-berry-600">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={promoForm.discount_type === 'percentage' ? '100' : undefined}
                                                        value={promoForm.discount_value}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, discount_value: e.target.value }))}
                                                        required
                                                        placeholder={promoForm.discount_type === 'percentage' ? 'Contoh: 10' : 'Contoh: 15000'}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950 font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Minimal Belanja (Rp)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="100"
                                                        min="0"
                                                        value={promoForm.min_order_amount}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, min_order_amount: e.target.value }))}
                                                        placeholder="Contoh: 30000"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                    <span className="text-[10px] text-coffee-400">Kosongkan jika tanpa minimal order</span>
                                                </div>
                                            </div>

                                            {/* Maksimal Diskon (Hanya untuk persentase) */}
                                            {promoForm.discount_type === 'percentage' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Batas Maksimal Potongan Diskon (Rp)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="500"
                                                        min="0"
                                                        value={promoForm.max_discount_amount}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, max_discount_amount: e.target.value }))}
                                                        placeholder="Contoh: 10000 (Opsional, kosongkan jika tanpa limit)"
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                            )}

                                            {/* Masa Berlaku */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Mulai Berlaku (Opsional)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={promoForm.start_date}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, start_date: e.target.value }))}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-coffee-900 mb-1">
                                                        Berakhir Pada (Opsional)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={promoForm.end_date}
                                                        onChange={(e) => setPromoForm((prev) => ({ ...prev, end_date: e.target.value }))}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-coffee-200 bg-coffee-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 text-coffee-950"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Awal Aktif */}
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-coffee-50 border border-coffee-200">
                                                <div>
                                                    <p className="text-xs font-bold text-coffee-950">Status Voucher Langsung Aktif</p>
                                                    <p className="text-[10.5px] text-coffee-500">Dapat langsung dipilih oleh kasir pada transaksi POS</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPromoForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        promoForm.is_active ? 'bg-matcha-600' : 'bg-coffee-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                                            promoForm.is_active ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="pt-3 border-t border-coffee-100 flex items-center justify-end gap-2.5">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => setIsPromoModalOpen(false)}
                                                    className="text-xs h-[36px] px-4"
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    isLoading={isSavingPromo}
                                                    leftIcon={<Save className="w-3.5 h-3.5" />}
                                                    className="text-xs h-[36px] px-5 font-bold"
                                                >
                                                    Simpan Voucher
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: AUDIT TRAIL LOGS */}
                    {activeTab === 'audit' && (
                        <div className="bg-white rounded-3xl border border-coffee-200 shadow-xs p-5 sm:p-8 space-y-6">
                            <div className="border-b border-coffee-100 pb-4">
                                <h2 className="text-base font-bold text-coffee-950">
                                    Audit Trail & Log Aktivitas Keamanan
                                </h2>
                                <p className="text-xs text-coffee-500">
                                    Merekam setiap tindakan sensitif (Buka/Tutup Shift, Void Pesanan, Reset Password, Perubahan Hak Akses Staf)
                                </p>
                            </div>

                            {recent_audit_logs.length === 0 ? (
                                <div className="py-12 text-center text-coffee-400 text-xs">
                                    Belum ada rekaman audit log.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-coffee-200 scrollbar-thin">
                                    <table className="table-zebra text-xs min-w-[720px]">
                                        <thead>
                                            <tr>
                                                <th className="py-3 px-4">Waktu</th>
                                                <th className="py-3 px-4">Aktivitas / Aksi</th>
                                                <th className="py-3 px-4">Pengguna (Staf)</th>
                                                <th className="py-3 px-4">Alamat IP</th>
                                                <th className="py-3 px-4 text-center">Status Audit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent_audit_logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td className="py-3 px-4 font-mono text-[11px] text-coffee-600 whitespace-nowrap">
                                                        {log.time_ago}
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-coffee-950">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="w-3.5 h-3.5 text-crema-600 flex-shrink-0" />
                                                            <span>
                                                                {log.action.replace(/_/g, ' ').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-coffee-800">
                                                        {log.user_name}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-[11px] text-coffee-600">
                                                        <code className="text-coffee-700 bg-coffee-100 px-1.5 py-0.5 rounded font-mono">
                                                            {log.ip_address}
                                                        </code>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-matcha-50 text-matcha-700 border border-matcha-200">
                                                            ✓ Terverifikasi
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
            </div>

            {/* MODAL: TAMBAH STAF BARU */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 bg-coffee-50/60 flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-crema-600" />
                                    <span>Tambah Akun Staf Baru</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Daftarkan pengguna baru untuk operasional Monera Coffee
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleCreateUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Lengkap <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="Contoh: Sarah Angelina"
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {createErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{createErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Username <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.username}
                                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                                        placeholder="sarah_kasir"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {createErrors.username && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createErrors.username}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Email Akun <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="sarah@moneracoffee.com"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {createErrors.email && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    No. WhatsApp / Telepon (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                    placeholder="08123456789"
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                            </div>

                            {/* Pilihan Hak Akses Role */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-coffee-800">
                                        Hak Akses Role <span className="text-berry-600">*</span>
                                    </label>
                                    <span className="text-[11px] text-coffee-500 font-medium">
                                        Super Admin: {superAdminCount}/2 Akun
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {/* Opsi Super Admin */}
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                            createForm.role === 'pemilik'
                                                ? 'border-coffee-700 bg-coffee-50/80 ring-1 ring-coffee-700'
                                                : superAdminCount >= 2
                                                ? 'border-coffee-200 bg-coffee-50/40 opacity-60 cursor-not-allowed'
                                                : 'border-coffee-200 hover:border-coffee-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="pemilik"
                                            disabled={superAdminCount >= 2}
                                            checked={createForm.role === 'pemilik'}
                                            onChange={() => setCreateForm({ ...createForm, role: 'pemilik' })}
                                            className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5 text-crema-600" />
                                                <span className="text-xs font-bold text-coffee-950">
                                                    Pemilik (Super Admin)
                                                </span>
                                                {superAdminCount >= 2 && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                                        Maksimal 2 Akun Tercapai
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-coffee-500 mt-0.5">
                                                Akses mutlak finansial, audit log, kelola staf, POS, dan KDS.
                                            </p>
                                        </div>
                                    </label>

                                    {/* Opsi Kasir */}
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                            createForm.role === 'admin_kasir'
                                                ? 'border-crema-600 bg-crema-50/60 ring-1 ring-crema-600'
                                                : 'border-coffee-200 hover:border-coffee-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="admin_kasir"
                                            checked={createForm.role === 'admin_kasir'}
                                            onChange={() => setCreateForm({ ...createForm, role: 'admin_kasir' })}
                                            className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-3.5 h-3.5 text-crema-700" />
                                                <span className="text-xs font-bold text-coffee-950">
                                                    Admin Kasir (Point of Sale)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-coffee-500 mt-0.5">
                                                Operasional transaksi, shift laci kasir, struk & open bill.
                                            </p>
                                        </div>
                                    </label>

                                    {/* Opsi Barista & Koki */}
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                            createForm.role === 'barista_koki'
                                                ? 'border-matcha-600 bg-matcha-50/60 ring-1 ring-matcha-600'
                                                : 'border-coffee-200 hover:border-coffee-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="barista_koki"
                                            checked={createForm.role === 'barista_koki'}
                                            onChange={() => setCreateForm({ ...createForm, role: 'barista_koki' })}
                                            className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <ChefHat className="w-3.5 h-3.5 text-matcha-700" />
                                                <span className="text-xs font-bold text-coffee-950">
                                                    Barista & Koki (Kitchen Display System)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-coffee-500 mt-0.5">
                                                Tiket pesanan live, timer waktu seduh & status pengerjaan menu.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Password Staf Baru */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Kata Sandi <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        placeholder="Min. 8 karakter"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {createErrors.password && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createErrors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Ulangi Kata Sandi <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.password_confirmation}
                                        onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })}
                                        placeholder="Ketik ulang password"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Otorisasi Tambah Super Admin */}
                            {createForm.role === 'pemilik' && (
                                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Konfirmasi Otorisasi Super Admin</span>
                                    </div>
                                    <p className="text-[11px] text-amber-800">
                                        Membuat akun Super Admin baru memerlukan verifikasi kata sandi akun Anda saat ini.
                                    </p>
                                    <input
                                        type="password"
                                        required
                                        value={createForm.admin_password}
                                        onChange={(e) => setCreateForm({ ...createForm, admin_password: e.target.value })}
                                        placeholder="Masukkan kata sandi Super Admin Anda..."
                                        className="w-full px-3.5 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                                    />
                                    {createErrors.admin_password && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createErrors.admin_password}</p>
                                    )}
                                </div>
                            )}

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isCreateSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isCreateSubmitting}
                                >
                                    {isCreateSubmitting ? 'Menyimpan...' : 'Buat Akun Staf'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: UBAH DATA STAF, EMAIL, PASSWORD & HAK AKSES */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 bg-coffee-50/60 flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <Edit3 className="w-4 h-4 text-crema-600" />
                                    <span>Kelola Data & Hak Akses Pengguna</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Ubah informasi, email, kata sandi, dan peran hak akses
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleUpdateUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Summary User Card */}
                            <div className="p-3 rounded-2xl bg-coffee-50/60 border border-coffee-200 flex items-center gap-3">
                                <img
                                    src={editingUser.avatar_url}
                                    alt={editingUser.name}
                                    className="w-10 h-10 rounded-full object-cover border border-coffee-200 bg-coffee-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-coffee-950 truncate">
                                        {editingUser.name}
                                    </p>
                                    <p className="text-[11px] text-coffee-500 truncate">
                                        @{editingUser.username} • ID #{editingUser.id}
                                    </p>
                                </div>
                                <div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-coffee-200/70 text-coffee-800 uppercase">
                                        {editingUser.role.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Lengkap <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {editErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{editErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Email Akun <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {editErrors.email && (
                                        <p className="text-[11px] text-berry-600 mt-1">{editErrors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        No. WhatsApp / Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="08123456789"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Pilihan Hak Akses Role Staf */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-coffee-800">
                                        Hak Akses Role <span className="text-berry-600">*</span>
                                    </label>
                                    <span className="text-[11px] text-coffee-500 font-medium">
                                        Super Admin: {superAdminCount}/2 Akun
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {/* Opsi Super Admin */}
                                    {(() => {
                                        const disablePemilik =
                                            (editingUser.role !== 'pemilik' && superAdminCount >= 2) ||
                                            (editingUser.role === 'pemilik' && superAdminCount <= 1 && editForm.role !== 'pemilik');

                                        return (
                                            <label
                                                className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                                    editForm.role === 'pemilik'
                                                        ? 'border-coffee-700 bg-coffee-50/80 ring-1 ring-coffee-700'
                                                        : editingUser.role !== 'pemilik' && superAdminCount >= 2
                                                        ? 'border-coffee-200 bg-coffee-50/40 opacity-60 cursor-not-allowed'
                                                        : 'border-coffee-200 hover:border-coffee-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="edit_role"
                                                    value="pemilik"
                                                    disabled={editingUser.role !== 'pemilik' && superAdminCount >= 2}
                                                    checked={editForm.role === 'pemilik'}
                                                    onChange={() => setEditForm({ ...editForm, role: 'pemilik' })}
                                                    className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-3.5 h-3.5 text-crema-600" />
                                                        <span className="text-xs font-bold text-coffee-950">
                                                            Pemilik (Super Admin)
                                                        </span>
                                                        {editingUser.role !== 'pemilik' && superAdminCount >= 2 && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                                                Maksimal 2 Akun
                                                            </span>
                                                        )}
                                                        {editingUser.role === 'pemilik' && superAdminCount <= 1 && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                                                Wajib Minimal 1 Super Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-coffee-500 mt-0.5">
                                                        Akses penuh seluruh modul, finansial, kelola akun, dan audit log.
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })()}

                                    {/* Opsi Kasir */}
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                            editForm.role === 'admin_kasir'
                                                ? 'border-crema-600 bg-crema-50/60 ring-1 ring-crema-600'
                                                : editingUser.role === 'pemilik' && superAdminCount <= 1
                                                ? 'border-coffee-200 bg-coffee-50/40 opacity-60 cursor-not-allowed'
                                                : 'border-coffee-200 hover:border-coffee-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="edit_role"
                                            value="admin_kasir"
                                            disabled={editingUser.role === 'pemilik' && superAdminCount <= 1}
                                            checked={editForm.role === 'admin_kasir'}
                                            onChange={() => setEditForm({ ...editForm, role: 'admin_kasir' })}
                                            className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-3.5 h-3.5 text-crema-700" />
                                                <span className="text-xs font-bold text-coffee-950">
                                                    Admin Kasir (Point of Sale)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-coffee-500 mt-0.5">
                                                Operasional transaksi kasir, tiket bayar, laci kas, dan cetak struk.
                                            </p>
                                        </div>
                                    </label>

                                    {/* Opsi Barista & Koki */}
                                    <label
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                                            editForm.role === 'barista_koki'
                                                ? 'border-matcha-600 bg-matcha-50/60 ring-1 ring-matcha-600'
                                                : editingUser.role === 'pemilik' && superAdminCount <= 1
                                                ? 'border-coffee-200 bg-coffee-50/40 opacity-60 cursor-not-allowed'
                                                : 'border-coffee-200 hover:border-coffee-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="edit_role"
                                            value="barista_koki"
                                            disabled={editingUser.role === 'pemilik' && superAdminCount <= 1}
                                            checked={editForm.role === 'barista_koki'}
                                            onChange={() => setEditForm({ ...editForm, role: 'barista_koki' })}
                                            className="mt-0.5 text-coffee-800 focus:ring-coffee-700"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <ChefHat className="w-3.5 h-3.5 text-matcha-700" />
                                                <span className="text-xs font-bold text-coffee-950">
                                                    Barista & Koki (Kitchen Display System)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-coffee-500 mt-0.5">
                                                Layar antrean dapur KDS, checklist resep, timer durasi seduh/masak.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Section Ubah Password (Opsional) */}
                            <div className="p-3.5 rounded-2xl bg-coffee-50/60 border border-coffee-200 space-y-2">
                                <div className="flex items-center gap-2 text-coffee-900 font-bold text-xs">
                                    <KeyRound className="w-3.5 h-3.5 text-coffee-700" />
                                    <span>Ganti Kata Sandi Staf (Opsional)</span>
                                </div>
                                <p className="text-[11px] text-coffee-500">
                                    Kosongkan bagian ini jika tidak ingin mengubah kata sandi pengguna ini.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-coffee-800 mb-1">
                                            Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={editForm.new_password}
                                            onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                                            placeholder="Minimal 8 karakter"
                                            className="w-full px-3 py-1.5 text-xs border border-coffee-200 rounded-xl bg-white focus:outline-none focus:border-coffee-600"
                                        />
                                        {editErrors.new_password && (
                                            <p className="text-[11px] text-berry-600 mt-1">{editErrors.new_password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-coffee-800 mb-1">
                                            Konfirmasi Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={editForm.new_password_confirmation}
                                            onChange={(e) => setEditForm({ ...editForm, new_password_confirmation: e.target.value })}
                                            placeholder="Ulangi password baru"
                                            className="w-full px-3 py-1.5 text-xs border border-coffee-200 rounded-xl bg-white focus:outline-none focus:border-coffee-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section Otorisasi Kata Sandi Super Admin (Wajib jika Ubah Role / Email / Password) */}
                            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
                                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Konfirmasi Kata Sandi Super Admin</span>
                                </div>
                                <p className="text-[11px] text-amber-900 leading-relaxed">
                                    Wajib diisi jika Anda mengubah <strong>Role Akses</strong>, <strong>Email</strong>, atau <strong>Kata Sandi</strong> staf demi kepatuhan keamanan audit.
                                </p>
                                <input
                                    type="password"
                                    value={editForm.admin_password}
                                    onChange={(e) => setEditForm({ ...editForm, admin_password: e.target.value })}
                                    placeholder="Masukkan kata sandi Super Admin Anda saat ini..."
                                    className="w-full px-3.5 py-2 text-xs border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                                />
                                {editErrors.admin_password && (
                                    <p className="text-[11px] text-berry-700 font-semibold mt-1">
                                        {editErrors.admin_password}
                                    </p>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingUser(null)}
                                    disabled={isEditSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isEditSubmitting}
                                >
                                    {isEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 1: TAMBAH BAHAN BAKU BARU                         */}
            {/* ======================================================== */}
            {isCreateIngredientOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 bg-coffee-50/60 flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-crema-600" />
                                    <span>Tambah Bahan Baku Baru</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Daftarkan bahan baku mentah ke inventaris kedai Monera Coffee
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateIngredientOpen(false)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleCreateIngredientSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Bahan Baku <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createIngredientForm.name}
                                    onChange={(e) => setCreateIngredientForm({ ...createIngredientForm, name: e.target.value })}
                                    placeholder="Contoh: Susu Oat Barista Blend"
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {createIngredientErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{createIngredientErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Satuan Takaran <span className="text-berry-600">*</span>
                                    </label>
                                    <Dropdown
                                        size="sm"
                                        options={unitOptions}
                                        value={createIngredientForm.unit}
                                        onChange={(val) => setCreateIngredientForm({ ...createIngredientForm, unit: String(val) })}
                                        placeholder="Pilih satuan..."
                                        triggerClassName="bg-white border-coffee-200 text-xs min-h-[38px]"
                                        error={createIngredientErrors.unit}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Saldo Stok Awal
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={createIngredientForm.initial_stock}
                                        onChange={(e) => setCreateIngredientForm({ ...createIngredientForm, initial_stock: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {createIngredientErrors.initial_stock && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createIngredientErrors.initial_stock}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Ambang Batas Minimum (Peringatan) <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={createIngredientForm.min_stock}
                                        onChange={(e) => setCreateIngredientForm({ ...createIngredientForm, min_stock: e.target.value })}
                                        placeholder="Contoh: 500"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    <p className="text-[10px] text-coffee-500 mt-0.5">Peringatan stok menipis jika ≤ nilai ini</p>
                                    {createIngredientErrors.min_stock && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createIngredientErrors.min_stock}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Harga Beli / HPP Satuan (Rp) <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={createIngredientForm.cost_per_unit}
                                        onChange={(e) => setCreateIngredientForm({ ...createIngredientForm, cost_per_unit: e.target.value })}
                                        placeholder="Contoh: 250"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    <p className="text-[10px] text-coffee-500 mt-0.5">HPP dasar per 1 satuan takaran</p>
                                    {createIngredientErrors.cost_per_unit && (
                                        <p className="text-[11px] text-berry-600 mt-1">{createIngredientErrors.cost_per_unit}</p>
                                    )}
                                </div>
                            </div>

                            {/* Tombol Aksi Form */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateIngredientOpen(false)}
                                    disabled={isCreateIngredientSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isCreateIngredientSubmitting}
                                >
                                    {isCreateIngredientSubmitting ? 'Menyimpan...' : 'Tambah Bahan Baku'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 2: UBAH PARAMETER BAHAN BAKU                       */}
            {/* ======================================================== */}
            {editingIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 bg-coffee-50/60 flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <Edit3 className="w-4 h-4 text-crema-600" />
                                    <span>Ubah Data Bahan Baku</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Perbarui nama, ambang minimum, satuan, atau HPP dasar
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingIngredient(null)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleEditIngredientSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Bahan Baku <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editIngredientForm.name}
                                    onChange={(e) => setEditIngredientForm({ ...editIngredientForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {editIngredientErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{editIngredientErrors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Satuan Takaran <span className="text-berry-600">*</span>
                                    </label>
                                    <Dropdown
                                        size="sm"
                                        options={unitOptions}
                                        value={editIngredientForm.unit}
                                        onChange={(val) => setEditIngredientForm({ ...editIngredientForm, unit: String(val) })}
                                        placeholder="Pilih satuan..."
                                        triggerClassName="bg-white border-coffee-200 text-xs min-h-[38px]"
                                        error={editIngredientErrors.unit}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Saldo Stok Saat Ini
                                    </label>
                                    <div className="px-3.5 py-2 text-xs bg-coffee-50 border border-coffee-200 rounded-xl font-mono text-coffee-900 font-bold">
                                        {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(editingIngredient.stock)} {editingIngredient.unit}
                                    </div>
                                    <p className="text-[10px] text-coffee-500 mt-0.5">Untuk ubah saldo stok, gunakan tombol Penyesuaian Stok</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Ambang Batas Minimum <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editIngredientForm.min_stock}
                                        onChange={(e) => setEditIngredientForm({ ...editIngredientForm, min_stock: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {editIngredientErrors.min_stock && (
                                        <p className="text-[11px] text-berry-600 mt-1">{editIngredientErrors.min_stock}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        HPP Satuan (Rp) <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={editIngredientForm.cost_per_unit}
                                        onChange={(e) => setEditIngredientForm({ ...editIngredientForm, cost_per_unit: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {editIngredientErrors.cost_per_unit && (
                                        <p className="text-[11px] text-berry-600 mt-1">{editIngredientErrors.cost_per_unit}</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-coffee-50/70 rounded-2xl border border-coffee-200 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-coffee-950 block">Status Aktif Bahan</span>
                                    <span className="text-[11px] text-coffee-500">Bahan aktif dapat digunakan dalam resep menu aktif</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editIngredientForm.is_active}
                                        onChange={(e) => setEditIngredientForm({ ...editIngredientForm, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-coffee-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-coffee-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-matcha-600"></div>
                                </label>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingIngredient(null)}
                                    disabled={isEditIngredientSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isEditIngredientSubmitting}
                                >
                                    {isEditIngredientSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 3: PENYESUAIAN STOK / RESTOCK / OPNAME FISIK      */}
            {/* ======================================================== */}
            {isAdjustStockOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 bg-coffee-50/60 flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-coffee-950 flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-crema-600" />
                                    <span>Penyesuaian Stok & Restock Bahan</span>
                                </h3>
                                <p className="text-xs text-coffee-500">
                                    Mutasi stok riil langsung dicatat ke Stock Log & Audit Trail sistem
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdjustStockOpen(false);
                                    setAdjustingIngredient(null);
                                }}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleAdjustStockSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Pemilihan Bahan Baku */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Pilih Bahan Baku <span className="text-berry-600">*</span>
                                </label>
                                <Dropdown
                                    size="sm"
                                    searchable
                                    options={ingredientOptions}
                                    value={adjustStockForm.ingredient_id}
                                    onChange={(val) => {
                                        const found = ingredients.find((i) => String(i.id) === String(val));
                                        setAdjustingIngredient(found || null);
                                        setAdjustStockForm({ ...adjustStockForm, ingredient_id: String(val) });
                                    }}
                                    placeholder="Cari & pilih bahan baku..."
                                    triggerClassName="bg-white border-coffee-200 text-xs min-h-[38px]"
                                    error={adjustStockErrors.ingredient_id}
                                />
                            </div>

                            {/* Jenis Mutasi Penyesuaian (3 Pilihan Tab Card) */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1.5">
                                    Tipe Mutasi Stok <span className="text-berry-600">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustStockForm({ ...adjustStockForm, type: 'in' })}
                                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                            adjustStockForm.type === 'in'
                                                ? 'border-matcha-600 bg-matcha-50/80 text-matcha-950 font-bold ring-1 ring-matcha-600'
                                                : 'border-coffee-200 hover:border-coffee-300 text-coffee-700'
                                        }`}
                                    >
                                        <Plus className="w-4 h-4 text-matcha-600" />
                                        <span className="text-[11px]">Restock Masuk</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAdjustStockForm({ ...adjustStockForm, type: 'waste' })}
                                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                            adjustStockForm.type === 'waste'
                                                ? 'border-berry-600 bg-berry-50/80 text-berry-950 font-bold ring-1 ring-berry-600'
                                                : 'border-coffee-200 hover:border-coffee-300 text-coffee-700'
                                        }`}
                                    >
                                        <Trash2 className="w-4 h-4 text-berry-600" />
                                        <span className="text-[11px]">Bahan Rusak / Waste</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAdjustStockForm({ ...adjustStockForm, type: 'adjustment' })}
                                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                                            adjustStockForm.type === 'adjustment'
                                                ? 'border-coffee-700 bg-coffee-100 text-coffee-950 font-bold ring-1 ring-coffee-700'
                                                : 'border-coffee-200 hover:border-coffee-300 text-coffee-700'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-4 h-4 text-crema-600" />
                                        <span className="text-[11px]">Opname Fisik</span>
                                    </button>
                                </div>
                            </div>

                            {/* Kuantitas & Saldo Preview */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    {adjustStockForm.type === 'in'
                                        ? 'Jumlah Masuk Restock'
                                        : adjustStockForm.type === 'waste'
                                        ? 'Jumlah Bahan Rusak / Dibuang'
                                        : 'Total Saldo Fisik Riil (Hasil Opname)'}{' '}
                                    ({selectedTargetForAdjustment?.unit ?? 'satuan'}) <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={adjustStockForm.quantity}
                                    onChange={(e) => setAdjustStockForm({ ...adjustStockForm, quantity: e.target.value })}
                                    placeholder={
                                        adjustStockForm.type === 'adjustment'
                                            ? `Masukkan jumlah fisik aktual (e.g. ${selectedTargetForAdjustment?.stock ?? 100})`
                                            : 'Masukkan jumlah kuantitas'
                                    }
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {adjustStockErrors.quantity && (
                                    <p className="text-[11px] text-berry-600 mt-1">{adjustStockErrors.quantity}</p>
                                )}
                            </div>

                            {/* Live Projection Box */}
                            {selectedTargetForAdjustment && (
                                <div className="p-3.5 bg-coffee-50/70 border border-coffee-200 rounded-2xl space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-coffee-600">Saldo Stok Saat Ini:</span>
                                        <span className="font-mono font-bold text-coffee-950">
                                            {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(selectedTargetForAdjustment.stock)}{' '}
                                            {selectedTargetForAdjustment.unit}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-coffee-600">Mutasi / Penyesuaian:</span>
                                        <span className={`font-mono font-bold ${
                                            adjustStockForm.type === 'in'
                                                ? 'text-matcha-700'
                                                : adjustStockForm.type === 'waste'
                                                ? 'text-berry-700'
                                                : 'text-crema-700'
                                        }`}>
                                            {adjustStockForm.type === 'in' ? '+' : adjustStockForm.type === 'waste' ? '-' : '='}{' '}
                                            {adjustStockForm.quantity || 0} {selectedTargetForAdjustment.unit}
                                        </span>
                                    </div>
                                    <div className="border-t border-coffee-200 pt-1.5 flex items-center justify-between text-xs">
                                        <span className="font-bold text-coffee-900">Estimasi Saldo Baru:</span>
                                        <span className="font-mono font-black text-sm text-coffee-950">
                                            {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(projectedStockAfterAdjustment ?? selectedTargetForAdjustment.stock)}{' '}
                                            {selectedTargetForAdjustment.unit}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Referensi & Alasan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        No. Referensi / Faktur (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={adjustStockForm.reference}
                                        onChange={(e) => setAdjustStockForm({ ...adjustStockForm, reference: e.target.value })}
                                        placeholder="Contoh: INV-SUP-202611"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Total Biaya Pembelian (Rp, Opsional)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={adjustStockForm.cost}
                                        onChange={(e) => setAdjustStockForm({ ...adjustStockForm, cost: e.target.value })}
                                        placeholder="Kalkulasi otomatis jika kosong"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Catatan / Alasan Mutasi <span className="text-berry-600">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={adjustStockForm.notes}
                                    onChange={(e) => setAdjustStockForm({ ...adjustStockForm, notes: e.target.value })}
                                    placeholder="Contoh: Pembelian rutin supplier susu, bahan tumpah saat kalibrasi mesin, dll..."
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none resize-none"
                                />
                                {adjustStockErrors.notes && (
                                    <p className="text-[11px] text-berry-600 mt-1">{adjustStockErrors.notes}</p>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsAdjustStockOpen(false);
                                        setAdjustingIngredient(null);
                                    }}
                                    disabled={isAdjustStockSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isAdjustStockSubmitting}
                                >
                                    {isAdjustStockSubmitting ? 'Memproses...' : 'Simpan Mutasi Stok'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: TAMBAH MENU BARU (KATALOG MENU KAFE) */}
            {/* ========================================================================= */}
            {isAddMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-coffee-100 bg-coffee-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-crema-100 text-coffee-900 flex items-center justify-center">
                                    <Coffee className="w-4 h-4 text-crema-700" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-coffee-950">
                                        Tambah Menu Sajian Baru
                                    </h3>
                                    <p className="text-[11px] text-coffee-500">
                                        Masukkan data nama, harga, HPP, kategori, dan foto produk
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddMenuOpen(false)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleCreateMenuSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {/* Nama Menu */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Menu Sajian <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={addMenuForm.name}
                                    onChange={(e) => setAddMenuForm({ ...addMenuForm, name: e.target.value })}
                                    placeholder="Contoh: Caramel Macchiato, Butter Croissant..."
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {addMenuErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{addMenuErrors.name}</p>
                                )}
                            </div>

                            {/* Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Kategori Menu <span className="text-berry-600">*</span>
                                </label>
                                <Dropdown
                                    size="sm"
                                    searchable
                                    matchTriggerWidth
                                    options={menuCategoryOptions}
                                    value={addMenuForm.category_id}
                                    onChange={(val) => setAddMenuForm({ ...addMenuForm, category_id: String(val) })}
                                    placeholder="Pilih Kategori Menu..."
                                    triggerClassName="bg-white border-coffee-200 text-xs min-h-[38px]"
                                    error={addMenuErrors.category_id}
                                />
                            </div>

                            {/* Harga Jual & HPP */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Harga Jual Kasir (Rp) <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        required
                                        value={addMenuForm.base_price}
                                        onChange={(e) => setAddMenuForm({ ...addMenuForm, base_price: e.target.value })}
                                        placeholder="Contoh: 25000"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {addMenuErrors.base_price && (
                                        <p className="text-[11px] text-berry-600 mt-1">{addMenuErrors.base_price}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        HPP / Modal Pokok (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={addMenuForm.cost_price}
                                        onChange={(e) => setAddMenuForm({ ...addMenuForm, cost_price: e.target.value })}
                                        placeholder="Contoh: 9500"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {addMenuErrors.cost_price && (
                                        <p className="text-[11px] text-berry-600 mt-1">{addMenuErrors.cost_price}</p>
                                    )}
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Deskripsi Menu Sajian
                                </label>
                                <textarea
                                    rows={2}
                                    value={addMenuForm.description}
                                    onChange={(e) => setAddMenuForm({ ...addMenuForm, description: e.target.value })}
                                    placeholder="Jelaskan aroma, rasa, atau bahan olahan menu ini..."
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none resize-none"
                                />
                                {addMenuErrors.description && (
                                    <p className="text-[11px] text-berry-600 mt-1">{addMenuErrors.description}</p>
                                )}
                            </div>

                            {/* Upload Foto Menu & Live Preview */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1.5">
                                    Foto Menu Sajian (PNG, JPG, WEBP maks 3MB)
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-20 rounded-xl border border-coffee-200 bg-coffee-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                                        <img
                                            src={addMenuImagePreview || '/images/icon.png'}
                                            alt="Preview Foto"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/icon.png';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={handleAddImageChange}
                                            className="block w-full text-xs text-coffee-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-coffee-100 file:text-coffee-800 hover:file:bg-coffee-200 cursor-pointer"
                                        />
                                        <p className="text-[10px] text-coffee-500">
                                            Foto akan langsung tampil di Terminal POS Kasir & KDS Barista.
                                        </p>
                                    </div>
                                </div>
                                {addMenuErrors.image && (
                                    <p className="text-[11px] text-berry-600 mt-1">{addMenuErrors.image}</p>
                                )}
                            </div>

                            {/* Status Ketersediaan Awal */}
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addMenuForm.is_available}
                                        onChange={(e) => setAddMenuForm({ ...addMenuForm, is_available: e.target.checked })}
                                        className="w-4 h-4 text-matcha-600 rounded border-coffee-300 focus:ring-matcha-500"
                                    />
                                    <span className="text-xs font-semibold text-coffee-800">
                                        Menu langsung Siap Jual (Tersedia) di Terminal POS
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddMenuOpen(false)}
                                    disabled={isAddMenuSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isAddMenuSubmitting}
                                >
                                    {isAddMenuSubmitting ? 'Menyimpan...' : 'Tambah ke Katalog'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: UBAH MENU (KATALOG MENU KAFE) */}
            {/* ========================================================================= */}
            {editingMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-coffee-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto overscroll-contain">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-coffee-100 bg-coffee-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-crema-100 text-coffee-900 flex items-center justify-center">
                                    <Edit3 className="w-4 h-4 text-crema-700" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-coffee-950">
                                        Ubah Menu: {editingMenu.name}
                                    </h3>
                                    <p className="text-[11px] text-coffee-500">
                                        Perbarui nama, harga jual kasir, HPP, kategori, atau ganti foto menu
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingMenu(null)}
                                className="p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleUpdateMenuSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {/* Nama Menu */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Nama Menu Sajian <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editMenuForm.name}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, name: e.target.value })}
                                    placeholder="Nama menu..."
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                />
                                {editMenuErrors.name && (
                                    <p className="text-[11px] text-berry-600 mt-1">{editMenuErrors.name}</p>
                                )}
                            </div>

                            {/* Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Kategori Menu <span className="text-berry-600">*</span>
                                </label>
                                <Dropdown
                                    size="sm"
                                    searchable
                                    matchTriggerWidth
                                    options={menuCategoryOptions}
                                    value={editMenuForm.category_id}
                                    onChange={(val) => setEditMenuForm({ ...editMenuForm, category_id: String(val) })}
                                    placeholder="Pilih Kategori Menu..."
                                    triggerClassName="bg-white border-coffee-200 text-xs min-h-[38px]"
                                    error={editMenuErrors.category_id}
                                />
                            </div>

                            {/* Harga Jual & HPP */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        Harga Jual Kasir (Rp) <span className="text-berry-600">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        required
                                        value={editMenuForm.base_price}
                                        onChange={(e) => setEditMenuForm({ ...editMenuForm, base_price: e.target.value })}
                                        placeholder="Contoh: 25000"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {editMenuErrors.base_price && (
                                        <p className="text-[11px] text-berry-600 mt-1">{editMenuErrors.base_price}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                        HPP / Modal Pokok (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="100"
                                        value={editMenuForm.cost_price}
                                        onChange={(e) => setEditMenuForm({ ...editMenuForm, cost_price: e.target.value })}
                                        placeholder="Contoh: 9500"
                                        className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none"
                                    />
                                    {editMenuErrors.cost_price && (
                                        <p className="text-[11px] text-berry-600 mt-1">{editMenuErrors.cost_price}</p>
                                    )}
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1">
                                    Deskripsi Menu Sajian
                                </label>
                                <textarea
                                    rows={2}
                                    value={editMenuForm.description}
                                    onChange={(e) => setEditMenuForm({ ...editMenuForm, description: e.target.value })}
                                    placeholder="Deskripsi sajian..."
                                    className="w-full px-3.5 py-2 text-xs border border-coffee-200 rounded-xl focus:border-coffee-600 focus:outline-none resize-none"
                                />
                                {editMenuErrors.description && (
                                    <p className="text-[11px] text-berry-600 mt-1">{editMenuErrors.description}</p>
                                )}
                            </div>

                            {/* Ganti Foto Menu */}
                            <div>
                                <label className="block text-xs font-semibold text-coffee-800 mb-1.5">
                                    Ganti Foto Menu (Opsional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-20 h-20 rounded-xl border border-coffee-200 bg-coffee-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                                        <img
                                            src={editMenuImagePreview || '/images/icon.png'}
                                            alt="Preview Foto"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/icon.png';
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={handleEditImageChange}
                                            className="block w-full text-xs text-coffee-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-coffee-100 file:text-coffee-800 hover:file:bg-coffee-200 cursor-pointer"
                                        />
                                        <p className="text-[10px] text-coffee-500">
                                            Pilih gambar baru untuk mengganti foto menu saat ini.
                                        </p>
                                    </div>
                                </div>
                                {editMenuErrors.image && (
                                    <p className="text-[11px] text-berry-600 mt-1">{editMenuErrors.image}</p>
                                )}
                            </div>

                            {/* Status Ketersediaan */}
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editMenuForm.is_available}
                                        onChange={(e) => setEditMenuForm({ ...editMenuForm, is_available: e.target.checked })}
                                        className="w-4 h-4 text-matcha-600 rounded border-coffee-300 focus:ring-matcha-500"
                                    />
                                    <span className="text-xs font-semibold text-coffee-800">
                                        Status Menu: Tersedia (Siap Dipesan di Kasir)
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-coffee-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMenu(null)}
                                    disabled={isEditMenuSubmitting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isEditMenuSubmitting}
                                >
                                    {isEditMenuSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
