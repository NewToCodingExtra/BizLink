<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * In-app Help Center. Serves the product docs in docs/*.md (whitelisted —
 * never arbitrary paths) so guidance ships with every deployment.
 */
class DocsController extends Controller
{
    public const PAGES = [
        'user-guide' => 'User Guide',
        'admin-guide' => 'Admin Guide',
        'deployment' => 'Deployment',
        'development' => 'Development',
    ];

    public function index()
    {
        return Inertia::render('Help', [
            'pages' => collect(self::PAGES)->map(fn ($title, $slug) => [
                'slug' => $slug,
                'title' => $title,
            ])->values(),
        ]);
    }

    public function show(Request $request, string $slug)
    {
        abort_unless(array_key_exists($slug, self::PAGES), 404);

        $path = dirname(base_path()) . '/docs/' . $slug . '.md';
        abort_unless(is_file($path), 404);

        return response()->json([
            'data' => [
                'slug' => $slug,
                'title' => self::PAGES[$slug],
                'markdown' => file_get_contents($path),
            ],
        ]);
    }
}
