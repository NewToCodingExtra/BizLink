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

        // Onboarding is only marked complete on an explicit save. A plain
        // "Skip for now" closes the modal client-side without touching the
        // server, so users without preferences are reminded again next
        // session instead of being silently marked complete.
        if (($data['onboardingCompleted'] ?? false) === true) {
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
