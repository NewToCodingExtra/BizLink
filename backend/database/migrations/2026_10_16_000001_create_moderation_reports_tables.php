<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_categories', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->string('label', 128);
            $table->unsignedInteger('severity')->default(10);
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('reportable_type', 32);
            $table->unsignedBigInteger('reportable_id');
            $table->foreignId('category_id')->constrained('report_categories')->restrictOnDelete();
            $table->text('details')->nullable();
            $table->string('status', 16)->default('pending');
            $table->integer('priority_score')->default(0);
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_note')->nullable();
            $table->string('action_taken', 32)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->unique(['reporter_id', 'reportable_type', 'reportable_id', 'category_id'], 'reports_reporter_target_category_unique');
            $table->index(['reportable_type', 'reportable_id', 'status'], 'reports_target_status_idx');
            $table->index(['status', 'priority_score', 'created_at'], 'reports_queue_idx');
            $table->index(['reporter_id'], 'reports_reporter_idx');
        });

        Schema::create('moderation_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 32);
            $table->text('reason');
            $table->integer('duration_days')->nullable();
            $table->boolean('removed_content')->default(false);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 16)->default('active')->after('role');
            $table->timestamp('suspended_until')->nullable()->after('status');
            $table->timestamp('banned_at')->nullable()->after('suspended_until');
            $table->text('ban_reason')->nullable()->after('banned_at');
            $table->unsignedInteger('warning_count')->default(0)->after('ban_reason');
        });

        Schema::table('opportunities', function (Blueprint $table) {
            $table->boolean('hidden_by_moderation')->default(false)->after('is_new');
        });

        Schema::table('stories', function (Blueprint $table) {
            $table->boolean('hidden_by_moderation')->default(false)->after('seen');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('is_hidden')->default(false)->after('text');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['is_hidden']);
        });
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn(['hidden_by_moderation']);
        });
        Schema::table('opportunities', function (Blueprint $table) {
            $table->dropColumn(['hidden_by_moderation']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'suspended_until', 'banned_at', 'ban_reason', 'warning_count']);
        });
        Schema::dropIfExists('moderation_actions');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('report_categories');
    }
};
