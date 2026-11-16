<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Memeriksa otorisasi role pengguna dengan prinsip DEFAULT DENY.
     * Jika role pengguna tidak tercantum secara eksplisit, akses langsung ditolak (403 Forbidden).
     *
     * @param  string  ...$roles  Daftar role yang diizinkan (e.g. 'pemilik', 'admin_kasir', 'barista_koki')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Cek apakah akun aktif
        if (! $user->is_active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'login' => 'Akun Anda telah dinonaktifkan.',
            ]);
        }

        // Periksa apakah role user terdaftar di daftar role yang diizinkan
        if (! in_array($user->role, $roles, true)) {
            $isBrowserNavigation = $request->isMethod('GET') && ! $request->expectsJson();

            // Catat upaya unauthorized access ke audit log untuk pemantauan keamanan
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'unauthorized_access_attempt',
                'model_type' => null,
                'model_id' => null,
                'old_values' => [
                    'user_role' => $user->role,
                    'required_roles' => $roles,
                    'target_url' => $request->fullUrl(),
                    'method' => $request->method(),
                ],
                'new_values' => [
                    'handled_via' => $isBrowserNavigation ? 'redirect_to_own_dashboard' : '403_forbidden',
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Jika user navigasi browser (GET) mengganti slug URL ke modul peran lain di address bar,
            // alihkan kembali secara mulus ke dashboard resmi perannya tanpa memunculkan layar 403.
            if ($isBrowserNavigation) {
                $targetDashboard = match ($user->role) {
                    'pemilik' => route('super.dashboard'),
                    'admin_kasir' => route('admin.dashboard'),
                    'barista_koki' => route('staff.dashboard'),
                    default => route('login'),
                };

                return redirect()->to($targetDashboard)->with('warning', 'Akses dialihkan ke dashboard resmi sesuai peran akun Anda.');
            }

            // Untuk aksi mutasi (POST/PUT/PATCH/DELETE) atau request API yang tidak berhak,
            // tetap ditegakkan status 403 Forbidden demi integritas keamanan Privilege Escalation.
            abort(Response::HTTP_FORBIDDEN, 'Akses Ditolak (403 Forbidden): Anda tidak memiliki otoritas hak akses untuk modul ini.');
        }

        return $next($request);
    }
}
