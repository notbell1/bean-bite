<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CashShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Promo;
use App\Models\StockLog;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    /**
     * Tampilkan Terminal POS Kasir & Pemrosesan Transaksi.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $store = StoreSetting::first();

        // Sanitasi & Validasi Parameter Query Katalog (?category=1', ?search=kopi', dsb.)
        $rawCategory = $request->query('category');
        $categoryFilter = ($rawCategory !== null && $rawCategory !== 'all' && ctype_digit((string) $rawCategory))
            ? (int) $rawCategory
            : 'all';
        $searchFilter = trim((string) $request->query('search', ''));

        // 1. Shift Kasir Aktif untuk Kasir yang Sedang Login
        $activeShift = CashShift::where('user_id', $user->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        // 2. Kategori Menu
        $categories = Category::where('is_active', true)
            ->withCount('menus')
            ->orderBy('sort_order')
            ->get();

        // 3. Katalog Menu Lengkap dengan Varian & Deteksi Stok Resep Real-time
        $menus = Menu::with([
            'variants' => fn($q) => $q->where('is_available', true),
            'recipes.ingredient',
        ])
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($m) {
                // Menu otomatis sold-out jika ada bahan baku resep yang habis (stok <= 0)
                $outOfStockRecipe = $m->recipes->first(function ($r) {
                    return $r->ingredient && $r->ingredient->stock <= 0;
                });
                $isAvailable = (bool) $m->is_available && ! $outOfStockRecipe;

                return [
                    'id' => $m->id,
                    'category_id' => $m->category_id,
                    'name' => $m->name,
                    'description' => $m->description,
                    'image' => $m->image ? (str_starts_with($m->image, 'http') || str_starts_with($m->image, '/') ? $m->image : asset('storage/' . $m->image)) : asset('images/icon.png'),
                    'base_price' => (float) $m->base_price,
                    'base_price_formatted' => 'Rp ' . number_format($m->base_price, 0, ',', '.'),
                    'cost_price' => (float) $m->cost_price,
                    'is_available' => $isAvailable,
                    'out_of_stock_reason' => $outOfStockRecipe ? "Bahan baku '{$outOfStockRecipe->ingredient->name}' habis" : null,
                    'variants' => $m->variants->map(fn($v) => [
                        'id' => $v->id,
                        'name' => $v->name,
                        'variant_type' => $v->variant_type,
                        'price_adjustment' => (float) $v->price_adjustment,
                        'cost_adjustment' => (float) $v->cost_adjustment,
                    ]),
                ];
            });

        // 4. Promo Kupon Diskon Aktif
        $promos = Promo::where('is_active', true)->get();

        // 5. Daftar Pesanan Open Bill yang Belum Lunas
        $openBillOrders = Order::with(['items.menu', 'promo'])
            ->where('is_open_bill', true)
            ->where('payment_status', 'unpaid')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return array_merge($order->toArray(), [
                    'total_price' => (float) $order->total_price,
                    'subtotal' => (float) $order->subtotal,
                    'tax_amount' => (float) $order->tax_amount,
                    'discount_amount' => (float) $order->discount_amount,
                ]);
            });

        // 6. Histori Order Hari Ini (untuk fitur Cetak Ulang Struk Kasir)
        $recentOrders = Order::with(['items', 'payment'])
            ->whereDate('created_at', today())
            ->where('payment_status', 'paid')
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(function ($order) {
                return array_merge($order->toArray(), [
                    'payment_method' => $order->payment?->payment_method ?? 'cash',
                    'total_price' => (float) $order->total_price,
                    'subtotal' => (float) $order->subtotal,
                    'tax_amount' => (float) $order->tax_amount,
                    'discount_amount' => (float) $order->discount_amount,
                ]);
            });

        return Inertia::render('pos/Index', [
            'store' => $store,
            'active_shift' => $activeShift ? [
                'id' => $activeShift->id,
                'cashier_name' => $activeShift->cashier_name ?: ($activeShift->user?->name ?? 'Kasir'),
                'shift_name' => $activeShift->shift_name,
                'start_cash' => (float) $activeShift->start_cash,
                'expected_cash' => (float) ($activeShift->expected_cash ?? $activeShift->start_cash),
                'opened_at' => $activeShift->opened_at->timezone('Asia/Jakarta')->format('H:i') . ' WIB',
            ] : null,
            'categories' => $categories,
            'menus' => $menus,
            'promos' => $promos,
            'open_bills' => $openBillOrders,
            'recent_orders' => $recentOrders,
            'filters' => [
                'category' => $categoryFilter,
                'search' => $searchFilter,
            ],
        ]);
    }

    /**
     * Buka Shift Kasir Baru (Input Modal Awal Kas).
     */
    public function openShift(Request $request): RedirectResponse
    {
        $request->validate([
            'cashier_name' => ['required', 'string', 'min:3', 'max:100'],
            'shift_name' => ['required', 'string', 'max:50'],
            'start_cash' => ['required', 'numeric', 'min:0'],
        ]);

        $shift = CashShift::create([
            'user_id' => Auth::id(),
            'cashier_name' => $request->cashier_name,
            'shift_name' => $request->shift_name,
            'start_cash' => $request->start_cash,
            'expected_cash' => $request->start_cash,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'cash_shift_opened',
            'model_type' => CashShift::class,
            'model_id' => $shift->id,
            'new_values' => [
                'cashier_name' => $request->cashier_name,
                'start_cash' => $request->start_cash,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Shift '{$shift->shift_name}' berhasil dibuka dengan modal awal Rp " . number_format($request->start_cash, 0, ',', '.') . '.');
    }

    /**
     * Tutup Shift Kasir (Rekonsiliasi Z-Report & Selisih Kas).
     */
    public function closeShift(Request $request): RedirectResponse
    {
        $request->validate([
            'actual_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $shift = CashShift::where('user_id', Auth::id())
            ->where('status', 'open')
            ->latest('opened_at')
            ->firstOrFail();

        $expected = (float) ($shift->expected_cash ?? $shift->start_cash);
        $actual = (float) $request->actual_cash;
        $difference = $actual - $expected;

        $shift->update([
            'actual_cash' => $actual,
            'difference' => $difference,
            'notes' => $request->notes,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'cash_shift_closed',
            'model_type' => CashShift::class,
            'model_id' => $shift->id,
            'old_values' => ['expected_cash' => $expected],
            'new_values' => ['actual_cash' => $actual, 'difference' => $difference],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Shift kasir telah ditutup. Laporan Z-Report berhasil disimpan.');
    }

    /**
     * Buat Pesanan Baru (Pay First maupun Open Bill).
     */
    public function storeOrder(Request $request): RedirectResponse
    {
        if ($request->has('payment_method') && $request->payment_method !== null) {
            $pm = strtolower((string) $request->payment_method);
            if ($pm === 'tunai') $pm = 'cash';
            $request->merge(['payment_method' => $pm]);
        }

        $request->validate([
            'customer_name' => ['nullable', 'string', 'max:100'],
            'table_number' => ['nullable', 'string', 'max:20'],
            'order_type' => ['required', 'in:dine_in,take_away'],
            'is_open_bill' => ['required', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'exists:menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required_if:is_open_bill,false', 'nullable', 'in:cash,qris,debit,transfer,tunai'],
            'amount_paid' => ['required_if:is_open_bill,false', 'nullable', 'numeric', 'min:0'],
        ]);

        $shift = CashShift::where('user_id', Auth::id())->where('status', 'open')->latest()->first();
        if (! $shift) {
            return back()->with('error', 'Buka sesi shift kasir terlebih dahulu sebelum mencatat pesanan.');
        }

        DB::transaction(function () use ($request, $shift) {
            $prefix = 'MNR-' . date('dmy') . '-';
            $todayCount = Order::whereDate('created_at', today())->count() + 1;
            $orderNumber = $prefix . str_pad($todayCount, 3, '0', STR_PAD_LEFT);
            while (Order::where('order_number', $orderNumber)->exists()) {
                $todayCount++;
                $orderNumber = $prefix . str_pad($todayCount, 3, '0', STR_PAD_LEFT);
            }

            $subtotal = 0;
            $totalCost = 0;

            foreach ($request->items as $itemData) {
                $subtotal += $itemData['unit_price'] * $itemData['quantity'];
                $menu = Menu::find($itemData['menu_id']);
                $totalCost += ($menu->cost_price ?? 0) * $itemData['quantity'];
            }

            $store = StoreSetting::first();
            $taxRate = $store ? ((float) $store->tax_percentage / 100) : 0.10;
            $tax = round($subtotal * $taxRate, 2);
            $discount = (float) ($request->discount_amount ?? 0);
            $totalPrice = $subtotal + $tax - $discount;

            $isOpenBill = (bool) $request->is_open_bill;

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => Auth::id(),
                'cash_shift_id' => $shift?->id,
                'promo_id' => $request->promo_id,
                'customer_name' => $request->customer_name ?: 'Pelanggan',
                'table_number' => $request->table_number,
                'order_type' => $request->order_type,
                'is_open_bill' => $isOpenBill,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'total_price' => $totalPrice,
                'total_cost' => $totalCost,
                'order_status' => $isOpenBill ? 'open_bill' : 'waiting',
                'payment_status' => $isOpenBill ? 'unpaid' : 'paid',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $it) {
                $menu = Menu::with(['category', 'recipes.ingredient'])->find($it['menu_id']);
                $target = $menu->category?->production_target ?? 'barista';

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_id' => $menu->id,
                    'menu_variant_id' => $it['menu_variant_id'] ?? null,
                    'item_name' => $menu->name,
                    'variant_snapshot' => $it['variant_name'] ?? null,
                    'quantity' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'cost_price' => $menu->cost_price ?? 0,
                    'subtotal' => $it['unit_price'] * $it['quantity'],
                    'notes' => $it['notes'] ?? null,
                    'production_status' => 'waiting',
                    'item_target' => $target,
                ]);

                // Sinkronisasi Stok Bahan Baku Real-time Sesuai Resep (FIFO & Mutasi Akurat)
                foreach ($menu->recipes as $recipe) {
                    $ingredient = $recipe->ingredient;
                    if ($ingredient) {
                        $deductQty = (float) ($recipe->quantity * $it['quantity']);
                        $ingredient->decrement('stock', $deductQty);

                        StockLog::create([
                            'ingredient_id' => $ingredient->id,
                            'user_id' => Auth::id(),
                            'type' => 'out',
                            'quantity' => $deductQty,
                            'cost' => $deductQty * (float) $ingredient->cost_per_unit,
                            'reference' => 'Order #' . $order->order_number,
                            'notes' => "Konsumsi resep {$it['quantity']}x {$menu->name}",
                        ]);
                    }
                }
            }

            // Jika Pay First, simpan pembayaran dan mutasi kas
            if (! $isOpenBill) {
                Payment::create([
                    'order_id' => $order->id,
                    'user_id' => Auth::id(),
                    'payment_method' => $request->payment_method ?? 'cash',
                    'amount_paid' => $request->amount_paid,
                    'change_amount' => max(0, $request->amount_paid - $totalPrice),
                    'payment_time' => now(),
                ]);

                // Update expected cash di shift kasir
                if ($shift && $request->payment_method === 'cash') {
                    $shift->increment('expected_cash', $totalPrice);
                }
            }
        });

        return back()->with('success', 'Pesanan berhasil diproses dan dikirim ke antrean dapur KDS.');
    }

    /**
     * Pelunasan Pesanan Open Bill (Pay Later -> Paid).
     */
    public function payOrder(Order $order, Request $request): RedirectResponse
    {
        if ($request->has('payment_method') && $request->payment_method !== null) {
            $pm = strtolower((string) $request->payment_method);
            if ($pm === 'tunai') $pm = 'cash';
            $request->merge(['payment_method' => $pm]);
        } else {
            $request->merge(['payment_method' => 'cash']);
        }

        if (! $request->filled('amount_paid')) {
            $request->merge(['amount_paid' => (float) $order->total_price]);
        }

        $request->validate([
            'payment_method' => ['required', 'in:cash,qris,debit,transfer,tunai'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'promo_id' => ['nullable', 'exists:promos,id'],
            'additional_items' => ['nullable', 'array'],
            'additional_items.*.menu_id' => ['required', 'exists:menus,id'],
            'additional_items.*.quantity' => ['required', 'integer', 'min:1'],
            'additional_items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $shift = CashShift::where('user_id', Auth::id())->where('status', 'open')->latest()->first();
        if (! $shift) {
            return back()->with('error', 'Buka sesi shift kasir terlebih dahulu sebelum menerima pembayaran.');
        }

        DB::transaction(function () use ($order, $request, $shift) {
            // 1. Simpan item tambahan jika kasir menambahkan pesanan baru saat pelunasan
            if (! empty($request->additional_items)) {
                foreach ($request->additional_items as $it) {
                    $menu = Menu::with(['category', 'recipes.ingredient'])->find($it['menu_id']);
                    $target = $menu?->category?->production_target ?? 'barista';

                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_id' => $it['menu_id'],
                        'menu_variant_id' => $it['menu_variant_id'] ?? null,
                        'item_name' => $menu ? $menu->name : 'Item Menu',
                        'variant_snapshot' => $it['variant_name'] ?? null,
                        'quantity' => $it['quantity'],
                        'unit_price' => $it['unit_price'],
                        'cost_price' => $menu->cost_price ?? 0,
                        'subtotal' => $it['unit_price'] * $it['quantity'],
                        'notes' => $it['notes'] ?? null,
                        'production_status' => 'waiting',
                        'item_target' => $target,
                    ]);

                    // Potong stok bahan baku untuk item tambahan
                    if ($menu) {
                        foreach ($menu->recipes as $recipe) {
                            $ingredient = $recipe->ingredient;
                            if ($ingredient) {
                                $usedQty = (float) ($recipe->quantity * $it['quantity']);
                                $ingredient->decrement('stock', $usedQty);

                                StockLog::create([
                                    'ingredient_id' => $ingredient->id,
                                    'user_id' => Auth::id(),
                                    'type' => 'out',
                                    'quantity' => $usedQty,
                                    'cost' => $usedQty * (float) $ingredient->cost_per_unit,
                                    'reference' => 'Add-on #' . $order->order_number,
                                    'notes' => "Pengurangan bahan ({$it['quantity']}x {$menu->name}) open bill",
                                ]);
                            }
                        }
                    }
                }
            }

            // 2. Hitung ulang total akhir pesanan
            $order->load('items');
            $subtotal = (float) $order->items->sum('subtotal');
            $store = StoreSetting::first();
            $taxRate = $store ? ((float) $store->tax_percentage / 100) : 0.10;
            $tax = round($subtotal * $taxRate, 2);
            $discount = (float) ($request->discount_amount ?? $order->discount_amount ?? 0);
            $totalPrice = max(0, $subtotal + $tax - $discount);

            $amountPaid = (float) $request->amount_paid;
            $changeAmount = max(0, $amountPaid - $totalPrice);

            // 3. Tentukan status order yang valid sesuai progres dapur
            $allReady = $order->items->count() > 0 && $order->items->every(fn($it) => $it->production_status === 'ready');
            $hasWaiting = $order->items->contains(fn($it) => $it->production_status === 'waiting');
            $resolvedStatus = $allReady ? 'completed' : ($hasWaiting ? 'waiting' : 'in_progress');

            // Update status order menjadi lunas (Paid) dan matikan is_open_bill
            $order->update([
                'cash_shift_id' => $shift->id,
                'promo_id' => $request->promo_id ?? $order->promo_id,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'total_price' => $totalPrice,
                'payment_status' => 'paid',
                'order_status' => $resolvedStatus,
                'is_open_bill' => false,
                'completed_at' => $resolvedStatus === 'completed' ? now() : $order->completed_at,
            ]);

            // 4. Catat transaksi pembayaran
            Payment::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'payment_method' => $request->payment_method,
                'amount_paid' => $amountPaid,
                'change_amount' => $changeAmount,
                'payment_time' => now(),
            ]);

            // 5. Update kas masuk laci kasir jika pembayaran tunai
            if ($request->payment_method === 'cash') {
                $shift->increment('expected_cash', $totalPrice);
            }
        });

        return back()->with('success', 'Tagihan Open Bill Meja ' . ($order->table_number ?? '') . ' berhasil dilunasi!');
    }

    /**
     * Batalkan / Void Order dengan Alasan Wajib.
     */
    public function voidOrder(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'order_status' => 'cancelled',
                'cancel_reason' => $request->reason,
                'cancelled_by' => Auth::id(),
            ]);

            // Kembalikan stok bahan baku secara otomatis (Restorasi Stok Void)
            foreach ($order->items as $item) {
                $menu = Menu::with('recipes.ingredient')->find($item->menu_id);
                if ($menu) {
                    foreach ($menu->recipes as $recipe) {
                        $ingredient = $recipe->ingredient;
                        if ($ingredient) {
                            $restoreQty = (float) ($recipe->quantity * $item->quantity);
                            $ingredient->increment('stock', $restoreQty);

                            StockLog::create([
                                'ingredient_id' => $ingredient->id,
                                'user_id' => Auth::id(),
                                'type' => 'in',
                                'quantity' => $restoreQty,
                                'cost' => $restoreQty * (float) $ingredient->cost_per_unit,
                                'reference' => 'Void Order #' . $order->order_number,
                                'notes' => "Pengembalian stok pembatalan order ({$item->quantity}x {$menu->name}): " . $request->reason,
                            ]);
                        }
                    }
                }
            }

            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'order_void',
                'model_type' => Order::class,
                'model_id' => $order->id,
                'old_values' => ['order_status' => $order->getOriginal('order_status')],
                'new_values' => [
                    'order_status' => 'cancelled',
                    'cancel_reason' => $request->reason,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', "Order #{$order->order_number} berhasil dibatalkan (void).");
    }
}
