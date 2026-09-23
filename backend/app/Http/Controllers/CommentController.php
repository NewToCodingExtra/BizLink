<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Opportunity;
use App\Services\CommentService;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(private CommentService $comments) {}

    private function viewerId(Request $request): ?int
    {
        return $request->user()?->id;
    }

    private function tree(Opportunity $opportunity, ?int $viewerId): array
    {
        return $this->comments->treeFor($opportunity, $viewerId);
    }

    public function index(Request $request, Opportunity $opportunity)
    {
        return response()->json(['data' => $this->tree($opportunity, $this->viewerId($request))]);
    }

    public function store(Request $request, Opportunity $opportunity)
    {
        $data = $request->validate([
            'text' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|integer|exists:comments,id',
            'media_url' => 'nullable|string|max:2048',
            'media_type' => 'nullable|in:image,video',
        ]);

        if (trim((string) ($data['text'] ?? '')) === '' && empty($data['media_url'])) {
            return response()->json(['message' => 'Write something or attach a photo or video.'], 422);
        }

        $comment = $this->comments->store($request->user(), $opportunity, $data);

        return response()->json(['data' => (new CommentResource(
            $comment->load(['user:id,name,username,avatar', 'reactions'])
        ))->withViewer($this->viewerId($request))->toArray($request)], 201);
    }

    public function replies(Request $request, Comment $comment)
    {
        $replies = $comment->replies()->withTrashed()
            ->with(['user:id,name,username,avatar', 'reactions'])
            ->oldest()
            ->get();

        return response()->json(['data' => $replies->map(
            fn($r) => (new CommentResource($r))->withViewer($this->viewerId($request))->toArray($request)
        )->values()]);
    }

    public function update(Request $request, Comment $comment)
    {
        $user = $request->user();
        abort_if(!$user || (int) $comment->user_id !== (int) $user->id, 403, 'You can only edit your own comments.');
        abort_if($comment->trashed(), 422, 'Deleted comments cannot be edited.');
        abort_if(
            $comment->created_at && $comment->created_at->diffInMinutes(now()) > CommentService::EDIT_WINDOW_MINUTES,
            422, 'Comments can only be edited within 15 minutes.'
        );

        $data = $request->validate(['text' => 'required|string|max:1000']);
        $comment->forceFill(['text' => $data['text'], 'edited_at' => now()])->save();

        return response()->json(['data' => (new CommentResource(
            $comment->load(['user:id,name,username,avatar', 'reactions'])
        ))->withViewer($this->viewerId($request))->toArray($request)]);
    }

    public function destroy(Request $request, Comment $comment)
    {
        $user = $request->user();
        $isOwner = $user && (int) $comment->user_id === (int) $user->id;
        $isPostOwner = $user && (int) $comment->opportunity->user_id === (int) $user->id;
        abort_if(!$isOwner && !$isPostOwner, 403, 'You cannot delete this comment.');

        $comment->delete();

        return response()->json(['deleted' => true]);
    }

    public function react(Request $request, Comment $comment)
    {
        $data = $request->validate([
            'emoji' => 'required|string|in:' . implode(',', CommentService::ALLOWED_EMOJI),
        ]);

        $result = $this->comments->toggleReaction($request->user(), $comment, $data['emoji']);

        return response()->json($result + ['data' => (new CommentResource(
            $comment->load(['user:id,name,username,avatar', 'reactions'])
        ))->withViewer($this->viewerId($request))->toArray($request)]);
    }

    public function report(Request $request, Comment $comment)
    {
        $data = $request->validate([
            'reason' => 'required|string|in:' . implode(',', CommentService::ALLOWED_REASONS),
        ]);

        $result = $this->comments->report($request->user(), $comment, $data['reason']);

        return response()->json($result + ['message' => $result['hidden']
            ? 'Thanks — this comment was hidden pending review.'
            : 'Thanks — our team will review this comment.']);
    }
}
