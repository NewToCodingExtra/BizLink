<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Message;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('messages')) {
            return;
        }

        if (!\Illuminate\Support\Facades\Schema::hasColumn('messages', 'meet_status') ||
            !\Illuminate\Support\Facades\Schema::hasColumn('messages', 'meet_url')) {
            return;
        }

        \Illuminate\Support\Facades\DB::table('messages')
            ->where('meet_status', 'scheduled')
            ->where('meet_url', 'like', '%meet.google.com%')
            ->orderBy('id')
            ->chunk(100, function ($messages) {
                foreach ($messages as $msg) {
                    if (preg_match('/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i', $msg->meet_url)) {
                        $roomSlug = 'BizLink-Consultation-' . $msg->conversation_id . '-' . strtolower(\Illuminate\Support\Str::random(8));
                        \Illuminate\Support\Facades\DB::table('messages')
                            ->where('id', $msg->id)
                            ->update(['meet_url' => 'https://meet.jit.si/' . $roomSlug]);
                    }
                }
            });
    }

    public function down(): void
    {
        // No rollback needed
    }
};
