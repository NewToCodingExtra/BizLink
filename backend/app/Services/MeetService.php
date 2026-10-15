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
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MeetService
{
    public function __construct(
        private readonly CalendarAdapter $calendarAdapter,
        private readonly NotificationService $notificationService,
    ) {}

    public function schedule(User $user, Conversation $conversation, array $data): Message
    {
        $customUrl = trim($data['custom_meet_url'] ?? '');

        if ($customUrl !== '') {
            if (!filter_var($customUrl, FILTER_VALIDATE_URL) || (!str_contains($customUrl, 'meet.google.com') && !str_contains($customUrl, 'zoom.us') && !str_contains($customUrl, 'teams.microsoft.com') && !str_contains($customUrl, 'http'))) {
                throw ValidationException::withMessages([
                    'custom_meet_url' => ['Please enter a valid video meeting URL (e.g. https://meet.google.com/xxx-yyyy-zzz).'],
                ]);
            }
        } else {
            $token = $user->googleToken;
            if (! $token || ! $token->access_token) {
                throw ValidationException::withMessages([
                    'google' => ['Google account not connected. Please connect your Google account or provide a direct meeting link.'],
                ]);
            }
        }

        $title = trim($data['title'] ?? 'BizLink Consultation');
        $start = Carbon::parse($data['start_at'])->utc();
        $duration = (int) ($data['duration'] ?? 30);

        if (! in_array($duration, [15, 30, 60], true)) {
            throw ValidationException::withMessages([
                'duration' => ['Duration must be 15, 30, or 60 minutes.'],
            ]);
        }

        if ($start->lt(now()->addMinutes(14))) {
            throw ValidationException::withMessages([
                'start_at' => ['Meeting time must be at least 15 minutes in the future.'],
            ]);
        }

        $end = $start->copy()->addMinutes($duration);

        return DB::transaction(function () use ($user, $conversation, $title, $start, $end, $duration, $customUrl) {
            if ($customUrl !== '') {
                $meet = [
                    'eventId' => 'custom_' . Str::random(16),
                    'link' => $customUrl,
                ];
            } else {
                $meet = $this->calendarAdapter->createMeet($user, $title, $start, $duration);
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

            broadcast(new MeetScheduled($message));
            broadcast(new MessageSent($message));

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

            broadcast(new MeetEnded($message, 'cancelled'));
            broadcast(new MessageSent($cancelMsg));

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

                broadcast(new MeetEnded($msg, 'ended'));
                broadcast(new MessageSent($endMsg));

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
        if (!filter_var($newUrl, FILTER_VALIDATE_URL) || (!str_contains($newUrl, 'meet.google.com') && !str_contains($newUrl, 'zoom.us') && !str_contains($newUrl, 'teams.microsoft.com') && !str_contains($newUrl, 'http'))) {
            throw ValidationException::withMessages([
                'meet_url' => ['Please enter a valid meeting URL (e.g. https://meet.google.com/xxx-yyyy-zzz).'],
            ]);
        }

        $message = Message::where('conversation_id', $conversation->id)
            ->where('meet_event_id', $eventId)
            ->firstOrFail();

        if ((int) $message->sender_id !== (int) $user->id) {
            abort(403, 'Only the meeting organizer can update this meeting.');
        }

        $message->update(['meet_url' => $newUrl]);
        broadcast(new MessageSent($message));

        return $message;
    }

    public function getOtherParticipantId(Conversation $conversation, ?int $userId): ?int
    {
        return $conversation->getOtherParticipantId($userId);
    }
}

