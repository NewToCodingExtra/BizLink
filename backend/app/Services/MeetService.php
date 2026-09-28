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
use Illuminate\Validation\ValidationException;

class MeetService
{
    public function __construct(
        private readonly CalendarAdapter $calendarAdapter,
        private readonly NotificationService $notificationService,
    ) {}

    public function schedule(User $user, Conversation $conversation, array $data): Message
    {
        $token = $user->googleToken;
        if (! $token || ! $token->access_token) {
            throw ValidationException::withMessages([
                'google' => ['Google account not connected. Please connect your Google account to schedule a meeting.'],
            ]);
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

        return DB::transaction(function () use ($user, $conversation, $title, $start, $end, $duration) {
            $meet = $this->calendarAdapter->createMeet($user, $title, $start, $duration);

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

    public function getOtherParticipantId(Conversation $conversation, ?int $userId): ?int
    {
        if ((int) $conversation->user_id === (int) $userId) {
            $ownerId = Opportunity::where('brand_id', $conversation->brand_id)->value('user_id')
                ?? Story::where('brand_id', $conversation->brand_id)->value('user_id');
            return $ownerId ? (int) $ownerId : null;
        }
        return (int) $conversation->user_id;
    }
}
