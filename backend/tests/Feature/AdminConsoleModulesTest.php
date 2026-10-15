<?php

namespace Tests\Feature;

use App\Models\AdminAction;
use App\Models\LoginAttempt;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminConsoleModulesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $brand;
    private User $entrepreneur;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $this->seed(\Database\Seeders\ReportCategorySeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin@bizlink.ph',
            'role' => 'admin',
        ]);
        $this->admin->assignRole('Admin');

        $this->brand = User::factory()->create([
            'email' => 'brand@bizlink.ph',
            'role' => 'brand',
            'is_brand_verified' => false,
        ]);
        $this->brand->assignRole('Manager');

        $this->entrepreneur = User::factory()->create([
            'email' => 'user@bizlink.ph',
            'role' => 'entrepreneur',
        ]);
        $this->entrepreneur->assignRole('User');
    }

    public function test_admin_can_access_all_modules(): void
    {
        $this->actingAs($this->admin)->get('/admin')->assertOk();
        $this->actingAs($this->admin)->get('/admin/users')->assertOk();
        $this->actingAs($this->admin)->get('/admin/reports')->assertOk();
        $this->actingAs($this->admin)->get('/admin/verifications')->assertOk();
        $this->actingAs($this->admin)->get('/admin/analytics')->assertOk();
        $this->actingAs($this->admin)->get('/admin/settings')->assertOk();
    }

    public function test_non_admin_is_forbidden_from_admin_modules(): void
    {
        $this->actingAs($this->brand)->get('/admin/users')->assertForbidden();
        $this->actingAs($this->brand)->get('/admin/verifications')->assertForbidden();
        $this->actingAs($this->brand)->get('/admin/analytics')->assertForbidden();
        $this->actingAs($this->brand)->get('/admin/settings')->assertForbidden();
    }

    public function test_admin_can_warn_user_and_creates_audit_log(): void
    {
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/warn", [
            'reason' => 'Inappropriate comments in community discussion',
        ]);

        $response->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertEquals(1, $this->entrepreneur->warning_count);

        $this->assertDatabaseHas('admin_actions', [
            'admin_id' => $this->admin->id,
            'action' => 'user.warn',
            'target_type' => 'User',
            'target_id' => $this->entrepreneur->id,
        ]);
    }

    public function test_admin_can_suspend_and_unsuspend_user(): void
    {
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/suspend", [
            'days' => 7,
            'reason' => 'Repeated spam violation',
        ]);

        $response->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertEquals('suspended', $this->entrepreneur->status);
        $this->assertNotNull($this->entrepreneur->suspended_until);

        // Unsuspend
        $unsuspendResponse = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/unsuspend");
        $unsuspendResponse->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertEquals('active', $this->entrepreneur->status);
        $this->assertNull($this->entrepreneur->suspended_until);
    }

    public function test_admin_can_ban_and_unban_user(): void
    {
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/ban", [
            'reason' => 'Malicious impersonation attempt',
        ]);

        $response->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertEquals('banned', $this->entrepreneur->status);
        $this->assertNotNull($this->entrepreneur->banned_at);

        // Unban
        $unbanResponse = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/unban");
        $unbanResponse->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertEquals('active', $this->entrepreneur->status);
        $this->assertNull($this->entrepreneur->banned_at);
    }

    public function test_admin_cannot_ban_themselves(): void
    {
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->admin->id}/ban", [
            'reason' => 'Self-ban',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_change_user_role(): void
    {
        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/role", [
            'role' => 'Manager',
        ]);

        $response->assertRedirect();
        $this->entrepreneur->refresh();
        $this->assertTrue($this->entrepreneur->hasRole('Manager'));
        $this->assertEquals('brand', $this->entrepreneur->role);
    }

    public function test_admin_can_unlock_user_lockout(): void
    {
        LoginAttempt::create([
            'email' => $this->entrepreneur->email,
            'ip' => '127.0.0.1',
            'successful' => false,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/users/{$this->entrepreneur->id}/unlock");
        $response->assertRedirect();

        $this->assertEquals(0, LoginAttempt::where('email', $this->entrepreneur->email)->count());
    }

    public function test_admin_can_approve_verification_request(): void
    {
        $req = VerificationRequest::create([
            'user_id' => $this->brand->id,
            'status' => 'pending',
            'business_name' => 'Acme Corporation',
            'document_url' => 'https://example.com/doc.pdf',
            'notes' => 'Registration permit attached',
        ]);

        $opp = Opportunity::create([
            'user_id' => $this->brand->id,
            'brand_name' => 'Acme Corp',
            'slug' => 'acme-deal',
            'headline' => 'Acme Deal',
            'description' => 'Test deal description',
            'type' => 'Franchise',
            'capital_required' => '₱500,000',
            'roi' => '25%',
            'verified' => false,
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/verifications/{$req->id}/approve", [
            'note' => 'Business documents verified with registry',
        ]);

        $response->assertRedirect();
        $req->refresh();
        $this->assertEquals('approved', $req->status);
        $this->assertEquals($this->admin->id, $req->admin_id);

        $this->brand->refresh();
        $this->assertTrue($this->brand->is_brand_verified);

        $opp->refresh();
        $this->assertTrue($opp->verified);
    }

    public function test_admin_can_reject_verification_request(): void
    {
        $req = VerificationRequest::create([
            'user_id' => $this->brand->id,
            'status' => 'pending',
            'business_name' => 'Acme Corp',
        ]);

        $response = $this->actingAs($this->admin)->post("/admin/verifications/{$req->id}/reject", [
            'reason' => 'Permit document was illegible and expired',
        ]);

        $response->assertRedirect();
        $req->refresh();
        $this->assertEquals('rejected', $req->status);
    }

    public function test_admin_can_update_settings(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/settings', [
            'login_rate_limit' => 10,
            'report_throttle_per_min' => 8,
            'comment_throttle_per_min' => 15,
            'inquiry_throttle_per_day' => 30,
            'demo_login_enabled' => true,
            'registration_open' => true,
            'maintenance_mode' => false,
        ]);

        $response->assertRedirect();
        $this->assertEquals('10', \App\Models\Setting::get('login_rate_limit'));
    }

    public function test_admin_exports_stream(): void
    {
        $this->actingAs($this->admin)->get('/admin/export/users')->assertOk();
        $this->actingAs($this->admin)->get('/admin/export/reports')->assertOk();
        $this->actingAs($this->admin)->get('/admin/export/verifications')->assertOk();
        $this->actingAs($this->admin)->get('/admin/export/audit-logs')->assertOk();
    }
}
