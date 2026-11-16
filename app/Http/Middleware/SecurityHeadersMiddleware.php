<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Menambahkan HTTP Security Headers untuk mitigasi:
     * - Clickjacking (X-Frame-Options)
     * - MIME Confusion (X-Content-Type-Options)
     * - XSS (X-XSS-Protection & Referrer-Policy)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Mencegah website di-embed ke dalam iframe jahat (Anti-Clickjacking)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Mencegah browser menebak MIME type file (Anti-MIME Sniffing)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Proteksi XSS bawaan browser modern
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Kebijakan Referrer yang aman
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Batasi izin sensor hardware yang tidak digunakan
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return $response;
    }
}
