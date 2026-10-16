<?php

namespace App\Services;

use App\Contracts\CalendarAdapter;
use App\Events\MeetEnded;
use App\Events\MeetScheduled;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Opportunity;
use App\Models\Story;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MeetService
{
    private function safeBroadcast(mixed $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed in MeetService: ' . $e->getMessage());
        }
    }

    public function __construct(
        private readonly CalendarAdapter $calendarAdapter,
        private readonly NotificationService $notificationService,
    ) {}

    public function schedule(User $user, Conversation $conversation, array $data): Message
    {
        $customUrl = trim($data['custom_meet_url'] ?? '');

        if ($customUrl !== '') {
            if (preg_match('/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i', $customUrl)) {
                $customUrl = 'https://meet.google.com/' . strtolower($customUrl);
            } elseif (!str_starts_with(strtolower($customUrl), 'http://') && !str_starts_with(strtolower($customUrl), 'https://')) {
                $customUrl = 'https://' . $customUrl;
            }

            if (!filter_var($customUrl, FILTER_VALIDATE_URL) || str_contains(strtolower($customUrl), 'meet.google.com/new')) {
                $roomSlug = 'BizLink-Room-' . $conversation->id . '-' . strtolower(Str::random(8));
                $customUrl = "https://meet.jit.si/{$roomSlug}";
            }
        }

        $title = trim($data['title'] ?? 'BizLink Consultation');
        if (empty($title)) {
            $title = 'BizLink Consultation';
        }

        try {
            $start = !empty($data['start_at']) ? Carbon::parse($data['start_at'])->utc() : now()->addMinutes(5);
        } catch (\Throwable) {
            $start = now()->addMinutes(5);
        }

        // Avoid blocking on clock skew or slightly past times: clamp to now
        if ($start->lt(now()->subMinutes(15))) {
            $start = now();
        }

        $duration = (int) ($data['duration'] ?? 30);
        if (!in_array($duration, [15, 30, 45, 60, 90, 120], true)) {
            $duration = 30;
        }

        $end = $start->copy()->addMinutes($duration);

        return DB::transaction(function () use ($user, $conversation, $title, $start, $end, $duration, $customUrl) {
            $meet = null;
            if ($customUrl !== '') {
                $meet = [
                    'eventId' => 'custom_' . Str::random(16),
                    'link' => $customUrl,
                ];
            } else {
                $token = $user->googleToken;
                if ($token && $token->access_token) {
                    try {
                        $meet = $this->calendarAdapter->createMeet($user, $title, $start, $duration);
                    } catch (\Throwable $e) {
                        Log::warning('Google Calendar adapter meet creation failed, falling back to direct meet link: ' . $e->getMessage());
                    }
                }
            }

            if (empty($meet) || empty($meet['link'])) {
                $roomSlug = 'BizLink-Consultation-' . $conversation->id . '-' . strtolower(Str::random(8));
                $meet = [
                    'eventId' => 'meet_' . Str::random(16),
                    'link' => "https://meet.jit.si/{$roomSlug}",
                ];
            }

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'from_side' => 'me',
                'text' => "Scheduled a meeting: {$title}",
                'meet_status' => 'scheduled',
                'meet_event_id' => $meet['eventId'],
                'meet_url' => $meet['link'],
                'meet_start_at' => $start,
                'meet_end_at' => $end,
                'meet_title' => $title,
            ]);

            $conversation->update(['last_message' => "Meeting scheduled: {$title}"]);

            $this->safeBroadcast(new MeetScheduled($message));
            $this->safeBroadcast(new MessageSent($message));

            $otherId = $this->getOtherParticipantId($conversation, $user->id);
            if ($otherId && $otherId !== $user->id) {
                $other = User::find($otherId);
                $this->notificationService->push(
                    $otherId,
                    'meet_scheduled',
                    "{$user->name} scheduled a meeting: {$title}",
                    '/messages/' . ($user->username ?: $user->id)
                );
            }

            return $message;
        });
    }

    public function cancel(User $user, Conversation $conversation, string $eventId): Message
    {
        $message = Message::where('conversation_id', $conversation->id)
            ->where('meet_event_id', $eventId)
            ->firstOrFail();

        if ((int) $message->sender_id !== (int) $user->id) {
            abort(403, 'Only the meeting organizer can cancel this meeting.');
        }

        if ($message->meet_status !== 'scheduled') {
            throw ValidationException::withMessages([
                'meeting' => ["Meeting is already {$message->meet_status}."],
            ]);
        }

        return DB::transaction(function () use ($user, $conversation, $message, $eventId) {
            $this->calendarAdapter->cancel($user, $eventId);

            $message->update(['meet_status' => 'cancelled']);

            $cancelMsg = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'from_side' => 'me',
                'text' => "Meeting cancelled: {$message->meet_title}",
            ]);

            $conversation->update(['last_message' => 'Meeting cancelled']);

            $this->safeBroadcast(new MeetEnded($message, 'cancelled'));
            $this->safeBroadcast(new MessageSent($cancelMsg));

            $otherId = $this->getOtherParticipantId($conversation, $user->id);
            if ($otherId && $otherId !== $user->id) {
                $this->notificationService->push(
                    $otherId,
                    'meet_ended',
                    "Meeting cancelled: {$message->meet_title}",
                    '/messages/' . ($user->username ?: $user->id)
                );
            }

            return $message;
        });
    }

    public function closeEndedMeetings(): int
    {
        $expiredMessages = Message::where('meet_status', 'scheduled')
            ->whereNotNull('meet_end_at')
            ->where('meet_end_at', '<=', now())
            ->with(['conversation', 'sender'])
            ->get();

        $count = 0;
        foreach ($expiredMessages as $msg) {
            DB::transaction(function () use ($msg) {
                $msg->update(['meet_status' => 'ended']);

                $endMsg = Message::create([
                    'conversation_id' => $msg->conversation_id,
                    'sender_id' => $msg->sender_id,
                    'from_side' => 'me',
                    'text' => "Meeting ended: {$msg->meet_title}",
                ]);

                $msg->conversation?->update(['last_message' => 'Meeting ended']);

                $this->safeBroadcast(new MeetEnded($msg, 'ended'));
                $this->safeBroadcast(new MessageSent($endMsg));

                $otherId = $this->getOtherParticipantId($msg->conversation, $msg->sender_id);
                if ($otherId) {
                    $this->notificationService->push(
                        $otherId,
                        'meet_ended',
                        "Meeting ended: {$msg->meet_title}",
                        '/messages/' . ($msg->sender?->username ?: $msg->sender_id)
                    );
                }
                if ($msg->sender_id) {
                    $this->notificationService->push(
                        $msg->sender_id,
                        'meet_ended',
                        "Meeting ended: {$msg->meet_title}",
                        '/messages/' . $msg->conversation_id
                    );
                }
            });
            $count++;
        }

        return $count;
    }

    public function updateLink(User $user, Conversation $conversation, string $eventId, string $newUrl): Message
    {
        $newUrl = trim($newUrl);
        if (preg_match('/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i', $newUrl)) {
            $newUrl = 'https://meet.google.com/' . strtolower($newUrl);
        } elseif (!str_starts_with(strtolower($newUrl), 'http://') && !str_starts_with(strtolower($newUrl), 'https://')) {
            $newUrl = 'https://' . $newUrl;
        }

        if (!filter_var($newUrl, FILTER_VALIDATE_URL) || str_contains(strtolower($newUrl), 'meet.google.com/new')) {
            $roomSlug = 'BizLink-Room-' . $conversation->id . '-' . strtolower(Str::random(8));
            $newUrl = "https://meet.jit.si/{$roomSlug}";
        }

        $message = Message::where('conversation_id', $conversation->id)
            ->where('meet_event_id', $eventId)
            ->firstOrFail();

        if ((int) $message->sender_id !== (int) $user->id) {
            abort(403, 'Only the meeting organizer can update this meeting.');
        }

        $message->update(['meet_url' => $newUrl]);
        $this->safeBroadcast(new MessageSent($message));

        return $message;
    }

    public function end(User $user, Conversation $conversation, string $eventId): Message
    {
        $message = Message::where('conversation_id', $conversation->id)
            ->where('meet_event_id', $eventId)
            ->firstOrFail();

        if ((int) $message->sender_id !== (int) $user->id) {
            abort(403, 'Only the meeting organizer can end this meeting.');
        }

        if ($message->meet_status === 'ended') {
            return $message;
        }

        return DB::transaction(function () use ($user, $conversation, $message) {
            $message->update(['meet_status' => 'ended']);

            $endMsg = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'from_side' => 'me',
                'text' => "Meeting ended: {$message->meet_title}",
            ]);

            $conversation->update(['last_message' => 'Meeting ended']);

            $this->safeBroadcast(new MeetEnded($message, 'ended'));
            $this->safeBroadcast(new MessageSent($endMsg));

            return $message;
        });
    }

    public function getOtherParticipantId(Conversation $conversation, ?int $userId): ?int
    {
        return $conversation->getOtherParticipantId($userId);
    }
}

