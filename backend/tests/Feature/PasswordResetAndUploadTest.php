<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PasswordResetAndUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_view_renders_successfully(): void
    {
        $response = $this->get('/forgot-password');
        $response->assertStatus(200);
    }

    public function test_forgot_password_request_generates_reset_link_without_server_error(): void
    {
        $user = User::factory()->create([
            'email' => 'founder@test.com',
        ]);

        $response = $this->post('/forgot-password', [
            'email' => 'founder@test.com',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $this->assertNotNull(session('reset_url'));
        $this->assertStringContainsString('/reset-password/', session('reset_url'));
    }

    public function test_authenticated_user_can_upload_media_to_uploads_endpoint(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->actingAs($user)->post('/uploads', [
            'file' => $file,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'url',
            'media_type',
            'media_name',
            'media_size',
            'path',
        ]);
        $this->assertEquals('image', $response->json('media_type'));
    }
}
