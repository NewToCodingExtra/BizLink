<?php

namespace App\Contracts;

interface GeocodeAdapter
{
    /**
     * @return list<array{label: string, city: ?string, province: ?string, lat: float, lng: float}>
     */
    public function search(string $q): array;
}
