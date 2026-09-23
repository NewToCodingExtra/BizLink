<?php

namespace App\Http\Controllers;

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\UserController;
use App\Http\Resources\OpportunityResource;
use App\Models\Conversation;
use App\Models\Opportunity;
use App\Services\OpportunityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Browser pages for the Inertia app.
 *
 * Page-level data reuses the existing API controllers/services by calling
 * them internally and passing the payloads as Inertia props. This keeps a
 * single source of truth for serialization (feed ranking, profile shaping)
 * instead of duplicating it for web. The JSON API itself is untouched.
 */
class PageController extends Controller
{
    public function __construct(private OpportunityService $feed) {}

    public function home(Request $request)
    {
        if (Auth::check()) {
            return $this->feed($request);
        }
        return Inertia::render('Landing');
    }

    public function feed(Request $request)
    {
        $viewer = $request->user();
        $result = $this->feedService($request, $viewer);

        return Inertia::render('HomeFeed', [
            'opportunities' => $result['page'],
            'stories' => $this->stories($request),
            'preferences' => $this->preferences($request),
        ]);
    }

    public function search(Request $request)
    {
        $viewer = $request->user();
        $result = $this->feedService($request, $viewer);

        return Inertia::render('Search', [
            'opportunities' => $result['page'],
            'q' => (string) $request->query('q', ''),
        ]);
    }

    public function reels(Request $request)
    {
        $request->merge(['mediaType' => 'video']);
        $viewer = $request->user();
        $result = $this->feedService($request, $viewer);

        return Inertia::render('Reels', [
            'opportunities' => $result['page'],
        ]);
    }

    public function post(Request $request, string $slug)
    {
        $opp = Opportunity::where('slug', $slug)->firstOrFail();
        $data = app(OpportunityController::class)->show($request, $opp)->getData(true)['data'];

        return Inertia::render('OpportunityDetail', ['opp' => $data]);
    }

    public function storyViewer()
    {
        return Inertia::render('StoryViewer', [
            'stories' => $this->stories(request()),
        ]);
    }

    public function profile(Request $request, string $username)
    {
        $data = app(UserController::class)->show($request, $username)->getData(true)['data'] ?? null;

        if (!$data) {
            abort(404);
        }

        return Inertia::render('Profile', [
            'username' => $username,
            'profileUser' => $data['user'],
            'stats' => $data['stats'],
            'following' => $data['following'],
            'opportunities' => $data['opportunities'],
            'stories' => $data['stories'],
            'savedIds' => collect($data['opportunities'])->where('saved', true)->pluck('id')->values()->all(),
        ]);
    }

    public function messages(Request $request)
    {
        $data = app(ConversationController::class)->index($request)->getData(true)['data'] ?? [];

        return Inertia::render('MessagesInbox', ['conversations' => $data]);
    }

    public function thread(Request $request, int $id)
    {
        $conversation = Conversation::findOrFail($id);

        if ((int) $conversation->user_id !== (int) $request->user()->id) {
            return redirect('/messages')->with('error', 'Conversation not found.');
        }

        $data = app(ConversationController::class)->show($request, $conversation)->getData(true)['data'];

        return Inertia::render('MessageThread', ['conv' => $data]);
    }

    public function notifications(Request $request)
    {
        $payload = app(NotificationController::class)->index($request)->getData(true);

        return Inertia::render('Notifications', [
            'notifications' => $payload['data'] ?? [],
            'unread' => $payload['meta']['unread'] ?? 0,
        ]);
    }

    public function saved(Request $request)
    {
        $payload = app(OpportunityController::class)->saved($request)->response()->getData(true);

        return Inertia::render('Saved', ['opportunities' => $payload['data'] ?? []]);
    }

    public function preferencesPage(Request $request)
    {
        $data = app(PreferenceController::class)->show($request)->getData(true)['data'];

        return Inertia::render('Preferences', ['prefs' => $data]);
    }

    public function editProfile(Request $request)
    {
        return Inertia::render('EditProfile', [
            'user' => $request->user()->only(['id', 'name', 'username', 'email', 'avatar', 'bio', 'role']),
        ]);
    }

    public function create()
    {
        return Inertia::render('CreateOpportunity');
    }

    public function about()
    {
        return Inertia::render('About');
    }

    public function contactPage()
    {
        return Inertia::render('Contact');
    }

    public function storeOpportunity(Request $request)
    {
        $response = app(OpportunityController::class)->store($request);

        if ($response->getStatusCode() === 201) {
            $id = $response->getData(true)['data']['id'] ?? null;
            return redirect($id ? "/post/{$id}" : '/feed')->with('success', 'Opportunity published.');
        }

        return $response;
    }

    /**
     * Feed-shaped paginator props, identical shaping to the JSON API.
     */
    private function feedService(Request $request, $viewer): array
    {
        $result = $this->feed->getFeed($request, $viewer);
        /** @var \Illuminate\Pagination\LengthAwarePaginator $paginator */
        $paginator = $result['paginator'];
        $preferredIds = $result['preferredIds'] ?? [];
        $reasons = $result['reasons'] ?? [];

        $likedIds = $viewer ? $viewer->likedOpportunities()->pluck('opportunities.id')->toArray() : [];
        $savedIds = $viewer ? $viewer->savedOpportunities()->pluck('opportunities.id')->toArray() : [];

        $paginator->getCollection()->transform(function ($o) use ($likedIds, $savedIds, $preferredIds, $reasons) {
            $o->additional = [
                'likedIds' => $likedIds,
                'savedIds' => $savedIds,
                'preferredIds' => $preferredIds,
                'reasons' => $reasons[$o->id] ?? [],
            ];
            return $o;
        });

        $payload = OpportunityResource::collection($paginator)->response()->getData(true);

        return [
            'page' => [
                'data' => $payload['data'] ?? [],
                'meta' => $payload['meta'] ?? null,
            ],
        ];
    }

    private function stories(Request $request): array
    {
        return app(StoryController::class)->index($request)->getData(true)['data'] ?? [];
    }

    private function preferences(Request $request): array
    {
        if (!$request->user()) {
            return ['categories' => [], 'budgetMin' => '', 'budgetMax' => ''];
        }
        return app(PreferenceController::class)->show($request)->getData(true)['data']
            ?? ['categories' => [], 'budgetMin' => '', 'budgetMax' => ''];
    }
}
