<?php

namespace App\Services;

use App\Contracts\GeocodeAdapter;

class LocationService
{
    public function __construct(private GeocodeAdapter $geocode) {}

    /**
     * @return array<string, list<array{name: string, lat: float, lng: float}>>
     */
    public function regions(): array
    {
        static $cached = null;
        if ($cached === null) {
            $cached = require database_path('data/ph_locations.php');
        }

        return $cached;
    }

    /**
     * @return list<string>
     */
    public function provinces(): array
    {
        return array_keys($this->regions());
    }

    /**
     * @return array{city: ?string, province: ?string, latitude: ?float, longitude: ?float}|null
     */
    public function normalize(?array $input): ?array
    {
        if (! is_array($input)) {
            return null;
        }

        $city = isset($input['city']) ? trim((string) $input['city']) : '';
        $province = isset($input['province']) ? trim((string) $input['province']) : '';
        $lat = $this->toFloat($input['latitude'] ?? $input['lat'] ?? null);
        $lng = $this->toFloat($input['longitude'] ?? $input['lng'] ?? null);

        if ($city === '' && $province === '' && $lat === null && $lng === null) {
            return null;
        }

        if ($city !== '' && ($lat === null || $lng === null)) {
            $resolved = $this->lookupCoords($province, $city);
            $lat = $lat ?? $resolved['lat'];
            $lng = $lng ?? $resolved['lng'];
        }

        return [
            'city' => $city !== '' ? $city : null,
            'province' => $province !== '' ? $province : null,
            'latitude' => $lat,
            'longitude' => $lng,
        ];
    }

    /**
     * @return array{city: string, province: string, lat: float, lng: float}|null
     */
    public function payload(?string $city, ?string $province, $lat, $lng): ?array
    {
        $city = $city !== null ? trim($city) : '';
        $province = $province !== null ? trim($province) : '';
        $lat = $this->toFloat($lat);
        $lng = $this->toFloat($lng);

        if ($city === '' && $province === '' && $lat === null && $lng === null) {
            return null;
        }

        return [
            'city' => $city,
            'province' => $province,
            'lat' => $lat,
            'lng' => $lng,
        ];
    }

    /**
     * @return list<array{label: string, city: ?string, province: ?string, lat: float, lng: float}>
     */
    public function search(string $q): array
    {
        return $this->geocode->search($q);
    }

    /**
     * @return array{lat: ?float, lng: ?float}
     */
    public function lookupCoords(string $province, string $city): array
    {
        $regions = $this->regions();
        $cities = $regions[$province] ?? null;
        if (! is_array($cities)) {
            foreach ($regions as $name => $list) {
                if (strcasecmp($name, $province) === 0) {
                    $cities = $list;
                    break;
                }
            }
        }
        if (! is_array($cities)) {
            return ['lat' => null, 'lng' => null];
        }
        foreach ($cities as $row) {
            if (strcasecmp((string) ($row['name'] ?? ''), $city) === 0) {
                return [
                    'lat' => isset($row['lat']) ? (float) $row['lat'] : null,
                    'lng' => isset($row['lng']) ? (float) $row['lng'] : null,
                ];
            }
        }

        return ['lat' => null, 'lng' => null];
    }

    private function toFloat($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
