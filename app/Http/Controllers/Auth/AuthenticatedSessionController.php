<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AuditLog;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Menampilkan form login terpadu (1 form untuk semua role).
     */
    public function create(): Response|RedirectResponse
    {
        // Jika sudah login, redirect langsung ke dashboard sesuai role yang sah (Anti-Bypass Login)
        if (Auth::check()) {
            return $this->redirectBasedOnRole(Auth::user());
        }

        return Inertia::render('auth/Login', [
            'store' => StoreSetting::first(),
        ]);
    }

    /**
     * Memproses otentikasi login dengan validasi dan mitigasi keamanan berlapis.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // 1. Mitigasi Bot / Spammer via Honeypot
        if (! empty($request->input('phone_extra'))) {
            // Jika honeypot terisi, perlambat bot dan tolak secara senyap
            sleep(1);
            throw ValidationException::withMessages([
                'login' => 'Aktivitas tidak wajar terdeteksi.',
            ]);
        }

        // 2. Mitigasi Brute Force & Account Lockout
        $request->ensureIsNotRateLimited();

        $loginInput = $request->input('login');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // 3. Tentukan field pencarian: Email atau Username (Aman dari SQLi via Eloquent parameterized query)
        $isEmail = filter_var($loginInput, FILTER_VALIDATE_EMAIL);
        $user = $isEmail
            ? User::where('email', strtolower($loginInput))->first()
            : User::where('username', strtolower($loginInput))->first();

        // 4. Verifikasi Kredensial & Validasi Status Akun Aktif
        if (! $user || ! Hash::check($password, $user->password)) {
            // Hit rate limiter (kunci selama 60 detik jika mencapai 5 kegagalan)
            RateLimiter::hit($request->throttleKey(), 60);

            // Catat kegagalan ke Audit Log
            AuditLog::create([
                'user_id' => $user?->id,
                'action' => 'login_failed',
                'model_type' => null,
                'model_id' => null,
                'old_values' => ['attempted_login' => $loginInput],
                'new_values' => ['error' => 'invalid_credentials'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Pesan error umum untuk mencegah Account Enumeration attack
            throw ValidationException::withMessages([
                'login' => 'Kombinasi kredensial tidak cocok dengan data kami.',
            ]);
        }

        // 5. Cek apakah akun dinonaktifkan (Suspended)
        if (! $user->is_active) {
            RateLimiter::hit($request->throttleKey(), 60);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'login_attempt_suspended_user',
                'model_type' => User::class,
                'model_id' => $user->id,
                'old_values' => ['username' => $user->username],
                'new_values' => ['is_active' => false],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            throw ValidationException::withMessages([
                'login' => 'Akun Anda sedang dinonaktifkan oleh Super Admin. Silakan hubungi Pemilik cafe.',
            ]);
        }

        // 6. Login Sukses: Bersihkan Rate Limiter
        RateLimiter::clear($request->throttleKey());

        // Login ke guard session
        Auth::login($user, $remember);

        // 7. Mitigasi Session Fixation & Session Hijacking: Regenerasi ID Sesi secara instan!
        $request->session()->regenerate();

        // Update timestamp login terakhir
        $user->update([
            'last_login_at' => now(),
        ]);

        // Catat keberhasilan ke Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login_success',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => null,
            'new_values' => [
                'role' => $user->role,
                'login_time' => now()->toDateTimeString(),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // 8. Mitigasi Open Redirect: Redirect secara ketat berbasis Role Pengguna Terverifikasi
        return $this->redirectBasedOnRole($user);
    }

    /**
     * Memproses Logout pengguna secara aman.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if ($user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'model_type' => User::class,
                'model_id' => $user->id,
                'old_values' => null,
                'new_values' => ['logout_time' => now()->toDateTimeString()],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        Auth::logout();

        // Invalidate session & regenerasi CSRF token
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Anda telah berhasil keluar dari sistem.');
    }

    /**
     * Helper Whitelist Redirect Berdasarkan Role yang Terotorisasi (Anti Open-Redirect & Intended URL Guard).
     */
    private function redirectBasedOnRole(User $user): RedirectResponse
    {
        $targetRoute = match ($user->role) {
            'pemilik' => route('super.dashboard'),
            'admin_kasir' => route('admin.dashboard'),
            'barista_koki' => route('staff.dashboard'),
            default => route('login'),
        };

        $intended = session('url.intended');
        if ($intended) {
            $intendedPath = parse_url($intended, PHP_URL_PATH) ?: '';

            // Periksa apakah URL intended yang tersimpan di session sesuai dengan kewenangan role saat ini
            $isAllowed = match ($user->role) {
                'pemilik' => str_starts_with($intendedPath, '/super') || str_starts_with($intendedPath, '/owner') || str_starts_with($intendedPath, '/profile'),
                'admin_kasir' => str_starts_with($intendedPath, '/admin') || str_starts_with($intendedPath, '/pos') || str_starts_with($intendedPath, '/profile'),
                'barista_koki' => str_starts_with($intendedPath, '/staff') || str_starts_with($intendedPath, '/kds') || str_starts_with($intendedPath, '/profile'),
                default => false,
            };

            // Jika user sebelumnya mengetik slug role lain (misal kasir /pos lalu login dengan akun superadmin/barista),
            // abaikan intended URL tersebut agar tidak memicu 403 Forbidden, dan arahkan ke dashboard role yang berhak
            if (! $isAllowed) {
                session()->forget('url.intended');
                return redirect()->to($targetRoute);
            }
        }

        return redirect()->intended($targetRoute);
    }
}
