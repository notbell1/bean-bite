<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Nama input field yang dikecualikan dari pembersihan karakter (misalnya kata sandi asli).
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'admin_password',
    ];

    /**
     * Tangani request yang masuk dan bersihkan parameter query & payload input.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Sanitasi seluruh parameter URL Query String (?station=all', ?role=pemilik', dsb.)
        $queryParams = $request->query->all();
        if (! empty($queryParams)) {
            $sanitizedQuery = $this->cleanArray($queryParams, isQueryParam: true);
            $request->query->replace($sanitizedQuery);
        }

        // 2. Sanitasi seluruh payload Request Body (POST/PUT/PATCH input data)
        $inputs = $request->request->all();
        if (! empty($inputs)) {
            $sanitizedInputs = $this->cleanArray($inputs, isQueryParam: false);
            $request->request->replace($sanitizedInputs);
        }

        return $next($request);
    }

    /**
     * Rekursif membersihkan array data dari karakter injeksi dan anomali.
     */
    protected function cleanArray(array $data, bool $isQueryParam = false): array
    {
        $cleaned = [];
        foreach ($data as $key => $value) {
            $cleanedKey = $this->sanitizeKey($key);

            if (is_array($value)) {
                $cleaned[$cleanedKey] = $this->cleanArray($value, $isQueryParam);
            } elseif (is_string($value)) {
                if (in_array($key, $this->except, true)) {
                    $cleaned[$cleanedKey] = $value;
                } else {
                    $cleaned[$cleanedKey] = $this->sanitizeValue($value, $isQueryParam);
                }
            } else {
                $cleaned[$cleanedKey] = $value;
            }
        }
        return $cleaned;
    }

    /**
     * Bersihkan key/nama parameter dari null bytes dan karakter kontrol.
     */
    protected function sanitizeKey(string $key): string
    {
        return preg_replace('/[\x00-\x1F\x7F]/', '', trim($key));
    }

    /**
     * Bersihkan nilai string dari SQLi/tampering artifacts, null bytes, dan invisible control chars.
     */
    protected function sanitizeValue(string $value, bool $isQueryParam = false): string
    {
        // 1. Hapus null byte injection (\0)
        $value = str_replace(chr(0), '', $value);

        // 2. Jika merupakan URL query parameter: mitigasi parameter tampering / SQLi trailing quotes & comments
        // Contoh: ?station=all' -> station=all, ?role=pemilik'-- -> role=pemilik, ?station=all" -> all
        if ($isQueryParam) {
            // Bersihkan trailing single/double quote dan SQL comment signatures
            $cleaned = preg_replace('/[\'"\x60]+(\s*--|\s*\/\*.*\*\/|#.*)?$/', '', $value);
            if ($cleaned !== null) {
                $value = $cleaned;
            }

            // Hapus leading quotes yang menggantung jika parameter berupa identifier
            if (preg_match('/^[\'"\x60]+([a-zA-Z0-9_\-]+)[\'"\x60]*$/', $value, $matches)) {
                $value = $matches[1];
            }
        }

        // 3. Normalisasi UTF-8 dan bersihkan non-printable control characters
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;

        return trim($value);
    }
}
