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
            $cachedImg = $cached->image_url;
            if ($cachedImg) {
                $cachedImg = html_entity_decode($cachedImg, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            return [
                'url' => $cached->url,
                'title' => $cached->title,
                'description' => $cached->description,
                'image' => $cachedImg,
                'siteName' => $cached->site_name,
            ];
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 facebookexternalhit/1.1',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.9',
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

    public function isPrivateHost(string $host): bool
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

    private function getMetaContent(string $html, string $key): ?string
    {
        $escaped = preg_quote($key, '/');
        // Match <meta property="key" content="value"> or <meta name="key" content="value">
        if (preg_match('/<meta[^>]+(?:property|name)=["\']' . $escaped . '["\'][^>]+content=["\']([^"\']*)["\']/i', $html, $m)) {
            return $m[1];
        }
        // Match <meta content="value" property="key"> or <meta content="value" name="key">
        if (preg_match('/<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']' . $escaped . '["\']/i', $html, $m)) {
            return $m[1];
        }
        return null;
    }

    private function extractMeta(string $html, string $url, string $host): array
    {
        $title = null;
        $description = null;
        $image = null;
        $siteName = $host;

        // Title: OG title -> Twitter title -> <title>
        $rawTitle = $this->getMetaContent($html, 'og:title')
            ?? $this->getMetaContent($html, 'twitter:title');
        if ($rawTitle !== null && trim($rawTitle) !== '') {
            $title = html_entity_decode(trim($rawTitle), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        } elseif (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
            $title = html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // Description: OG desc -> Twitter desc -> Meta desc
        $rawDesc = $this->getMetaContent($html, 'og:description')
            ?? $this->getMetaContent($html, 'twitter:description')
            ?? $this->getMetaContent($html, 'description');
        if ($rawDesc !== null && trim($rawDesc) !== '') {
            $description = html_entity_decode(trim($rawDesc), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // Image: OG image -> Twitter image
        $rawImg = $this->getMetaContent($html, 'og:image')
            ?? $this->getMetaContent($html, 'og:image:url')
            ?? $this->getMetaContent($html, 'twitter:image')
            ?? $this->getMetaContent($html, 'twitter:image:src');
        if ($rawImg !== null && trim($rawImg) !== '') {
            $img = html_entity_decode(trim($rawImg), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if (str_starts_with($img, '//')) {
                $img = 'https:' . $img;
            } elseif (str_starts_with($img, '/') && !empty($host)) {
                $parsedUrl = parse_url($url);
                $scheme = $parsedUrl['scheme'] ?? 'https';
                $img = $scheme . '://' . $host . $img;
            }
            if (filter_var($img, FILTER_VALIDATE_URL)) {
                $image = $img;
            }
        }

        // Site Name
        $rawSite = $this->getMetaContent($html, 'og:site_name')
            ?? $this->getMetaContent($html, 'twitter:site');
        if ($rawSite !== null && trim($rawSite) !== '') {
            $siteName = html_entity_decode(trim($rawSite), ENT_QUOTES | ENT_HTML5, 'UTF-8');
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
