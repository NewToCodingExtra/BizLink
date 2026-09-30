<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use App\Services\MeetService;
use Google\Client as GoogleClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MeetController extends Controller
{
    private function authorizeParticipant(Request $request, Conversation $conversation): void
    {
        $user = $request->user();
        $isBuyer = (int) $conversation->user_id === (int) $user->id;
        $isSeller = false;

        if (! $isBuyer) {
            $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
                ?? Story::where('brand_id', $conversation->brand_id)->value('user_id');
            $isSeller = (int) $ownerId === (int) $user->id;
        }

        if (! $isBuyer && !$isSeller) {
            abort(403, 'Forbidden');
        }
    }

    /**
     * The single redirect_uri sent to Google for the Meet/Calendar flow.
     * Built from APP_URL (never from the browse host) so localhost vs
     * 127.0.0.1 vs LAN IP can never cause a redirect_uri_mismatch.
     * Override with GOOGLE_MEET_REDIRECT_URI when APP_URL differs from the
     * URI registered in Google Console.
     */
    private function redirectUri(): string
    {
        $override = config('services.google.meet_redirect');
        if ($override) {
            return $override;
        }
        return rtrim(config('app.url'), '/') . '/meet/callback';
    }

    public function connect(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return redirect('/login');
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $returnTo = $request->query('return_to', '/messages');

        if (! $clientId || ! $clientSecret) {
            // Local fallback for environments without live Google OAuth keys
            $user->googleToken()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'access_token' => 'mock_access_token_' . Str::random(32),
                    'refresh_token' => 'mock_refresh_token_' . Str::random(32),
                    'expires_at' => now()->addDays(30),
                ]
            );

            return redirect($returnTo)->with('success', 'Google Calendar connected (demo mode).');
        }

        $client = new GoogleClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri($this->redirectUri());
        Log::info('Meet OAuth connect', ['client_id' => $clientId, 'redirect_uri' => $this->redirectUri()]);
        $client->addScope('https://www.googleapis.com/auth/calendar.events');
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $stateData = [
            'user_id' => $user->id,
            'return_to' => $returnTo,
        ];
        $client->setState(base64_encode(json_encode($stateData)));

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    public function callback(Request $request)
    {
        if ($error = $request->query('error')) {
            $stateData = json_decode(base64_decode($request->query('state', '')) ?: '{}', true);
            $returnTo = $stateData['return_to'] ?? '/messages';
            return redirect($returnTo)->with('error', 'Google authorization cancelled: ' . $error);
        }

        $code = $request->query('code');
        if (! $code) {
            return redirect('/messages')->with('error', 'No authorization code received.');
        }

        $stateData = json_decode(base64_decode($request->query('state', '')) ?: '{}', true);
        $returnTo = $stateData['return_to'] ?? '/messages';
        $userId = $request->user()?->id ?? ($stateData['user_id'] ?? null);

        if (! $userId) {
            return redirect('/login');
        }

        $user = User::find($userId);
        if (! $user) {
            return redirect('/login');
        }

        $client = new GoogleClient();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri($this->redirectUri());

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
            if (! empty($token['error'])) {
                return redirect($returnTo)->with('error', 'Google OAuth failed: ' . ($token['error_description'] ?? $token['error']));
            }

            $user->googleToken()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'access_token' => $token['access_token'],
                    'refresh_token' => $token['refresh_token'] ?? null,
                    'expires_at' => isset($token['expires_in']) ? now()->addSeconds((int) $token['expires_in']) : null,
                ]
            );

            return redirect($returnTo)->with('success', 'Google Calendar connected successfully.');
        } catch (\Throwable $e) {
            Log::error('Google Meet callback error', ['error' => $e->getMessage()]);
            return redirect($returnTo)->with('error', 'Failed to complete Google authorization.');
        }
    }

    public function status(Request $request)
    {
        $user = $request->user();
        $token = $user?->googleToken;

        return response()->json([
            'connected' => (bool) ($token && $token->access_token),
            'expires_at' => $token?->expires_at?->toIso8601String(),
        ]);
    }

    public function disconnect(Request $request)
    {
        $user = $request->user();
        $token = $user?->googleToken;

        if ($token) {
            $clientId = config('services.google.client_id');
            if ($clientId && ! str_starts_with($token->access_token, 'mock_')) {
                try {
                    $client = new GoogleClient();
                    $client->setClientId($clientId);
                    $client->setClientSecret(config('services.google.client_secret'));
                    $client->revokeToken($token->access_token);
                } catch (\Throwable $e) {
                    Log::warning('Revoke token failed on disconnect', ['error' => $e->getMessage()]);
                }
            }
            $token->delete();
        }

        return response()->json([
            'connected' => false,
            'message' => 'Google account disconnected successfully.',
        ]);
    }

    public function schedule(Request $request, Conversation $conversation, MeetService $meetService)
    {
        $this->authorizeParticipant($request, $conversation);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'start_at' => 'required|date',
            'duration' => 'required|integer|in:15,30,60',
        ]);

        $message = $meetService->schedule($request->user(), $conversation, $validated);

        return response()->json([
            'data' => app(ConversationController::class)->serializeForBroadcast($message),
        ], 201);
    }

    public function cancel(Request $request, Conversation $conversation, string $eventId, MeetService $meetService)
    {
        $this->authorizeParticipant($request, $conversation);

        $message = $meetService->cancel($request->user(), $conversation, $eventId);

        return response()->json([
            'data' => app(ConversationController::class)->serializeForBroadcast($message),
        ]);
    }
}
