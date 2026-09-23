<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrphanProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_opportunity_requires_owner(): void
    {
        $this->expectException(\RuntimeException::class);
        Opportunity::create([
            'user_id' => null,
            'brand_name' => 'No Owner',
            'headline' => 'Ownerless post',
        ]);
    }

    public function test_story_requires_owner(): void
    {
        $this->expectException(\RuntimeException::class);
        Story::create([
            'user_id' => null,
            'brand_name' => 'No Owner',
            'caption' => 'x',
        ]);
    }

    public function test_user_with_posts_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        Opportunity::create([
            'user_id' => $user->id,
            'brand_name' => $user->name,
            'headline' => 'Keep me',
        ]);
        $this->expectException(\RuntimeException::class);
        $user->delete();
    }

    public function test_guest_comment_rejected(): void
    {
        $user = User::factory()->create();
        $opp = Opportunity::create([
            'user_id' => $user->id,
            'brand_name' => $user->name,
            'headline' => 'Comment target',
        ]);
        $service = app(\App\Services\CommentService::class);
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        $service->store(null, $opp, ['text' => 'hi']);
    }

    public function test_comment_service_sets_owner_and_seller_flag(): void
    {
        $owner = User::factory()->create();
        $buyer = User::factory()->create();
        $opp = Opportunity::create([
            'user_id' => $owner->id,
            'brand_name' => $owner->name,
            'headline' => 'Seller flag target',
        ]);
        $service = app(\App\Services\CommentService::class);
        $sellerComment = $service->store($owner, $opp, ['text' => 'yes, available']);
        $buyerComment = $service->store($buyer, $opp, ['text' => 'is this available?']);
        $this->assertEquals($owner->id, $sellerComment->user_id);
        $this->assertTrue((bool) $sellerComment->is_seller_reply);
        $this->assertEquals($buyer->id, $buyerComment->user_id);
        $this->assertFalse((bool) $buyerComment->is_seller_reply);
        $this->assertInstanceOf(Comment::class, $buyerComment);
    }
}
