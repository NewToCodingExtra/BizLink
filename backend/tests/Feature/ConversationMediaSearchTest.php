<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationMediaSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_media_and_search_endpoints(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $conversation = Conversation::create([
            'user_id' => $sender->id,
            'with_name' => $receiver->name,
            'avatar' => 'https://example.com/avatar.jpg',
            'last_message' => 'Hello test',
            'unread' => 0,
            'brand_id' => $receiver->username,
        ]);

        // Create an image message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'from_side' => 'me',
            'text' => 'Here is a photo and link https://bizlink.test',
            'media_url' => 'https://storage.googleapis.com/test-bucket/bizlink/photo.jpg',
            'media_type' => 'image',
            'media_name' => 'photo.jpg',
        ]);

        // Create a video message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $receiver->id,
            'from_side' => 'them',
            'text' => 'Video demonstration',
            'media_url' => 'https://storage.googleapis.com/test-bucket/bizlink/demo.mp4',
            'media_type' => 'video',
            'media_name' => 'demo.mp4',
        ]);

        // Create a document file message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'from_side' => 'me',
            'text' => 'Document specification',
            'media_url' => 'https://storage.googleapis.com/test-bucket/bizlink/spec.pdf',
            'media_type' => 'file',
            'media_name' => 'spec.pdf',
        ]);

        // 1. Test Media Endpoint with type=media (Photos + Videos)
        $resMedia = $this->actingAs($sender)->getJson("/conversations/{$conversation->id}/media?type=media");
        $resMedia->assertStatus(200);
        $resMedia->assertJsonStructure(['data' => [['id', 'mediaUrl', 'mediaType']]]);
        $this->assertCount(2, $resMedia->json('data'));

        // 2. Test Media Endpoint with type=photo
        $resPhoto = $this->actingAs($sender)->getJson("/conversations/{$conversation->id}/media?type=photo");
        $resPhoto->assertStatus(200);
        $this->assertCount(1, $resPhoto->json('data'));
        $this->assertEquals('image', $resPhoto->json('data.0.mediaType'));

        // 3. Test Media Endpoint with type=file
        $resFile = $this->actingAs($sender)->getJson("/conversations/{$conversation->id}/media?type=file");
        $resFile->assertStatus(200);
        $this->assertCount(1, $resFile->json('data'));
        $this->assertEquals('file', $resFile->json('data.0.mediaType'));

        // 4. Test Search Endpoint
        $resSearch = $this->actingAs($sender)->getJson("/conversations/{$conversation->id}/messages/search?q=demonstration");
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertStringContainsString('Video demonstration', $resSearch->json('data.0.text'));
    }
}
