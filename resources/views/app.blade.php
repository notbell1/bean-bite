<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- Monera Coffee (Bean & Bite) Application Icons -->
        <link rel="icon" type="image/png" sizes="192x192" href="/images/icon.png?v={{ time() }}">
        <link rel="icon" type="image/png" sizes="96x96" href="/images/icon.png?v={{ time() }}">
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon.png?v={{ time() }}">
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon.png?v={{ time() }}">
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v={{ time() }}">
        <link rel="apple-touch-icon" href="/images/icon.png?v={{ time() }}">

        <!-- Google Fonts: Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Bean & Bite') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
