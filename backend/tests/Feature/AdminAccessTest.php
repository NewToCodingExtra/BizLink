<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Role-based access + role-aware login routing.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        foreach ([
            ['admin@bizlink.ph', 'Admin'],
            ['brand@bizlink.ph', 'Manager'],
            ['demo@bizlink.ph', 'User'],
        ] as [$email, $roleName]) {
            $u = User::factory()->create([
                'email' => $email,
                'password' => 'password123', // hashed cast
                'role' => $roleName,
            ]);
            $u->assignRole($roleName);
        }
    }

    public function test_guests_are_blocked(): void
    {
        $this->get('/admin')->assertRedirect();
        $this->get('/create')->assertRedirect();
        $this->assertTrue(true);
    }

    public function test_admin_dashboard_access(): void
    {
        $admin = User::where('email', 'admin@bizlink.ph')->first();
        $this->actingAs($admin)->get('/admin')->assertOk();
    }

    public function test_non_admin_cannot_see_console(): void
    {
        $manager = User::where('email', 'brand@bizlink.ph')->first();
        $this->actingAs($manager)
            ->get('/admin')
            ->assertForbidden();
        // ...but the manager CAN reach the create form.
        $this->actingAs($manager)->get('/create')->assertOk();
    }

    public function test_login_routes_by_role(): void
    {
        $this->post('/login', ['email' => 'admin@bizlink.ph', 'password' => 'password123'])
            ->assertRedirect('/admin');
    }

    public function test_manager_login_lands_on_create(): void
    {
        $this->post('/login', ['email' => 'brand@bizlink.ph', 'password' => 'password123'])
            ->assertRedirect('/create');
    }

    public function test_entrepreneur_login_lands_on_feed(): void
    {
        $this->post('/login', ['email' => 'demo@bizlink.ph', 'password' => 'password123'])
            ->assertRedirect('/feed');
    }

    public function test_demo_login_routes_by_role(): void
    {
        $this->post('/demo-login', ['role' => 'admin'])->assertRedirect('/admin');
        $this->post('/demo-login', ['role' => 'brand'])->assertRedirect('/create');
        $this->post('/demo-login', ['role' => 'entrepreneur'])->assertRedirect('/feed');
    }

    public function test_intended_url_wins_over_role_home(): void
    {
        // Guest tries /create, logs in as brand -> returns to /create.
        $this->get('/create');
        $this->post('/login', ['email' => 'brand@bizlink.ph', 'password' => 'password123'])
            ->assertRedirect('/create');
    }

    public function test_demo_login_rejects_unknown_role(): void
    {
        $this->post('/demo-login', ['role' => 'superuser'])
            ->assertSessionHasErrors('role');
    }
}
