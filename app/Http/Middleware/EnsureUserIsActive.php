<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Memastikan user yang terautentikasi memiliki status aktif (is_active = true).
     * Jika akun dinonaktifkan (disuspend oleh Pemilik), sesi akan langsung diputus (Force Logout).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            if (! $user->is_active) {
                // Catat kejadian di audit log
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'session_terminated_suspended_user',
                    'model_type' => get_class($user),
                    'model_id' => $user->id,
                    'old_values' => ['is_active' => false],
                    'new_values' => ['forced_logout' => true],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'login' => 'Akun Anda telah dinonaktifkan oleh Super Admin. Silakan hubungi Pemilik cafe.',
                ]);
            }
        }

        return $next($request);
    }
}
