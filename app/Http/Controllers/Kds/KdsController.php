<?php

namespace App\Http\Controllers\Kds;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class KdsController extends Controller
{
    /**
     * Tampilkan Kitchen Display System (KDS) Antrean Barista & Koki.
     */
    public function index(Request $request): Response
    {
        // 1. Sanitasi & Validasi Whitelist Ketat (Default Deny & Sanitasi Parameter)
        // Mendukung parameter 'tab' (instant client switching) dan backward-compatible 'station'.
        $rawTab = (string) $request->query('tab', $request->query('station', ''));
        if ($rawTab === '' && $request->query('drawer') === 'sold-out') {
            $rawTab = 'sold_out';
        }
        $activeTab = in_array($rawTab, ['barista', 'koki', 'sold_out'], true) ? $rawTab : 'all';

        // 2. Ambil Semua Pesanan Aktif untuk kalkulasi antrean & badge (FIFO)
        $ordersQuery = Order::with(['items', 'user:id,name', 'promo'])
            ->whereIn('order_status', ['waiting', 'in_progress', 'ready', 'open_bill'])
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                    ->orWhere('is_open_bill', true);
            })
            ->orderBy('created_at', 'asc');

        $allOrders = $ordersQuery->get();

        // Kalkulasi dinamis untuk badge navigasi antrean
        $totalOrdersCount = $allOrders->count();
        $baristaOrdersCount = $allOrders->filter(function ($o) {
            return $o->items->contains(fn($it) => $it->item_target === 'barista');
        })->count();
        $kokiOrdersCount = $allOrders->filter(function ($o) {
            return $o->items->contains(fn($it) => $it->item_target === 'koki');
        })->count();

        // Format semua pesanan aktif dengan item lengkap agar tab switching di frontend INSTANT tanpa loading
        $activeOrders = $allOrders->map(function ($o) {
            $elapsedSeconds = abs((int) now()->diffInSeconds($o->created_at));
            $elapsedMinutes = (int) floor($elapsedSeconds / 60);
            $remainingSeconds = $elapsedSeconds % 60;
            $timeFormatted = sprintf('%02dm %02ds', $elapsedMinutes, $remainingSeconds);

            // Klasifikasi SLA
            if ($elapsedMinutes >= 10) {
                $slaStatus = 'OVERDUE';
                $slaColor = 'berry';
            } elseif ($elapsedMinutes >= 5) {
                $slaStatus = 'WARNING';
                $slaColor = 'crema';
            } else {
                $slaStatus = 'ON TIME';
                $slaColor = 'matcha';
            }

            // Normalisasi nomor meja
            $rawTable = trim((string) $o->table_number);
            if ($rawTable !== '') {
                $tableDisplay = str_starts_with(strtolower($rawTable), 'meja')
                    ? $rawTable
                    : 'Meja ' . $rawTable;
            } else {
                $tableDisplay = 'Take Away';
            }

            return [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_name' => $o->customer_name,
                'table_number' => $tableDisplay,
                'order_type' => $o->order_type,
                'is_open_bill' => (bool) $o->is_open_bill,
                'order_status' => $o->order_status,
                'promo_code' => $o->promo?->code,
                'promo_name' => $o->promo?->name,
                'discount_amount' => (float) $o->discount_amount,
                'created_at_time' => $o->created_at->format('H:i'),
                'time_formatted' => $timeFormatted,
                'sla_status' => $slaStatus,
                'sla_color' => $slaColor,
                'elapsed_seconds' => $elapsedSeconds,
                'items' => $o->items->values()->map(fn($it) => [
                    'id' => $it->id,
                    'name' => $it->item_name,
                    'variant' => $it->variant_snapshot,
                    'quantity' => $it->quantity,
                    'notes' => $it->notes,
                    'production_status' => $it->production_status,
                    'item_target' => $it->item_target,
                ]),
            ];
        });

        // 3. Kalkulasi Batch Summary (Total Racikan Serupa yang Sedang Mengantre)
        $batchSummary = [];
        foreach ($activeOrders as $ord) {
            foreach ($ord['items'] as $it) {
                if ($it['production_status'] !== 'ready') {
                    $key = $it['name'];
                    $batchSummary[$key] = ($batchSummary[$key] ?? 0) + $it['quantity'];
                }
            }
        }
        arsort($batchSummary);

        // 4. Quick Toggle Menu Habis (Sold Out) dengan Sinkronisasi Stok Resep & Kategori
        $menus = Menu::with(['recipes.ingredient', 'category:id,name,production_target'])
            ->select('id', 'category_id', 'name', 'is_available', 'image', 'base_price')
            ->orderBy('name')
            ->get()
            ->map(function ($m) {
                $depletedList = $m->recipes
                    ->filter(fn($r) => $r->ingredient && $r->ingredient->stock <= 0)
                    ->map(fn($r) => $r->ingredient->name)
                    ->values()
                    ->toArray();
                $hasDepleted = count($depletedList) > 0;
                $isAvailable = (bool) $m->is_available && ! $hasDepleted;

                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'category_name' => $m->category?->name ?? 'Menu',
                    'production_target' => $m->category?->production_target ?? 'barista',
                    'base_price' => (float) $m->base_price,
                    'image' => $m->image,
                    'is_available' => $isAvailable,
                    'is_manually_disabled' => ! (bool) $m->is_available,
                    'is_stock_depleted' => $hasDepleted,
                    'depleted_ingredients' => $depletedList,
                ];
            });

        $soldOutCount = $menus->filter(fn($m) => ! $m['is_available'])->count();
        $availableCount = $menus->filter(fn($m) => $m['is_available'])->count();
        $depletedStockCount = $menus->filter(fn($m) => $m['is_stock_depleted'])->count();
        $totalMenusCount = $menus->count();

        $counts = [
            'all' => $totalOrdersCount,
            'barista' => $baristaOrdersCount,
            'koki' => $kokiOrdersCount,
            'sold_out' => $soldOutCount,
            'available' => $availableCount,
            'depleted_stock' => $depletedStockCount,
            'total_menus' => $totalMenusCount,
        ];

        return Inertia::render('kds/Index', [
            'store' => StoreSetting::first(),
            'active_station' => $activeTab,
            'active_tab' => $activeTab,
            'counts' => $counts,
            'orders' => $activeOrders,
            'batch_summary' => $batchSummary,
            'menus' => $menus,
        ]);
    }

    /**
     * Tandai Item Mulai Diracik / Selesai (Siap Saji).
     */
    public function updateItemStatus(OrderItem $item, Request $request): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:waiting,in_progress,ready'],
        ]);

        $item->update([
            'production_status' => $request->status,
            'started_at' => $request->status === 'in_progress' ? now() : $item->started_at,
            'ready_at' => $request->status === 'ready' ? now() : null,
        ]);

        // Cek apakah seluruh item dalam order telah siap saji
        $order = $item->order;
        $allReady = $order->items()->where('production_status', '!=', 'ready')->count() === 0;

        if ($allReady) {
            $order->update([
                'order_status' => 'ready',
                'ready_at' => now(),
            ]);
        } elseif ($request->status === 'in_progress' && $order->order_status === 'waiting') {
            $order->update(['order_status' => 'in_progress']);
        }

        return back();
    }

    /**
     * Fitur Undo: Batalkan status Siap jika barista/koki tidak sengaja mengklik.
     */
    public function undoItem(OrderItem $item): RedirectResponse
    {
        $item->update([
            'production_status' => 'in_progress',
            'ready_at' => null,
        ]);

        $order = $item->order;
        if ($order->order_status === 'ready') {
            $order->update(['order_status' => 'in_progress']);
        }

        return back();
    }

    /**
     * Quick Toggle Menu Habis / Sold Out langsung dari layar KDS.
     */
    public function toggleMenuAvailability(Menu $menu, Request $request): RedirectResponse
    {
        $old = $menu->is_available;
        $menu->is_available = ! $old;
        $menu->save();

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $menu->is_available ? 'menu_available_toggled' : 'menu_sold_out_toggled',
            'model_type' => Menu::class,
            'model_id' => $menu->id,
            'old_values' => ['is_available' => $old],
            'new_values' => ['is_available' => $menu->is_available],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $status = $menu->is_available ? 'Tersedia Kembali' : 'SOLD OUT';
        return back()->with('success', "Menu '{$menu->name}' sekarang berstatus {$status}.");
    }
}
