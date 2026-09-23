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
            'onboardingCompleted' => (bool) $pref?->onboarding_completed_at,
        ]]);
    }

    public function update(Request $request)
    {
        foreach (['budgetMin', 'budgetMax'] as $field) {
            if ($request->has($field) && $request->input($field) === '') {
                $request->merge([$field => null]);
            }
        }

        $data = $request->validate([
            'categories' => 'sometimes|array',
            'categories.*' => 'string|max:255',
            'budgetMin' => 'sometimes|nullable|numeric|min:0',
            'budgetMax' => 'sometimes|nullable|numeric|min:0',
            'onboardingCompleted' => 'sometimes|boolean',
        ]);

        if (isset($data['budgetMin'], $data['budgetMax'])
            && $data['budgetMin'] !== null
            && $data['budgetMax'] !== null
            && (float) $data['budgetMin'] > (float) $data['budgetMax']) {
            return response()->json([
                'message' => 'Your maximum budget must be greater than or equal to your minimum budget.',
            ], 422);
        }

        $pref = Preference::firstOrNew(['user_id' => $request->user()->id]);

        if (array_key_exists('categories', $data)) {
            $pref->categories = $data['categories'];
        }
        if (array_key_exists('budgetMin', $data)) {
            $pref->budget_min = $data['budgetMin'];
        }
        if (array_key_exists('budgetMax', $data)) {
            $pref->budget_max = $data['budgetMax'];
        }

        // Any explicit preference save is a completed setup unless a caller
        // deliberately says otherwise. This also lets a dismissal persist
        // without erasing an existing preference selection.
        if (($data['onboardingCompleted'] ?? true) === true) {
            $pref->onboarding_completed_at = now();
        }
        $pref->save();

        return response()->json(['data' => [
            'categories' => $pref->categories ?? [],
            'budgetMin' => $pref->budget_min ?? '',
            'budgetMax' => $pref->budget_max ?? '',
            'onboardingCompleted' => (bool) $pref->onboarding_completed_at,
        ]]);
    }
}
