<?php

namespace App\Http\Controllers;

use App\Services\LocationService;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function __construct(private LocationService $locations) {}

    public function regions()
    {
        return response()->json(['data' => $this->locations->regions()]);
    }

    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => $this->locations->search($q)]);
    }
}
