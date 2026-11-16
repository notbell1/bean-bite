<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Kds\KdsController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Pos\PosController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — Monera Coffee (Powered by Bean & Bite)
|--------------------------------------------------------------------------
*/

// Batasi Parameter Route ID hanya berupa angka (Mitigasi SQLi & Route Tampering)
Route::pattern('user', '[0-9]+');
Route::pattern('shift', '[0-9]+');
Route::pattern('order', '[0-9]+');
Route::pattern('item', '[0-9]+');
Route::pattern('menu', '[0-9]+');
Route::pattern('ingredient', '[0-9]+');

// Root Redirect: Jika sudah login, redirect sesuai role. Jika belum, arahkan ke login
Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        return match ($user->role) {
            'pemilik' => redirect()->route('super.dashboard'),
            'admin_kasir' => redirect()->route('admin.dashboard'),
            'barista_koki' => redirect()->route('staff.dashboard'),
            default => redirect()->route('login'),
        };
    }
    return redirect()->route('login');
})->name('home');

// Halaman Pengujian Template Desain Global
Route::inertia('/design-system', 'DesignSystemTest')->name('design-system');

// Guest Authentication Routes (1 Login Form untuk Semua Role)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

// Authenticated & Active User Routes
Route::middleware(['auth', 'active'])->group(function () {
    // Logout Terproteksi
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Pengaturan Profil Global (Berlaku untuk 3 Role: Pemilik, Kasir, Barista)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // 1. Portal Role: Pemilik (Super Admin) — Otorisasi Ketat (Default Deny)
    Route::middleware('role:pemilik')->group(function () {
        // Primary URL: /super/dashboard
        Route::get('/super/dashboard', [OwnerDashboardController::class, 'index'])->name('super.dashboard');
        Route::get('/super', fn () => redirect()->route('super.dashboard'));

        // Backward compatibility & redirect alias
        Route::get('/owner/dashboard', function (Request $request) {
            return redirect()->route('super.dashboard', $request->query());
        })->name('owner.dashboard');
        Route::get('/owner', fn () => redirect()->route('super.dashboard'));

        $registerOwnerActions = function () {
            Route::post('/users', [OwnerDashboardController::class, 'storeUser'])->name('users.store');
            Route::put('/users/{user}', [OwnerDashboardController::class, 'updateUser'])->name('users.update');
            Route::delete('/users/{user}', [OwnerDashboardController::class, 'deleteUser'])->name('users.delete');
            Route::post('/users/{user}/toggle-status', [OwnerDashboardController::class, 'toggleUserStatus'])->name('users.toggle-status');
            Route::post('/users/{user}/reset-password', [OwnerDashboardController::class, 'resetUserPassword'])->name('users.reset-password');
            Route::post('/shifts/{shift}/force-close', [OwnerDashboardController::class, 'forceCloseShift'])->name('shifts.force-close');

            // Inventaris & Kelola Stok Real-time
            Route::post('/inventory', [OwnerDashboardController::class, 'storeIngredient'])->name('inventory.store');
            Route::put('/inventory/{ingredient}', [OwnerDashboardController::class, 'updateIngredient'])->name('inventory.update');
            Route::delete('/inventory/{ingredient}', [OwnerDashboardController::class, 'deleteIngredient'])->name('inventory.delete');
            Route::post('/inventory/{ingredient}/adjust', [OwnerDashboardController::class, 'adjustStock'])->name('inventory.adjust');

            // Pengaturan Toko & Informasi Struk Kasir (Sinkronisasi Global)
            Route::put('/settings', [OwnerDashboardController::class, 'updateStoreSettings'])->name('settings.update');

            // Manajemen Katalog Menu Kafe (CRUD, Harga, Gambar, Kategori)
            Route::post('/menus', [OwnerDashboardController::class, 'storeMenu'])->name('menus.store');
            Route::post('/menus/{menu}', [OwnerDashboardController::class, 'updateMenu'])->name('menus.update');
            Route::delete('/menus/{menu}', [OwnerDashboardController::class, 'deleteMenu'])->name('menus.delete');
            Route::post('/menus/{menu}/toggle', [OwnerDashboardController::class, 'toggleMenu'])->name('menus.toggle');

            // Manajemen Voucher & Kupon Diskon (Sinkron ke Kasir & Barista KDS)
            Route::post('/promos', [OwnerDashboardController::class, 'storePromo'])->name('promos.store');
            Route::post('/promos/{promo}/toggle', [OwnerDashboardController::class, 'togglePromo'])->name('promos.toggle');
            Route::delete('/promos/{promo}', [OwnerDashboardController::class, 'deletePromo'])->name('promos.delete');
        };

        Route::prefix('super')->name('super.')->group($registerOwnerActions);
        Route::prefix('owner')->name('owner.')->group($registerOwnerActions);
    });

    // 2. Portal Role: Admin / Kasir — Otorisasi Ketat Khusus role:admin_kasir (Default Deny)
    Route::middleware('role:admin_kasir')->group(function () {
        // Primary URL: /admin/dashboard
        Route::get('/admin/dashboard', [PosController::class, 'index'])->name('admin.dashboard');
        Route::get('/admin', fn () => redirect()->route('admin.dashboard'));

        // Backward compatibility & redirect alias
        Route::get('/pos', function (Request $request) {
            return redirect()->route('admin.dashboard', $request->query());
        })->name('pos.index');

        $registerAdminActions = function () {
            Route::post('/shift/open', [PosController::class, 'openShift'])->name('shift.open');
            Route::post('/shift/close', [PosController::class, 'closeShift'])->name('shift.close');
            Route::post('/orders', [PosController::class, 'storeOrder'])->name('orders.store');
            Route::post('/orders/{order}/pay', [PosController::class, 'payOrder'])->name('orders.pay');
            Route::post('/orders/{order}/void', [PosController::class, 'voidOrder'])->name('orders.void');
        };

        Route::prefix('admin')->name('admin.')->group($registerAdminActions);
        Route::prefix('pos')->name('pos.')->group($registerAdminActions);
    });

    // 3. Portal Role: Barista & Koki — Otorisasi Ketat Khusus role:barista_koki (Default Deny)
    Route::middleware('role:barista_koki')->group(function () {
        // Primary URL: /staff/dashboard
        Route::get('/staff/dashboard', [KdsController::class, 'index'])->name('staff.dashboard');
        Route::get('/staff', fn () => redirect()->route('staff.dashboard'));

        // Backward compatibility & redirect alias
        Route::get('/kds', function (Request $request) {
            return redirect()->route('staff.dashboard', $request->query());
        })->name('kds.index');

        $registerStaffActions = function () {
            Route::patch('/items/{item}/status', [KdsController::class, 'updateItemStatus'])->name('items.status');
            Route::patch('/items/{item}/undo', [KdsController::class, 'undoItem'])->name('items.undo');
            Route::patch('/menus/{menu}/toggle', [KdsController::class, 'toggleMenuAvailability'])->name('menus.toggle');
        };

        Route::prefix('staff')->name('staff.')->group($registerStaffActions);
        Route::prefix('kds')->name('kds.')->group($registerStaffActions);
    });
});
