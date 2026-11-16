<?php

namespace App\Http\Requests\Auth;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Otorisasi request (semua pengunjung diizinkan mencoba login).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sanitasi data input sebelum validasi dijalankan.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'login' => is_string($this->login) ? trim($this->login) : '',
            // Potong whitespace tak disengaja di password jika ada
            'password' => is_string($this->password) ? $this->password : '',
        ]);
    }

    /**
     * Aturan validasi ketat dari sisi server.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Batasi inputan login: hanya huruf, angka, @, dan . (titik) — blokir karakter JavaScript dan simbol lainnya
            'login' => [
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[a-zA-Z0-9@.]+$/',
            ],
            // Blokir injeksi script HTML/JavaScript pada password
            'password' => [
                'required',
                'string',
                'min:6',
                'max:128',
                'not_regex:/<[^>]*>|javascript:/i',
            ],
            'remember' => ['nullable', 'boolean'],
            // Honeypot Field: Harus selalu kosong! Jika terisi bot, validasi gagal seketika
            'phone_extra' => ['nullable', 'max:0'],
        ];
    }

    /**
     * Pesan error validasi kustom.
     */
    public function messages(): array
    {
        return [
            'login.required' => 'Username atau Email wajib diisi.',
            'login.min' => 'Username atau Email minimal 3 karakter.',
            'login.max' => 'Username atau Email maksimal 100 karakter.',
            'login.regex' => 'Input hanya boleh memuat huruf, angka, simbol @, dan titik (.). Karakter JavaScript dan simbol lainnya dilarang.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.not_regex' => 'Karakter script/tag tidak diizinkan pada kata sandi.',
            'phone_extra.max' => 'Aktivitas bot terdeteksi.',
        ];
    }

    /**
     * Memastikan request tidak melampaui batas rate limit (Anti-Brute Force).
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        // Catat insiden brute-force lockout ke Audit Log
        AuditLog::create([
            'user_id' => null,
            'action' => 'login_account_lockout',
            'model_type' => null,
            'model_id' => null,
            'old_values' => [
                'target_login' => $this->input('login'),
                'lockout_seconds' => $seconds,
            ],
            'new_values' => ['status' => 'locked_out'],
            'ip_address' => $this->ip(),
            'user_agent' => $this->userAgent(),
        ]);

        throw ValidationException::withMessages([
            'login' => "Terlalu banyak percobaan login gagal. Akun dikunci sementara demi keamanan. Silakan coba lagi dalam {$seconds} detik.",
        ]);
    }

    /**
     * Dapatkan throttle key unik gabungan antara input login dan alamat IP pengguna.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login'))).'|'.$this->ip();
    }
}
