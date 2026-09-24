<?php

namespace App\Services;

use App\Contracts\GeocodeAdapter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NominatimGeocodeAdapter implements GeocodeAdapter
{
    public function search(string $q): array
    {
        if (! config('services.nominatim.enabled', true)) {
            return [];
        }

        $q = trim($q);
        if ($q === '' || mb_strlen($q) < 2) {
            return [];
        }

        $cacheKey = 'nominatim:q:'.md5(mb_strtolower($q));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($q) {
            $ip = (string) request()->ip();
            $rateKey = 'nominatim:rate:'.$ip;
            if (Cache::has($rateKey)) {
                usleep(1_100_000);
            }
            Cache::put($rateKey, 1, 1);

            try {
                $response = Http::timeout(8)
                    ->withHeaders([
                        'User-Agent' => config('services.nominatim.user_agent', 'BizLink/1.0 (school project)'),
                        'Accept-Language' => 'en',
                    ])
                    ->get(config('services.nominatim.url', 'https://nominatim.openstreetmap.org/search'), [
                        'format' => 'json',
                        'limit' => 5,
                        'countrycodes' => 'ph',
                        'addressdetails' => 1,
                        'q' => $q,
                    ]);
            } catch (\Throwable $e) {
                Log::warning('Nominatim request failed', ['error' => $e->getMessage()]);
                return [];
            }

            if (! $response->ok()) {
                return [];
            }

            $out = [];
            foreach ($response->json() ?? [] as $row) {
                if (! is_array($row) || ! isset($row['lat'], $row['lon'])) {
                    continue;
                }
                $addr = is_array($row['address'] ?? null) ? $row['address'] : [];
                $out[] = [
                    'label' => (string) ($row['display_name'] ?? ''),
                    'city' => $addr['city'] ?? $addr['town'] ?? $addr['municipality'] ?? $addr['village'] ?? null,
                    'province' => $addr['state'] ?? $addr['province'] ?? $addr['region'] ?? null,
                    'lat' => (float) $row['lat'],
                    'lng' => (float) $row['lon'],
                ];
            }

            return $out;
        });
    }
}
