<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Audit log backbone
        Schema::create('admin_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 64);
            $table->string('target_type', 64)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->text('reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['target_type', 'target_id'], 'admin_actions_target_idx');
            $table->index(['admin_id', 'created_at'], 'admin_actions_admin_time_idx');
            $table->index('created_at', 'admin_actions_created_idx');
        });

        // 2. Login attempts tracking (for lockout / rate limiting visibility)
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email', 191)->index();
            $table->string('ip', 45)->index();
            $table->boolean('successful')->default(false);
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });

        // 3. Brand Verification requests
        Schema::create('verification_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 16)->default('pending'); // pending, approved, rejected
            $table->string('business_name', 191);
            $table->string('document_url', 512)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'verif_req_status_idx');
            $table->index('user_id', 'verif_req_user_idx');
        });

        // 4. Profile-level verified brand column
        if (! Schema::hasColumn('users', 'is_brand_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_brand_verified')->default(false)->after('role');
            });
        }

        // Grandfather option (a): Seeded brands with verified opportunities get is_brand_verified = true
        $verifiedOwnerIds = DB::table('opportunities')
            ->where('verified', true)
            ->pluck('user_id')
            ->unique()
            ->filter();

        if ($verifiedOwnerIds->isNotEmpty()) {
            DB::table('users')
                ->whereIn('id', $verifiedOwnerIds)
                ->update(['is_brand_verified' => true]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_brand_verified')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_brand_verified');
            });
        }
        Schema::dropIfExists('verification_requests');
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('admin_actions');
    }
};
