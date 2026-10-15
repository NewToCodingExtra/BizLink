<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LinkPreviewService
{
    public function getPreview(string $url): ?array
    {
        $url = trim($url);
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $parsed = parse_url($url);
        $scheme = strtolower($parsed['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        $host = $parsed['host'] ?? '';
        if ($this->isPrivateHost($host)) {
            return null;
        }

        $hash = hash('sha256', $url);
        $cached = DB::table('link_previews')
            ->where('url_hash', $hash)
            ->where('created_at', '>=', now()->subDays(30))
            ->first();

        if ($cached) {
            return [
                'url' => $cached->url,
                'title' => $cached->title,
                'description' => $cached->description,
                'image' => $cached->image_url,
                'siteName' => $cached->site_name,
            ];
        }

        try {
            $response = Http::timeout(4)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; BizLinkBot/1.0; +https://bizlink.ph)',
                    'Accept' => 'text/html,application/xhtml+xml',
                ])
                ->get($url);

            if (!$response->successful()) {
                return null;
            }

            $html = substr($response->body(), 0, 100000);
            $preview = $this->extractMeta($html, $url, $host);

            DB::table('link_previews')->updateOrInsert(
                ['url_hash' => $hash],
                [
                    'url' => $url,
                    'title' => Str::limit($preview['title'] ?? '', 450),
                    'description' => Str::limit($preview['description'] ?? '', 1000),
                    'image_url' => Str::limit($preview['image'] ?? '', 2000),
                    'site_name' => Str::limit($preview['siteName'] ?? $host, 250),
                    'fetched_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            return $preview;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function isPrivateHost(string $host): bool
    {
        if (empty($host)) return true;
        if (in_array(strtolower($host), ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            return true;
        }
        $ip = gethostbyname($host);
        if ($ip === $host && !filter_var($ip, FILTER_VALIDATE_IP)) {
            return false;
        }
        return !filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }

    private function extractMeta(string $html, string $url, string $host): array
    {
        $title = null;
        $description = null;
        $image = null;
        $siteName = $host;

        // OG title or <title>
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $title = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        } elseif (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
            $title = html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // OG description or standard description
        if (preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $description = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        } elseif (preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $description = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // OG image
        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $img = trim($m[1]);
            if (str_starts_with($img, '//')) {
                $img = 'https:' . $img;
            } elseif (str_starts_with($img, '/') && !empty($host)) {
                $img = rtrim($url, '/') . '/' . ltrim($img, '/');
            }
            if (filter_var($img, FILTER_VALIDATE_URL)) {
                $image = $img;
            }
        }

        // OG site_name
        if (preg_match('/<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            $siteName = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        return [
            'url' => $url,
            'title' => $title,
            'description' => $description,
            'image' => $image,
            'siteName' => $siteName,
        ];
    }
}
