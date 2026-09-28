<?php

namespace App\Services;

use App\Contracts\CalendarAdapter;
use App\Models\GoogleToken;
use App\Models\User;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\ConferenceData;
use Google\Service\Calendar\CreateConferenceRequest;
use Google\Service\Calendar\ConferenceSolutionKey;
use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleCalendarAdapter implements CalendarAdapter
{
    private function getClient(User $user): GoogleClient
    {
        $token = $user->googleToken;
        if (! $token || ! $token->access_token) {
            throw new \RuntimeException('Google account not connected. Please connect your Google account to schedule a meeting.');
        }

        $client = new GoogleClient();
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.meet_redirect', url('/meet/callback'));

        if ($clientId) {
            $client->setClientId($clientId);
        }
        if ($clientSecret) {
            $client->setClientSecret($clientSecret);
        }
        $client->setRedirectUri($redirectUri);
        $client->addScope('https://www.googleapis.com/auth/calendar.events');
        $client->setAccessType('offline');

        if ($token->isExpired()) {
            if ($token->refresh_token && $clientId && $clientSecret) {
                try {
                    $refreshed = $client->fetchAccessTokenWithRefreshToken($token->refresh_token);
                    if (! empty($refreshed['error'])) {
                        throw new \RuntimeException('Google token refresh failed: ' . ($refreshed['error_description'] ?? $refreshed['error']));
                    }
                    $token->update([
                        'access_token' => $refreshed['access_token'],
                        'expires_at' => isset($refreshed['expires_in']) ? now()->addSeconds((int) $refreshed['expires_in']) : null,
                        'refresh_token' => $refreshed['refresh_token'] ?? $token->refresh_token,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Google token refresh exception', ['error' => $e->getMessage()]);
                    throw new \RuntimeException('Your Google authorization has expired. Please reconnect your Google account.');
                }
            } else {
                throw new \RuntimeException('Your Google authorization has expired. Please reconnect your Google account.');
            }
        }

        $client->setAccessToken($token->access_token);

        return $client;
    }

    public function createMeet(User $u, string $t, Carbon $s, int $mins): array
    {
        $client = $this->getClient($u);
        $clientId = config('services.google.client_id');

        if (! $clientId) {
            // Mock fallback when Google credentials are not configured in environment
            $eventId = 'mock_meet_' . Str::random(16);
            $randomCode = strtolower(Str::random(3)) . '-' . strtolower(Str::random(4)) . '-' . strtolower(Str::random(3));
            return [
                'eventId' => $eventId,
                'link' => "https://meet.google.com/{$randomCode}",
            ];
        }

        $service = new GoogleCalendar($client);

        $event = new GoogleEvent();
        $event->setSummary($t);
        $event->setDescription('BizLink Consultation Meeting');

        $start = new EventDateTime();
        $start->setDateTime($s->toRfc3339String());
        $start->setTimeZone('UTC');
        $event->setStart($start);

        $end = new EventDateTime();
        $end->setDateTime($s->copy()->addMinutes($mins)->toRfc3339String());
        $end->setTimeZone('UTC');
        $event->setEnd($end);

        $confSolution = new ConferenceSolutionKey();
        $confSolution->setType('hangoutsMeet');

        $createRequest = new CreateConferenceRequest();
        $createRequest->setRequestId((string) Str::uuid());
        $createRequest->setConferenceSolutionKey($confSolution);

        $confData = new ConferenceData();
        $confData->setCreateRequest($createRequest);
        $event->setConferenceData($confData);

        $attempt = 0;
        $maxAttempts = 3;
        $created = null;

        while ($attempt < $maxAttempts) {
            $attempt++;
            try {
                $created = $service->events->insert('primary', $event, [
                    'conferenceDataVersion' => 1,
                ]);
                break;
            } catch (\Throwable $e) {
                Log::warning("Google Calendar createMeet attempt {$attempt} failed", ['error' => $e->getMessage()]);
                if ($attempt >= $maxAttempts) {
                    throw new \RuntimeException('Failed to create Google Meet with Google Calendar API: ' . $e->getMessage());
                }
                usleep(500000 * $attempt);
            }
        }

        $link = $created->getHangoutLink();
        if (! $link) {
            $entryPoints = $created->getConferenceData()?->getEntryPoints() ?? [];
            foreach ($entryPoints as $ep) {
                if ($ep->getEntryPointType() === 'video' || str_contains($ep->getUri() ?? '', 'meet.google.com')) {
                    $link = $ep->getUri();
                    break;
                }
            }
        }

        if (! $link) {
            $link = $created->getHtmlLink() ?? 'https://meet.google.com';
        }

        return [
            'eventId' => (string) $created->getId(),
            'link' => $link,
        ];
    }

    public function cancel(User $u, string $eventId): void
    {
        $clientId = config('services.google.client_id');
        if (! $clientId || str_starts_with($eventId, 'mock_meet_')) {
            return;
        }

        try {
            $client = $this->getClient($u);
            $service = new GoogleCalendar($client);
            $service->events->delete('primary', $eventId);
        } catch (\Throwable $e) {
            Log::warning('Google Calendar delete event failed or event already deleted', [
                'eventId' => $eventId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function ended(string $eventId): bool
    {
        return false;
    }
}
