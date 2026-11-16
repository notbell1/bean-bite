<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\CashShift;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Tampilkan Halaman Pengaturan Profil Penuh & Dinamis untuk 3 Role.
     */
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();

        // 1. Ambil 5 audit log aktivitas terakhir milik pengguna yang sedang login
        $userAuditLogs = AuditLog::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'time_ago' => $log->created_at ? $log->created_at->diffForHumans() : '-',
                    'ip_address' => $log->ip_address ?? '127.0.0.1',
                ];
            });

        // 2. Data kontekstual khusus sesuai peran
        $roleContext = [];
        if ($user->role === 'pemilik') {
            $roleContext['super_admin_count'] = User::where('role', 'pemilik')->count();
        } elseif ($user->role === 'admin_kasir') {
            $activeShift = CashShift::where('user_id', $user->id)
                ->where('status', 'open')
                ->latest('opened_at')
                ->first();
            $roleContext['active_shift'] = $activeShift ? [
                'id' => $activeShift->id,
                'shift_name' => $activeShift->shift_name,
                'opened_at' => $activeShift->opened_at ? $activeShift->opened_at->format('H:i') : '-',
                'start_cash_formatted' => 'Rp ' . number_format($activeShift->start_cash, 0, ',', '.'),
            ] : null;
        }

        return Inertia::render('profile/Edit', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at ? $user->created_at->format('d M Y') : '-',
                'last_login_at' => $user->last_login_at ? $user->last_login_at->diffForHumans() : 'Sesi Ini',
            ],
            'recent_logs' => $userAuditLogs,
            'role_context' => $roleContext,
        ]);
    }

    /**
     * Perbarui Profil dan Kredensial Pengguna Aktif (Berlaku untuk 3 Role: Pemilik, Kasir, Barista).
     */
    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'current_password' => ['nullable', 'string'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah digunakan oleh pengguna lain.',
            'new_password.min' => 'Kata sandi baru minimal harus 8 karakter.',
            'new_password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
            'avatar.image' => 'File yang diunggah harus berupa gambar yang valid.',
            'avatar.mimes' => 'Format foto profil harus berupa JPEG, PNG, JPG, atau WEBP.',
            'avatar.max' => 'Ukuran file foto profil maksimal adalah 2MB (2048 KB).',
        ]);

        $emailChanged = strtolower($request->email) !== strtolower($user->email);
        $passwordChanged = ! empty($request->new_password);

        // Keamanan: Jika mengganti email atau password, wajib memasukkan kata sandi saat ini
        if ($emailChanged || $passwordChanged) {
            if (empty($request->current_password) || ! Hash::check($request->current_password, $user->password)) {
                return back()->withErrors([
                    'current_password' => 'Kata sandi saat ini diperlukan dan harus cocok untuk mengubah email atau kata sandi.',
                ]);
            }
        }

        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
        ];

        $user->name = $request->name;
        $user->email = strtolower($request->email);
        $user->phone = $request->phone;

        // Kelola Foto Profil (Unggah baru atau Hapus foto profil)
        $avatarChanged = false;
        if ($request->hasFile('avatar')) {
            // Hapus file avatar lama jika ada di disk public
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $storedPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $storedPath;
            $avatarChanged = true;
        } elseif ($request->boolean('remove_avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = null;
            $avatarChanged = true;
        }

        if ($passwordChanged) {
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        // Rekam aktivitas ke Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'profile_updated',
            'model_type' => User::class,
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_changed' => $avatarChanged,
                'password_changed' => $passwordChanged,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Profil dan foto akun Anda berhasil diperbarui.');
    }
}
