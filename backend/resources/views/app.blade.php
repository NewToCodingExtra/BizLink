<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0B1F3A" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#040814" media="(prefers-color-scheme: dark)">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="reverb-key" content="{{ config('broadcasting.connections.reverb.key') }}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title inertia>{{ config('app.name', 'BizLink') }}</title>
    @viteReactRefresh
    @vite(['src/app.jsx'])
    @inertiaHead
</head>
<body>
@inertia
</body>
</html>
