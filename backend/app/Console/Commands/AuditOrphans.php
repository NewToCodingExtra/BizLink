<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditOrphans extends Command
{
    protected $signature = 'audit:orphans {--json : Output as JSON}';
    protected $description = 'Report rows whose FK points at a missing parent (read-only)';

    public function handle(): int
    {
        $report = [];
        $q = function (string $label, string $table, string $sql, array $bindings = []) use (&$report) {
            if (! Schema::hasTable($table)) {
                $report[$label] = ['error' => "table {$table} missing"];
                return;
            }
            $rows = DB::select($sql, $bindings);
            $report[$label] = ['count' => count($rows), 'sample' => array_slice($rows, 0, 5)];
        };

        $userIds = DB::table('users')->pluck('id');
        $oppIds = DB::table('opportunities')->pluck('id');
        $convIds = Schema::hasTable('conversations') ? DB::table('conversations')->pluck('id') : collect();
        $storyIds = Schema::hasTable('stories') ? DB::table('stories')->pluck('id') : collect();

        $q('opportunities.user_id NULL', 'opportunities',
            'SELECT id, brand_id, brand_name, headline FROM opportunities WHERE user_id IS NULL LIMIT 20');
        $q('opportunities.user_id dangling', 'opportunities',
            'SELECT id, user_id, brand_id, headline FROM opportunities WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('stories.user_id NULL', 'stories',
            'SELECT id, brand_id, brand_name, caption FROM stories WHERE user_id IS NULL LIMIT 20');
        $q('stories.user_id dangling', 'stories',
            'SELECT id, user_id, brand_id FROM stories WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('comments.user_id NULL', 'comments',
            'SELECT id, opportunity_id, author, LEFT(text,60) AS text FROM comments WHERE user_id IS NULL LIMIT 20');
        $q('comments.user_id dangling', 'comments',
            'SELECT id, user_id, opportunity_id FROM comments WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('comments.opportunity_id orphan', 'comments',
            'SELECT id, opportunity_id FROM comments WHERE opportunity_id NOT IN (SELECT id FROM opportunities) LIMIT 20');
        $q('conversations.user_id orphan', 'conversations',
            'SELECT id, user_id FROM conversations WHERE user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('messages.conversation_id orphan', 'messages',
            'SELECT id, conversation_id FROM messages WHERE conversation_id NOT IN (SELECT id FROM conversations) LIMIT 20');
        $q('messages.sender_id dangling', 'messages',
            'SELECT id, sender_id FROM messages WHERE sender_id IS NOT NULL AND sender_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('app_notifications.user_id orphan', 'app_notifications',
            'SELECT id, user_id, type FROM app_notifications WHERE user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('likes.user orphan', 'opportunity_user_likes',
            'SELECT id, user_id, opportunity_id FROM opportunity_user_likes WHERE user_id NOT IN (SELECT id FROM users) OR opportunity_id NOT IN (SELECT id FROM opportunities) LIMIT 20');
        $q('saves orphan', 'opportunity_user_saves',
            'SELECT id, user_id, opportunity_id FROM opportunity_user_saves WHERE user_id NOT IN (SELECT id FROM users) OR opportunity_id NOT IN (SELECT id FROM opportunities) LIMIT 20');
        $q('hidden orphan', 'hidden_opportunities',
            'SELECT id, user_id, opportunity_id FROM hidden_opportunities WHERE user_id NOT IN (SELECT id FROM users) OR opportunity_id NOT IN (SELECT id FROM opportunities) LIMIT 20');
        $q('follows.user orphan', 'follows',
            'SELECT id, user_id, brand_id FROM follows WHERE user_id NOT IN (SELECT id FROM users) LIMIT 20');
        $q('preferences.user orphan', 'preferences',
            'SELECT id, user_id FROM preferences WHERE user_id NOT IN (SELECT id FROM users) LIMIT 20');
        if (Schema::hasTable('story_user_likes')) {
            $q('story_likes orphan', 'story_user_likes',
                'SELECT id, story_id, user_id FROM story_user_likes WHERE user_id NOT IN (SELECT id FROM users) OR story_id NOT IN (SELECT id FROM stories) LIMIT 20');
        } else {
            $report['story_likes orphan'] = ['error' => 'table story_user_likes missing (drift: expected via /migrate-now hack)'];
        }
        $q('brand_id slugs with no matching user', 'opportunities',
            'SELECT DISTINCT brand_id FROM opportunities WHERE brand_id IS NOT NULL AND brand_id NOT LIKE "brand-%" LIMIT 20');

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT));
        } else {
            $this->table(['check', 'count / error'],
                collect($report)->map(fn ($v, $k) => [$k, $v['error'] ?? $v['count']])->values()->all());
        }
        return self::SUCCESS;
    }
}
