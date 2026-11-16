<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CashShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Promo;
use App\Models\StockLog;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Tampilkan Executive Dashboard Pemilik / Super Admin dengan data riil dari database.
     */
    public function index(Request $request): Response
    {
        // 1. Sanitasi & Whitelist Parameter Query Laporan
        $rawPeriod = (string) $request->query('period', 'today');
        $period = in_array($rawPeriod, ['today', 'yesterday', 'last_7_days', 'this_month'], true) ? $rawPeriod : 'today';

        $rawRole = (string) $request->query('role', 'all');
        $roleFilter = in_array($rawRole, ['pemilik', 'admin_kasir', 'barista_koki'], true) ? $rawRole : 'all';

        $rawStatus = (string) $request->query('status', 'all');
        $statusFilter = in_array($rawStatus, ['active', 'suspended'], true) ? $rawStatus : 'all';

        $search = trim((string) $request->query('search', ''));

        // Rentang Waktu Laporan Berdasarkan Periode
        $startDate = match ($period) {
            'yesterday' => now()->subDay()->startOfDay(),
            'last_7_days' => now()->subDays(7)->startOfDay(),
            'this_month' => now()->startOfMonth(),
            default => now()->startOfDay(),
        };
        $endDate = match ($period) {
            'yesterday' => now()->subDay()->endOfDay(),
            default => now()->endOfDay(),
        };

        // 2. Data Pengguna dari tabel users
        $users = User::select(
            'id', 'name', 'username', 'email', 'role', 'phone', 'avatar', 'is_active', 'last_login_at', 'created_at'
        )->orderBy('id', 'asc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->role,
                'phone' => $u->phone,
                'avatar_url' => $u->avatar_url,
                'is_active' => (bool) $u->is_active,
                'last_login_at' => $u->last_login_at ? $u->last_login_at->diffForHumans() : 'Belum pernah',
                'created_at' => $u->created_at ? $u->created_at->format('d M Y') : '-',
            ];
        });

        // 3. Kalkulasi KPI Penjualan & Finansial Sesuai Periode
        $ordersQuery = Order::whereBetween('created_at', [$startDate, $endDate])->get();
        $paidOrders = $ordersQuery->where('payment_status', 'paid');

        $omzetGross = (float) $paidOrders->sum('total_price');
        $totalCost = (float) $paidOrders->sum('total_cost');
        $labaKotor = $omzetGross - $totalCost;
        $profitMargin = $omzetGross > 0 ? round(($labaKotor / $omzetGross) * 100, 1) : 0;
        $totalOrders = $ordersQuery->count();
        $activeOpenBills = Order::where('is_open_bill', true)->where('payment_status', 'unpaid')->count();

        // 4. Data Bahan Baku & Inventaris Real-time
        $ingredientsQuery = Ingredient::with(['recipes.menu'])->orderBy('name', 'asc')->get();
        $totalInventoryAsset = 0;
        $criticalCount = 0;
        $outOfStockCount = 0;

        $allIngredients = $ingredientsQuery->map(function ($ing) use (&$totalInventoryAsset, &$criticalCount, &$outOfStockCount) {
            $stock = (float) $ing->stock;
            $minStock = (float) $ing->min_stock;
            $costPerUnit = (float) $ing->cost_per_unit;
            $assetValue = $stock * $costPerUnit;
            $totalInventoryAsset += $assetValue;

            if ($stock <= 0) {
                $status = 'habis';
                $outOfStockCount++;
            } elseif ($stock <= $minStock) {
                $status = 'menipis';
                $criticalCount++;
            } else {
                $status = 'aman';
            }

            return [
                'id' => $ing->id,
                'name' => $ing->name,
                'unit' => $ing->unit,
                'stock' => $stock,
                'min_stock' => $minStock,
                'cost_per_unit' => $costPerUnit,
                'cost_per_unit_formatted' => 'Rp ' . number_format($costPerUnit, 0, ',', '.'),
                'total_asset' => $assetValue,
                'total_asset_formatted' => 'Rp ' . number_format($assetValue, 0, ',', '.'),
                'status' => $status,
                'is_active' => (bool) $ing->is_active,
                'recipes_count' => $ing->recipes->count(),
                'used_in_menus' => $ing->recipes->map(fn($r) => $r->menu?->name)->filter()->values(),
            ];
        });

        // Filter bahan baku kritis untuk widget alert di overview
        $criticalIngredients = $allIngredients->filter(fn($i) => $i['status'] !== 'aman')->values();

        // 5. Status Shift Kasir Aktif
        $activeShift = CashShift::with('user:id,name,username,avatar')
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        // 6. Data Grafik Tren Penjualan Jam Sibuk (Hourly Peak 08:00 - 22:00)
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $hourlySales = [];
        $peakOrders = 0;
        $peakHour = null;
        for ($hour = 8; $hour <= 22; $hour++) {
            $formattedHour = str_pad($hour, 2, '0', STR_PAD_LEFT);
            $query = Order::whereBetween('created_at', [$startDate, $endDate]);
            if ($isSqlite) {
                $query->whereRaw("cast(strftime('%H', created_at) as integer) = ?", [$hour]);
            } else {
                $query->whereRaw('HOUR(created_at) = ?', [$hour]);
            }
            $count = $query->count();
            $rev = (float) (clone $query)->where('payment_status', 'paid')->sum('total_price');
            if ($count > $peakOrders) {
                $peakOrders = $count;
                $peakHour = $formattedHour . ':00';
            }
            $hourlySales[] = [
                'hour' => $formattedHour,
                'orders' => $count,
                'revenue_formatted' => 'Rp ' . number_format($rev, 0, ',', '.'),
            ];
        }

        // 7. Top 5 Menu Terlaris Sesuai Periode
        $topMenus = OrderItem::select('item_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('AVG(cost_price) as avg_cost'), DB::raw('AVG(unit_price) as avg_price'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('item_name')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $margin = $item->avg_price > 0 ? round((($item->avg_price - $item->avg_cost) / $item->avg_price) * 100) : 0;
                return [
                    'name' => $item->item_name,
                    'sold' => (int) $item->total_sold,
                    'cost_formatted' => 'Rp ' . number_format($item->avg_cost, 0, ',', '.'),
                    'margin_percent' => $margin,
                ];
            });

        // 7. Audit Trail Logs Terbaru
        $recentAuditLogs = AuditLog::with('user:id,name,username')
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'ip_address' => $log->ip_address,
                    'time_ago' => $log->created_at ? $log->created_at->diffForHumans() : '-',
                ];
            });

        // 8. Riwayat Mutasi Stok Real-time (Bahan Rusak/Waste, Opname Fisik, Restock, POS)
        // Terurut dari yang paling baru di bagian paling atas
        $stockLogs = StockLog::with(['ingredient:id,name,unit', 'user:id,name,username'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->take(200)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'ingredient_id' => $log->ingredient_id,
                    'ingredient_name' => $log->ingredient?->name ?? 'Bahan Telah Dihapus',
                    'unit' => $log->ingredient?->unit ?? '',
                    'user_name' => $log->user?->name ?? 'System',
                    'type' => $log->type, // 'waste', 'adjustment', 'in', 'out'
                    'quantity' => (float) $log->quantity,
                    'cost' => (float) $log->cost,
                    'cost_formatted' => 'Rp ' . number_format($log->cost, 0, ',', '.'),
                    'reference' => $log->reference,
                    'notes' => $log->notes,
                    'created_at' => $log->created_at ? $log->created_at->format('d M Y, H:i') : '-',
                    'created_at_raw' => $log->created_at ? $log->created_at->toIso8601String() : null,
                    'time_ago' => $log->created_at ? $log->created_at->diffForHumans() : '-',
                ];
            });

        $totalWasteCost = (float) StockLog::where('type', 'waste')->sum('cost');
        $totalWasteCount = StockLog::where('type', 'waste')->count();
        $totalAdjustmentCount = StockLog::where('type', 'adjustment')->count();
        $totalRestockCount = StockLog::where('type', 'in')->count();

        // 9. Laba Rugi & Arus Kas Finansial (Profit & Loss / Cashflow)
        // A. Pemasukan (Revenue): Pesanan Kasir Lunas
        $totalGrossRevenue = (float) Order::where('payment_status', 'paid')->sum('total_price');
        $totalCostOfGoodsSold = (float) Order::where('payment_status', 'paid')->sum('total_cost');
        $totalGrossProfit = $totalGrossRevenue - $totalCostOfGoodsSold;
        $grossMarginPercent = $totalGrossRevenue > 0 ? round(($totalGrossProfit / $totalGrossRevenue) * 100, 1) : 0;

        // B. Pengeluaran (Expenses): Pembelian Restock Bahan & Kerugian Bahan Rusak
        $totalProcurementCost = (float) StockLog::where('type', 'in')->sum('cost');
        $totalWasteExpense = (float) StockLog::where('type', 'waste')->sum('cost');
        $totalOperationalExpense = $totalProcurementCost + $totalWasteExpense;

        // C. Arus Kas Bersih (Net Cash Flow / Laba Bersih Operasional)
        $netCashFlow = $totalGrossRevenue - $totalOperationalExpense;

        // D. Periode Laba Rugi Berjalan (Berdasarkan filter periode saat ini)
        $periodGrossRevenue = (float) $paidOrders->sum('total_price');
        $periodCostOfGoods = (float) $paidOrders->sum('total_cost');
        $periodGrossProfit = $periodGrossRevenue - $periodCostOfGoods;

        $periodStockInCost = (float) StockLog::where('type', 'in')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('cost');
        $periodWasteCost = (float) StockLog::where('type', 'waste')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('cost');
        $periodTotalExpense = $periodStockInCost + $periodWasteCost;
        $periodNetCashFlow = $periodGrossRevenue - $periodTotalExpense;

        $financialSummary = [
            'gross_revenue' => $totalGrossRevenue,
            'gross_revenue_formatted' => 'Rp ' . number_format($totalGrossRevenue, 0, ',', '.'),
            'cogs' => $totalCostOfGoodsSold,
            'cogs_formatted' => 'Rp ' . number_format($totalCostOfGoodsSold, 0, ',', '.'),
            'gross_profit' => $totalGrossProfit,
            'gross_profit_formatted' => 'Rp ' . number_format($totalGrossProfit, 0, ',', '.'),
            'gross_margin_percent' => $grossMarginPercent,
            'procurement_cost' => $totalProcurementCost,
            'procurement_cost_formatted' => 'Rp ' . number_format($totalProcurementCost, 0, ',', '.'),
            'waste_expense' => $totalWasteExpense,
            'waste_expense_formatted' => 'Rp ' . number_format($totalWasteExpense, 0, ',', '.'),
            'total_expense' => $totalOperationalExpense,
            'total_expense_formatted' => 'Rp ' . number_format($totalOperationalExpense, 0, ',', '.'),
            'net_cash_flow' => $netCashFlow,
            'net_cash_flow_formatted' => ($netCashFlow >= 0 ? '+' : '-') . 'Rp ' . number_format(abs($netCashFlow), 0, ',', '.'),
            'is_surplus' => $netCashFlow >= 0,

            // Periode Terpilih
            'period_revenue_formatted' => 'Rp ' . number_format($periodGrossRevenue, 0, ',', '.'),
            'period_expense_formatted' => 'Rp ' . number_format($periodTotalExpense, 0, ',', '.'),
            'period_procurement_formatted' => 'Rp ' . number_format($periodStockInCost, 0, ',', '.'),
            'period_waste_formatted' => 'Rp ' . number_format($periodWasteCost, 0, ',', '.'),
            'period_net_cash_flow_formatted' => ($periodNetCashFlow >= 0 ? '+' : '-') . 'Rp ' . number_format(abs($periodNetCashFlow), 0, ',', '.'),
            'period_is_surplus' => $periodNetCashFlow >= 0,
        ];

        // E. Buku Kas & Ledger Finansial Terpadu (Pemasukan POS + Pengeluaran Restock/Waste)
        $incomeRecords = Order::with('user:id,name')
            ->where('payment_status', 'paid')
            ->orderByDesc('created_at')
            ->take(150)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => 'order_' . $order->id,
                    'type' => 'income',
                    'category' => 'Penjualan Kasir',
                    'title' => 'Order #' . $order->order_number,
                    'description' => ($order->customer_name ? 'Pelanggan: ' . $order->customer_name : 'Walk-in Customer') . ' (' . ($order->order_type === 'dine_in' ? 'Dine In' : 'Takeaway') . ')',
                    'amount' => (float) $order->total_price,
                    'amount_formatted' => '+Rp ' . number_format($order->total_price, 0, ',', '.'),
                    'cogs' => (float) $order->total_cost,
                    'cogs_formatted' => 'HPP: Rp ' . number_format($order->total_cost, 0, ',', '.'),
                    'user_name' => $order->user?->name ?? 'Kasir Monera',
                    'created_at' => $order->created_at ? $order->created_at->format('d M Y, H:i') : '-',
                    'created_at_raw' => $order->created_at ? $order->created_at->toIso8601String() : null,
                    'time_ago' => $order->created_at ? $order->created_at->diffForHumans() : '-',
                ];
            });

        $expenseRecords = StockLog::with(['ingredient:id,name,unit', 'user:id,name'])
            ->whereIn('type', ['in', 'waste'])
            ->where('cost', '>', 0)
            ->orderByDesc('created_at')
            ->take(150)
            ->get()
            ->map(function ($log) {
                $isWaste = $log->type === 'waste';
                $ingName = $log->ingredient?->name ?? 'Bahan';
                return [
                    'id' => 'stock_' . $log->id,
                    'type' => $isWaste ? 'waste' : 'expense',
                    'category' => $isWaste ? 'Kerugian Bahan Rusak' : 'Belanja Stok Bahan',
                    'title' => $isWaste ? 'Waste: ' . $ingName : 'Restock: ' . $ingName,
                    'description' => ($log->reference ? 'Ref: ' . $log->reference . ' • ' : '') . ($log->notes ? $log->notes : ($isWaste ? 'Bahan kedaluwarsa/rusak (' . $log->quantity . ' ' . ($log->ingredient?->unit ?? '') . ')' : 'Pembelian stok (' . $log->quantity . ' ' . ($log->ingredient?->unit ?? '') . ')')),
                    'amount' => (float) $log->cost,
                    'amount_formatted' => '-Rp ' . number_format($log->cost, 0, ',', '.'),
                    'cogs' => null,
                    'cogs_formatted' => null,
                    'user_name' => $log->user?->name ?? 'Admin Gudang',
                    'created_at' => $log->created_at ? $log->created_at->format('d M Y, H:i') : '-',
                    'created_at_raw' => $log->created_at ? $log->created_at->toIso8601String() : null,
                    'time_ago' => $log->created_at ? $log->created_at->diffForHumans() : '-',
                ];
            });

        $financialLedger = $incomeRecords->concat($expenseRecords)->sortByDesc('created_at_raw')->values()->all();

        // 8. Katalog Menu Kafe untuk Manajemen Super Admin
        $allMenus = Menu::with(['category', 'variants'])
            ->orderBy('category_id')
            ->orderBy('name')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'category_id' => $m->category_id,
                    'category_name' => $m->category?->name ?? 'Tanpa Kategori',
                    'name' => $m->name,
                    'slug' => $m->slug,
                    'description' => $m->description,
                    'image' => $m->image ? (str_starts_with($m->image, 'http') || str_starts_with($m->image, '/') ? $m->image : asset('storage/' . $m->image)) : '/images/icon.png',
                    'base_price' => (float) $m->base_price,
                    'base_price_formatted' => 'Rp ' . number_format($m->base_price, 0, ',', '.'),
                    'cost_price' => (float) $m->cost_price,
                    'cost_price_formatted' => 'Rp ' . number_format($m->cost_price, 0, ',', '.'),
                    'is_available' => (bool) $m->is_available,
                    'is_active' => (bool) $m->is_active,
                    'variants_count' => $m->variants->count(),
                ];
            });

        // Data Voucher Diskon & Kupon Promosi Kafe
        $promos = Promo::orderByDesc('id')->get()->map(function ($p) {
            $isPercent = in_array($p->discount_type, ['percentage', 'percent'], true);
            $val = (float) $p->discount_value;
            $formattedValue = $isPercent
                ? (rtrim(rtrim(number_format($val, 2, '.', ''), '0'), '.') . '%')
                : ('Rp ' . number_format($val, 0, ',', '.'));

            return [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'discount_type' => $p->discount_type,
                'discount_value' => $val,
                'discount_value_formatted' => $formattedValue,
                'min_order_amount' => (float) $p->min_order_amount,
                'min_order_amount_formatted' => 'Rp ' . number_format($p->min_order_amount, 0, ',', '.'),
                'max_discount_amount' => $p->max_discount_amount !== null ? (float) $p->max_discount_amount : null,
                'max_discount_amount_formatted' => $p->max_discount_amount !== null ? ('Rp ' . number_format($p->max_discount_amount, 0, ',', '.')) : '-',
                'start_date' => $p->start_date ? $p->start_date->format('Y-m-d') : null,
                'end_date' => $p->end_date ? $p->end_date->format('Y-m-d') : null,
                'is_active' => (bool) $p->is_active,
                'created_at' => $p->created_at ? $p->created_at->format('d M Y') : '-',
            ];
        });

        return Inertia::render('owner/Dashboard', [
            'users' => $users,
            'promos' => $promos,
            'kpi' => [
                'omzet_gross' => 'Rp ' . number_format($omzetGross, 0, ',', '.'),
                'laba_kotor' => 'Rp ' . number_format($labaKotor, 0, ',', '.'),
                'profit_margin' => $profitMargin,
                'total_orders' => $totalOrders,
                'active_open_bills' => $activeOpenBills,
                'critical_stock_count' => $criticalCount + $outOfStockCount,
                'total_ingredients' => $allIngredients->count(),
                'total_inventory_asset_formatted' => 'Rp ' . number_format($totalInventoryAsset, 0, ',', '.'),
                'critical_count' => $criticalCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_waste_cost_formatted' => 'Rp ' . number_format($totalWasteCost, 0, ',', '.'),
                'total_waste_count' => $totalWasteCount,
                'total_adjustment_count' => $totalAdjustmentCount,
                'total_restock_count' => $totalRestockCount,
            ],
            'financial_summary' => $financialSummary,
            'financial_ledger' => $financialLedger,
            'ingredients' => $allIngredients,
            'stock_logs' => $stockLogs,
            'critical_ingredients' => $criticalIngredients,
            'active_shift' => $activeShift ? [
                'id' => $activeShift->id,
                'shift_name' => $activeShift->shift_name,
                'kasir_name' => $activeShift->cashier_name ?: ($activeShift->user?->name ?? 'Kasir'),
                'kasir_avatar_url' => $activeShift->user?->avatar_url,
                'start_cash_formatted' => 'Rp ' . number_format($activeShift->start_cash, 0, ',', '.'),
                'expected_cash_formatted' => 'Rp ' . number_format($activeShift->expected_cash ?? 0, 0, ',', '.'),
                'opened_at' => $activeShift->opened_at->timezone('Asia/Jakarta')->format('H:i') . ' WIB',
                'status' => $activeShift->status,
            ] : null,
            'hourly_sales' => $hourlySales,
            'peak_hour' => $peakHour ? "{$peakHour} ({$peakOrders} Order)" : 'Belum Ada Transaksi',
            'top_menus' => $topMenus,
            'categories' => Category::orderBy('sort_order')->get(),
            'menus' => $allMenus,
            'recent_audit_logs' => $recentAuditLogs,
            'filters' => [
                'period' => $period,
                'role' => $roleFilter,
                'status' => $statusFilter,
                'search' => $search,
            ],
            'store' => StoreSetting::first(),
        ]);
    }

    /**
     * Toggle status aktif/suspend akun pengguna (Proteksi Super Admin aktif).
     */
    public function toggleUserStatus(User $user, Request $request): RedirectResponse
    {
        // Proteksi: Tidak boleh suspend Super Admin utama
        if ($user->id === 1 || $user->role === 'pemilik') {
            return back()->with('error', 'Proteksi Keamanan: Akun Super Admin tidak dapat dinonaktifkan.');
        }

        $oldStatus = $user->is_active;
        $user->is_active = ! $oldStatus;
        $user->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $user->is_active ? 'user_activated' : 'user_suspended',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => ['is_active' => $oldStatus],
            'new_values' => ['is_active' => $user->is_active],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $statusMsg = $user->is_active ? 'diaktifkan kembali' : 'dinonaktifkan (suspend)';
        return back()->with('success', "Akun staf {$user->name} berhasil {$statusMsg}.");
    }

    /**
     * Reset password akun pengguna oleh Pemilik.
     */
    public function resetUserPassword(User $user, Request $request): RedirectResponse
    {
        $user->password = Hash::make('password123');
        $user->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'user_password_reset_by_owner',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => null,
            'new_values' => ['reset_to_default' => true],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Kata sandi untuk {$user->name} berhasil direset menjadi 'password123'.");
    }

    /**
     * Paksa Tutup Shift Kasir (Force Close).
     */
    public function forceCloseShift(CashShift $shift, Request $request): RedirectResponse
    {
        $shift->update([
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => 'Shift ditutup paksa oleh Pemilik (Super Admin) dari dashboard.',
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'shift_forced_closed_by_owner',
            'model_type' => CashShift::class,
            'model_id' => $shift->id,
            'old_values' => ['status' => 'open'],
            'new_values' => ['status' => 'closed'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Shift kasir #{$shift->id} berhasil ditutup secara paksa.");
    }

    /**
     * Tambah Pengguna / Staf Baru oleh Super Admin.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'in:pemilik,admin_kasir,barista_koki'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'admin_password' => ['required_if:role,pemilik', 'nullable', 'string'],
        ]);

        // Cek Kuota Super Admin (Maksimal 2 Akun)
        if ($request->role === 'pemilik') {
            $currentPemilikCount = User::where('role', 'pemilik')->count();
            if ($currentPemilikCount >= 2) {
                return back()->with('error', 'Batas maksimal Super Admin adalah 2 akun. Tidak dapat menambah Super Admin baru.');
            }

            // Verifikasi Password Super Admin yang sedang login saat membuat akun Super Admin
            if (! Hash::check($request->admin_password, Auth::user()->password)) {
                return back()->withErrors(['admin_password' => 'Konfirmasi kata sandi Super Admin tidak valid.']);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'username' => strtolower($request->username),
            'email' => strtolower($request->email),
            'phone' => $request->phone,
            'role' => $request->role,
            'password' => Hash::make($request->password),
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'user_created',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => null,
            'new_values' => [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Akun staf {$user->name} berhasil ditambahkan dengan peran '{$user->role}'.");
    }

    /**
     * Ubah Profil, Email, Password, dan Hak Akses Role Pengguna.
     */
    public function updateUser(User $user, Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'in:pemilik,admin_kasir,barista_koki'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'admin_password' => ['nullable', 'string'],
        ]);

        $roleChanged = $request->role !== $user->role;
        $passwordChanged = ! empty($request->new_password);
        $emailChanged = strtolower($request->email) !== strtolower($user->email);

        // 1. Verifikasi Password Super Admin (Wajib jika mengubah Role, Email, atau Password)
        if ($roleChanged || $passwordChanged || $emailChanged) {
            if (empty($request->admin_password) || ! Hash::check($request->admin_password, Auth::user()->password)) {
                return back()->withErrors(['admin_password' => 'Konfirmasi kata sandi Super Admin diperlukan dan harus sesuai.']);
            }
        }

        // 2. Batasan Kuota Super Admin: Maksimal 2 Akun
        if ($request->role === 'pemilik' && $user->role !== 'pemilik') {
            $pemilikCount = User::where('role', 'pemilik')->count();
            if ($pemilikCount >= 2) {
                return back()->with('error', 'Batas maksimal Super Admin adalah 2 akun. Tidak dapat mempromosikan akun ini menjadi Super Admin.');
            }
        }

        // 3. Batasan Kuota Super Admin: Minimal 1 Akun (Tidak boleh mendemote satu-satunya Super Admin)
        if ($user->role === 'pemilik' && $request->role !== 'pemilik') {
            $pemilikCount = User::where('role', 'pemilik')->count();
            if ($pemilikCount <= 1) {
                return back()->with('error', 'Sistem wajib memiliki minimal 1 akun Super Admin. Tidak dapat mengubah peran satu-satunya Super Admin.');
            }
        }

        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
        ];

        $user->name = $request->name;
        $user->email = strtolower($request->email);
        $user->phone = $request->phone;
        $user->role = $request->role;

        if ($passwordChanged) {
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'user_updated',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'password_changed' => $passwordChanged,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Data akun {$user->name} berhasil diperbarui.");
    }

    /**
     * Hapus Akun Pengguna dengan Konfirmasi Password Super Admin.
     */
    public function deleteUser(User $user, Request $request): RedirectResponse
    {
        // 1. Tidak bisa menghapus diri sendiri
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Proteksi Keamanan: Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // 2. Minimal 1 akun Super Admin (Tidak bisa menghapus jika tersisa 1 Super Admin)
        if ($user->role === 'pemilik') {
            $pemilikCount = User::where('role', 'pemilik')->count();
            if ($pemilikCount <= 1) {
                return back()->with('error', 'Proteksi Keamanan: Tidak dapat menghapus satu-satunya akun Super Admin di sistem.');
            }
        }

        // 3. Konfirmasi Password Super Admin Wajib Valid
        $request->validate([
            'admin_password' => ['required', 'string'],
        ]);

        if (! Hash::check($request->admin_password, Auth::user()->password)) {
            return back()->withErrors(['admin_password' => 'Konfirmasi kata sandi Super Admin tidak valid.']);
        }

        DB::transaction(function () use ($user, $request) {
            // Reassign relasi pesanan ke admin yang menghapus agar integritas audit transaksi tetap utuh
            Order::where('user_id', $user->id)->update(['user_id' => Auth::id()]);
            Order::where('cancelled_by', $user->id)->update(['cancelled_by' => Auth::id()]);

            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'user_deleted',
                'model_type' => User::class,
                'model_id' => $user->id,
                'old_values' => [
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'new_values' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $user->delete();
        });

        return back()->with('success', "Akun pengguna {$user->name} berhasil dihapus secara permanen.");
    }

    /**
     * Tambah Bahan Baku Baru ke Inventaris.
     */
    public function storeIngredient(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:ingredients,name'],
            'unit' => ['required', 'string', 'max:30'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'cost_per_unit' => ['required', 'numeric', 'min:0'],
            'initial_stock' => ['nullable', 'numeric', 'min:0'],
        ]);

        $initialStock = (float) ($request->initial_stock ?? 0);

        DB::transaction(function () use ($request, $initialStock) {
            $ingredient = Ingredient::create([
                'name' => trim($request->name),
                'unit' => strtolower(trim($request->unit)),
                'stock' => $initialStock,
                'min_stock' => (float) $request->min_stock,
                'cost_per_unit' => (float) $request->cost_per_unit,
                'is_active' => true,
            ]);

            if ($initialStock > 0) {
                StockLog::create([
                    'ingredient_id' => $ingredient->id,
                    'user_id' => Auth::id(),
                    'type' => 'in',
                    'quantity' => $initialStock,
                    'cost' => $initialStock * (float) $request->cost_per_unit,
                    'reference' => 'Saldo Awal Bahan Baku',
                    'notes' => 'Pencatatan stok awal saat penambahan bahan baku baru',
                ]);
            }

            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'ingredient_created',
                'model_type' => Ingredient::class,
                'model_id' => $ingredient->id,
                'old_values' => null,
                'new_values' => [
                    'name' => $ingredient->name,
                    'unit' => $ingredient->unit,
                    'initial_stock' => $initialStock,
                    'min_stock' => $ingredient->min_stock,
                    'cost_per_unit' => $ingredient->cost_per_unit,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', "Bahan baku '{$request->name}' berhasil ditambahkan ke inventaris.");
    }

    /**
     * Ubah Parameter Bahan Baku (Nama, Satuan, Ambang Minimum, HPP).
     */
    public function updateIngredient(Ingredient $ingredient, Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('ingredients', 'name')->ignore($ingredient->id)],
            'unit' => ['required', 'string', 'max:30'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'cost_per_unit' => ['required', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $oldValues = [
            'name' => $ingredient->name,
            'unit' => $ingredient->unit,
            'min_stock' => (float) $ingredient->min_stock,
            'cost_per_unit' => (float) $ingredient->cost_per_unit,
            'is_active' => (bool) $ingredient->is_active,
        ];

        $ingredient->update([
            'name' => trim($request->name),
            'unit' => strtolower(trim($request->unit)),
            'min_stock' => (float) $request->min_stock,
            'cost_per_unit' => (float) $request->cost_per_unit,
            'is_active' => (bool) $request->is_active,
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'ingredient_updated',
            'model_type' => Ingredient::class,
            'model_id' => $ingredient->id,
            'old_values' => $oldValues,
            'new_values' => [
                'name' => $ingredient->name,
                'unit' => $ingredient->unit,
                'min_stock' => $ingredient->min_stock,
                'cost_per_unit' => $ingredient->cost_per_unit,
                'is_active' => $ingredient->is_active,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Data bahan baku '{$ingredient->name}' berhasil diperbarui.");
    }

    /**
     * Penyesuaian Stok Cepat (Restock Masuk, Waste Rusak/Kadaluarsa, Opname Fisik).
     */
    public function adjustStock(Ingredient $ingredient, Request $request): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'in:in,waste,adjustment'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['required', 'string', 'min:3', 'max:500'],
            'reference' => ['nullable', 'string', 'max:100'],
            'cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $type = $request->type;
        $qty = (float) $request->quantity;
        $oldStock = (float) $ingredient->stock;
        $newStock = $oldStock;
        $logQty = $qty;
        $cost = (float) ($request->cost ?? ($qty * $ingredient->cost_per_unit));
        $typeLabel = 'Penyesuaian Stok';

        if ($type === 'in') {
            // Restock Bahan Baku Masuk
            $newStock = $oldStock + $qty;
            $typeLabel = 'Restock Masuk';
        } elseif ($type === 'waste') {
            // Bahan Rusak / Kadaluarsa / Tumpah
            if ($oldStock < $qty) {
                return back()->with('error', "Gagal: Kuantitas waste ({$qty} {$ingredient->unit}) melebihi stok yang tersedia ({$oldStock} {$ingredient->unit}).");
            }
            $newStock = max(0, $oldStock - $qty);
            $typeLabel = 'Waste / Bahan Rusak';
        } elseif ($type === 'adjustment') {
            // Hasil Opname Stok Fisik (Menetapkan saldo fisik riil)
            $newStock = $qty;
            $diff = $newStock - $oldStock;
            $logQty = abs($diff);
            $cost = abs($diff) * $ingredient->cost_per_unit;
            $typeLabel = 'Koreksi Opname Fisik';
        }

        DB::transaction(function () use ($ingredient, $newStock, $oldStock, $type, $logQty, $cost, $request, $typeLabel) {
            $ingredient->update(['stock' => $newStock]);

            StockLog::create([
                'ingredient_id' => $ingredient->id,
                'user_id' => Auth::id(),
                'type' => $type,
                'quantity' => $logQty,
                'cost' => $cost,
                'reference' => $request->reference ?: $typeLabel,
                'notes' => $request->notes,
            ]);

            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'ingredient_stock_adjusted',
                'model_type' => Ingredient::class,
                'model_id' => $ingredient->id,
                'old_values' => ['stock' => $oldStock],
                'new_values' => [
                    'stock' => $newStock,
                    'adjustment_type' => $type,
                    'quantity_affected' => $logQty,
                    'notes' => $request->notes,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return back()->with('success', "Stok '{$ingredient->name}' berhasil diperbarui ({$typeLabel}: saldo kini {$newStock} {$ingredient->unit}).");
    }

    /**
     * Hapus Bahan Baku dari Inventaris (Dengan Proteksi Integritas Resep Menu Aktif).
     */
    public function deleteIngredient(Ingredient $ingredient, Request $request): RedirectResponse
    {
        $recipeCount = $ingredient->recipes()->count();
        if ($recipeCount > 0) {
            return back()->with('error', "Gagal menghapus: Bahan baku '{$ingredient->name}' masih digunakan oleh {$recipeCount} resep menu aktif. Harap ubah resep menu terkait sebelum menghapus bahan.");
        }

        DB::transaction(function () use ($ingredient, $request) {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'ingredient_deleted',
                'model_type' => Ingredient::class,
                'model_id' => $ingredient->id,
                'old_values' => [
                    'name' => $ingredient->name,
                    'unit' => $ingredient->unit,
                    'stock' => (float) $ingredient->stock,
                    'cost_per_unit' => (float) $ingredient->cost_per_unit,
                ],
                'new_values' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $ingredient->delete();
        });

        return back()->with('success', "Bahan baku '{$ingredient->name}' berhasil dihapus dari inventaris.");
    }

    /**
     * Perbarui Pengaturan Toko & Informasi Struk Kasir (Sinkronisasi Global).
     */
    public function updateStoreSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_charge_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'receipt_footer' => ['nullable', 'string', 'max:500'],
            'is_open' => ['required', 'boolean'],
        ]);

        $store = StoreSetting::firstOrCreate(['id' => 1]);
        $oldValues = $store->toArray();

        $store->update($validated);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'update_store_settings',
            'model_type' => StoreSetting::class,
            'model_id' => $store->id,
            'old_values' => $oldValues,
            'new_values' => $store->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Pengaturan Cafe & Toko berhasil diperbarui dan disinkronkan ke seluruh sistem & struk.');
    }

    /**
     * Tambah Menu Baru ke Katalog Kafe (Super Admin).
     */
    public function storeMenu(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'exists:categories,id'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:3072'],
            'is_available' => ['nullable', 'boolean'],
        ]);

        $imagePath = '/images/icon.png';
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('menus', 'public');
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug ?: 'menu-' . time();
        $counter = 1;
        while (Menu::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $menu = Menu::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'base_price' => $validated['base_price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'is_available' => $request->boolean('is_available', true),
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'menu_created',
            'model_type' => Menu::class,
            'model_id' => $menu->id,
            'old_values' => null,
            'new_values' => $menu->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Menu '{$menu->name}' berhasil ditambahkan ke katalog kafe.");
    }

    /**
     * Perbarui Menu yang Ada di Katalog (Super Admin).
     */
    public function updateMenu(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'exists:categories,id'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:3072'],
            'is_available' => ['nullable', 'boolean'],
        ]);

        $oldValues = $menu->toArray();

        if ($request->hasFile('image')) {
            if ($menu->image && !str_starts_with($menu->image, 'http') && !str_starts_with($menu->image, '/images/')) {
                Storage::disk('public')->delete($menu->image);
            }
            $menu->image = $request->file('image')->store('menus', 'public');
        }

        $menu->name = $validated['name'];
        $menu->category_id = $validated['category_id'];
        $menu->base_price = $validated['base_price'];
        if (array_key_exists('cost_price', $validated)) {
            $menu->cost_price = $validated['cost_price'] ?? 0;
        }
        $menu->description = $validated['description'] ?? null;
        if ($request->has('is_available')) {
            $menu->is_available = $request->boolean('is_available');
        }
        $menu->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'menu_updated',
            'model_type' => Menu::class,
            'model_id' => $menu->id,
            'old_values' => $oldValues,
            'new_values' => $menu->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Menu '{$menu->name}' berhasil diperbarui.");
    }

    /**
     * Hapus Menu dari Katalog (Soft Delete).
     */
    public function deleteMenu(Menu $menu, Request $request): RedirectResponse
    {
        $name = $menu->name;
        $menu->delete();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'menu_deleted',
            'model_type' => Menu::class,
            'model_id' => $menu->id,
            'old_values' => ['name' => $name],
            'new_values' => ['deleted' => true],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Menu '{$name}' berhasil dihapus dari katalog.");
    }

    /**
     * Toggle Ketersediaan Menu (Tersedia / Sold Out).
     */
    public function toggleMenu(Menu $menu, Request $request): RedirectResponse
    {
        $oldStatus = $menu->is_available;
        $menu->is_available = ! $oldStatus;
        $menu->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $menu->is_available ? 'menu_available' : 'menu_sold_out',
            'model_type' => Menu::class,
            'model_id' => $menu->id,
            'old_values' => ['is_available' => $oldStatus],
            'new_values' => ['is_available' => $menu->is_available],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $statusMsg = $menu->is_available ? 'Tersedia' : 'Habis (Sold Out)';
        return back()->with('success', "Status ketersediaan '{$menu->name}' diubah menjadi {$statusMsg}.");
    }

    /**
     * Tambah Voucher Diskon Baru oleh Super Admin.
     */
    public function storePromo(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:promos,code'],
            'name' => ['required', 'string', 'max:150'],
            'discount_type' => ['required', 'in:percentage,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0.01'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $code = strtoupper(trim($validated['code']));

        // Proteksi nilai diskon jika tipe persentase
        if ($validated['discount_type'] === 'percentage' && $validated['discount_value'] > 100) {
            return back()->withErrors(['discount_value' => 'Nilai diskon persentase tidak boleh melebihi 100%.']);
        }

        $promo = Promo::create([
            'code' => $code,
            'name' => $validated['name'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'min_order_amount' => $validated['min_order_amount'] ?? 0,
            'max_discount_amount' => $validated['discount_type'] === 'percentage' ? ($validated['max_discount_amount'] ?? null) : null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'promo_created',
            'model_type' => Promo::class,
            'model_id' => $promo->id,
            'old_values' => null,
            'new_values' => $promo->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Voucher diskon '{$promo->code}' berhasil ditambahkan dan disinkronkan ke Kasir & Barista KDS.");
    }

    /**
     * Toggle Status Aktif / Nonaktif Voucher Diskon.
     */
    public function togglePromo(Promo $promo, Request $request): RedirectResponse
    {
        $oldStatus = $promo->is_active;
        $promo->is_active = ! $oldStatus;
        $promo->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $promo->is_active ? 'promo_activated' : 'promo_deactivated',
            'model_type' => Promo::class,
            'model_id' => $promo->id,
            'old_values' => ['is_active' => $oldStatus],
            'new_values' => ['is_active' => $promo->is_active],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $statusMsg = $promo->is_active ? 'Aktif (dapat digunakan di Kasir)' : 'Dinonaktifkan';
        return back()->with('success', "Voucher diskon '{$promo->code}' berhasil diubah menjadi {$statusMsg}.");
    }

    /**
     * Hapus Voucher Diskon dari Database.
     */
    public function deletePromo(Promo $promo, Request $request): RedirectResponse
    {
        $code = $promo->code;
        $promo->delete();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => 'promo_deleted',
            'model_type' => Promo::class,
            'model_id' => $promo->id,
            'old_values' => ['code' => $code],
            'new_values' => ['deleted' => true],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', "Voucher diskon '{$code}' berhasil dihapus dari sistem.");
    }
}

