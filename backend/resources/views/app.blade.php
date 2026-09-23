<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title inertia>{{ config('app.name', 'BizLink') }}</title>
    @viteReactRefresh
    @vite(['src/app.jsx'])
</head>
<body>
@inertia
</body>
</html>
