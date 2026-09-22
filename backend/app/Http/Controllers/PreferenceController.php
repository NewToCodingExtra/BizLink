<?php

namespace App\Http\Controllers;

use App\Models\Preference;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request)
    {
        $pref = $request->user()->preference;
        return response()->json(['data' => [
            'categories' => $pref?->categories ?? [],
            'budgetMin' => $pref?->budget_min ?? '',
            'budgetMax' => $pref?->budget_max ?? '',
        ]]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'categories' => 'sometimes|array',
            'categories.*' => 'string|max:255',
            'budgetMin' => 'sometimes|nullable|string|max:255',
            'budgetMax' => 'sometimes|nullable|string|max:255',
        ]);

        $pref = Preference::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'categories' => $data['categories'] ?? [],
                'budget_min' => $data['budgetMin'] ?? null,
                'budget_max' => $data['budgetMax'] ?? null,
            ]
        );

        return response()->json(['data' => [
            'categories' => $pref->categories ?? [],
            'budgetMin' => $pref->budget_min ?? '',
            'budgetMax' => $pref->budget_max ?? '',
        ]]);
    }
}
