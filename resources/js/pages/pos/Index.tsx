import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Coffee,
    LogOut,
    Search,
    Plus,
    Minus,
    Trash2,
    Receipt,
    CreditCard,
    QrCode,
    Banknote,
    Clock,
    User,
    Layers,
    AlertTriangle,
    ShoppingBag,
    Utensils,
    RotateCcw,
    DollarSign,
    CheckCircle2,
    X,
    Tag,
    ChevronRight,
    Store,
    Printer,
    ArrowRightLeft,
    ChevronUp,
    SlidersHorizontal,
    Menu as MenuIcon,
    ChefHat,
    CircleDollarSign,
    TrendingUp,
    UserCog,
} from 'lucide-react';
import { Button, Badge, Dropdown, DropdownOption, showToast, showConfirm, promptVoidOrder } from '@/components/ui';
import { DashboardLayout, NavGroup } from '@/components/layout';

interface Variant {
    id: number;
    name: string;
    variant_type: string;
    price_adjustment: number;
    cost_adjustment: number;
}

interface MenuItem {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    image?: string | null;
    base_price: number;
    base_price_formatted: string;
    cost_price: number;
    is_available: boolean;
    variants: Variant[];
}

interface Category {
    id: number;
    name: string;
    slug: string;
    production_target: string;
    menus_count: number;
}

interface Promo {
    id: number;
    code: string;
    name: string;
    discount_type: 'percentage' | 'percent' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount?: number | null;
}

interface CartItem {
    cart_id: string; // unique for menu + variant combination
    menu_id: number;
    menu_name: string;
    variant_id?: number;
    variant_name?: string;
    unit_price: number;
    quantity: number;
    notes?: string;
}

interface ActiveShift {
    id: number;
    cashier_name?: string;
    shift_name: string;
    start_cash: number;
    expected_cash: number;
    opened_at: string;
}

interface OrderItemSummary {
    id: number;
    menu_id?: number;
    item_name?: string;
    variant_snapshot?: string | null;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    notes?: string | null;
    menu?: { id: number; name: string };
}

interface OrderSummary {
    id: number;
    order_number: string;
    customer_name: string;
    table_number: string | null;
    order_type: 'dine_in' | 'take_away';
    is_open_bill: boolean;
    promo_id?: number | null;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_price: number;
    order_status: string;
    payment_status: string;
    payment_method?: string | null;
    created_at: string;
    items?: OrderItemSummary[];
}

interface Props {
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
    active_shift: ActiveShift | null;
    categories: Category[];
    menus: MenuItem[];
    promos: Promo[];
    open_bills: OrderSummary[];
    recent_orders: OrderSummary[];
}

export default function PosIndex({
    store,
    active_shift,
    categories,
    menus,
    promos,
    open_bills,
    recent_orders,
}: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // --- State Katalog & Filter ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

    // --- State Responsif Mobile: Active View Tab ('catalog' | 'cart') & Drawer ---
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
    const [isMobileCartDrawerOpen, setIsMobileCartDrawerOpen] = useState(false);

    // --- State Keranjang & Pesanan ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in');
    const [tableNumber, setTableNumber] = useState<string>('01');
    const [customerName, setCustomerName] = useState<string>('');
    const [isOpenBill, setIsOpenBill] = useState<boolean>(false);
    const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

    // --- State Pembayaran (Pay First) ---
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
    const [cashReceived, setCashReceived] = useState<number | ''>('');

    // --- State Pilihan Varian Menu Inline (Tanpa Modal Popup) ---
    const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});

    // --- State Tab Section Kasir In-Page (Tanpa Modal Popup) ---
    const initialPosTab = (): 'catalog' | 'cart' | 'open-bills' | 'history' | 'shift' => {
        if (typeof window !== 'undefined') {
            const urlTab = new URLSearchParams(window.location.search).get('tab');
            if (urlTab && ['catalog', 'cart', 'open-bills', 'history', 'shift'].includes(urlTab)) {
                return urlTab as 'catalog' | 'cart' | 'open-bills' | 'history' | 'shift';
            }
        }
        return 'catalog';
    };

    const [posTab, setPosTab] = useState<'catalog' | 'cart' | 'open-bills' | 'history' | 'shift'>(initialPosTab);

    // Sinkronkan posTab saat query parameter di URL berubah (e.g. navigasi dari Profile)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlTab = params.get('tab');
            if (urlTab && ['catalog', 'cart', 'open-bills', 'history', 'shift'].includes(urlTab)) {
                setPosTab(urlTab as 'catalog' | 'cart' | 'open-bills' | 'history' | 'shift');
                if (urlTab === 'cart') setMobileTab('cart');
            }
        }
    }, []);
    const [openBillSearch, setOpenBillSearch] = useState('');
    const [historySearch, setHistorySearch] = useState('');
    const [historyPaymentFilter, setHistoryPaymentFilter] = useState<'all' | 'cash' | 'qris' | 'debit'>('all');

    // State Shift Kasir
    const [openCashierName, setOpenCashierName] = useState('');
    const [openShiftName, setOpenShiftName] = useState('Shift Pagi (08:00 - 15:00)');
    const [openStartCash, setOpenStartCash] = useState<number | ''>(500000);
    const [actualCash, setActualCash] = useState<number | ''>('');
    const [closeShiftNotes, setCloseShiftNotes] = useState('');

    // Modal Popup Struk Thermal (Hanya untuk cetak struk kertas)
    const [receiptModalOrder, setReceiptModalOrder] = useState<OrderSummary | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal Pelunasan Cepat Open Bill Langsung
    const [settleModalOrder, setSettleModalOrder] = useState<OrderSummary | null>(null);
    const [settlePaymentMethod, setSettlePaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
    const [settleCashReceived, setSettleCashReceived] = useState<number | ''>('');
    const [isSettling, setIsSettling] = useState(false);

    // State Open Bill aktif yang sedang dilanjutkan (mode tambah menu)
    const [activeOpenBill, setActiveOpenBill] = useState<OrderSummary | null>(null);

    // Helper Format Tampilan Nomor Meja & Waktu
    const formatTableDisplay = (table: string | null | undefined) => {
        if (!table) return 'Meja -';
        const cleaned = table.replace(/^meja\s+/i, '').replace(/^meja\s+/i, '').trim();
        return `Meja ${cleaned}`;
    };

    const formatOrderTime = (dateStr: string | null | undefined, includeDate = false) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const timePart = d.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            if (includeDate) {
                const datePart = d.toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
                return `${datePart}, ${timePart} WIB`;
            }
            return `${timePart} WIB`;
        } catch {
            return dateStr;
        }
    };

    // Filter Pesanan Open Bill Aktif
    const filteredOpenBills = useMemo(() => {
        if (!openBillSearch) return open_bills;
        const q = openBillSearch.toLowerCase();
        return open_bills.filter(
            (ob) =>
                ob.order_number.toLowerCase().includes(q) ||
                ob.customer_name.toLowerCase().includes(q) ||
                (ob.table_number && ob.table_number.toLowerCase().includes(q))
        );
    }, [open_bills, openBillSearch]);

    // Filter Histori Transaksi Hari Ini
    const filteredRecentOrders = useMemo(() => {
        return recent_orders.filter((ord) => {
            const matchesSearch =
                !historySearch ||
                ord.order_number.toLowerCase().includes(historySearch.toLowerCase()) ||
                ord.customer_name.toLowerCase().includes(historySearch.toLowerCase());
            const ordMethod = (ord.payment_method || 'cash').toLowerCase();
            const matchesPay =
                historyPaymentFilter === 'all' || ordMethod === historyPaymentFilter.toLowerCase();
            return matchesSearch && matchesPay;
        });
    }, [recent_orders, historySearch, historyPaymentFilter]);

    // Kunci scroll halaman belakang ketika modal popup cetak struk terbuka
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (receiptModalOrder) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [receiptModalOrder]);

    // Opsi Dropdown Custom Nomor Meja
    const tableOptions: DropdownOption[] = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => {
            const num = String(i + 1).padStart(2, '0');
            return {
                value: num,
                label: `Meja ${num}`,
            };
        });
    }, []);

    // Opsi Dropdown Custom Kupon Promo
    const promoOptions: DropdownOption[] = useMemo(() => {
        const list: DropdownOption[] = [
            {
                value: '',
                label: 'Tanpa Kupon Promo',
                description: 'Harga normal tanpa potongan voucher',
            },
        ];
        promos.forEach((p) => {
            const isPercentage = p.discount_type === 'percentage' || p.discount_type === 'percent';
            const valNum = Number(p.discount_value);
            const minNum = Number(p.min_order_amount) || 0;
            const desc = isPercentage
                ? `Diskon ${valNum}% ${minNum > 0 ? `(Min. Belanja Rp ${minNum.toLocaleString('id-ID')})` : ''}`
                : `Potongan Rp ${valNum.toLocaleString('id-ID')} ${minNum > 0 ? `(Min. Belanja Rp ${minNum.toLocaleString('id-ID')})` : ''}`;
            list.push({
                value: String(p.id),
                label: `${p.name} (${p.code})`,
                description: desc,
                badge: isPercentage ? `${valNum}%` : `Rp ${valNum >= 1000 ? `${valNum / 1000}k` : valNum}`,
            });
        });
        return list;
    }, [promos]);

    // Opsi Dropdown Custom Nama Shift Kasir
    const shiftNameOptions: DropdownOption[] = [
        {
            value: 'Shift Pagi (08:00 - 15:00)',
            label: 'Shift Pagi (08:00 - 15:00)',
            description: 'Operasional pagi hingga siang',
            badge: 'Pagi',
        },
        {
            value: 'Shift Sore (15:00 - 22:00)',
            label: 'Shift Sore (15:00 - 22:00)',
            description: 'Operasional sore hingga closing malam',
            badge: 'Sore',
        },
        {
            value: 'Shift Full Day (08:00 - 22:00)',
            label: 'Shift Full Day (08:00 - 22:00)',
            description: 'Shift seharian penuh',
            badge: 'Full Day',
        },
    ];

    // Filter Menu
    const filteredMenus = useMemo(() => {
        return menus.filter((menu) => {
            const matchesCategory =
                selectedCategory === 'all' || menu.category_id === selectedCategory;
            const matchesSearch =
                menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (menu.description &&
                    menu.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [menus, selectedCategory, searchQuery]);

    // Kalkulasi Total Keranjang
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    }, [cart]);

    const discountAmount = useMemo(() => {
        if (!selectedPromo) return 0;
        const minOrder = Number(selectedPromo.min_order_amount) || 0;
        if (subtotal < minOrder) return 0;

        const isPercentage =
            selectedPromo.discount_type === 'percentage' ||
            selectedPromo.discount_type === 'percent';
        let calculated = 0;
        if (isPercentage) {
            calculated = (subtotal * Number(selectedPromo.discount_value)) / 100;
            if (
                selectedPromo.max_discount_amount &&
                Number(selectedPromo.max_discount_amount) > 0
            ) {
                calculated = Math.min(
                    calculated,
                    Number(selectedPromo.max_discount_amount)
                );
            }
        } else {
            calculated = Number(selectedPromo.discount_value);
        }
        return Math.min(subtotal, Math.round(calculated));
    }, [subtotal, selectedPromo]);

    const taxRatePercentage = store?.tax_percentage !== undefined ? Number(store.tax_percentage) : 10;
    const taxAmount = useMemo(() => {
        const taxable = Math.max(0, subtotal - discountAmount);
        return Math.round(taxable * (taxRatePercentage / 100));
    }, [subtotal, discountAmount, taxRatePercentage]);

    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal - discountAmount + taxAmount);
    }, [subtotal, discountAmount, taxAmount]);

    const payableTotal = useMemo(() => {
        return grandTotal + (activeOpenBill ? Number(activeOpenBill.total_price) : 0);
    }, [grandTotal, activeOpenBill]);

    const changeAmount = useMemo(() => {
        if (paymentMethod !== 'cash' || cashReceived === '') return 0;
        const totalToPay = grandTotal + (activeOpenBill ? Number(activeOpenBill.total_price) : 0);
        return Math.max(0, Number(cashReceived) - totalToPay);
    }, [paymentMethod, cashReceived, grandTotal, activeOpenBill]);

    // Tambah Menu ke Keranjang Secara Langsung (Tanpa Modal Popup)
    const handleAddMenuInline = (menu: MenuItem, variantIdOverride?: number) => {
        if (!active_shift) {
            showToast('Buka sesi shift kasir terlebih dahulu sebelum mencatat pesanan!', 'warning');
            setPosTab('shift');
            return;
        }

        if (!menu.is_available) {
            showToast('Menu ini sedang Sold Out / Habis!', 'warning');
            return;
        }

        const activeVariantId = variantIdOverride ?? (selectedVariants[menu.id] ?? menu.variants?.[0]?.id);
        const activeVariant = menu.variants?.find((v) => v.id === activeVariantId);
        const extra = activeVariant ? activeVariant.price_adjustment : 0;
        const unitPrice = menu.base_price + extra;
        const variantId = activeVariant ? activeVariant.id : undefined;
        const variantName = activeVariant ? activeVariant.name : undefined;
        const cartId = `m-${menu.id}-v-${variantId ?? 'none'}`;

        setCart((prev) => {
            const existing = prev.find((i) => i.cart_id === cartId);
            if (existing) {
                return prev.map((i) =>
                    i.cart_id === cartId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    cart_id: cartId,
                    menu_id: menu.id,
                    menu_name: menu.name,
                    variant_id: variantId,
                    variant_name: variantName,
                    unit_price: unitPrice,
                    quantity: 1,
                },
            ];
        });

        showToast(`+1 ${menu.name} ${variantName ? `(${variantName})` : ''} ditambahkan`, 'success', 1200);
    };

    // Update Catatan Khusus Item Langsung di Keranjang
    const updateItemNotes = (cartId: string, notes: string) => {
        setCart((prev) =>
            prev.map((i) => (i.cart_id === cartId ? { ...i, notes } : i))
        );
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.cart_id === cartId) {
                        const newQ = item.quantity + delta;
                        return newQ > 0 ? { ...item, quantity: newQ } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const removeFromCart = (cartId: string) => {
        setCart((prev) => prev.filter((i) => i.cart_id !== cartId));
    };

    const clearCart = async () => {
        if (cart.length === 0) return;
        const confirmed = await showConfirm({
            title: 'Kosongkan Pesanan?',
            text: 'Semua item dalam keranjang saat ini akan dihapus.',
            confirmButtonText: 'Ya, Kosongkan',
            cancelButtonText: 'Batal',
            isDanger: true,
        });
        if (confirmed) {
            setCart([]);
            setSelectedPromo(null);
            setCashReceived('');
        }
    };

    // Pelunasan Cepat Modal Open Bill Langsung
    const handleConfirmSettleOrder = () => {
        if (!settleModalOrder) return;
        if (!active_shift) {
            showToast('Buka shift kasir terlebih dahulu sebelum memproses transaksi!', 'error');
            setPosTab('shift');
            return;
        }

        if (settlePaymentMethod === 'cash') {
            if (settleCashReceived === '' || Number(settleCashReceived) < settleModalOrder.total_price) {
                showToast('Nominal tunai yang diterima kurang dari total tagihan!', 'warning');
                return;
            }
        }

        setIsSettling(true);
        router.post(
            `/pos/orders/${settleModalOrder.id}/pay`,
            {
                payment_method: settlePaymentMethod,
                amount_paid:
                    settlePaymentMethod === 'cash'
                        ? Number(settleCashReceived)
                        : settleModalOrder.total_price,
            },
            {
                onSuccess: () => {
                    const paidOrder = settleModalOrder;
                    setIsSettling(false);
                    setSettleModalOrder(null);
                    showToast(`Tagihan Meja ${paidOrder.table_number || ''} berhasil dilunasi!`, 'success');
                    setReceiptModalOrder(paidOrder);
                },
                onError: (errors) => {
                    setIsSettling(false);
                    const first = Object.values(errors)[0] as string;
                    showToast(first || 'Gagal melunasi tagihan.', 'error');
                },
            }
        );
    };

    // Submit Order
    const handleProcessOrder = async () => {
        if (!active_shift) {
            showToast('Buka shift kasir terlebih dahulu sebelum memproses transaksi!', 'error');
            setPosTab('shift');
            return;
        }

        // 1. Jika sedang dalam mode pelunasan Open Bill yang dilanjutkan di POS
        if (activeOpenBill) {
            const initialBill = Number(activeOpenBill.total_price);
            const totalToPay = initialBill + grandTotal;

            if (!isOpenBill && paymentMethod === 'cash') {
                if (cashReceived !== '' && Number(cashReceived) < totalToPay) {
                    showToast('Nominal tunai yang diterima kurang dari total tagihan!', 'warning');
                    return;
                }
            }

            const payPayload = {
                payment_method: paymentMethod || 'cash',
                amount_paid:
                    paymentMethod === 'cash'
                        ? (cashReceived === '' ? totalToPay : Number(cashReceived))
                        : totalToPay,
                promo_id: selectedPromo ? selectedPromo.id : activeOpenBill.promo_id,
                discount_amount: discountAmount,
                additional_items: cart.map((it) => ({
                    menu_id: it.menu_id,
                    menu_variant_id: it.variant_id ?? null,
                    variant_name: it.variant_name ?? null,
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    notes: it.notes ?? null,
                })),
            };

            setIsSubmitting(true);
            router.post(`/pos/orders/${activeOpenBill.id}/pay`, payPayload, {
                onSuccess: () => {
                    const finished = activeOpenBill;
                    setActiveOpenBill(null);
                    setCart([]);
                    setCustomerName('');
                    setSelectedPromo(null);
                    setCashReceived('');
                    setIsSubmitting(false);
                    setIsMobileCartDrawerOpen(false);
                    setMobileTab('catalog');
                    showToast(`Tagihan Meja ${finished.table_number || ''} berhasil dilunasi!`, 'success');
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const first = Object.values(errors)[0] as string;
                    showToast(first || 'Gagal melunasi pesanan.', 'error');
                },
            });
            return;
        }

        // 2. Pesanan Baru Standar
        if (cart.length === 0) {
            showToast('Keranjang masih kosong!', 'warning');
            return;
        }

        if (!isOpenBill && paymentMethod === 'cash') {
            if (cashReceived !== '' && Number(cashReceived) < grandTotal) {
                showToast('Nominal tunai yang diterima kurang dari total tagihan!', 'warning');
                return;
            }
        }

        const payload = {
            customer_name: customerName.trim() || 'Pelanggan',
            table_number: orderType === 'dine_in' ? tableNumber : null,
            order_type: orderType,
            is_open_bill: isOpenBill,
            promo_id: selectedPromo ? selectedPromo.id : null,
            discount_amount: discountAmount,
            notes: isOpenBill ? 'Open Bill (Bayar Nanti)' : 'Lunas di Kasir (Pay First)',
            payment_method: isOpenBill ? null : (paymentMethod || 'cash'),
            amount_paid: isOpenBill
                ? null
                : paymentMethod === 'cash'
                ? (cashReceived === '' ? grandTotal : Number(cashReceived))
                : grandTotal,
            items: cart.map((it) => ({
                menu_id: it.menu_id,
                menu_variant_id: it.variant_id ?? null,
                variant_name: it.variant_name ?? null,
                quantity: it.quantity,
                unit_price: it.unit_price,
                notes: it.notes ?? null,
            })),
        };

        setIsSubmitting(true);
        router.post('/pos/orders', payload, {
            onSuccess: () => {
                setCart([]);
                setCustomerName('');
                setSelectedPromo(null);
                setCashReceived('');
                setIsSubmitting(false);
                setIsMobileCartDrawerOpen(false);
                setMobileTab('catalog');
                showToast(
                    isOpenBill
                        ? 'Pesanan Open Bill disimpan & diteruskan ke KDS!'
                        : 'Pembayaran berhasil! Pesanan dikirim ke antrean dapur KDS.',
                    'success'
                );
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const first = Object.values(errors)[0] as string;
                showToast(first || 'Gagal memproses pesanan.', 'error');
            },
        });
    };

    // Buka Shift Kasir
    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (!openCashierName.trim()) {
            showToast('Nama lengkap kasir bertugas wajib diisi!', 'warning');
            return;
        }
        if (openStartCash === '' || Number(openStartCash) < 0) {
            showToast('Modal awal kas tidak valid!', 'warning');
            return;
        }

        router.post(
            '/pos/shift/open',
            {
                cashier_name: openCashierName.trim(),
                shift_name: openShiftName,
                start_cash: Number(openStartCash),
            },
            {
                onSuccess: () => {
                    showToast(`Shift '${openShiftName}' berhasil dibuka oleh ${openCashierName.trim()}!`, 'success');
                    setOpenCashierName('');
                    setPosTab('catalog');
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0] as string;
                    showToast(first || 'Gagal membuka shift.', 'error');
                },
            }
        );
    };

    // Tutup Shift Kasir (Z-Report)
    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (actualCash === '' || Number(actualCash) < 0) {
            showToast('Masukkan hitungan fisik kas di laci!', 'warning');
            return;
        }

        router.post(
            '/pos/shift/close',
            {
                actual_cash: Number(actualCash),
                notes: closeShiftNotes,
            },
            {
                onSuccess: () => {
                    setActualCash('');
                    setCloseShiftNotes('');
                    showToast('Shift kasir berhasil ditutup. Laporan Z-Report disimpan.', 'success');
                    setPosTab('catalog');
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0] as string;
                    showToast(first || 'Gagal menutup shift.', 'error');
                },
            }
        );
    };

    // Void Order
    const handleVoidOrder = async (order: OrderSummary) => {
        const reason = await promptVoidOrder(order.order_number);
        if (!reason) return;

        router.post(
            `/pos/orders/${order.id}/void`,
            { reason },
            {
                onSuccess: () => {
                    showToast(`Order #${order.order_number} berhasil dibatalkan (void).`, 'success');
                },
                onError: (errors) => {
                    const first = Object.values(errors)[0] as string;
                    showToast(first || 'Gagal membatalkan pesanan.', 'error');
                },
            }
        );
    };

    // Logout
    const handleLogout = async () => {
        const confirmed = await showConfirm({
            title: 'Keluar dari Terminal Kasir?',
            text: 'Pastikan shift kas Anda telah direkonsiliasi jika jam kerja telah selesai.',
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal',
            isDanger: true,
        });

        if (confirmed) {
            router.post('/logout');
        }
    };

    // Render Konten Tiket Keranjang (Digunakan bersama di desktop sidebar & mobile drawer/tab)
    const renderCartContent = () => (
        <div className="flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-sm overflow-hidden w-full">
            {/* Header & Konfigurasi Pesanan (Kompak & Ringkas di Layar Kecil & Mobile) */}
            <div className="p-2.5 sm:p-3 border-b border-coffee-200 space-y-2 shrink-0 bg-white">
                {!active_shift && (
                    <div className="p-2 bg-berry-50 border border-berry-200 rounded-xl flex items-center justify-between text-xs text-berry-900 font-bold">
                        <div className="flex items-center gap-1.5 truncate min-w-0">
                            <span className="w-2 h-2 rounded-full bg-berry-600 animate-pulse shrink-0" />
                            <span className="truncate text-[11px]">Shift Belum Dibuka (Terkunci)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPosTab('shift')}
                            className="text-[10px] px-2 py-0.5 bg-berry-600 hover:bg-berry-700 text-white rounded-lg font-bold shrink-0 ml-1.5 cursor-pointer shadow-2xs"
                        >
                            Buka Shift
                        </button>
                    </div>
                )}
                {activeOpenBill && (
                    <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-950 font-bold">
                        <div className="flex items-center gap-1.5 truncate min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse shrink-0" />
                            <span className="truncate">
                                Melunasi {activeOpenBill.table_number?.toLowerCase().startsWith('meja') ? activeOpenBill.table_number : `Meja ${activeOpenBill.table_number || '-'}`} ({activeOpenBill.customer_name}) • Tagihan Awal: Rp {Number(activeOpenBill.total_price).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveOpenBill(null);
                                setCart([]);
                                setCustomerName('');
                            }}
                            className="text-[10px] text-berry-600 hover:text-berry-700 underline font-bold shrink-0 ml-1.5 cursor-pointer"
                        >
                            Batal
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Receipt className="w-4 h-4 text-crema-600 shrink-0" />
                        <h2 className="text-xs sm:text-sm font-bold text-coffee-950 truncate">
                            Tiket Pesanan
                        </h2>
                        {((activeOpenBill?.items?.reduce((a, b) => a + b.quantity, 0) || 0) + cart.reduce((a, b) => a + b.quantity, 0)) > 0 && (
                            <span className="px-1.5 py-0.2 bg-crema-100 text-crema-800 rounded-md text-[10px] font-bold shrink-0">
                                {(activeOpenBill?.items?.reduce((a, b) => a + b.quantity, 0) || 0) + cart.reduce((a, b) => a + b.quantity, 0)} item
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mode Bayar Pill Switcher (Kompak Tanpa Teks Panjang) */}
                        {activeOpenBill ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                <span>Pelunasan Tagihan</span>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsOpenBill(!isOpenBill)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border shadow-2xs ${
                                    isOpenBill
                                        ? 'bg-crema-100 text-crema-900 border-crema-300'
                                        : 'bg-matcha-50 text-matcha-700 border-matcha-200'
                                }`}
                                title="Klik untuk ubah: Bayar Langsung / Open Bill"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpenBill ? 'bg-crema-600 animate-pulse' : 'bg-matcha-600'}`} />
                                <span>{isOpenBill ? 'Open Bill (Nanti)' : 'Bayar Langsung'}</span>
                            </button>
                        )}
                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-[10.5px] font-bold text-berry-600 hover:text-berry-700 flex items-center gap-0.5 transition cursor-pointer px-1 py-0.5 rounded hover:bg-berry-50"
                                title="Kosongkan Keranjang"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden xs:inline">Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Input Pesanan: Dine In/Takeaway, Pelanggan & Meja (1 Baris Ringkas) */}
                <div className="grid grid-cols-12 gap-1.5 text-xs">
                    {/* Mode Dine In vs Take Away */}
                    <div className="col-span-12 xs:col-span-4 grid grid-cols-2 gap-0.5 p-0.5 bg-coffee-100/70 rounded-xl h-[32px] items-center">
                        <button
                            type="button"
                            onClick={() => setOrderType('dine_in')}
                            className={`h-full text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                                orderType === 'dine_in'
                                    ? 'bg-white text-coffee-950 shadow-2xs'
                                    : 'text-coffee-600 hover:text-coffee-900'
                            }`}
                        >
                            <Utensils className="w-3 h-3" />
                            <span>Dine In</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType('take_away')}
                            className={`h-full text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                                orderType === 'take_away'
                                    ? 'bg-white text-coffee-950 shadow-2xs'
                                    : 'text-coffee-600 hover:text-coffee-900'
                            }`}
                        >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Take Away</span>
                        </button>
                    </div>

                    {/* Input Pelanggan */}
                    <div className="col-span-6 xs:col-span-4">
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nama Pelanggan (opsional)..."
                            className="w-full px-2.5 py-1 bg-coffee-50 border border-coffee-200 rounded-xl text-xs font-semibold text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500 h-[32px] transition placeholder:text-coffee-400"
                        />
                    </div>

                    {/* Pilih Meja */}
                    <div className="col-span-6 xs:col-span-4">
                        {orderType === 'dine_in' ? (
                            <Dropdown
                                size="sm"
                                searchable={true}
                                matchTriggerWidth={true}
                                options={tableOptions}
                                value={tableNumber}
                                onChange={(val) => setTableNumber(String(val))}
                                placeholder="Pilih Meja..."
                                triggerClassName="bg-coffee-50 border-coffee-200 h-[32px] text-xs py-0.5"
                            />
                        ) : (
                            <div className="px-2 py-0.5 bg-coffee-100/70 border border-coffee-200 text-coffee-600 font-semibold rounded-xl text-xs flex items-center justify-center h-[32px]">
                                Bawa Pulang
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Area Tengah Scrollable: Daftar Item, Kupon Promo & Pembayaran */}
            <div className="p-2.5 sm:p-3 overflow-y-auto space-y-2.5 scrollbar-thin max-h-[46vh] lg:max-h-[38vh]">
                {/* 2A. DAFTAR MENU SEBELUMNYA DARI OPEN BILL (Sudah Disimpan ke Dapur) */}
                {activeOpenBill && activeOpenBill.items && activeOpenBill.items.length > 0 && (
                    <div className="space-y-1.5 pb-2 border-b border-coffee-200">
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-coffee-700 uppercase tracking-wider">
                                Menu Sebelumnya (Tersimpan)
                            </span>
                            <span className="text-[9.5px] font-bold text-matcha-700 bg-matcha-50 border border-matcha-200 px-1.5 py-0.5 rounded-md">
                                Sudah di Dapur
                            </span>
                        </div>
                        <div className="divide-y divide-coffee-200/70 border border-coffee-200/80 rounded-xl p-2 bg-coffee-50/50 space-y-1">
                            {activeOpenBill.items.map((it, idx) => (
                                <div key={it.id || idx} className="py-1.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2 text-xs">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded bg-coffee-200/80 text-coffee-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <h4 className="text-xs font-bold text-coffee-950 truncate">
                                                {it.menu?.name || it.item_name || `Menu #${it.menu_id}`}
                                            </h4>
                                        </div>
                                        {it.variant_name && (
                                            <span className="text-[10px] font-medium text-crema-700 bg-crema-50 px-1.5 py-0.2 rounded inline-block mt-0.5 ml-5.5">
                                                {it.variant_name}
                                            </span>
                                        )}
                                        {it.notes && (
                                            <p className="text-[10px] text-coffee-500 italic mt-0.5 ml-5.5">
                                                Catatan: {it.notes}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right whitespace-nowrap shrink-0">
                                        <div className="font-bold text-coffee-950">
                                            Rp {Number(it.subtotal || it.unit_price * it.quantity).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-[10.5px] text-coffee-400">
                                            {it.quantity}x @ Rp {Number(it.unit_price).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2B. DAFTAR ITEM TAMBAHAN BARU DARI KATALOG */}
                {cart.length > 0 && (
                    <div className="space-y-1.5">
                        {activeOpenBill && (
                            <div className="flex items-center justify-between text-[10.5px] font-bold text-crema-800 uppercase tracking-wider pt-1">
                                <span>+ Tambahan Menu Baru</span>
                                <span className="text-[9.5px] font-bold text-crema-700 bg-crema-50 border border-crema-200 px-1.5 py-0.5 rounded-md">
                                    {cart.reduce((a, b) => a + b.quantity, 0)} item baru
                                </span>
                            </div>
                        )}
                        <div className="divide-y divide-coffee-200">
                            {cart.map((item, index) => (
                                <div key={item.cart_id} className="py-2.5 first:pt-0 last:pb-1 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-4 rounded-md bg-crema-100 text-crema-800 border border-crema-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                                    {(activeOpenBill?.items?.length || 0) + index + 1}
                                                </span>
                                                <h4 className="text-xs font-bold text-coffee-950 truncate">
                                                    {item.menu_name}
                                                </h4>
                                            </div>
                                            {item.variant_name && (
                                                <span className="text-[10px] font-medium text-crema-700 bg-crema-50 px-1.5 py-0.5 rounded inline-block mt-0.5 ml-5.5">
                                                    {item.variant_name}
                                                </span>
                                            )}
                                            {/* Input Catatan Item Langsung di Tiket (Tanpa Modal) */}
                                            <input
                                                type="text"
                                                value={item.notes ?? ''}
                                                onChange={(e) => updateItemNotes(item.cart_id, e.target.value)}
                                                placeholder="+ Tulis catatan (Less Ice, dll)..."
                                                className="w-full mt-1 px-2 py-0.8 bg-coffee-100/70 hover:bg-white focus:bg-white border border-transparent focus:border-coffee-300 rounded-lg text-[10px] text-coffee-900 focus:outline-none transition placeholder:text-coffee-400"
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-coffee-900 whitespace-nowrap">
                                            Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[11px] text-coffee-400">
                                            Rp {item.unit_price.toLocaleString('id-ID')} / item
                                        </span>
                                        <div className="flex items-center gap-1.5 bg-coffee-100/80 rounded-lg p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.cart_id, -1)}
                                                className="w-5 h-5 rounded bg-white text-coffee-700 flex items-center justify-center hover:bg-coffee-200 transition shadow-2xs"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-coffee-950">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.cart_id, 1)}
                                                className="w-5 h-5 rounded bg-white text-coffee-700 flex items-center justify-center hover:bg-coffee-200 transition shadow-2xs"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Kosong */}
                {cart.length === 0 && !activeOpenBill && (
                    <div className="py-4 text-center text-coffee-400">
                        <ShoppingBag className="w-6 h-6 mx-auto mb-1 opacity-30 text-coffee-400" />
                        <p className="text-xs font-semibold text-coffee-600">Pesanan masih kosong</p>
                        <p className="text-[10.5px] text-coffee-400">Pilih menu sajian di katalog</p>
                    </div>
                )}

                {cart.length === 0 && activeOpenBill && (
                    <div className="py-2.5 px-3 text-center text-coffee-600 border border-dashed border-coffee-200 rounded-xl bg-coffee-50/50">
                        <p className="text-xs font-bold text-coffee-800">+ Tambah sajian baru dari katalog</p>
                        <p className="text-[10.5px] text-coffee-500 mt-0.5">Atau langsung selesaikan pembayaran tagihan di bawah</p>
                    </div>
                )}

                {/* Custom Dropdown Kupon Promo Ringkas */}
                {promos.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="block text-[10.5px] font-bold text-coffee-700 uppercase tracking-wider">
                                Kupon Promo Diskon
                            </label>
                            {selectedPromo && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedPromo(null)}
                                    className="text-[10px] text-berry-600 hover:text-berry-700 font-bold cursor-pointer"
                                >
                                    Hapus Kupon
                                </button>
                            )}
                        </div>
                        <Dropdown
                            size="sm"
                            searchable={true}
                            matchTriggerWidth={true}
                            options={promoOptions}
                            value={selectedPromo ? String(selectedPromo.id) : ''}
                            onChange={(val) => {
                                const found = promos.find((p) => String(p.id) === String(val));
                                setSelectedPromo(found || null);
                            }}
                            placeholder="Pilih Kupon Promo Diskon..."
                            triggerClassName="bg-white border-coffee-200"
                        />
                        {selectedPromo && (
                            <div className="pt-0.5">
                                {subtotal < Number(selectedPromo.min_order_amount) ? (
                                    <p className="text-[10.5px] text-berry-700 font-semibold flex items-center gap-1 bg-berry-50 border border-berry-200/70 px-2 py-1 rounded-lg">
                                        <span>⚠️</span>
                                        <span>
                                            Min. belanja Rp {Number(selectedPromo.min_order_amount).toLocaleString('id-ID')} (Kurang Rp {(Number(selectedPromo.min_order_amount) - subtotal).toLocaleString('id-ID')})
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-[10.5px] text-matcha-700 font-bold flex items-center gap-1 bg-matcha-50 border border-matcha-200/70 px-2 py-1 rounded-lg">
                                        <span>✨</span>
                                        <span>
                                            Kupon Aktif: Hemat Rp {discountAmount.toLocaleString('id-ID')}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Breakdown Rincian Harga */}
                <div className="space-y-1 text-xs text-coffee-600">
                    <div className="flex justify-between">
                        <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item)</span>
                        <span className="font-semibold text-coffee-900">
                            Rp {subtotal.toLocaleString('id-ID')}
                        </span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-matcha-700 font-bold">
                            <span>Diskon Promo ({selectedPromo?.name || 'Kupon'})</span>
                            <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Pajak Restoran PB1 ({taxRatePercentage}%)</span>
                        <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Payment Method Selector (Pay First & Pelunasan Open Bill) */}
                {!isOpenBill && (cart.length > 0 || activeOpenBill) && (
                    <div className="space-y-2 pt-2 border-t border-coffee-200">
                        <label className="block text-[11px] font-bold text-coffee-700 uppercase tracking-wider">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                    paymentMethod === 'cash'
                                        ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                        : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                }`}
                            >
                                <Banknote className="w-3.5 h-3.5" />
                                Tunai
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('qris')}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                    paymentMethod === 'qris'
                                        ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                        : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                }`}
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                QRIS
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('debit')}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                    paymentMethod === 'debit'
                                        ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                        : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                }`}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                Debit
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(payableTotal)}
                                        className="flex-1 py-1 bg-white border border-coffee-200 rounded-lg text-[10px] font-semibold text-coffee-800 hover:bg-coffee-100 transition"
                                    >
                                        Uang Pas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(50000)}
                                        className="flex-1 py-1 bg-white border border-coffee-200 rounded-lg text-[10px] font-semibold text-coffee-800 hover:bg-coffee-100 transition"
                                    >
                                        50.000
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashReceived(100000)}
                                        className="flex-1 py-1 bg-white border border-coffee-200 rounded-lg text-[10px] font-semibold text-coffee-800 hover:bg-coffee-100 transition"
                                    >
                                        100.000
                                    </button>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-coffee-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="Uang Diterima Kasir"
                                        value={cashReceived}
                                        onChange={(e) =>
                                            setCashReceived(
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value)
                                            )
                                        }
                                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-coffee-200 rounded-xl text-xs font-bold text-coffee-950 focus:outline-none focus:border-coffee-500"
                                    />
                                </div>

                                {cashReceived !== '' && (
                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <span className="font-semibold text-coffee-600">
                                            Kembalian:
                                        </span>
                                        <span
                                            className={`font-bold ${
                                                Number(cashReceived) >= payableTotal
                                                    ? 'text-matcha-700'
                                                    : 'text-berry-600'
                                            }`}
                                        >
                                            {Number(cashReceived) >= payableTotal
                                                ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                                                : 'Uang Kurang!'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Footer Pembayaran & Total Akhir (Kompak ~75px, Selalu Terlihat Tanpa Terpotong) */}
            <div className="p-2.5 sm:p-3 bg-coffee-50 border-t border-coffee-200 space-y-2 shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                <div className="flex justify-between items-baseline">
                    <span className="text-[11px] sm:text-xs font-bold text-coffee-950 uppercase tracking-wider">
                        Total Akhir {activeOpenBill && <span className="text-[10px] text-amber-800 lowercase font-normal">(termasuk tagihan awal)</span>}
                    </span>
                    <span className="text-sm sm:text-base font-black text-coffee-950">
                        Rp {(grandTotal + (activeOpenBill ? Number(activeOpenBill.total_price) : 0)).toLocaleString('id-ID')}
                    </span>
                </div>

                {/* Submit Order Action Button */}
                <Button
                    variant={!active_shift ? 'outline' : isOpenBill ? 'accent' : 'primary'}
                    size="md"
                    className="w-full font-bold shadow-md cursor-pointer py-2 h-10 text-xs sm:text-sm"
                    disabled={!active_shift ? false : ((cart.length === 0 && !activeOpenBill) || isSubmitting)}
                    isLoading={isSubmitting}
                    onClick={() => {
                        if (!active_shift) {
                            showToast('Buka sesi shift kasir terlebih dahulu sebelum mencatat pesanan!', 'warning');
                            setPosTab('shift');
                            return;
                        }
                        handleProcessOrder();
                    }}
                >
                    {!active_shift
                        ? 'Buka Shift Kasir Dahulu (Terkunci)'
                        : activeOpenBill
                        ? `Bayar & Tutup Tagihan ${formatTableDisplay(activeOpenBill.table_number)} (Rp ${(grandTotal + Number(activeOpenBill.total_price)).toLocaleString('id-ID')})`
                        : isOpenBill
                        ? `Simpan Open Bill (Rp ${grandTotal.toLocaleString('id-ID')})`
                        : `Bayar & Kirim ke Dapur (Rp ${grandTotal.toLocaleString('id-ID')})`}
                </Button>
            </div>
        </div>
    );

    // Section 1: In-Page Pesanan Open Bill (Tanpa Modal Popup)
    const renderOpenBillsSection = () => {
        const totalItemsCount = open_bills.reduce((acc, ob) => acc + (ob.items?.length || 0), 0);
        const totalUnpaidAmount = open_bills.reduce((acc, ob) => acc + Number(ob.total_price), 0);

        return (
            <div className="space-y-4 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-coffee-200 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-berry-600 animate-pulse" />
                            <h2 className="text-base sm:text-lg font-black text-coffee-950 tracking-tight">
                                Pesanan Open Bill & Tagihan Meja Aktif
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-berry-50 text-berry-700 border border-berry-200">
                                {open_bills.length} Meja
                            </span>
                        </div>
                        <p className="text-xs text-coffee-500 mt-0.5">
                            Daftar pesanan aktif pelanggan dine-in yang belum lunas. Kasir dapat menambah menu baru atau memproses pembayaran saat pelanggan bersiap pulang.
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => {
                            if (!active_shift) {
                                showToast('Buka sesi shift kasir terlebih dahulu sebelum membuat Open Bill!', 'warning');
                                setPosTab('shift');
                                return;
                            }
                            setIsOpenBill(true);
                            setPosTab('catalog');
                        }}
                        className="text-xs font-bold self-start sm:self-auto"
                    >
                        Buat Open Bill Baru
                    </Button>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-berry-50 text-berry-700 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-coffee-500 font-medium">Meja Aktif Open Bill</p>
                            <p className="text-lg sm:text-xl font-black text-coffee-950 truncate">
                                {open_bills.length} Meja
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-crema-50 text-crema-700 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-coffee-500 font-medium">Total Item Tertahan</p>
                            <p className="text-lg sm:text-xl font-black text-coffee-950 truncate">
                                {totalItemsCount} Porsi / Cup
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-matcha-50 text-matcha-700 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-coffee-500 font-medium">Total Nilai Belum Lunas</p>
                            <p className="text-lg sm:text-xl font-black text-coffee-950 truncate">
                                Rp {totalUnpaidAmount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-4 sm:p-5 space-y-4">
                    {/* Search Toolbar */}
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor meja, nama pelanggan, atau nomor order..."
                            value={openBillSearch}
                            onChange={(e) => setOpenBillSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 text-coffee-950 bg-coffee-50 focus:bg-white"
                        />
                        {openBillSearch && (
                            <button
                                type="button"
                                onClick={() => setOpenBillSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {filteredOpenBills.length === 0 ? (
                        <div className="py-16 text-center text-coffee-500 space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-coffee-100/70 text-coffee-400 flex items-center justify-center mx-auto">
                                <Clock className="w-7 h-7" />
                            </div>
                            <div className="space-y-1 max-w-sm mx-auto">
                                <p className="text-sm font-bold text-coffee-900">
                                    {openBillSearch ? 'Tidak ditemukan tagihan yang sesuai' : 'Tidak Ada Open Bill Aktif'}
                                </p>
                                <p className="text-xs text-coffee-500">
                                    {openBillSearch
                                        ? `Tidak ada tagihan yang cocok dengan kata kunci "${openBillSearch}".`
                                        : 'Semua meja saat ini telah menyelesaikan pembayaran, atau belum ada pesanan baru.'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPosTab('catalog')}
                                className="text-xs mt-2"
                            >
                                Kembali ke Katalog Menu
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                            <table className="table-zebra w-full text-xs min-w-[700px]">
                                <thead>
                                    <tr>
                                        <th className="w-10 text-center">#</th>
                                        <th>No. Order</th>
                                        <th>Meja</th>
                                        <th>Pelanggan</th>
                                        <th className="text-center">Jumlah Item</th>
                                        <th className="text-right">Total Tagihan</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Aksi Kasir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOpenBills.map((ob, idx) => (
                                        <tr key={ob.id}>
                                            <td className="text-center font-mono text-coffee-400 font-semibold">
                                                {idx + 1}
                                            </td>
                                            <td className="font-bold text-coffee-950 font-mono">
                                                {ob.order_number}
                                            </td>
                                            <td>
                                                <span className="font-extrabold text-coffee-900 bg-coffee-100 px-2.5 py-1 rounded-lg">
                                                    {formatTableDisplay(ob.table_number)}
                                                </span>
                                            </td>
                                            <td className="font-semibold text-coffee-950">
                                                {ob.customer_name}
                                            </td>
                                            <td className="text-center font-medium text-coffee-700">
                                                {ob.items?.length ?? 0} Varian
                                            </td>
                                            <td className="text-right font-black text-coffee-950 text-sm">
                                                Rp {Number(ob.total_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-berry-50 text-berry-700 border border-berry-200">
                                                    Belum Lunas
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-[11px] font-bold bg-matcha-700 hover:bg-matcha-800 text-white"
                                                        leftIcon={<Banknote className="w-3 h-3" />}
                                                        onClick={() => {
                                                            if (!active_shift) {
                                                                showToast('Buka sesi shift kasir terlebih dahulu sebelum menerima pembayaran!', 'warning');
                                                                setPosTab('shift');
                                                                return;
                                                            }
                                                            setSettleModalOrder(ob);
                                                            setSettlePaymentMethod('cash');
                                                            setSettleCashReceived(ob.total_price);
                                                        }}
                                                    >
                                                        Bayar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-[11px] font-bold"
                                                        onClick={() => {
                                                            if (!active_shift) {
                                                                showToast('Buka sesi shift kasir terlebih dahulu sebelum menambah menu pesanan!', 'warning');
                                                                setPosTab('shift');
                                                                return;
                                                            }
                                                            setActiveOpenBill(ob);
                                                            if (ob.table_number) setTableNumber(ob.table_number);
                                                            setCustomerName(ob.customer_name);
                                                            setIsOpenBill(false);
                                                            setPosTab('catalog');
                                                            showToast(`Mode Pelunasan Meja ${ob.table_number || ''} aktif.`, 'info');
                                                        }}
                                                    >
                                                        Tambah Menu
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-[11px]"
                                                        leftIcon={<Printer className="w-3 h-3 text-coffee-600" />}
                                                        onClick={() => setReceiptModalOrder(ob)}
                                                        title="Cetak Struk Sementara"
                                                    >
                                                        Struk
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Section 2: In-Page Riwayat Transaksi & Void (Tanpa Modal Popup)
    const renderHistorySection = () => {
        const totalGrossRevenue = recent_orders.reduce((acc, o) => acc + Number(o.total_price), 0);
        const cashOrdersCount = recent_orders.filter((o) => (o.payment_method || 'cash').toLowerCase() === 'cash').length;
        const qrisOrdersCount = recent_orders.filter((o) => (o.payment_method || 'cash').toLowerCase() !== 'cash').length;

        return (
            <div className="space-y-4 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-coffee-200 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-matcha-600" />
                            <h2 className="text-base sm:text-lg font-black text-coffee-950 tracking-tight">
                                Riwayat Transaksi Hari Ini & Pembatalan (Void)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-matcha-50 text-matcha-800 border border-matcha-200">
                                {recent_orders.length} Transaksi
                            </span>
                        </div>
                        <p className="text-xs text-coffee-500 mt-0.5">
                            Daftar seluruh transaksi lunas yang diproses pada shift aktif. Kasir dapat mencetak ulang struk kasir atau mengajukan pembatalan (void) resmi.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Coffee className="w-3.5 h-3.5 text-coffee-600" />}
                        onClick={() => setPosTab('catalog')}
                        className="text-xs font-bold self-start sm:self-auto"
                    >
                        Ke Katalog Menu
                    </Button>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs space-y-1">
                        <p className="text-[11px] text-coffee-500 font-bold uppercase tracking-wider">Total Transaksi</p>
                        <p className="text-lg sm:text-2xl font-black text-coffee-950">
                            {recent_orders.length} Order
                        </p>
                        <p className="text-[10px] text-coffee-400">Tersinkronisasi shift aktif</p>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs space-y-1">
                        <p className="text-[11px] text-coffee-500 font-bold uppercase tracking-wider">Omzet Lunas</p>
                        <p className="text-lg sm:text-2xl font-black text-matcha-800">
                            Rp {totalGrossRevenue.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-matcha-700 font-semibold">Kas masuk terkonfirmasi</p>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs space-y-1">
                        <p className="text-[11px] text-coffee-500 font-bold uppercase tracking-wider">Transaksi Tunai</p>
                        <p className="text-lg sm:text-2xl font-black text-coffee-950">
                            {cashOrdersCount} Order
                        </p>
                        <p className="text-[10px] text-coffee-500">Uang tunai di laci</p>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-coffee-200 shadow-2xs space-y-1">
                        <p className="text-[11px] text-coffee-500 font-bold uppercase tracking-wider">QRIS / Non-Tunai</p>
                        <p className="text-lg sm:text-2xl font-black text-coffee-950">
                            {qrisOrdersCount} Order
                        </p>
                        <p className="text-[10px] text-crema-700 font-semibold">Settlement digital</p>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-coffee-200 shadow-xs p-4 sm:p-5 space-y-4">
                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor order, nama pelanggan..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 text-coffee-950 bg-coffee-50 focus:bg-white"
                            />
                            {historySearch && (
                                <button
                                    type="button"
                                    onClick={() => setHistorySearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Payment Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {(['all', 'cash', 'qris', 'debit'] as const).map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setHistoryPaymentFilter(method)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                        historyPaymentFilter === method
                                            ? 'bg-coffee-900 text-white shadow-xs'
                                            : 'bg-coffee-100/70 text-coffee-700 hover:bg-coffee-200/70'
                                    }`}
                                >
                                    {method === 'all'
                                        ? 'Semua Metode'
                                        : method === 'cash'
                                        ? 'Tunai'
                                        : method === 'qris'
                                        ? 'QRIS'
                                        : 'Debit'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredRecentOrders.length === 0 ? (
                        <div className="py-16 text-center text-coffee-500 space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-coffee-100/70 text-coffee-400 flex items-center justify-center mx-auto">
                                <Receipt className="w-7 h-7" />
                            </div>
                            <div className="space-y-1 max-w-sm mx-auto">
                                <p className="text-sm font-bold text-coffee-900">Belum Ada Transaksi</p>
                                <p className="text-xs text-coffee-500">
                                    {historySearch
                                        ? `Tidak ada transaksi yang cocok dengan "${historySearch}".`
                                        : 'Belum ada transaksi pesanan lunas yang tercatat pada sesi shift ini.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-coffee-200/90 shadow-2xs scrollbar-thin">
                            <table className="table-zebra w-full text-xs min-w-[760px]">
                                <thead>
                                    <tr>
                                        <th className="w-10 text-center">#</th>
                                        <th>Waktu</th>
                                        <th>No. Order</th>
                                        <th>Tipe / Meja</th>
                                        <th>Pelanggan</th>
                                        <th className="text-center">Metode Bayar</th>
                                        <th className="text-right">Total Tagihan</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Aksi Keamanan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecentOrders.map((ord, idx) => (
                                        <tr key={ord.id}>
                                            <td className="text-center font-mono text-coffee-400 font-semibold">
                                                {idx + 1}
                                            </td>
                                            <td className="text-coffee-600 whitespace-nowrap font-medium font-mono">
                                                {formatOrderTime(ord.created_at)}
                                            </td>
                                            <td className="font-bold text-coffee-950 font-mono">
                                                {ord.order_number}
                                            </td>
                                            <td className="text-coffee-700 font-medium">
                                                {ord.order_type === 'dine_in'
                                                    ? formatTableDisplay(ord.table_number)
                                                    : 'Take Away'}
                                            </td>
                                            <td className="font-semibold text-coffee-950">
                                                {ord.customer_name}
                                            </td>
                                            <td className="text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-coffee-100 text-coffee-800">
                                                    {(ord.payment_method || 'cash').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-right font-black text-coffee-950 text-sm">
                                                Rp {Number(ord.total_price).toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-matcha-50 text-matcha-700 border border-matcha-200">
                                                    LUNAS
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-[11px]"
                                                        leftIcon={<Printer className="w-3 h-3 text-coffee-600" />}
                                                        onClick={() => setReceiptModalOrder(ord)}
                                                    >
                                                        Struk
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="h-7 px-2.5 text-[11px]"
                                                        onClick={() => handleVoidOrder(ord)}
                                                    >
                                                        Void
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Section 3: In-Page Rekonsiliasi Kas & Tutup Shift (Tanpa Modal Popup)
    const renderShiftSection = () => {
        if (!active_shift) {
            return (
                <div className="max-w-xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm p-6 sm:p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 rounded-2xl bg-matcha-50 text-matcha-700 flex items-center justify-center mx-auto">
                                <CircleDollarSign className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-black text-coffee-950 tracking-tight">
                                Buka Sesi Shift Kasir Baru
                            </h2>
                            <p className="text-xs text-coffee-500 max-w-sm mx-auto">
                                Mulai shift kerja untuk mengaktifkan transaksi di POS kasir dan mencatat modal awal kas secara transparan.
                            </p>
                        </div>

                        <form onSubmit={handleOpenShift} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-coffee-800 mb-1.5">
                                    Nama Lengkap Kasir Bertugas <span className="text-berry-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={openCashierName}
                                    onChange={(e) => setOpenCashierName(e.target.value)}
                                    placeholder="Ketikkan nama lengkap Anda (e.g. Siti Rahma, Rian Pratama)..."
                                    required
                                    className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-xs sm:text-sm font-semibold text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500 transition placeholder:text-coffee-400"
                                />
                                <p className="text-[10.5px] text-coffee-500 mt-1">
                                    Wajib diisi agar Super Admin (Pemilik) & Admin dapat memantau identitas staf yang bertanggung jawab atas sesi shift ini.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-coffee-800 mb-1.5">
                                    Jadwal Shift Kasir
                                </label>
                                <Dropdown
                                    options={shiftNameOptions}
                                    value={openShiftName}
                                    onChange={(val) => setOpenShiftName(String(val))}
                                    placeholder="Pilih Nama Shift..."
                                    triggerClassName="bg-coffee-50 border-coffee-200 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-coffee-800 mb-1.5">
                                    Modal Kas Awal di Laci (Cash Float Rp)
                                </label>
                                <input
                                    type="number"
                                    value={openStartCash}
                                    onChange={(e) =>
                                        setOpenStartCash(
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                    required
                                    className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm font-bold text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500 transition"
                                />
                                <p className="text-[10.5px] text-coffee-500 mt-1">
                                    Uang tunai kembalian awal yang tersedia di laci kasir saat toko dibuka.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                className="w-full font-bold h-11"
                            >
                                Konfirmasi Buka Shift Kasir
                            </Button>
                        </form>
                    </div>
                </div>
            );
        }

        const calculatedDiff = actualCash !== '' ? Number(actualCash) - active_shift.expected_cash : null;

        return (
            <div className="space-y-4 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-coffee-200 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-matcha-600 animate-pulse" />
                            <h2 className="text-base sm:text-lg font-black text-coffee-950 tracking-tight">
                                Rekonsiliasi Kas & Tutup Shift Kasir (Z-Report)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-matcha-50 text-matcha-800 border border-matcha-200">
                                Shift Aktif
                            </span>
                        </div>
                        <p className="text-xs text-coffee-500 mt-0.5">
                            Shift: <strong>{active_shift.shift_name}</strong> • Dibuka sejak {active_shift.opened_at} oleh {user?.name || 'Kasir'}
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Coffee className="w-3.5 h-3.5 text-coffee-600" />}
                        onClick={() => setPosTab('catalog')}
                        className="text-xs font-bold self-start sm:self-auto"
                    >
                        Ke Katalog Menu
                    </Button>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Catatan Sistem (5 cols) */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-coffee-200 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-coffee-950 border-b border-coffee-100 pb-2">
                            Pencatatan Kas Sistem
                        </h3>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-coffee-50 rounded-xl space-y-1">
                                <span className="text-coffee-600 font-medium">Kasir Bertugas:</span>
                                <p className="text-sm font-bold text-coffee-950 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-crema-700 shrink-0" />
                                    <span>{active_shift.cashier_name || 'Kasir'}</span>
                                </p>
                            </div>

                            <div className="p-3 bg-coffee-50 rounded-xl space-y-1">
                                <span className="text-coffee-600 font-medium">Modal Awal Kas (Cash Float):</span>
                                <p className="text-base font-bold text-coffee-950">
                                    Rp {active_shift.start_cash.toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="p-3 bg-coffee-50 rounded-xl space-y-1">
                                <span className="text-coffee-600 font-medium">Penjualan Tunai Masuk:</span>
                                <p className="text-base font-bold text-matcha-800">
                                    Rp {Math.max(0, active_shift.expected_cash - active_shift.start_cash).toLocaleString('id-ID')}
                                </p>
                            </div>

                            <div className="p-4 bg-coffee-900 text-white rounded-2xl space-y-1 shadow-sm">
                                <span className="text-coffee-300 text-[11px] font-semibold uppercase tracking-wider">
                                    Total Ekspektasi Kas di Laci:
                                </span>
                                <p className="text-2xl font-black text-crema-300">
                                    Rp {active_shift.expected_cash.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[10px] text-coffee-300">
                                    Modal awal + seluruh penerimaan tunai shift ini
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-crema-50/70 border border-crema-200 rounded-xl text-[11px] text-coffee-800 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-crema-700 flex-shrink-0" />
                                Prosedur Serah Terima Kas:
                            </p>
                            <p className="text-coffee-600 leading-relaxed">
                                Hitung seluruh lembaran uang tunai dan koin di laci kasir secara teliti, kemudian masukkan nominal totalnya pada kolom di sebelah kanan.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Form Hitungan Fisik & Tutup Shift (7 cols) */}
                    <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-coffee-200 shadow-xs space-y-5">
                        <h3 className="text-sm font-bold text-coffee-950 border-b border-coffee-100 pb-2">
                            Hitungan Fisik Laci & Rekonsiliasi
                        </h3>

                        <form onSubmit={handleCloseShift} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-coffee-900 mb-1.5">
                                    Total Hitungan Uang Fisik Aktual di Laci (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={actualCash}
                                    onChange={(e) =>
                                        setActualCash(
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                    placeholder="Contoh: 1250000"
                                    required
                                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-2xl text-base font-black text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500 transition"
                                />
                            </div>

                            {calculatedDiff !== null && (
                                <div
                                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                                        calculatedDiff === 0
                                            ? 'bg-matcha-50 border-matcha-300 text-matcha-900'
                                            : calculatedDiff > 0
                                            ? 'bg-crema-50 border-crema-300 text-crema-900'
                                            : 'bg-berry-50 border-berry-300 text-berry-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {calculatedDiff === 0 ? (
                                            <CheckCircle2 className="w-4 h-4 text-matcha-600 flex-shrink-0" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        )}
                                        <span className="font-bold">
                                            {calculatedDiff === 0
                                                ? 'PAS (100% Sesuai Sistem)'
                                                : calculatedDiff > 0
                                                ? 'Selisih Kas Lebih'
                                                : 'Selisih Kas Kurang'}
                                        </span>
                                    </div>
                                    <span className="font-black text-sm">
                                        {calculatedDiff === 0
                                            ? 'Rp 0'
                                            : `${calculatedDiff > 0 ? '+' : ''}Rp ${calculatedDiff.toLocaleString('id-ID')}`}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-coffee-900 mb-1.5">
                                    Catatan Kasir / Keterangan Serah Terima (Opsional)
                                </label>
                                <textarea
                                    value={closeShiftNotes}
                                    onChange={(e) => setCloseShiftNotes(e.target.value)}
                                    placeholder="Tuliskan catatan selisih kas, alasan uang kembalian, atau pesan untuk kasir shift berikutnya..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-coffee-50 border border-coffee-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-coffee-500 transition"
                                />
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                                <Button
                                    type="submit"
                                    variant="danger"
                                    size="md"
                                    className="w-full sm:flex-1 font-bold h-11"
                                >
                                    Konfirmasi Tutup Shift & Cetak Z-Report
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => setPosTab('catalog')}
                                    className="w-full sm:w-auto h-11 text-xs"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    // Section 4: In-Page Keranjang Pesanan (Tampilan Penuh)
    const renderCartSection = () => {
        return (
            <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl border border-coffee-200 shadow-sm p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-coffee-100">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-crema-600" />
                            <h2 className="text-base sm:text-lg font-bold text-coffee-950">
                                Keranjang Pesanan ({cart.length} Jenis Menu)
                            </h2>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setPosTab('catalog');
                                setMobileTab('catalog');
                            }}
                            className="text-xs font-bold"
                        >
                            + Tambah Menu Lain
                        </Button>
                    </div>

                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                        {renderCartContent()}
                    </div>
                </div>
            </div>
        );
    };

    // Konfigurasi Navigasi Sidebar Kasir (Tanpa Modal Popup)
    const posNavGroups: NavGroup[] = [
        {
            title: 'Menu Kasir',
            items: [
                {
                    id: 'catalog',
                    label: 'Katalog Menu',
                    icon: <Coffee className="w-4 h-4 text-crema-500" />,
                    active: posTab === 'catalog',
                    badge: menus.length,
                    onClick: () => {
                        setPosTab('catalog');
                        setMobileTab('catalog');
                    },
                },
                {
                    id: 'cart',
                    label: 'Keranjang Pesanan',
                    icon: <ShoppingBag className="w-4 h-4 text-crema-500" />,
                    active: posTab === 'cart',
                    badge: cart.length > 0 ? cart.length : undefined,
                    badgeVariant: 'matcha',
                    onClick: () => {
                        setPosTab('cart');
                        setMobileTab('cart');
                    },
                },
                {
                    id: 'open-bills',
                    label: 'Pesanan Open Bill',
                    icon: <Clock className="w-4 h-4 text-crema-500" />,
                    active: posTab === 'open-bills',
                    badge: open_bills.length > 0 ? open_bills.length : undefined,
                    badgeVariant: 'berry',
                    onClick: () => setPosTab('open-bills'),
                },
                {
                    id: 'history',
                    label: 'Riwayat & Void',
                    icon: <Receipt className="w-4 h-4 text-crema-500" />,
                    active: posTab === 'history',
                    onClick: () => setPosTab('history'),
                },
                {
                    id: 'shift',
                    label: active_shift ? 'Tutup Shift Kasir' : 'Buka Shift Kasir',
                    icon: <CircleDollarSign className="w-4 h-4 text-crema-500" />,
                    active: posTab === 'shift',
                    badge: active_shift ? 'Aktif' : 'Tutup',
                    badgeVariant: active_shift ? 'matcha' : 'berry',
                    onClick: () => setPosTab('shift'),
                },
            ],
        },
    ];

    // Header Right Controls
    const headerRightControls = (
        <div className="flex items-center gap-1.5 sm:gap-2">
            {active_shift ? (
                <button
                    type="button"
                    onClick={() => setPosTab('shift')}
                    className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-xs ${
                        posTab === 'shift'
                            ? 'bg-matcha-100 text-matcha-900 border-matcha-300 font-bold shadow-2xs'
                            : 'bg-coffee-50 border-coffee-200 text-coffee-800 hover:bg-coffee-100 font-semibold'
                    }`}
                    title="Klik untuk melihat status shift & rekonsiliasi kas"
                >
                    <div className="w-2 h-2 rounded-full bg-matcha-600 animate-pulse flex-shrink-0" />
                    <span>{active_shift.shift_name.split(' ')[0]} (Aktif)</span>
                </button>
            ) : (
                <Button
                    variant="accent"
                    size="sm"
                    className="h-8 text-xs font-bold"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                    onClick={() => setPosTab('shift')}
                >
                    Buka Shift
                </Button>
            )}

            <Button
                variant={posTab === 'open-bills' ? 'primary' : 'outline'}
                size="sm"
                className="relative text-xs h-8 px-2 sm:px-3"
                leftIcon={<Clock className="w-3.5 h-3.5" />}
                onClick={() => setPosTab('open-bills')}
            >
                <span className="hidden sm:inline">Open Bill</span>
                {open_bills.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-berry-600 text-white rounded-full text-[10px] font-bold">
                        {open_bills.length}
                    </span>
                )}
            </Button>

            <Button
                variant={posTab === 'history' ? 'primary' : 'outline'}
                size="sm"
                className="hidden md:inline-flex text-xs h-8"
                leftIcon={<Receipt className="w-3.5 h-3.5" />}
                onClick={() => setPosTab('history')}
            >
                Histori
            </Button>
        </div>
    );

    return (
        <DashboardLayout
            title={
                posTab === 'catalog'
                    ? 'Katalog Menu'
                    : posTab === 'cart'
                    ? 'Keranjang Pesanan Pelanggan'
                    : posTab === 'open-bills'
                    ? 'Pesanan Open Bill (Tagihan Meja)'
                    : posTab === 'history'
                    ? 'Riwayat Transaksi & Pembatalan (Void)'
                    : active_shift
                    ? 'Manajemen Kas & Tutup Shift Kasir'
                    : 'Buka Shift Baru Kasir'
            }
            subtitle={
                posTab === 'catalog'
                    ? 'Katalog menu kopi, makanan, varian rasa, dan pemrosesan pesanan'
                    : posTab === 'cart'
                    ? 'Rincian item pesanan, nomor meja, diskon, dan metode pembayaran'
                    : posTab === 'open-bills'
                    ? 'Daftar pesanan aktif pelanggan dine-in yang belum lunas di kasir'
                    : posTab === 'history'
                    ? 'Daftar transaksi lunas shift ini, cetak ulang struk, dan otorisasi void'
                    : active_shift
                    ? 'Rekonsiliasi uang fisik di laci kasir terhadap catatan sistem (Z-Report)'
                    : 'Mulai shift kerja baru kasir dengan pencatatan modal awal kas'
            }
            storeName={store?.store_name ?? 'Monera Coffee'}
            tagline={store?.tagline ?? 'Powered by Bean & Bite'}
            navGroups={posNavGroups}
            headerRight={headerRightControls}
        >
            <div className="flex flex-col pb-20 lg:pb-0 w-full overflow-x-clip">
                {/* 1. IN-PAGE SECTION: KATALOG MENU (Workspace Kasir Utama) */}
                {posTab === 'catalog' && (
                    <>
                        {!active_shift && (
                            <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 font-medium shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-berry-600 animate-pulse shrink-0" />
                                    <p>
                                        <span className="font-bold text-coffee-950">Shift Kasir Sedang Tutup:</span> Transaksi dan pencatatan pesanan terkunci. Silakan buka shift kasir dan masukkan modal awal di laci untuk mulai bertransaksi.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => setPosTab('shift')}
                                    className="text-xs font-bold shrink-0 self-start sm:self-auto"
                                >
                                    Buka Shift Kasir
                                </Button>
                            </div>
                        )}
                        {/* Mobile Tab Switcher (Katalog vs Keranjang) */}
                        <div className="flex lg:hidden border-b border-coffee-200 bg-white px-3 py-1.5 gap-2 sticky top-0 z-20 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setMobileTab('catalog')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                    mobileTab === 'catalog'
                                        ? 'bg-coffee-900 text-white shadow-xs'
                                        : 'bg-white text-coffee-700 border border-coffee-200'
                                }`}
                            >
                                <Coffee className="w-3.5 h-3.5" />
                                Katalog ({menus.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileTab('cart')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
                                    mobileTab === 'cart'
                                        ? 'bg-coffee-900 text-white shadow-xs'
                                        : 'bg-white text-coffee-700 border border-coffee-200'
                                }`}
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                Pesanan
                                {cart.length > 0 && (
                                    <span className="px-1.5 py-0.2 bg-crema-600 text-white rounded-full text-[10px] font-bold">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* MAIN WORKSPACE */}
                        <main className="flex-1 w-full mx-auto px-3 py-3 sm:px-4 sm:py-3.5 lg:px-5 lg:py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-start">
                            {/* SISI KIRI: KATALOG MENU (Ditampilkan selalu di desktop, atau saat mobileTab === 'catalog') */}
                            <section
                                className={`lg:col-span-7 xl:col-span-8 flex flex-col space-y-3 ${
                                    mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
                                }`}
                            >
                                {/* Search & Category Filter (Statis di Atas Katalog) */}
                                <div className="shrink-0 bg-white p-3 rounded-2xl border border-coffee-200 shadow-2xs space-y-2.5">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-coffee-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari menu kopi, matcha, makanan, atau pastry..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 bg-coffee-50 border border-coffee-200 rounded-xl text-xs sm:text-sm text-coffee-950 placeholder-coffee-400 focus:outline-none focus:border-coffee-500 focus:bg-white transition"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Category Responsive Tabs (Wrap Dinamis di Layar Kecil agar Tidak Terpotong) */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('all')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                                selectedCategory === 'all'
                                                    ? 'bg-coffee-900 text-white shadow-2xs'
                                                    : 'bg-coffee-100/70 text-coffee-700 hover:bg-coffee-200/60'
                                            }`}
                                        >
                                            Semua Menu ({menus.length})
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                                    selectedCategory === cat.id
                                                        ? 'bg-coffee-900 text-white shadow-2xs'
                                                        : 'bg-coffee-100/70 text-coffee-700 hover:bg-coffee-200/60'
                                                }`}
                                            >
                                                <span>{cat.name}</span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                                        selectedCategory === cat.id
                                                            ? 'bg-coffee-800 text-crema-300'
                                                            : 'bg-coffee-200 text-coffee-600'
                                                    }`}
                                                >
                                                    {cat.menus_count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Container Scroll Mandiri Menu Cards (Memastikan Tiket Kasir di Kanan Tetap Statis) */}
                                <div className="lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto pr-1 pb-4 scrollbar-thin space-y-3">
                                    {/* Grid Menu Cards: Dilengkapi Gambar Menu & Tampilan Responsif */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredMenus.map((menu) => {
                                        const selectedVarId = selectedVariants[menu.id] ?? menu.variants?.[0]?.id;
                                        const activeVar = menu.variants?.find((v) => v.id === selectedVarId);
                                        const extraPrice = activeVar ? activeVar.price_adjustment : 0;
                                        const dynamicPrice = menu.base_price + extraPrice;

                                        return (
                                            <div
                                                key={menu.id}
                                                className={`group bg-white border rounded-2xl p-3 flex flex-col justify-between transition-all select-none hover:shadow-sm hover:border-coffee-300 relative ${
                                                    !menu.is_available
                                                        ? 'opacity-60 bg-coffee-100/30 border-coffee-200 cursor-not-allowed'
                                                        : 'border-coffee-200'
                                                }`}
                                            >
                                                {/* Gambar Menu Visual */}
                                                <div className="relative w-full h-28 sm:h-32 mb-2 rounded-xl overflow-hidden bg-coffee-100 border border-coffee-200/60">
                                                    <img
                                                        src={menu.image || '/images/icon.png'}
                                                        alt={menu.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/images/icon.png';
                                                        }}
                                                    />

                                                    {!menu.is_available && (
                                                        <div className="absolute top-2 right-2 z-10">
                                                            <Badge variant="berry" size="sm">
                                                                Habis
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    {/* Kategori Sajian di atas nama menu (Tanpa border, teks bold) */}
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-crema-600 block mb-0.5">
                                                        {categories.find((c) => c.id === menu.category_id)?.name}
                                                    </span>

                                                    {/* Header Menu & Judul */}
                                                    <h3 className="font-bold text-coffee-950 text-xs sm:text-sm leading-snug group-hover:text-coffee-800 line-clamp-1">
                                                        {menu.name}
                                                    </h3>

                                                    {/* Deskripsi Menu Ringkas */}
                                                    <p className="text-[11px] text-coffee-500 leading-snug line-clamp-2 min-h-[28px]">
                                                        {menu.description || 'Racikan istimewa barista Monera Coffee.'}
                                                    </p>

                                                    {/* Pilihan Varian Kompak Horizontal Satu Baris */}
                                                    <div className="pt-1 border-t border-coffee-100/70">
                                                        {menu.variants && menu.variants.length > 0 ? (
                                                            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar scrollbar-none h-[25px]">
                                                                {menu.variants.map((v) => {
                                                                    const isSelected = selectedVarId === v.id;
                                                                    return (
                                                                        <button
                                                                            key={v.id}
                                                                            type="button"
                                                                            disabled={!menu.is_available}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedVariants((prev) => ({
                                                                                    ...prev,
                                                                                    [menu.id]: v.id,
                                                                                }));
                                                                            }}
                                                                            className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold whitespace-nowrap shrink-0 transition border cursor-pointer ${
                                                                                isSelected
                                                                                    ? 'bg-coffee-900 text-white border-coffee-900 shadow-2xs'
                                                                                    : 'bg-coffee-50 text-coffee-700 border-coffee-200 hover:bg-coffee-100'
                                                                            }`}
                                                                            title={v.name}
                                                                        >
                                                                            {v.name}
                                                                            {v.price_adjustment > 0 && (
                                                                                <span
                                                                                    className={
                                                                                        isSelected
                                                                                            ? 'text-crema-300 ml-1'
                                                                                            : 'text-coffee-500 ml-1'
                                                                                    }
                                                                                >
                                                                                    +{v.price_adjustment >= 1000 ? `${v.price_adjustment / 1000}k` : v.price_adjustment}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="h-[25px] flex items-center text-[10px] text-coffee-400 italic">
                                                                Porsi Standar
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer Card: Harga Dinamis & Tombol Tambah */}
                                                <div className="pt-2 mt-1.5 border-t border-coffee-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs sm:text-sm font-black text-coffee-950">
                                                            Rp {dynamicPrice.toLocaleString('id-ID')}
                                                        </span>
                                                        {activeVar && activeVar.price_adjustment > 0 && (
                                                            <p className="text-[9.5px] text-crema-800 font-semibold truncate max-w-[110px]">
                                                                {activeVar.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={!menu.is_available}
                                                        onClick={() => handleAddMenuInline(menu)}
                                                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-xl bg-coffee-900 text-white hover:bg-coffee-800 flex items-center gap-1 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 shadow-2xs"
                                                        title="Tambahkan ke pesanan"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-crema-400" />
                                                        <span>Tambah</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>

                                    {filteredMenus.length === 0 && (
                                        <div className="p-12 text-center bg-white rounded-2xl border border-coffee-200">
                                            <Coffee className="w-10 h-10 mx-auto text-coffee-300 mb-2" />
                                            <h4 className="text-sm font-bold text-coffee-800">
                                                Menu tidak ditemukan
                                            </h4>
                                            <p className="text-xs text-coffee-500 mt-1">
                                                Coba kata kunci lain atau pilih tab kategori yang berbeda.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* SISI KANAN: TIKET KERANJANG (Tinggi Dinamis Alami & Mengikuti Layar / Statis) */}
                            <section
                                className={`lg:col-span-5 xl:col-span-4 flex flex-col h-auto self-start lg:sticky lg:top-20 z-10 w-full max-w-xl mx-auto lg:max-w-none mb-16 lg:mb-0 ${
                                    mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
                                }`}
                            >
                                {renderCartContent()}
                            </section>
                        </main>

                {/* FLOATING MOBILE ACTION BAR (Untuk smartphone & tablet saat berada di tab Katalog) */}
                {cart.length > 0 && mobileTab === 'catalog' && (
                    <div className="fixed bottom-3 inset-x-4 z-40 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setPosTab('cart')}
                            className="w-full bg-coffee-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-coffee-800 active:scale-[0.99] transition cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-crema-600 text-white font-extrabold text-xs flex items-center justify-center">
                                    {cart.length}
                                </span>
                                <div className="text-left">
                                    <p className="text-xs font-bold leading-tight">
                                        Pesanan Aktif ({cart.reduce((a, b) => a + b.quantity, 0)} item)
                                    </p>
                                    <p className="text-[11px] text-crema-300 font-semibold">
                                        Rp {grandTotal.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl">
                                <span>Buka Keranjang & Bayar</span>
                                <ChevronUp className="w-4 h-4 text-crema-400" />
                            </div>
                        </button>
                    </div>
                )}
            </>
        )}

        {/* 2. IN-PAGE SECTION: KERANJANG PESANAN */}
        {posTab === 'cart' && renderCartSection()}

        {/* 3. IN-PAGE SECTION: PESANAN OPEN BILL */}
        {posTab === 'open-bills' && renderOpenBillsSection()}

        {/* 4. IN-PAGE SECTION: RIWAYAT & VOID */}
        {posTab === 'history' && renderHistorySection()}

        {/* 5. IN-PAGE SECTION: TUTUP / BUKA SHIFT KASIR (REKONSILIASI KAS Z-REPORT) */}
        {posTab === 'shift' && renderShiftSection()}

            {/* MODAL CETAK STRUK THERMAL SINKRON DENGAN PENGATURAN TOKO */}
            {receiptModalOrder && (
                <div className="fixed inset-0 z-50 bg-coffee-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-coffee-200 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-2 border-b border-coffee-100">
                            <div className="flex items-center gap-2 text-coffee-900 font-bold text-xs uppercase tracking-wider">
                                <Printer className="w-4 h-4 text-crema-600" />
                                Cetak Struk Kasir
                            </div>
                            <button
                                onClick={() => setReceiptModalOrder(null)}
                                className="w-7 h-7 rounded-full bg-coffee-100 text-coffee-600 flex items-center justify-center hover:bg-coffee-200 text-xs cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Tampilan Struk Kertas Thermal 58mm/80mm */}
                        <div className="bg-[#FAF9F6] border border-coffee-300 rounded-xl p-4 font-mono text-xs text-coffee-950 space-y-2.5 select-none shadow-2xs">
                            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-coffee-300">
                                <p className="font-extrabold text-sm tracking-wide uppercase">
                                    {store?.store_name ?? 'Monera Coffee'}
                                </p>
                                {store?.tagline && (
                                    <p className="text-[10px] italic text-coffee-600">
                                        "{store.tagline}"
                                    </p>
                                )}
                                {store?.address && (
                                    <p className="text-[10px] text-coffee-700 leading-tight">
                                        {store.address}
                                    </p>
                                )}
                                {store?.phone && (
                                    <p className="text-[10px] text-coffee-700">
                                        Telp/WA: {store.phone}
                                    </p>
                                )}
                            </div>

                            <div className="text-[10px] space-y-0.5 text-coffee-700 pb-2 border-b border-dashed border-coffee-300">
                                <div className="flex justify-between">
                                    <span>No: {receiptModalOrder.order_number}</span>
                                    <span>{receiptModalOrder.order_type === 'dine_in' ? formatTableDisplay(receiptModalOrder.table_number) : 'Take Away'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pelanggan: {receiptModalOrder.customer_name}</span>
                                    <span>Kasir: {active_shift?.cashier_name || (active_shift ? active_shift.shift_name : 'Kasir')}</span>
                                </div>
                                <div className="flex justify-between text-coffee-600">
                                    <span>Waktu:</span>
                                    <span>{formatOrderTime(receiptModalOrder.created_at, true)}</span>
                                </div>
                            </div>

                            {/* Daftar Item */}
                            <div className="space-y-1 text-[10.5px] py-1">
                                {receiptModalOrder.items && receiptModalOrder.items.length > 0 ? (
                                    receiptModalOrder.items.map((it) => (
                                        <div key={it.id} className="space-y-0.5">
                                            <div className="flex justify-between font-semibold">
                                                <span>{it.quantity}x {it.item_name}</span>
                                                <span>Rp {(it.unit_price * it.quantity).toLocaleString('id-ID')}</span>
                                            </div>
                                            {it.notes && (
                                                <div className="text-[9.5px] text-coffee-500 pl-2 italic">
                                                    {it.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between font-semibold">
                                        <span>Total Belanja Kasir</span>
                                        <span>Rp {receiptModalOrder.total_price.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Kalkulasi Subtotal, Pajak, Total */}
                            <div className="pt-2 border-t border-dashed border-coffee-300 space-y-0.5 text-[10.5px]">
                                <div className="flex justify-between text-coffee-700">
                                    <span>Subtotal</span>
                                    <span>Rp {receiptModalOrder.subtotal ? receiptModalOrder.subtotal.toLocaleString('id-ID') : receiptModalOrder.total_price.toLocaleString('id-ID')}</span>
                                </div>
                                {receiptModalOrder.tax_amount > 0 && (
                                    <div className="flex justify-between text-coffee-700">
                                        <span>Pajak Restoran PB1 ({store?.tax_percentage ?? 10}%)</span>
                                        <span>Rp {receiptModalOrder.tax_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {receiptModalOrder.discount_amount > 0 && (
                                    <div className="flex justify-between text-matcha-700 font-semibold">
                                        <span>Diskon Promo</span>
                                        <span>-Rp {receiptModalOrder.discount_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-xs text-coffee-950 pt-1 border-t border-coffee-900/30">
                                    <span>TOTAL</span>
                                    <span>Rp {receiptModalOrder.total_price.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-coffee-600">
                                    <span>Status</span>
                                    <span className="font-bold text-matcha-700">LUNAS</span>
                                </div>
                            </div>

                            {/* Footer Struk Kustom */}
                            <div className="text-center pt-2.5 border-t border-dashed border-coffee-300 space-y-0.5 text-[9.5px] text-coffee-600">
                                <p className="whitespace-pre-line leading-relaxed">
                                    {store?.receipt_footer || 'Terima kasih atas kunjungan Anda di Monera Coffee!'}
                                </p>
                                <p className="font-semibold text-coffee-400 text-[8.5px] uppercase tracking-wider">
                                    Powered by Bean & Bite POS
                                </p>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => setReceiptModalOrder(null)}
                            >
                                Tutup
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1 text-xs"
                                leftIcon={<Printer className="w-3.5 h-3.5" />}
                                onClick={() => {
                                    window.print();
                                }}
                            >
                                Cetak Thermal
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pelunasan Cepat Open Bill Langsung */}
            {settleModalOrder && (
                <div className="fixed inset-0 z-50 bg-coffee-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl border border-coffee-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-coffee-100 flex items-center justify-between bg-coffee-50/70">
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-coffee-950 flex items-center gap-2">
                                    <span>Pelunasan Tagihan Open Bill</span>
                                    <span className="text-xs bg-crema-100 text-crema-900 border border-crema-300 font-bold px-2 py-0.5 rounded-lg">
                                        Meja {settleModalOrder.table_number || '-'}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-coffee-500 mt-0.5 font-medium">
                                    No. Order: <span className="font-mono font-bold text-coffee-800">{settleModalOrder.order_number}</span> • Pelanggan: <span className="font-bold text-coffee-800">{settleModalOrder.customer_name}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettleModalOrder(null)}
                                className="w-8 h-8 rounded-full bg-coffee-100 hover:bg-coffee-200 flex items-center justify-center text-coffee-600 cursor-pointer transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body Scrollable */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 scrollbar-thin">
                            {/* Rincian Item */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-coffee-700 uppercase tracking-wider">
                                    Daftar Sajian Yang Dipesan
                                </label>
                                <div className="divide-y divide-coffee-100 border border-coffee-100 rounded-2xl p-2.5 bg-coffee-50/40 max-h-40 overflow-y-auto scrollbar-thin">
                                    {settleModalOrder.items && settleModalOrder.items.length > 0 ? (
                                        settleModalOrder.items.map((it, idx) => (
                                            <div key={it.id || idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="font-bold text-coffee-950 truncate">
                                                        <span className="text-coffee-400 font-semibold mr-1">{idx + 1}.</span>
                                                        {it.menu?.name || it.item_name || `Menu #${it.menu_id}`}
                                                    </p>
                                                    {it.variant_name && (
                                                        <p className="text-[10px] text-crema-700 font-medium">{it.variant_name}</p>
                                                    )}
                                                </div>
                                                <div className="text-right whitespace-nowrap">
                                                    <span className="text-coffee-500 text-[11px] mr-2">{it.quantity}x</span>
                                                    <span className="font-bold text-coffee-950">Rp {Number(it.subtotal || it.unit_price * it.quantity).toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-coffee-400 py-1 text-center">Rincian pesanan meja</p>
                                    )}
                                </div>
                            </div>

                            {/* Ringkasan Biaya */}
                            <div className="p-3 bg-crema-50/60 border border-crema-200/80 rounded-2xl space-y-1 text-xs">
                                <div className="flex justify-between text-coffee-600">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-coffee-900">Rp {Number(settleModalOrder.subtotal || settleModalOrder.total_price).toLocaleString('id-ID')}</span>
                                </div>
                                {Number(settleModalOrder.tax_amount) > 0 && (
                                    <div className="flex justify-between text-coffee-600">
                                        <span>Pajak Restoran PB1</span>
                                        <span>Rp {Number(settleModalOrder.tax_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {Number(settleModalOrder.discount_amount) > 0 && (
                                    <div className="flex justify-between text-matcha-700 font-bold">
                                        <span>Diskon Promo</span>
                                        <span>- Rp {Number(settleModalOrder.discount_amount).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="border-t border-crema-200/80 pt-1.5 flex justify-between items-baseline">
                                    <span className="font-bold text-coffee-950 uppercase text-xs">Total Tagihan</span>
                                    <span className="font-black text-coffee-950 text-base">Rp {Number(settleModalOrder.total_price).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Pilihan Metode Pembayaran */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-coffee-700 uppercase tracking-wider">
                                    Pilih Metode Pembayaran
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setSettlePaymentMethod('cash')}
                                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                            settlePaymentMethod === 'cash'
                                                ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                                : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-50'
                                        }`}
                                    >
                                        <Banknote className="w-3.5 h-3.5" />
                                        Tunai
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSettlePaymentMethod('qris')}
                                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                            settlePaymentMethod === 'qris'
                                                ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                                : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-50'
                                        }`}
                                    >
                                        <QrCode className="w-3.5 h-3.5" />
                                        QRIS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSettlePaymentMethod('debit')}
                                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                            settlePaymentMethod === 'debit'
                                                ? 'bg-coffee-900 text-white border-coffee-900 shadow-xs'
                                                : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-50'
                                        }`}
                                    >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Debit
                                    </button>
                                </div>

                                {settlePaymentMethod === 'cash' && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setSettleCashReceived(settleModalOrder.total_price)}
                                                className="flex-1 py-1 bg-coffee-50 border border-coffee-200 rounded-lg text-xs font-bold text-coffee-800 hover:bg-coffee-100 transition cursor-pointer"
                                            >
                                                Uang Pas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSettleCashReceived(50000)}
                                                className="flex-1 py-1 bg-coffee-50 border border-coffee-200 rounded-lg text-xs font-bold text-coffee-800 hover:bg-coffee-100 transition cursor-pointer"
                                            >
                                                50.000
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSettleCashReceived(100000)}
                                                className="flex-1 py-1 bg-coffee-50 border border-coffee-200 rounded-lg text-xs font-bold text-coffee-800 hover:bg-coffee-100 transition cursor-pointer"
                                            >
                                                100.000
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-coffee-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                placeholder="Uang Diterima Kasir"
                                                value={settleCashReceived}
                                                onChange={(e) =>
                                                    setSettleCashReceived(
                                                        e.target.value === '' ? '' : Number(e.target.value)
                                                    )
                                                }
                                                className="w-full pl-9 pr-3 py-1.5 bg-coffee-50 border border-coffee-200 rounded-xl text-sm font-bold text-coffee-950 focus:bg-white focus:outline-none focus:border-coffee-500"
                                            />
                                        </div>

                                        {settleCashReceived !== '' && (
                                            <div className="flex items-center justify-between text-xs pt-0.5">
                                                <span className="font-semibold text-coffee-600">Kembalian:</span>
                                                <span
                                                    className={`font-bold text-sm ${
                                                        Number(settleCashReceived) >= settleModalOrder.total_price
                                                            ? 'text-matcha-700'
                                                            : 'text-berry-600'
                                                    }`}
                                                >
                                                    {Number(settleCashReceived) >= settleModalOrder.total_price
                                                        ? `Rp ${(Number(settleCashReceived) - settleModalOrder.total_price).toLocaleString('id-ID')}`
                                                        : 'Uang Kurang!'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Tombol Aksi */}
                        <div className="p-3.5 sm:p-4 border-t border-coffee-100 bg-coffee-50/50 flex gap-2">
                            <Button
                                variant="outline"
                                size="md"
                                className="flex-1 font-bold text-xs"
                                onClick={() => setSettleModalOrder(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                className="flex-2 font-bold text-xs bg-matcha-700 hover:bg-matcha-800 text-white"
                                disabled={
                                    isSettling ||
                                    (settlePaymentMethod === 'cash' &&
                                        (settleCashReceived === '' || Number(settleCashReceived) < settleModalOrder.total_price))
                                }
                                isLoading={isSettling}
                                onClick={handleConfirmSettleOrder}
                            >
                                Konfirmasi & Lunasi (Rp {Number(settleModalOrder.total_price).toLocaleString('id-ID')})
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
